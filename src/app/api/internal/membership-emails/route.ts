import { createHash, timingSafeEqual } from "node:crypto";
import { privateJson } from "@/lib/admin/http";
import { runMembershipEmailWorker } from "@/lib/membership/email-outbox";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const secret = process.env.MEMBERSHIP_EMAIL_WORKER_SECRET;
  if (!secret || secret.length < 32 || secret.length > 256 || /\s/.test(secret)) return privateJson({ error: "The membership email worker is not configured." }, 503);
  const authorization = request.headers.get("authorization") ?? "";
  if (authorization.length > 512 || !timingSafeEqual(createHash("sha256").update(authorization).digest(), createHash("sha256").update(`Bearer ${secret}`).digest())) return privateJson({ error: "Not authorized." }, 401);
  try { const result = await runMembershipEmailWorker(); return privateJson(result, result.enabled ? 200 : 503); }
  catch { return privateJson({ error: "Membership notification processing could not be confirmed. Retry later." }, 503); }
}
