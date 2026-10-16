export function slugBase(name: string, fallback = "research-group") {
  return name.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80).replace(/-+$/g, "") || fallback;
}
export function slugCandidate(base: string, number: number) {
  const suffix = number === 1 ? "" : `-${number}`;
  return base.slice(0, 80 - suffix.length).replace(/-+$/g, "") + suffix;
}
// Callers hold the authority lock and include every retained slug in their content namespace.
export function automaticSlug(title: string, reserved: Iterable<string | null>, fallback = "research-group") {
  const base = slugBase(title, fallback), used = new Set(reserved);
  let number = 1, slug = base; while (used.has(slug)) slug = slugCandidate(base, ++number);
  return slug;
}
