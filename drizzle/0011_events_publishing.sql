CREATE TABLE event (
 id uuid PRIMARY KEY, slug text NOT NULL UNIQUE, fields jsonb NOT NULL,
 cover_image text NOT NULL DEFAULT '', cover_alt text NOT NULL DEFAULT '', status text NOT NULL DEFAULT 'draft',
 published_content jsonb, published_start timestamptz, published_end timestamptz, published_featured boolean, published_at timestamptz,
 provenance text NOT NULL DEFAULT 'admin-authored; owner approval separate',
 deleted_at timestamptz, last_mutation_key uuid, last_mutation_digest text,
 version integer NOT NULL DEFAULT 1, creation_key uuid NOT NULL UNIQUE, creation_digest text NOT NULL, created_by uuid NOT NULL REFERENCES administrator(id),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT event_status CHECK(status IN ('draft','published','unpublished','deleted')),
 CONSTRAINT event_version CHECK(version>0),
 CONSTRAINT event_publication CHECK(status<>'published' OR (published_content IS NOT NULL AND published_start IS NOT NULL AND published_end IS NOT NULL AND published_end>published_start AND published_featured IS NOT NULL AND published_at IS NOT NULL))
);
--> statement-breakpoint
CREATE INDEX event_feed ON event(published_featured,published_start,slug) WHERE status='published' AND deleted_at IS NULL;
