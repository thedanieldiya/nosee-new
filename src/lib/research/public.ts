import "server-only";
import { eq, sql } from "drizzle-orm";
import { adminDatabase } from "../admin/database.ts";
import { researchGroup } from "../admin/schema.ts";
import { groupContentInput } from "./input.ts";
// P4 has no approved public research renderer yet. This is its published-only read contract.
// No member roster, Lead identity or working draft is included, and no public API exposes it.
export async function publishedResearchGroup(slug: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 80) return null;
  const [row] = await adminDatabase().db.select({ content: researchGroup.publishedContent, publishedAt: researchGroup.publishedAt }).from(researchGroup).where(sql`${researchGroup.status}='published' and ${researchGroup.publishedSlug}=${slug}`).limit(1);
  const parsed = groupContentInput.safeParse(row?.content);
  return row?.publishedAt && parsed.success ? { ...parsed.data, publishedAt: row.publishedAt.toISOString() } : null;
}
export async function publishedResearchSlugs() {
  return (await adminDatabase().db.select({ slug: researchGroup.publishedSlug }).from(researchGroup).where(eq(researchGroup.status, "published")).orderBy(researchGroup.publishedSlug)).flatMap(row => row.slug ? [row.slug] : []);
}
