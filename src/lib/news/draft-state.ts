import { descriptionDocument, validateDescription, type Description } from "../research/description.ts";
import type { NewsFields } from "./options.ts";
export function draftFingerprint(fields: NewsFields) {
  const instant = new Date(/Z$|[+-]\d\d:\d\d$/.test(fields.publicationDate) ? fields.publicationDate : fields.publicationDate + "Z");
  let body: Description = descriptionDocument(fields.body);
  // Compare the same safe document the server stores. Invalid in-progress input
  // still needs an unsaved indicator, rather than an exception while typing.
  try { body = validateDescription(body); } catch { /* Save validation reports unsupported or over-limit content. */ }
  const value = { ...fields, publicationDate: Number.isFinite(instant.getTime()) ? instant.toISOString() : fields.publicationDate, body };
  return JSON.stringify(value, (key, item) => {
    // Marks commute; content/list order does not. Tiptap also supplies default
    // ordered-list attributes that can be absent in a valid stored document.
    if (key === "marks" && Array.isArray(item)) return [...item].sort((a, b) => a.type < b.type ? -1 : Number(a.type > b.type));
    if (item && typeof item === "object" && !Array.isArray(item)) {
      const normalized = item.type === "orderedList" ? { ...item, attrs: { start: item.attrs?.start ?? 1 } } : item;
      return Object.fromEntries(Object.entries(normalized).sort(([a], [b]) => a < b ? -1 : Number(a > b)));
    }
    return item;
  });
}
