CREATE TABLE publication (
 id uuid PRIMARY KEY, slug text NOT NULL UNIQUE, doi text UNIQUE, fields jsonb NOT NULL,
 status text NOT NULL DEFAULT 'draft', published_content jsonb, published_date_key integer, published_at timestamptz,
 provenance text NOT NULL DEFAULT 'admin-authored; owner acceptance separate', deleted_at timestamptz,
 last_mutation_key uuid, last_mutation_digest text, version integer NOT NULL DEFAULT 1,
 creation_key uuid NOT NULL UNIQUE, creation_digest text NOT NULL, created_by uuid NOT NULL REFERENCES administrator(id),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT publication_status CHECK(status IN ('draft','published','unpublished','deleted')),
 CONSTRAINT publication_version CHECK(version>0),
 CONSTRAINT publication_doi_normalized CHECK(doi IS NULL OR (doi=lower(doi) AND doi !~ '[[:space:]]' AND doi ~ '^10\.[0-9]{4,9}/.+$')),
 CONSTRAINT publication_live CHECK(status<>'published' OR (published_content IS NOT NULL AND published_date_key IS NOT NULL AND published_at IS NOT NULL))
);
--> statement-breakpoint
CREATE INDEX publication_feed ON publication(published_date_key,slug) WHERE status='published' AND deleted_at IS NULL;
--> statement-breakpoint
CREATE TABLE publication_doi (doi text PRIMARY KEY, publication_id uuid NOT NULL REFERENCES publication(id), created_at timestamptz NOT NULL DEFAULT now());
--> statement-breakpoint
CREATE TABLE publication_lookup (doi text PRIMARY KEY, result jsonb, expires_at timestamptz NOT NULL, lease_until timestamptz, lease_token uuid);
