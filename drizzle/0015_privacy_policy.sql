CREATE TABLE privacy_policy_version (
 id text PRIMARY KEY, title text NOT NULL, effective_date text NOT NULL DEFAULT '', body jsonb NOT NULL, is_placeholder boolean NOT NULL DEFAULT false,
 created_by uuid REFERENCES administrator(id), published_at timestamptz,
 CHECK ((id='development-placeholder-v1')=is_placeholder)
);
--> statement-breakpoint
CREATE TABLE privacy_policy (
 id text PRIMARY KEY CHECK(id='privacy'), fields jsonb NOT NULL,
 published_version text NOT NULL REFERENCES privacy_policy_version(id),
 version integer NOT NULL DEFAULT 1 CHECK(version>0), last_mutation_key uuid, last_mutation_digest text,
 updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
-- Preserve the exact original wording/version; no historical consent rows are rewritten.
INSERT INTO privacy_policy_version(id,title,body,is_placeholder) VALUES ('development-placeholder-v1','Privacy policy',to_jsonb('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'::text),true);
--> statement-breakpoint
INSERT INTO privacy_policy(id,fields,published_version) SELECT 'privacy',jsonb_build_object('title',title,'effectiveDate',effective_date,'body',body),id FROM privacy_policy_version WHERE id='development-placeholder-v1';
