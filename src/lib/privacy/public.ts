import "server-only";
import { eq } from "drizzle-orm";
import { adminDatabase } from "../admin/database.ts";
import { privacyPolicy, privacyPolicyVersion } from "../admin/schema.ts";
import { validateDescription } from "../research/description.ts";
import { type PublishedPolicy } from "./content.ts";
// Missing configuration or database failure must never restore an obsolete policy.
export async function publishedPrivacyPolicy(): Promise<PublishedPolicy | null> {
  if (!process.env.DATABASE_URL) return null;
  try {
    const [row] = await adminDatabase()
      .db.select({
        version: privacyPolicyVersion.id,
        title: privacyPolicyVersion.title,
        effectiveDate: privacyPolicyVersion.effectiveDate,
        body: privacyPolicyVersion.body,
        isPlaceholder: privacyPolicyVersion.isPlaceholder,
        publishedAt: privacyPolicyVersion.publishedAt,
      })
      .from(privacyPolicy)
      .innerJoin(
        privacyPolicyVersion,
        eq(privacyPolicy.publishedVersion, privacyPolicyVersion.id),
      )
      .where(eq(privacyPolicy.id, "privacy"));
    return row
      ? {
          ...row,
          body: validateDescription(row.body),
          publishedAt: row.publishedAt?.toISOString() ?? null,
        }
      : null;
  } catch {
    return null;
  }
}
