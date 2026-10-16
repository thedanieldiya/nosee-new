export const researchDeletionPhrase = (name: string) => `Delete ${name}`;
export function researchSlugBase(name: string) {
  // Latin diacritics fold; other Unicode scripts remain in the name, with a safe URL fallback.
  return name.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80).replace(/-+$/g, "") || "research-group";
}
export function researchSlugCandidate(base: string, number: number) {
  const suffix = number === 1 ? "" : `-${number}`;
  return base.slice(0, 80 - suffix.length).replace(/-+$/g, "") + suffix;
}
