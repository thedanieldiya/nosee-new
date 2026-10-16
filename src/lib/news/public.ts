import "server-only";
import { sql, desc } from "drizzle-orm";
import { adminDatabase } from "../admin/database.ts";
import { newsArticle } from "../admin/schema.ts";
import { newsContentInput, newsFeedInput } from "./input.ts";
import type { NewsRecord } from "../content/news.ts";

// No public route exists yet. Return only a validated published snapshot, never working fields.
export async function publishedNewsArticle(slug: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 80) return null;
  const [article] = await adminDatabase().db.select({ content: newsArticle.publishedContent, date: newsArticle.publishedDate, featured: newsArticle.publishedFeatured }).from(newsArticle).where(sql`${newsArticle.status}='published' and ${newsArticle.slug}=${slug} and ${newsArticle.publishedDate}<=clock_timestamp()`);
  const parsed = newsContentInput.safeParse(article?.content); return parsed.success && parsed.data.slug === slug && parsed.data.publicationDate === article.date?.toISOString() && parsed.data.featured === article.featured ? parsed.data : null;
}
export async function publishedNewsFeed(): Promise<NewsRecord[]> {
  const rows = await adminDatabase().db.select({ slug: newsArticle.slug, date: newsArticle.publishedDate, featured: newsArticle.publishedFeatured, content: sql`(${newsArticle.publishedContent}-'body')` }).from(newsArticle).where(sql`${newsArticle.status}='published' and ${newsArticle.publishedDate}<=clock_timestamp()`).orderBy(desc(newsArticle.publishedFeatured), desc(newsArticle.publishedDate), sql`${newsArticle.slug} collate "C" asc`).limit(4);
  return rows.flatMap(row => { const content = newsFeedInput.safeParse(row.content); if (!content.success || content.data.slug !== row.slug || content.data.publicationDate !== row.date?.toISOString() || content.data.featured !== row.featured) return []; const value = content.data; return [{ slug: value.slug, title: value.title, category: value.category, excerpt: value.excerpt, published_at: value.publicationDate, featured: value.featured, image: value.coverImage, image_alt: value.coverAlt }]; });
}
