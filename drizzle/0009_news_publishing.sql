CREATE TABLE "news_article" (
 "id" uuid PRIMARY KEY NOT NULL, "title" text NOT NULL, "slug" text NOT NULL UNIQUE, "category" text NOT NULL,
 "excerpt" text DEFAULT '' NOT NULL, "body" jsonb NOT NULL, "publication_date" timestamp with time zone NOT NULL,
 "featured" boolean DEFAULT false NOT NULL, "cover_image" text DEFAULT '' NOT NULL, "cover_alt" text DEFAULT '' NOT NULL,
 "status" text DEFAULT 'draft' NOT NULL, "published_content" jsonb, "published_date" timestamp with time zone,
 "published_featured" boolean, "published_at" timestamp with time zone, "version" integer DEFAULT 1 NOT NULL,
 "creation_key" uuid NOT NULL UNIQUE, "creation_digest" text NOT NULL, "created_by" uuid NOT NULL REFERENCES "administrator"("id"),
 "created_at" timestamp with time zone DEFAULT now() NOT NULL, "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
 CONSTRAINT "news_article_status" CHECK (status IN ('draft','published')),
 CONSTRAINT "news_article_version" CHECK (version>0),
 CONSTRAINT "news_article_publication" CHECK (status<>'published' OR (published_content IS NOT NULL AND published_date IS NOT NULL AND published_featured IS NOT NULL AND published_at IS NOT NULL))
);
--> statement-breakpoint
CREATE INDEX "news_article_feed" ON "news_article" ("published_featured", "published_date", "slug") WHERE "status"='published';
