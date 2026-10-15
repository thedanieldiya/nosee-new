import { z } from "zod";
import { profileInput } from "../admin/validation.ts";
import { applicationInput, memberAcknowledgement } from "./input.ts";
import { memberStatuses } from "./member-options.ts";
const printable = (max: number) => z.string().trim().max(max).refine(value => !/[\x00-\x1f\x7f]/.test(value), "Use printable text.");
export const memberDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => value >= "0001-01-01" && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value, "Use a real calendar date.");
export const memberInput = profileInput.extend({
  email: applicationInput.shape.email, phone: printable(80), affiliation: printable(200),
  careerStage: z.union([z.literal(""), applicationInput.shape.careerStage]),
  researchInterests: z.array(applicationInput.shape.researchInterests.element).max(5).refine(values => new Set(values).size === values.length, "Choose each interest once."),
  status: z.enum(Object.keys(memberStatuses) as ["active", "inactive"]), joinDate: memberDate,
  notes: z.string().trim().max(2000).refine(value => !/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value), "Use printable text."),
}).strict();
export const memberCreateInput = z.object({ fields: memberInput, requestId: z.uuid(), confirm: z.literal(true) }).strict();
export const memberUpdateInput = z.object({ fields: memberInput, version: z.number().int().min(1), confirm: z.literal(true) }).strict();
export const applicationMemberInput = z.object({ confirm: z.literal(true), association: memberAcknowledgement.optional() }).strict();
export const profileLinkInput = z.object({ profileId: z.uuid().nullable(), version: z.number().int().min(1), confirm: z.literal(true) }).strict();
export const memberQuery = z.object({ q: z.string().trim().max(120).default(""), status: z.enum(["", "active", "inactive"]).default(""), interest: z.union([z.literal(""), applicationInput.shape.researchInterests.element]).default(""), page: z.coerce.number().int().min(1).max(100000).default(1) }).strict();
export const memberMatchInput = z.object({ firstName: printable(80).default(""), lastName: printable(80).default(""), email: z.union([z.literal(""), applicationInput.shape.email]).default(""), exclude: z.union([z.literal(""), z.uuid()]).default("") }).strict();
