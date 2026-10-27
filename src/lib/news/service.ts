import { authorizedPublishing } from "../admin/publishing.ts";
import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { eq, sql, desc, asc } from "drizzle-orm";
import { z } from "zod";
import { ManagementError } from "../admin/errors.ts";
import { newsArticle, auditLog } from "../admin/schema.ts";
import type { Principal } from "../admin/policy.ts";
import type { ResearchTransaction } from "../research/security.ts";
import { descriptionText } from "../research/description.ts";
import { automaticSlug } from "../content/slug.ts";
import { newsCreateInput, newsUpdateInput, newsPublicationInput, newsDeletionInput, newsQuery, newsContentInput } from "./input.ts";
import { newsDeletionPhrase, type NewsContent, type NewsFields } from "./options.ts";
import { hasUnpublishedNewsChanges } from "./draft-state.ts";

export type NewsStatus = "draft" | "published" | "unpublished" | "deleted";
export type ArticleRecord = NewsContent & { id: string; version: number; status: NewsStatus; publishedContent: NewsContent | null; publishedAt: string | null; updatedAt: string };
const fields = { title: newsArticle.title, slug: newsArticle.slug, category: newsArticle.category, excerpt: newsArticle.excerpt, body: newsArticle.body, publicationDate: newsArticle.publicationDate, publicationTimezone: newsArticle.publicationTimezone, featured: newsArticle.featured, coverImage: newsArticle.coverImage, coverAlt: newsArticle.coverAlt };
const projection = { ...fields, id: newsArticle.id, version: newsArticle.version, status: newsArticle.status, publishedContent: newsArticle.publishedContent, publishedAt: newsArticle.publishedAt, updatedAt: newsArticle.updatedAt, lastMutationKey: newsArticle.lastMutationKey, lastMutationDigest: newsArticle.lastMutationDigest };
const serialize = <T>(value: unknown): T => JSON.parse(JSON.stringify(value));
function parse<T>(schema: z.ZodType<T>, raw: unknown): T {
  const result = schema.safeParse(raw);
  if (!result.success) throw new ManagementError(result.error.issues.some(issue => issue.path.includes("body")) ? "Use supported body formatting and safe links, within 6,000 visible characters." : "Check the title, category, date, time zone and saved version before retrying.");
  return result.data;
}
async function row(tx: ResearchTransaction, id: string, includeDeleted = false) {
  if (!z.uuid().safeParse(id).success) throw new ManagementError("Article not found.", 404);
  const [article] = await tx.select(projection).from(newsArticle).where(eq(newsArticle.id, id));
  if (!article || (!includeDeleted && article.status === "deleted")) throw new ManagementError("Article not found.", 404);
  return article;
}
function checkVersion(article: { version: number }, expected: number) {
  if (article.version !== expected) throw new ManagementError("This article changed. Reload and review the saved version before retrying.", 409);
}
async function audit(tx: ResearchTransaction, actor: Principal, id: string, title: string, action: string, before?: string, after?: string) {
  await tx.insert(auditLog).values({ id: randomUUID(), actorId: actor.id, action, targetType: "news_article", targetId: id, targetLabel: title, ...(before && after ? { changes: { before: { status: before }, after: { status: after } } } : {}), createdAt: sql`clock_timestamp()` });
}
function digest(value: unknown) { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
function sameMutation(article: { lastMutationKey: string | null; lastMutationDigest: string | null }, key: string | undefined, hashed: string) {
  if (!key || article.lastMutationKey !== key) return false;
  if (article.lastMutationDigest !== hashed) throw new ManagementError("This request key has already been used for different changes.", 409);
  return true;
}
function snapshot(article: { slug: string; coverImage: string; coverAlt: string }, input: NewsFields) {
  return parse(newsContentInput, { ...input, slug: article.slug, coverImage: article.coverImage, coverAlt: article.coverAlt });
}
async function checkPublication(tx: ResearchTransaction, value: { publicationDate: string; excerpt: string; body: NewsContent["body"] }) {
  if (!value.excerpt || !descriptionText(value.body).trim()) throw new ManagementError("Add a summary and article body before publishing.");
  const result = await tx.execute<{ now: Date }>(sql`select clock_timestamp() as now`);
  if (new Date(value.publicationDate).getTime() > new Date(result.rows[0].now).getTime()) throw new ManagementError("Publication date is in the future. Choose a current or past time; scheduled publishing is unavailable.");
}
export async function newsDirectory(actor: Principal, raw: unknown) {
  const query = parse(newsQuery, raw), pattern = `%${query.q.replace(/[\\%_]/g, "\\$&")}%`;
  return authorizedPublishing(actor, async tx => {
    const where = sql`${newsArticle.deletedAt} is null and (${newsArticle.title} ilike ${pattern} or ${newsArticle.excerpt} ilike ${pattern}) and (${query.status}='' or ${newsArticle.status}=${query.status})`;
    const total = Number((await tx.select({ n: sql`count(*)::int` }).from(newsArticle).where(where))[0].n), pages = Math.max(1, Math.ceil(total / 20)), page = Math.min(query.page, pages);
    // Compare this bounded page on the server; bodies and snapshots never enter the directory DTO.
    const rows = await tx.select({ ...fields, id: newsArticle.id, status: newsArticle.status, version: newsArticle.version, updatedAt: newsArticle.updatedAt, publishedContent: newsArticle.publishedContent }).from(newsArticle).where(where).orderBy(desc(newsArticle.updatedAt), asc(newsArticle.id)).limit(20).offset((page - 1) * 20);
    const records = serialize<Array<NewsContent & Pick<ArticleRecord, "id" | "status" | "version" | "updatedAt" | "publishedContent">>>(rows);
    return { rows: records.map(article => ({ id: article.id, title: article.title, category: article.category, slug: article.slug, status: article.status, version: article.version, updatedAt: article.updatedAt, hasUnpublishedChanges: article.status === "published" && hasUnpublishedNewsChanges(article, article.publishedContent) })), total, page, pages };
  });
}
export async function getNewsArticle(actor: Principal, id: string) { return authorizedPublishing(actor, async tx => serialize<ArticleRecord>(await row(tx, id))); }
export async function createNewsArticle(actor: Principal, raw: unknown) {
  const input = parse(newsCreateInput, raw), fingerprint = digest({ fields: input.fields, mode: input.mode });
  return authorizedPublishing(actor, async tx => {
    const [prior] = await tx.select({ id: newsArticle.id, digest: newsArticle.creationDigest }).from(newsArticle).where(eq(newsArticle.creationKey, input.requestId));
    if (prior) {
      if (prior.digest !== fingerprint) throw new ManagementError("This creation request already saved different content. Reload before adding another article.", 409);
      return { id: prior.id, message: "This request was already saved. No duplicate was added." };
    }
    if (input.mode === "publish") await checkPublication(tx, input.fields);
    const reserved = (await tx.select({ slug: newsArticle.slug }).from(newsArticle)).map(value => value.slug);
    const id = randomUUID(), slug = automaticSlug(input.fields.title, reserved, "news-article");
    const content = input.mode === "publish" ? snapshot({ slug, coverImage: "", coverAlt: "" }, input.fields) : null;
    await tx.insert(newsArticle).values({ ...input.fields, publicationDate: new Date(input.fields.publicationDate), id, slug, creationKey: input.requestId, creationDigest: fingerprint, createdBy: actor.id, status: input.mode === "publish" ? "published" : "draft", ...(content ? { publishedContent: content, publishedDate: new Date(input.fields.publicationDate), publishedFeatured: input.fields.featured, publishedAt: sql`clock_timestamp()` } : {}) });
    await audit(tx, actor, id, input.fields.title, input.mode === "publish" ? "Published news article" : "Created news draft");
    return { id, message: input.mode === "publish" ? "Article published." : "Draft saved." };
  });
}
export async function updateNewsArticle(actor: Principal, id: string, raw: unknown) {
  const input = parse(newsUpdateInput, raw), fingerprint = digest({ action: "update", mode: input.mode, fields: input.fields, version: input.version });
  return authorizedPublishing(actor, async tx => {
    const article = await row(tx, id);
    if (sameMutation(article, input.mutationId, fingerprint)) return { id, message: "These changes were already saved." };
    checkVersion(article, input.version);
    if (input.mode === "publish") await checkPublication(tx, input.fields);
    const content = input.mode === "publish" ? snapshot(article, input.fields) : null;
    const newStatus = input.mode === "publish" ? "published" : article.status;
    await tx.update(newsArticle).set({ ...input.fields, publicationDate: new Date(input.fields.publicationDate), status: newStatus, ...(content ? { publishedContent: content, publishedDate: new Date(input.fields.publicationDate), publishedFeatured: input.fields.featured, publishedAt: sql`clock_timestamp()` } : {}), lastMutationKey: input.mutationId ?? null, lastMutationDigest: input.mutationId ? fingerprint : null, version: article.version + 1, updatedAt: sql`clock_timestamp()` }).where(eq(newsArticle.id, id));
    await audit(tx, actor, id, input.fields.title, input.mode === "publish" ? "Published news changes" : "Saved news working copy", article.status, newStatus);
    return { id, message: input.mode === "publish" ? "Article published." : "Draft saved. Published content is unchanged." };
  });
}
export async function publishNewsArticle(actor: Principal, id: string, raw: unknown) {
  const input = parse(newsPublicationInput, raw), fingerprint = digest(input);
  return authorizedPublishing(actor, async tx => {
    const article = await row(tx, id);
    if (sameMutation(article, input.mutationId, fingerprint)) return { id, message: "Publication state already saved." };
    checkVersion(article, input.version);
    if (input.action === "unpublish" && article.status !== "published") throw new ManagementError("Only published articles can be unpublished.", 409);
    if (input.action === "publish") await checkPublication(tx, { publicationDate: article.publicationDate.toISOString(), excerpt: article.excerpt, body: article.body });
    const published = input.action === "publish", newStatus = published ? "published" : "unpublished";
    const content = published ? snapshot(article, {
      title: article.title, category: article.category as NewsContent["category"], excerpt: article.excerpt,
      body: article.body, publicationDate: article.publicationDate.toISOString(), publicationTimezone: article.publicationTimezone, featured: article.featured,
    }) : null;
    await tx.update(newsArticle).set({ status: newStatus, ...(content ? { publishedContent: content, publishedDate: article.publicationDate, publishedFeatured: article.featured, publishedAt: sql`clock_timestamp()` } : {}), lastMutationKey: input.mutationId ?? null, lastMutationDigest: input.mutationId ? fingerprint : null, version: article.version + 1, updatedAt: sql`clock_timestamp()` }).where(eq(newsArticle.id, id));
    await audit(tx, actor, id, article.title, published ? "Published news article" : "Unpublished news article", article.status, newStatus);
    return { id, slug: article.slug, message: published ? "Article published." : "Article unpublished." };
  });
}
export async function deleteNewsArticle(actor: Principal, id: string, raw: unknown) {
  const input = parse(newsDeletionInput, raw), fingerprint = digest({ action: "delete", version: input.version, phrase: input.phrase });
  return authorizedPublishing(actor, async tx => {
    const article = await row(tx, id, true);
    if (article.status === "deleted" && sameMutation(article, input.mutationId, fingerprint)) return { id, slug: article.slug, message: "Article already deleted." };
    if (article.status === "deleted") throw new ManagementError("Article not found.", 404);
    checkVersion(article, input.version);
    if (input.phrase !== newsDeletionPhrase(article.title)) throw new ManagementError("Type the exact deletion phrase to confirm.", 400);
    await tx.update(newsArticle).set({ status: "deleted", deletedAt: sql`clock_timestamp()`, lastMutationKey: input.mutationId ?? null, lastMutationDigest: input.mutationId ? fingerprint : null, version: article.version + 1, updatedAt: sql`clock_timestamp()` }).where(eq(newsArticle.id, id));
    await audit(tx, actor, id, article.title, "Deleted news article", article.status, "deleted");
    return { id, slug: article.slug, message: "Article deleted." };
  });
}
