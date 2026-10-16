import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { eq, sql, desc, asc } from "drizzle-orm";
import { z } from "zod";
import { adminDatabase } from "../admin/database.ts";
import { ManagementError } from "../admin/errors.ts";
import { user, newsArticle, auditLog } from "../admin/schema.ts";
import type { Principal } from "../admin/policy.ts";
import type { ResearchTransaction } from "../research/security.ts";
import { descriptionText } from "../research/description.ts";
import { automaticSlug } from "../content/slug.ts";
import { newsCreateInput, newsUpdateInput, newsPublicationInput, newsQuery, newsContentInput } from "./input.ts";
import type { NewsContent } from "./options.ts";
export type ArticleRecord = NewsContent & { id: string; version: number; status: "draft" | "published"; publishedContent: NewsContent | null; publishedAt: string | null; updatedAt: string };
const fields = { title: newsArticle.title, slug: newsArticle.slug, category: newsArticle.category, excerpt: newsArticle.excerpt, body: newsArticle.body, publicationDate: newsArticle.publicationDate, featured: newsArticle.featured, coverImage: newsArticle.coverImage, coverAlt: newsArticle.coverAlt };
const projection = { ...fields, id: newsArticle.id, version: newsArticle.version, status: newsArticle.status, publishedContent: newsArticle.publishedContent, publishedAt: newsArticle.publishedAt, updatedAt: newsArticle.updatedAt };
const serialize = <T>(value: unknown): T => JSON.parse(JSON.stringify(value));
function parse<T>(schema: z.ZodType<T>, raw: unknown): T { const result = schema.safeParse(raw); if (!result.success) throw new ManagementError(result.error.issues.some(issue => issue.path.includes("body")) ? "Use supported body formatting and safe links, within 6,000 visible characters." : "Check the title, category, field limits, UTC date and confirmation. Reload if this article changed."); return result.data; }
async function authorized<T>(actor: Principal, work: (tx: ResearchTransaction) => Promise<T>) {
  return adminDatabase().db.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(4631002)`);
    const [current] = await tx.select().from(user).where(eq(user.id, actor.id));
    if (!current?.active || current.accessVersion !== actor.accessVersion || !["super_admin", "editor"].includes(current.role)) throw new ManagementError("Current publishing access is required.", 403);
    return work(tx);
  });
}
async function row(tx: ResearchTransaction, id: string) {
  if (!z.uuid().safeParse(id).success) throw new ManagementError("Article not found.", 404);
  const [article] = await tx.select(projection).from(newsArticle).where(eq(newsArticle.id, id));
  if (!article) throw new ManagementError("Article not found.", 404); return article;
}
function version(article: { version: number }, expected: number) { if (article.version !== expected) throw new ManagementError("This article changed. Reload and review the saved version before retrying.", 409); }
async function audit(tx: ResearchTransaction, actor: Principal, id: string, action: string, before?: string, after?: string) {
  await tx.insert(auditLog).values({ id: randomUUID(), actorId: actor.id, action, targetType: "news_article", targetId: id, targetLabel: "News article", ...(before && after ? { changes: { before: { status: before }, after: { status: after } } } : {}), createdAt: sql`clock_timestamp()` });
}
export async function newsDirectory(actor: Principal, raw: unknown) {
  const query = parse(newsQuery, raw), pattern = `%${query.q.replace(/[\\%_]/g, "\\$&")}%`;
  return authorized(actor, async tx => {
    const where = sql`(${newsArticle.title} ilike ${pattern} or ${newsArticle.excerpt} ilike ${pattern}) and (${query.status}='' or ${newsArticle.status}=${query.status})`;
    const total = Number((await tx.select({ n: sql`count(*)::int` }).from(newsArticle).where(where))[0].n), pages = Math.max(1, Math.ceil(total / 20)), page = Math.min(query.page, pages);
    const rows = await tx.select({ id: newsArticle.id, title: newsArticle.title, category: newsArticle.category, slug: newsArticle.slug, status: newsArticle.status, updatedAt: newsArticle.updatedAt }).from(newsArticle).where(where).orderBy(desc(newsArticle.updatedAt), asc(newsArticle.id)).limit(20).offset((page - 1) * 20);
    return { rows: serialize<Array<{ id: string; title: string; category: string; slug: string; status: string; updatedAt: string }>>(rows), total, page, pages };
  });
}
export async function getNewsArticle(actor: Principal, id: string) { return authorized(actor, async tx => serialize<ArticleRecord>(await row(tx, id))); }
export async function createNewsArticle(actor: Principal, raw: unknown) {
  const input = parse(newsCreateInput, raw), digest = createHash("sha256").update(JSON.stringify(input.fields)).digest("hex");
  return authorized(actor, async tx => {
    const [prior] = await tx.select({ id: newsArticle.id, digest: newsArticle.creationDigest }).from(newsArticle).where(eq(newsArticle.creationKey, input.requestId));
    if (prior) { if (prior.digest !== digest) throw new ManagementError("This creation request already saved different content. Reload before adding another article.", 409); return { id: prior.id, message: "This request already created an article; no duplicate was added." }; }
    const reserved = (await tx.select({ slug: newsArticle.slug }).from(newsArticle)).map(article => article.slug), id = randomUUID();
    await tx.insert(newsArticle).values({ ...input.fields, publicationDate: new Date(input.fields.publicationDate), id, slug: automaticSlug(input.fields.title, reserved, "news-article"), creationKey: input.requestId, creationDigest: digest, createdBy: actor.id });
    await audit(tx, actor, id, "Created news draft"); return { id, message: "Draft saved." };
  });
}
export async function updateNewsArticle(actor: Principal, id: string, raw: unknown) {
  const input = parse(newsUpdateInput, raw);
  return authorized(actor, async tx => {
    const article = await row(tx, id); version(article, input.version);
    await tx.update(newsArticle).set({ ...input.fields, publicationDate: new Date(input.fields.publicationDate), version: article.version + 1, updatedAt: sql`clock_timestamp()` }).where(eq(newsArticle.id, id));
    await audit(tx, actor, id, "Saved news working copy"); return { id, message: "Working copy saved. Publish to update the homepage version." };
  });
}
export async function publishNewsArticle(actor: Principal, id: string, raw: unknown) {
  const input = parse(newsPublicationInput, raw);
  return authorized(actor, async tx => {
    const article = await row(tx, id); version(article, input.version);
    const published = input.action === "publish";
    if (published) {
      const [{ now }] = await tx.select({ now: sql<string>`clock_timestamp()::text` }).from(newsArticle).where(eq(newsArticle.id, id));
      if (article.publicationDate.getTime() > new Date(now).getTime()) throw new ManagementError("Publication date is in the future. Choose a current or past UTC time; scheduled publication is unavailable.");
      if (!article.excerpt || !descriptionText(article.body).trim()) throw new ManagementError("Add a summary and article body before publishing.");
    }
    const content = parse(newsContentInput, serialize(Object.fromEntries(Object.keys(fields).map(key => [key, article[key as keyof typeof article]]))));
    await tx.update(newsArticle).set({ status: published ? "published" : "draft", ...(published ? { publishedContent: content, publishedDate: article.publicationDate, publishedFeatured: article.featured, publishedAt: sql`clock_timestamp()` } : {}), version: article.version + 1, updatedAt: sql`clock_timestamp()` }).where(eq(newsArticle.id, id));
    await audit(tx, actor, id, published ? "Published news article" : "Unpublished news article", article.status, published ? "published" : "draft");
    return { id, message: published ? "Published snapshot saved. The homepage selects up to four eligible articles; full article pages await an approved design." : "Article unpublished and removed from the homepage feed." };
  });
}
