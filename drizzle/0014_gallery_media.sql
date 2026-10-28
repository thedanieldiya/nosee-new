CREATE TABLE gallery_item (
 id uuid PRIMARY KEY, kind text NOT NULL CHECK(kind IN ('photo','album')), slug text NOT NULL UNIQUE,
 fields jsonb NOT NULL, status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','unpublished','deleted')),
 published_content jsonb, published_order integer, published_at timestamptz, version integer NOT NULL DEFAULT 1 CHECK(version>0),
 creation_key uuid NOT NULL UNIQUE, creation_digest text NOT NULL, last_mutation_key uuid, last_mutation_digest text,
 deleted_at timestamptz, created_by uuid NOT NULL REFERENCES administrator(id),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(status<>'published' OR (published_content IS NOT NULL AND published_order IS NOT NULL AND published_at IS NOT NULL))
);
--> statement-breakpoint
CREATE INDEX gallery_public_order ON gallery_item(published_order,id) WHERE status='published' AND deleted_at IS NULL;
--> statement-breakpoint
CREATE TABLE media_asset (
 id uuid PRIMARY KEY, owner_type text NOT NULL, owner_id uuid NOT NULL, uploaded_by uuid NOT NULL REFERENCES administrator(id),
 request_id uuid NOT NULL, declaration jsonb NOT NULL, provider text NOT NULL,
 state text NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','uploading','staged','ready','failed')),
 attempts jsonb NOT NULL DEFAULT '[]', variants jsonb, raw_sha256 text,
 lease_token uuid, lease_until timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(owner_type,owner_id,uploaded_by,request_id),
 CHECK(state<>'ready' OR (variants IS NOT NULL AND raw_sha256 IS NOT NULL))
);
--> statement-breakpoint
CREATE INDEX media_upload_leases ON media_asset(lease_until) WHERE state='uploading';
--> statement-breakpoint
CREATE TABLE media_reference (
 asset_id uuid NOT NULL REFERENCES media_asset(id), owner_type text NOT NULL, owner_id uuid NOT NULL,
 kind text NOT NULL CHECK(kind IN ('working','published','history')), created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(asset_id,owner_type,owner_id,kind)
);
