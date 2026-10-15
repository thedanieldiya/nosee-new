import { z } from "zod";
import { profileInput, passwordInput } from "./validation.ts";
export const eligibleRole = z.enum(["super_admin", "editor"]);
export const invitationMailConfiguration = z.object({
  senderName: z.literal("NOSEE"), from: z.email().max(254),
  origin: z.string().refine(value => { try { const url = new URL(value); return url.protocol === "https:" && url.origin === value; } catch { return false; } }, "Use the exact secure administrator origin."),
}).strict();
export const invitationInput = profileInput.extend({ email: z.email().max(254).transform(value => value.toLowerCase()), role: eligibleRole }).strict();
export const managementInput = z.discriminatedUnion("action", [
  invitationInput.extend({ action: z.literal("invite") }).strict(),
  z.object({ action: z.enum(["resend", "revoke", "activate", "deactivate"]), id: z.uuid() }).strict(),
  z.object({ action: z.literal("change-role"), id: z.uuid(), role: eligibleRole }).strict(),
]);
export const acceptanceInput = z.object({ code: z.string().trim().regex(/^[A-Za-z0-9_-]{43}$/), password: passwordInput, confirmation: passwordInput }).strict().refine(value => value.password === value.confirmation, "Passwords must match.");
const page = z.coerce.number().int().min(1).max(100000).default(1);
const query = z.string().trim().max(120).default("");
export const directoryInput = z.object({ q: query, role: z.enum(["", "super_admin", "editor", "research_group_lead"]).default(""), status: z.enum(["", "active", "deactivated", "pending", "expired", "revoked"]).default(""), page }).strict();
const date = z.string().refine(value => value === "" || (/^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value), "Use a valid date.").default("");
export const activityInput = z.object({ actor: z.union([z.literal(""), z.literal("system"), z.uuid()]).default(""), action: z.string().trim().max(100).default(""), target: query, from: date, to: date, page }).strict().refine(value => !value.from || !value.to || value.from <= value.to, "The end date must follow the start date.");
export type DirectoryQuery = z.infer<typeof directoryInput>;
export type ActivityQuery = z.infer<typeof activityInput>;
