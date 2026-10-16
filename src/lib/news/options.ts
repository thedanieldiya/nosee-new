import type { Description } from "../research/description.ts";
// Existing pinned content values, without importing development articles into the live feed.
export const newsCategories = ["organisation-news", "research-news", "scientific-development", "outreach-report", "member-achievement", "funding-opportunity", "partnership"] as const;
export type NewsFields = { title: string; category: typeof newsCategories[number]; excerpt: string; body: Description; publicationDate: string; featured: boolean };
export type NewsContent = NewsFields & { slug: string; coverImage: string; coverAlt: string };
export const emptyNewsFields = (clock = new Date()): NewsFields => ({ title: "", category: "organisation-news", excerpt: "", body: "", publicationDate: clock.toISOString(), featured: false });
