import type { Description } from "../research/description.ts";
// Existing pinned content values, without importing development articles into the live feed.
export const newsCategories = ["organisation-news", "research-news", "scientific-development", "outreach-report", "member-achievement", "funding-opportunity", "partnership"] as const;
export type NewsFields = { title: string; category: typeof newsCategories[number]; excerpt: string; body: Description; publicationDate: string; publicationTimezone?: string; featured: boolean };
export type NewsContent = NewsFields & { slug: string; coverImage: string; coverAlt: string };
export const emptyNewsFields = (clock = new Date()): NewsFields => ({ title: "", category: "organisation-news", excerpt: "", body: "", publicationDate: clock.toISOString(), publicationTimezone: "Africa/Lagos", featured: false });
// Records also carry private snapshot/version/URL fields; never put those in editable state.
export function editableNewsFields(value: NewsFields): NewsFields {
  return { title: value.title, category: value.category, excerpt: value.excerpt, body: value.body, publicationDate: value.publicationDate, publicationTimezone: value.publicationTimezone, featured: value.featured };
}

export const newsDeletionPhrase = (title: string) => `Delete ${title}`;
