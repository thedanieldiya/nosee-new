import { canonicalContentFingerprint } from "../news/draft-state.ts";
import { publicationFieldsInput, type PublicationFields, type PublicationContent } from "./input.ts";
export const emptyPublicationFields = (): PublicationFields => ({ doi: "", title: "", authors: [], type: "other", publicationDate: "", source: "", referenceUrl: "", abstract: "", researchAreas: [], groupId: null, lookup: null });
export function editablePublicationFields(value: PublicationFields): PublicationFields { return Object.fromEntries(Object.keys(emptyPublicationFields()).map(key => [key, value[key as keyof PublicationFields]])) as PublicationFields; }
export function publicationFingerprint(value: PublicationFields) {
  let fields = editablePublicationFields(value);
  try { fields = publicationFieldsInput.parse(fields); } catch { /* Invalid in-progress edits must stay dirty. */ }
  return canonicalContentFingerprint({ ...fields, lookup: null });
}
export const hasUnpublishedPublicationChanges = (working: PublicationFields, published: PublicationContent | null) => !!published && publicationFingerprint(working) !== publicationFingerprint(published);
export const publicationDeletionPhrase = (title: string) => `Delete ${title}`;
// Missing components sort below known components in the same year/month; never display them.
export const publicationDateKey = (value: string) => Number(value.replaceAll("-", "").padEnd(8, "0"));
export function publicationDateLabel(value: string) {
  if (!value) return "Date not recorded";
  if (value.length === 4) return value;
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return (value.length === 10 ? Number(value.slice(8, 10)) + " " : "") + months[Number(value.slice(5,7)) - 1] + " " + value.slice(0,4);
}
export function publicationRequirements(fields: PublicationFields) {
  const errors: Record<string, string> = {};
  if (!fields.publicationDate) errors.publicationDate = "Add at least a publication year before publishing.";
  if (!fields.authors.length && !fields.source) errors.authors = "Add an author or a source/issuing organisation before publishing.";
  return errors;
}

export function publicationDraftFingerprint(value: PublicationFields) { return canonicalContentFingerprint(editablePublicationFields(value)); }
