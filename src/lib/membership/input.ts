import { z } from "zod";
import { profileInput } from "../admin/validation.ts";
import { careerStages, researchInterests, applicationStatuses } from "./options.ts";
export const applicationInput = profileInput.extend({
  email: z.string().trim().pipe(z.email().max(254)).transform(value => value.toLowerCase()),
  careerStage: z.enum(Object.keys(careerStages) as [keyof typeof careerStages, ...(keyof typeof careerStages)[]]),
  researchInterests: z.array(z.enum(Object.keys(researchInterests) as [keyof typeof researchInterests, ...(keyof typeof researchInterests)[]])).min(1, "Select at least one research interest.").max(5).refine(values => new Set(values).size === values.length, "Choose each interest once."),
  why: z.string().trim().min(1, "Tell us why you want to join NOSEE.").max(2000, "Use at most 2,000 characters.").refine(value => !/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value), "Use printable text."),
  consent: z.literal(true, { error: "Consent is required to submit your membership application." }),
}).strict();
export const submissionInput = applicationInput.extend({ formToken: z.string().min(1).max(200), website: z.literal("") }).strict();
export const applicationQuery = z.object({ q: z.string().trim().max(120).default(""), status: z.enum(["", ...Object.keys(applicationStatuses)] as ["", ...Array<keyof typeof applicationStatuses>]).default(""), page: z.coerce.number().int().min(1).max(100000).default(1) }).strict();
export const decisionInput = z.object({ decision: z.enum(["approved", "rejected"]), note: z.string().trim().min(1, "Enter an internal review note or reason.").max(2000).refine(value => !/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value), "Use printable text.") }).strict();
