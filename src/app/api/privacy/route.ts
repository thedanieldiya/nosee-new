import { publishedPrivacyPolicy } from "@/lib/privacy/public";
import { createApplicationToken } from "@/lib/membership/form-guard";
import { privateJson } from "@/lib/admin/http";
export const dynamic = "force-dynamic";
export async function GET() {
  const policy = await publishedPrivacyPolicy();
  if (!policy)
    return privateJson(
      {
        error:
          "The privacy policy is temporarily unavailable. Close and try again.",
      },
      503,
    );
  return privateJson({
    policy,
    formToken: createApplicationToken(Date.now(), policy.version),
  });
}
