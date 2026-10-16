import { z } from "zod";
import { validateDescription } from "./description.ts";
import { researchCovers } from "./options.ts";
const text = (max: number) => z.string().trim().max(max).refine(value => !/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value), "Use printable text.");
const description = z.unknown().transform((value, ctx) => { try { return validateDescription(value); } catch { ctx.addIssue({ code: "custom", message: "Use supported formatting and safe links, within 6,000 visible characters." }); return z.NEVER; } });
export const groupEditableInput = z.object({ name: text(120).min(1), introduction: text(400), description, objectives: z.array(text(240).min(1)).max(8) }).strict();
// Stored snapshots include server-owned metadata. Never use this as a mutation schema.
export const groupContentInput = groupEditableInput.extend({ slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80), coverImage: z.union([z.literal(""), z.enum(researchCovers)]), coverAlt: text(240) }).strict();
export const groupCreateInput = z.object({ content: groupEditableInput, requestId: z.uuid(), confirm: z.literal(true) }).strict();
export const groupUpdateInput = z.object({ content: groupEditableInput, version: z.number().int().positive(), confirm: z.literal(true) }).strict();
export const groupDeletionInput = z.object({ phrase: z.string().max(127), version: z.number().int().positive() }).strict();
export const publicationInput = z.object({ action: z.enum(["publish", "unpublish"]), version: z.number().int().positive(), confirm: z.literal(true) }).strict();
export const groupQuery = z.object({ q: text(120).default(""), page: z.coerce.number().int().min(1).max(100000).default(1) }).strict();
export const eligibleQuery = z.object({ q: text(80).min(2), purpose: z.enum(["member", "lead"]).default("member") }).strict();
const roleFields = { roleTitle: text(100), displayOrder: z.number().int().min(0).max(9999) };
export const groupMemberInput = z.discriminatedUnion("action", [
  z.object({ action: z.literal("add"), memberId: z.uuid(), memberVersion: z.number().int().positive(), ...roleFields, confirm: z.literal(true) }).strict(),
  z.object({ action: z.literal("update"), id: z.uuid(), version: z.number().int().positive(), ...roleFields, confirm: z.literal(true) }).strict(),
  z.object({ action: z.literal("remove"), id: z.uuid(), version: z.number().int().positive(), confirm: z.literal(true) }).strict(),
]);
export const leadInput = z.discriminatedUnion("action", [
  z.object({ action: z.literal("assign"), administratorId: z.uuid(), accessVersion: z.number().int().min(0), memberId: z.uuid(), memberVersion: z.number().int().positive(), version: z.number().int().positive(), confirmIdentity: z.literal(true), confirm: z.literal(true) }).strict(),
  z.object({ action: z.literal("remove"), version: z.number().int().positive(), confirm: z.literal(true) }).strict(),
]);
export const leadInvitationInput = z.object({ memberId: z.uuid(), memberVersion: z.number().int().positive(), version: z.number().int().positive(), confirm: z.literal(true) }).strict();
