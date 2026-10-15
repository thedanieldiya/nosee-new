import "server-only";
import { z } from "zod";
import { invitationMailConfiguration } from "./management-input.ts";
import type { DeliveryResult, InvitationTransport } from "./invitation-mail.ts";
import { sendResendMessage } from "./resend-request.ts";

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
      return (await sendResendMessage({ apiKey, from: config.data.from }, message, { signal: parentSignal, idempotencyKey: `nosee-admin-invitation/${idempotencyKey}` }, request)).delivery;
    },
  };
}
