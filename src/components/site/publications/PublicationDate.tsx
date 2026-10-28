import { publicationDateLabel } from "@/lib/publications/content";
export function PublicationDate({ value }: { value: string }) {
  // HTML datetime supports month/date values; a year alone remains plain text.
  return value.length === 4 ? <span>{publicationDateLabel(value)}</span> : <time dateTime={value}>{publicationDateLabel(value)}</time>;
}
