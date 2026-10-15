import "server-only";
import { z } from "zod";
import { invitationMailConfiguration } from "./management-input.ts";
import type { DeliveryResult, InvitationTransport } from "./invitation-mail.ts";

const acceptance = z.object({ id: z.string().min(1).max(200).regex(/^[A-Za-z0-9@._<>:-]+$/) });
const rejectionStatuses = new Set([400, 401, 403, 404, 405, 413, 415, 422, 429]);

export function resendInvitationTransport(
  environment: Record<string, string | undefined>,
  request: typeof fetch = fetch,
): InvitationTransport | null {
  const config = invitationMailConfiguration.safeParse({ senderName: "NOSEE", from: environment.ADMIN_INVITATION_FROM, origin: environment.ADMIN_ORIGIN });
  const apiKey = environment.RESEND_API_KEY;
  if (!config.success || !apiKey || apiKey.length > 512 || !/^[\x21-\x7e]+$/.test(apiKey)) return null;

  return {
    async send(message, { signal: parentSignal, idempotencyKey }): Promise<DeliveryResult> {
      if (!z.uuid().safeParse(idempotencyKey).success) return { status: "failed" };
      const signal = AbortSignal.any([parentSignal, AbortSignal.timeout(8000)]);
      try {
        signal.throwIfAborted();
        const response = await request("https://api.resend.com/emails", {
          method: "POST", redirect: "error", cache: "no-store", signal,
          headers: {
            Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json",
            "Idempotency-Key": `nosee-admin-invitation/${idempotencyKey}`,
          },
          body: JSON.stringify({ from: `NOSEE <${config.data.from}>`, to: [message.to], subject: message.subject, html: message.html, text: message.text }),
        });
        // Never retry here or consume/return a provider error body, which may echo secrets.
        if (response.status !== 200) {
          await response.body?.cancel();
          return { status: rejectionStatuses.has(response.status) ? "failed" : "unconfirmed" };
        }
        const result = acceptance.safeParse(await response.json());
        signal.throwIfAborted();
        if (!result.success) return { status: "unconfirmed" };
        const id = result.data.id;
        // Ignore reflected message content/credentials; the service also checks the code.
        return !id.includes(apiKey) && !message.text.includes(id) && !message.html.includes(id) ? { status: "accepted", messageId: id } : { status: "unconfirmed" };
      } catch {
        // A lost response, abort, 409 or 5xx may follow acceptance; preserve uncertainty.
        return { status: "unconfirmed" };
      }
    },
  };
}
