export function researchPaths(slugs: string[]) {
  return ["/research", ...new Set(slugs.filter(slug => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 80).map(slug => `/research/${slug}`))];
}
