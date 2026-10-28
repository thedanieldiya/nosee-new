import { z } from "zod";
import {
  validateDescription,
  descriptionText,
  type Description,
} from "../research/description.ts";
import { isPlaceholderBody } from "./content.ts";
export const privacyFieldsInput = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Add a policy title.")
      .max(160)
      .refine((v) => !/[\x00-\x1f\x7f]/.test(v), "Use printable text."),
    effectiveDate: z.union([z.literal(""), z.iso.date()]),
    body: z.unknown().transform((value, ctx): Description => {
      try {
        return validateDescription(value);
      } catch {
        ctx.addIssue({
          code: "custom",
          message:
            "Use supported policy formatting within 6,000 visible characters.",
        });
        return z.NEVER;
      }
    }),
  })
  .strict();
export const privacySaveInput = z
  .object({
    fields: privacyFieldsInput,
    mode: z.enum(["draft", "publish"]),
    version: z.number().int().min(1),
    mutationId: z.uuid(),
    confirm: z.literal(true),
    approvedForPublication: z.literal(true).optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.mode !== "publish") return;
    if (!value.approvedForPublication)
      ctx.addIssue({
        code: "custom",
        path: ["approvedForPublication"],
        message: "Confirm that this wording is approved for publication.",
      });
    if (!descriptionText(value.fields.body).trim())
      ctx.addIssue({
        code: "custom",
        path: ["fields", "body"],
        message: "Keep a complete policy before publishing.",
      });
    if (isPlaceholderBody(value.fields.body))
      ctx.addIssue({
        code: "custom",
        path: ["fields", "body"],
        message:
          "The development placeholder cannot be marked approved. Keep it live until approved replacement wording is supplied.",
      });
  });
export const policyVersionInput = z
  .string()
  .regex(/^(development-placeholder-v1|privacy-[0-9a-f-]{36})$/);
