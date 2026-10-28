import { z } from "zod";
import { normalizeDoi } from "./doi.ts";
import { researchInterests } from "../membership/options.ts";
export const publicationTypes = ["journal-article", "conference-paper", "book", "book-chapter", "report", "dataset", "preprint", "thesis", "software", "other"] as const;
export const text = (max: number) => z.string().trim().max(max).refine(v => !/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(v), "Use printable text.");
export const doiInput = z.string().max(2048).transform((v, ctx) => { if (!v.trim()) return ""; try { return normalizeDoi(v); } catch (error) { ctx.addIssue({ code: "custom", message: (error as Error).message }); return z.NEVER; } });
export function validPublicationDate(value: string) {
  if (!/^[1-9]\d{3}(?:-(?:0[1-9]|1[0-2])(?:-(?:0[1-9]|[12]\d|3[01]))?)?$/.test(value)) return false;
  return value.length !== 10 || new Date(value + "T12:00:00Z").toISOString().slice(0, 10) === value;
}
export const publicationDateInput = z.string().refine(v => v === "" || validPublicationDate(v), "Use YYYY, YYYY-MM or YYYY-MM-DD with a real calendar date.");
export function safePublicationUrl(value: string) { try { const u = new URL(value); return /^https?:\/\//i.test(value) && ["http:", "https:"].includes(u.protocol) && !u.username && !u.password && !/[\\\s]/.test(value); } catch { return false; } }
export const referenceInput = text(2048).refine(v => v === "" || safePublicationUrl(v), "Use an HTTP(S) reference URL without credentials.");
export const lookupProvenanceInput = z.object({ doi: doiInput.refine(v => !!v), provider: z.enum(["crossref", "datacite"]), retrievedAt: z.iso.datetime() }).strict();
const areaInput = z.enum(Object.keys(researchInterests) as [keyof typeof researchInterests, ...(keyof typeof researchInterests)[]]);
export const publicationFieldsInput = z.object({
  doi: doiInput, title: text(400).min(1, "Add a title."), authors: z.array(text(240).min(1, "Add an author name or remove the empty row.")).max(200), type: z.enum(publicationTypes), publicationDate: publicationDateInput,
  source: text(400), referenceUrl: referenceInput, abstract: text(6000), researchAreas: z.array(areaInput).max(5).refine(v => new Set(v).size === v.length, "Choose each research area once.").transform(v => [...v].sort()), groupId: z.uuid().nullable(), lookup: lookupProvenanceInput.nullable(),
}).strict().superRefine((v, ctx) => { if (v.lookup && v.lookup.doi !== v.doi) ctx.addIssue({ code: "custom", path: ["lookup"], message: "Lookup provenance must match the current DOI." }); });
export type PublicationFields = z.infer<typeof publicationFieldsInput>;
export type PublicationContent = PublicationFields & { slug: string; publicGroup: { name: string; slug: string } | null };
export const publicationCreateInput = z.object({ fields: publicationFieldsInput, mode: z.enum(["draft", "publish"]).default("draft"), requestId: z.uuid(), confirm: z.literal(true) }).strict();
export const publicationUpdateInput = z.object({ fields: publicationFieldsInput, mode: z.enum(["draft", "publish"]).default("draft"), version: z.number().int().positive(), mutationId: z.uuid(), confirm: z.literal(true) }).strict();
export const publicationStateInput = z.object({ action: z.enum(["publish", "unpublish"]), version: z.number().int().positive(), mutationId: z.uuid(), confirm: z.literal(true) }).strict();
export const publicationDeletionInput = z.object({ phrase: z.string().max(420), version: z.number().int().positive(), mutationId: z.uuid(), confirm: z.literal(true) }).strict();
export const publicationQuery = z.object({ q: text(120).default(""), status: z.enum(["", "draft", "published", "unpublished"]).default(""), type: z.enum(["", ...publicationTypes]).default(""), area: z.union([z.literal(""), areaInput]).default(""), page: z.coerce.number().int().min(1).max(100000).default(1) }).strict();
export const lookupRequestInput = z.object({ doi: doiInput.refine(v => !!v), id: z.uuid().optional() }).strict();

export const lookupMetadataInput = z.object({ title: text(400).optional(), authors: z.array(text(240).min(1)).max(200).optional(), type: z.enum(publicationTypes).optional(), publicationDate: publicationDateInput.refine(v => !!v).optional(), source: text(400).optional(), referenceUrl: referenceInput.refine(v => !!v).optional() }).strict();
export type LookupMetadata = z.infer<typeof lookupMetadataInput>;
