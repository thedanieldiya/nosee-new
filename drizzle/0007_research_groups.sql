CREATE TABLE research_group (
 id uuid PRIMARY KEY, name text NOT NULL, slug text NOT NULL UNIQUE, introduction text NOT NULL DEFAULT '', description text NOT NULL DEFAULT '', objectives text[] NOT NULL DEFAULT '{}', cover_image text NOT NULL DEFAULT '', cover_alt text NOT NULL DEFAULT '',
 status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')), published_content jsonb, published_slug text UNIQUE, published_at timestamptz,
 version integer NOT NULL DEFAULT 1 CHECK (version>0), creation_key uuid NOT NULL UNIQUE, creation_digest text NOT NULL, created_by uuid NOT NULL REFERENCES administrator(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT research_group_publication CHECK (status<>'published' OR (published_content IS NOT NULL AND published_slug IS NOT NULL AND published_at IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE research_group_member (
 id uuid PRIMARY KEY, group_id uuid NOT NULL REFERENCES research_group(id), member_id uuid NOT NULL REFERENCES member(id), role_title text NOT NULL DEFAULT '', display_order integer NOT NULL DEFAULT 0 CHECK(display_order BETWEEN 0 AND 9999), version integer NOT NULL DEFAULT 1 CHECK(version>0), added_by uuid NOT NULL REFERENCES administrator(id), removed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX research_group_member_current ON research_group_member(group_id,member_id) WHERE removed_at IS NULL;
--> statement-breakpoint
CREATE INDEX research_group_member_person ON research_group_member(member_id);
--> statement-breakpoint
CREATE TABLE research_lead_assignment (
 id uuid PRIMARY KEY, group_id uuid NOT NULL REFERENCES research_group(id), administrator_id uuid NOT NULL REFERENCES administrator(id), member_id uuid NOT NULL REFERENCES member(id), assigned_by uuid NOT NULL REFERENCES administrator(id), created_at timestamptz NOT NULL DEFAULT now(), revoked_at timestamptz, revoked_by uuid REFERENCES administrator(id), revocation_reason text
);
--> statement-breakpoint
CREATE UNIQUE INDEX research_lead_current_group ON research_lead_assignment(group_id) WHERE revoked_at IS NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX research_lead_current_administrator ON research_lead_assignment(administrator_id) WHERE revoked_at IS NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX research_lead_current_member ON research_lead_assignment(member_id) WHERE revoked_at IS NULL;
--> statement-breakpoint
ALTER TABLE admin_invitation ADD COLUMN research_group_id uuid REFERENCES research_group(id), ADD COLUMN member_id uuid REFERENCES member(id), ADD COLUMN member_version integer;
--> statement-breakpoint
ALTER TABLE admin_invitation DROP CONSTRAINT admin_invitation_role_check;
--> statement-breakpoint
ALTER TABLE admin_invitation ADD CONSTRAINT admin_invitation_eligible_role CHECK (
 (role IN ('super_admin','editor') AND research_group_id IS NULL AND member_id IS NULL AND member_version IS NULL)
 OR (role='research_group_lead' AND research_group_id IS NOT NULL AND member_id IS NOT NULL AND member_version IS NOT NULL AND member_version>0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX admin_invitation_pending_group ON admin_invitation(research_group_id) WHERE revoked_at IS NULL AND accepted_at IS NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX admin_invitation_pending_member ON admin_invitation(member_id) WHERE revoked_at IS NULL AND accepted_at IS NULL;
