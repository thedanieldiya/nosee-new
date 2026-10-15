import { createHash, timingSafeEqual } from "node:crypto";
import { privateJson } from "@/lib/admin/http";
import { expireMembershipApplications } from "@/lib/membership/service";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 32 || secret.length > 256 || /\s/.test(secret)) return privateJson({ error: "The expiry worker is not configured." }, 503);
  const authorization = request.headers.get("authorization") ?? "";
  if (authorization.length > 512 || !timingSafeEqual(createHash("sha256").update(authorization).digest(), createHash("sha256").update(`Bearer ${secret}`).digest())) return privateJson({ error: "Not authorized." }, 401);
  try { return privateJson(await expireMembershipApplications()); }
  catch { return privateJson({ error: "The expiry sweep could not complete. Retry later." }, 503); }
}
