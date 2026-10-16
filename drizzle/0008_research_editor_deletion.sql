ALTER TABLE "research_group" ADD COLUMN "description_document" jsonb;
--> statement-breakpoint
ALTER TABLE "research_group" ADD COLUMN "deleted_at" timestamp with time zone;
