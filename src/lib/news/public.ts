import "server-only";
import { sql, desc, asc } from "drizzle-orm";
import { adminDatabase } from "../admin/database.ts";
import { newsArticle } from "../admin/schema.ts";
import { newsContentInput, newsFeedInput } from "./input.ts";
import type { NewsRecord } from "../content/news.ts";

const visible = sql`${newsArticle.status}='published' and ${newsArticle.deletedAt} is null and ${newsArticle.publishedDate}<=clock_timestamp()`;
const isSlug = (slug: string) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 80;
type PublishedRow = { slug: string; date: Date | null; featured: boolean | null; content: unknown };
function newsSummary(row: PublishedRow): NewsRecord | null {
  const parsed = newsFeedInput.safeParse(row.content);
  if (!parsed.success || !row.date || parsed.data.slug !== row.slug || parsed.data.publicationDate !== row.date.toISOString() || parsed.data.featured !== row.featured) return null;
  const article = parsed.data;
  return { slug: article.slug, title: article.title, category: article.category, excerpt: article.excerpt, published_at: article.publicationDate, editorial_timezone: article.publicationTimezone, featured: article.featured, image: article.coverImage, image_alt: article.coverAlt };
}
export async function publishedNewsArticle(slug: string) {
  if (!isSlug(slug)) return null;
  const [article] = await adminDatabase().db.select({ content: newsArticle.publishedContent, date: newsArticle.publishedDate, featured: newsArticle.publishedFeatured }).from(newsArticle).where(sql`${visible} and ${newsArticle.slug}=${slug}`).limit(1);
  const parsed = newsContentInput.safeParse(article?.content);
  return parsed.success && parsed.data.slug === slug && parsed.data.publicationDate === article.date?.toISOString() && parsed.data.featured === article.featured ? parsed.data : null;
}
export async function publishedNewsFeed(): Promise<NewsRecord[]> {
  const rows = await adminDatabase().db.select({ slug: newsArticle.slug, date: newsArticle.publishedDate, featured: newsArticle.publishedFeatured, content: sql`(${newsArticle.publishedContent}-'body')` }).from(newsArticle).where(visible).orderBy(desc(newsArticle.publishedFeatured), desc(newsArticle.publishedDate), sql`${newsArticle.slug} collate "C" asc`).limit(4);
  return rows.flatMap(row => newsSummary(row as PublishedRow) ?? []);
}
export async function publishedNewsListing(rawPage: number) {
  const where = visible, size = 12;
  const [{ total }] = await adminDatabase().db.select({ total: sql<number>`count(*)::int` }).from(newsArticle).where(where);
  const pages = Math.max(1, Math.ceil(total / size)), page = Math.min(Math.max(1, Math.trunc(rawPage) || 1), pages);
  const rows = await adminDatabase().db.select({ slug: newsArticle.slug, date: newsArticle.publishedDate, featured: newsArticle.publishedFeatured, content: sql`(${newsArticle.publishedContent}-'body')` }).from(newsArticle).where(where).orderBy(desc(newsArticle.publishedDate), asc(newsArticle.slug)).limit(size).offset((page - 1) * size);
  return { rows: rows.flatMap(row => newsSummary(row as PublishedRow) ?? []), page, pages, total };
}
