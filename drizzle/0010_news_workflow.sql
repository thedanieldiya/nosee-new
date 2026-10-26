ALTER TABLE "news_article" ADD COLUMN "publication_timezone" text DEFAULT 'Africa/Lagos' NOT NULL;
ALTER TABLE "news_article" ADD COLUMN "deleted_at" timestamp with time zone;
ALTER TABLE "news_article" ADD COLUMN "last_mutation_key" uuid;
ALTER TABLE "news_article" ADD COLUMN "last_mutation_digest" text;
ALTER TABLE "news_article" DROP CONSTRAINT "news_article_status";
ALTER TABLE "news_article" ADD CONSTRAINT "news_article_status" CHECK ("status" IN ('draft','published','unpublished','deleted'));
CREATE INDEX "news_article_listing" ON "news_article" ("published_date" DESC, "slug") WHERE "status"='published' AND "deleted_at" IS NULL;
