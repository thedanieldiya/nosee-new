ALTER TABLE leadership_profile_identity ADD COLUMN deleted_at timestamptz;
--> statement-breakpoint
CREATE TABLE leadership_profile (
 id uuid PRIMARY KEY REFERENCES leadership_profile_identity(id), fields jsonb NOT NULL,
 status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','unpublished','deleted')),
 published_content jsonb, published_order integer, published_at timestamptz, version integer NOT NULL DEFAULT 1 CHECK(version>0),
 creation_key uuid NOT NULL UNIQUE, creation_digest text NOT NULL, last_mutation_key uuid, last_mutation_digest text,
 provenance text NOT NULL DEFAULT 'admin-authored; approval separate', created_by uuid REFERENCES administrator(id),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(status<>'published' OR (published_content IS NOT NULL AND published_order IS NOT NULL AND published_at IS NOT NULL))
);
--> statement-breakpoint
INSERT INTO leadership_profile(id,fields,creation_key,creation_digest,provenance)
 SELECT id,jsonb_build_object('firstName','','lastName','','displayName',display_name,'roleTitle',role_title,'category','','affiliation',affiliation,'researchInterests','','biography','','portrait','','portraitAlt','','displayOrder',0),id,'a04-anchor-attachment','existing A04 stable identity; attached draft, never auto-published' FROM leadership_profile_identity;
--> statement-breakpoint
CREATE INDEX leadership_profile_public ON leadership_profile(published_order,id) WHERE status='published';
--> statement-breakpoint
CREATE TABLE homepage_hero (
 id text PRIMARY KEY CHECK(id='homepage'), fields jsonb NOT NULL, published_content jsonb NOT NULL,
 version integer NOT NULL DEFAULT 1 CHECK(version>0), last_mutation_key uuid, last_mutation_digest text,
 published_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE site_content_state (id text PRIMARY KEY CHECK(id='leadership'), initialized_at timestamptz NOT NULL DEFAULT now());
