import "server-only";
import { randomUUID, createHash } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import {
  privacyPolicy,
  privacyPolicyVersion,
  auditLog,
} from "../admin/schema.ts";
import { authorizedPublishing } from "../admin/publishing.ts";
import type { Principal } from "../admin/policy.ts";
import { ManagementError } from "../admin/errors.ts";
import { privacySaveInput, policyVersionInput } from "./input.ts";
import { privacyFingerprint } from "./content.ts";
const serialized = <T>(v: T): T => JSON.parse(JSON.stringify(v));
export async function getPrivacy(actor: Principal) {
  return authorizedPublishing(actor, async (tx) => {
    const [row] = await tx
      .select({
        fields: privacyPolicy.fields,
        version: privacyPolicy.version,
        updatedAt: privacyPolicy.updatedAt,
        publishedContent: privacyPolicyVersion.body,
        publishedTitle: privacyPolicyVersion.title,
        publishedEffectiveDate: privacyPolicyVersion.effectiveDate,
        publishedVersion: privacyPolicyVersion.id,
        publishedAt: privacyPolicyVersion.publishedAt,
        isPlaceholder: privacyPolicyVersion.isPlaceholder,
      })
      .from(privacyPolicy)
      .innerJoin(
        privacyPolicyVersion,
        eq(privacyPolicy.publishedVersion, privacyPolicyVersion.id),
      )
      .where(eq(privacyPolicy.id, "privacy"));
    if (!row)
      throw new ManagementError(
        "Privacy policy is unavailable. Apply the reviewed schema before editing.",
        503,
      );
    return serialized({
      ...row,
      publishedContent: {
        body: row.publishedContent,
        title: row.publishedTitle,
        effectiveDate: row.publishedEffectiveDate,
      },
      hasUnpublishedChanges:
        privacyFingerprint(row.fields) !==
        privacyFingerprint({
          body: row.publishedContent,
          title: row.publishedTitle,
          effectiveDate: row.publishedEffectiveDate,
        }),
    });
  });
}
export async function getPrivacyVersion(actor: Principal, version: string) {
  return authorizedPublishing(actor, async (tx) => {
    if (!policyVersionInput.safeParse(version).success)
      throw new ManagementError("Policy version not found.", 404);
    const [row] = await tx
      .select({
        version: privacyPolicyVersion.id,
        title: privacyPolicyVersion.title,
        effectiveDate: privacyPolicyVersion.effectiveDate,
        body: privacyPolicyVersion.body,
        isPlaceholder: privacyPolicyVersion.isPlaceholder,
        publishedAt: privacyPolicyVersion.publishedAt,
      })
      .from(privacyPolicyVersion)
      .where(eq(privacyPolicyVersion.id, version));
    if (!row) throw new ManagementError("Policy version not found.", 404);
    return serialized(row);
  });
}
export async function savePrivacy(actor: Principal, raw: unknown) {
  const parsed = privacySaveInput.safeParse(raw);
  if (!parsed.success)
    throw new ManagementError(
      parsed.error.issues
        .map((i) => i.message)
        .join(" ")
        .slice(0, 1400),
    );
  const input = parsed.data,
    digest = createHash("sha256").update(JSON.stringify(input)).digest("hex");
  return authorizedPublishing(actor, async (tx) => {
    // Same order as membership decisions: management, then application/consent lock.
    if (input.mode === "publish")
      await tx.execute(sql`select pg_advisory_xact_lock(4631003)`);
    const [row] = await tx
      .select()
      .from(privacyPolicy)
      .where(eq(privacyPolicy.id, "privacy"));
    if (!row)
      throw new ManagementError(
        "Privacy policy is unavailable. Apply the reviewed schema before editing.",
        503,
      );
    if (row.lastMutationKey === input.mutationId) {
      if (row.lastMutationDigest !== digest)
        throw new ManagementError(
          "This request already saved different content.",
          409,
        );
      return { id: "privacy", message: "Changes already saved." };
    }
    if (row.version !== input.version)
      throw new ManagementError(
        "This policy changed. Reload and review the saved version before retrying.",
        409,
      );
    const [live] = await tx
      .select()
      .from(privacyPolicyVersion)
      .where(eq(privacyPolicyVersion.id, row.publishedVersion));
    if (!live)
      throw new ManagementError(
        "The published policy could not be confirmed.",
        503,
      );
    let publishedVersion = row.publishedVersion;
    if (
      input.mode === "publish" &&
      privacyFingerprint(input.fields) !==
        privacyFingerprint({
          body: live.body,
          title: live.title,
          effectiveDate: live.effectiveDate,
        })
    ) {
      publishedVersion = "privacy-" + randomUUID();
      await tx.insert(privacyPolicyVersion).values({
        id: publishedVersion,
        ...input.fields,
        isPlaceholder: false,
        createdBy: actor.id,
        publishedAt: sql`clock_timestamp()`,
      });
    }
    await tx
      .update(privacyPolicy)
      .set({
        fields: input.fields,
        publishedVersion,
        version: row.version + 1,
        lastMutationKey: input.mutationId,
        lastMutationDigest: digest,
        updatedAt: sql`clock_timestamp()`,
      })
      .where(eq(privacyPolicy.id, "privacy"));
    await tx.insert(auditLog).values({
      id: randomUUID(),
      actorId: actor.id,
      targetType: "site_content",
      targetId: null,
      targetLabel: "Privacy policy",
      action:
        input.mode === "publish"
          ? "Published privacy policy"
          : "Saved privacy working copy",
      changes: {
        before: { policyVersion: row.publishedVersion },
        after: { policyVersion: publishedVersion },
      },
      createdAt: sql`clock_timestamp()`,
    });
    return {
      id: "privacy",
      message:
        input.mode === "publish"
          ? "Privacy policy published."
          : "Draft saved. The public policy is unchanged.",
    };
  });
}
