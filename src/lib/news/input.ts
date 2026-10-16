import { z } from "zod";
import { validateDescription } from "../research/description.ts";
import { newsCategories } from "./options.ts";
const text = (max: number) => z.string().trim().max(max).refine(value => !/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value), "Use printable text.");
export const newsBody = z.unknown().transform((value, ctx) => { try { return validateDescription(value); } catch { ctx.addIssue({ code: "custom", message: "Use supported formatting and safe links, within 6,000 visible characters." }); return z.NEVER; } });
export const newsFieldsInput = z.object({ title: text(160).min(1), category: z.enum(newsCategories), excerpt: text(400), body: newsBody, publicationDate: z.iso.datetime({ offset: true }).transform(value => new Date(value).toISOString()), featured: z.boolean() }).strict();
// Reserved for legitimate retained media only; no image mutation or URL input is exposed.
const publicationFields = { slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80), coverImage: z.union([z.literal(""),z.enum(["/media/trending/trending1.png","/media/trending/trending2.png","/media/trending/trending3.png"])]), coverAlt: text(240) };
const describedCover = (value: { coverImage: string; coverAlt: string }) => !value.coverImage || !!value.coverAlt;
export const newsContentInput = newsFieldsInput.extend(publicationFields).strict().refine(describedCover, "Describe a retained cover image.");
export const newsFeedInput = newsFieldsInput.omit({ body: true }).extend(publicationFields).strict().refine(describedCover, "Describe a retained cover image.");
export const newsCreateInput = z.object({ fields: newsFieldsInput, requestId: z.uuid(), confirm: z.literal(true) }).strict();
export const newsUpdateInput = z.object({ fields: newsFieldsInput, version: z.number().int().positive(), confirm: z.literal(true) }).strict();
export const newsPublicationInput = z.object({ action: z.enum(["publish","unpublish"]), version: z.number().int().positive(), confirm: z.literal(true) }).strict();
export const newsQuery = z.object({ q: text(120).default(""), status: z.enum(["","draft","published"]).default(""), page: z.coerce.number().int().min(1).max(100000).default(1) }).strict();
