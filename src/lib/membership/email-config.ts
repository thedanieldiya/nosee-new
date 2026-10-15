import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import { invitationMailConfiguration } from "../admin/management-input.ts";
const configuration = invitationMailConfiguration.extend({ recipients: z.array(z.email().max(254)).min(1).max(10).refine(values => new Set(values).size === values.length), startAt: z.iso.datetime({ offset: true }) }).strict();
export function membershipEmailConfig(environment: Record<string, string | undefined>) {
  const apiKey = environment.RESEND_API_KEY;
  if (environment.MEMBERSHIP_EMAIL_ENABLED !== "true" || !apiKey || apiKey.length > 512 || !/^[\x21-\x7e]+$/.test(apiKey)) return null;
  const result = configuration.safeParse({ senderName: "NOSEE", from: environment.MEMBERSHIP_EMAIL_FROM, origin: environment.ADMIN_ORIGIN, recipients: environment.MEMBERSHIP_EMAIL_ADMIN_RECIPIENTS?.split(",").map(value => value.trim().toLowerCase()), startAt: environment.MEMBERSHIP_EMAIL_START_AT });
  if (!result.success) return null;
  const config = { ...result.data, recipients: result.data.recipients.sort(), startAt: new Date(result.data.startAt).toISOString() };
  const activationKey = createHash("sha256").update(JSON.stringify(config)).digest("hex");
  return { ...config, apiKey, activationKey };
}
export type MembershipEmailConfig = NonNullable<ReturnType<typeof membershipEmailConfig>>;
