import "server-only";
import { z } from "zod";
import type { DeliveryResult, InvitationMessage } from "./invitation-mail.ts";
const acceptance = z.object({ id: z.string().min(1).max(200).regex(/^[A-Za-z0-9@._<>:-]+$/) });
const rejectionStatuses = new Set([400, 401, 403, 404, 405, 413, 415, 422, 429]);
export type ResendOutcome = { delivery: DeliveryResult; retryable: boolean; retryAfterSeconds?: number; issue?: "rate_limited" | "provider_rejected" | "unconfirmed" };
export function retryAfterSeconds(value: string | null, now = Date.now()) {
  const delay = value && /^\d+$/.test(value) ? Number(value) : value ? Math.ceil((Date.parse(value) - now) / 1000) : NaN;
  return Number.isFinite(delay) ? Math.min(86400, Math.max(1, delay)) : 60;
}
export async function sendResendMessage(config: { apiKey: string; from: string }, message: InvitationMessage, options: { idempotencyKey: string; signal: AbortSignal }, request: typeof fetch = fetch): Promise<ResendOutcome> {
  if (!/^[A-Za-z0-9/_-]{1,256}$/.test(options.idempotencyKey)) return { delivery: { status: "failed" }, retryable: false, issue: "provider_rejected" };
  const signal = AbortSignal.any([options.signal, AbortSignal.timeout(8000)]);
  let abort: (() => void) | undefined;
  try {
    signal.throwIfAborted();
    const cancelled = new Promise<never>((_resolve, reject) => { abort = () => reject(new Error("Request unconfirmed.")); signal.addEventListener("abort", abort, { once: true }); });
    return await Promise.race([cancelled, (async (): Promise<ResendOutcome> => {
      const response = await request("https://api.resend.com/emails", {
        method: "POST", redirect: "error", cache: "no-store", signal,
        headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json", "Idempotency-Key": options.idempotencyKey },
        body: JSON.stringify({ from: `NOSEE <${config.from}>`, to: [message.to], subject: message.subject, html: message.html, text: message.text }),
      });
      if (response.status !== 200) {
        const retryAfter = response.status === 429 ? retryAfterSeconds(response.headers.get("retry-after")) : undefined;
        await response.body?.cancel(); // Never read or return provider error bodies.
        return { delivery: { status: rejectionStatuses.has(response.status) ? "failed" : "unconfirmed" }, retryable: response.status === 429 || !rejectionStatuses.has(response.status), issue: response.status === 429 ? "rate_limited" : rejectionStatuses.has(response.status) ? "provider_rejected" : "unconfirmed", ...(retryAfter ? { retryAfterSeconds: retryAfter } : {}) };
      }
      const result = acceptance.safeParse(await response.json()); signal.throwIfAborted();
      if (!result.success || result.data.id.includes(config.apiKey) || message.text.includes(result.data.id) || message.html.includes(result.data.id)) return { delivery: { status: "unconfirmed" }, retryable: true, issue: "unconfirmed" };
      return { delivery: { status: "accepted", messageId: result.data.id }, retryable: false };
    })()]);
  } catch { return { delivery: { status: "unconfirmed" }, retryable: true, issue: "unconfirmed" }; }
  finally { if (abort) signal.removeEventListener("abort", abort); }
}
