CREATE TYPE "membership_application_status" AS ENUM ('pending','approved','rejected','expired');
--> statement-breakpoint
CREATE TABLE "membership_application" (
  "id" uuid PRIMARY KEY NOT NULL,
  "first_name" text NOT NULL CHECK (length("first_name") BETWEEN 1 AND 80),
  "last_name" text NOT NULL CHECK (length("last_name") BETWEEN 1 AND 80),
  "email" text NOT NULL CHECK (length("email") <= 254),
  "career_stage" text NOT NULL CHECK ("career_stage" IN ('high_school_student','undergraduate_student','graduate_postgraduate_student','postdoctoral_researcher','early_career','mid_career','experienced','retired')),
  "research_interests" text[] NOT NULL CHECK (cardinality("research_interests") BETWEEN 1 AND 5 AND "research_interests" <@ ARRAY['atmosphere_air_quality','climate_science','earth_space_informatics','energy_resources_environment','space_weather']::text[]),
  "why" text NOT NULL CHECK (length("why") BETWEEN 1 AND 2000),
  "consented_at" timestamptz NOT NULL, "consent_version" text NOT NULL, "privacy_version" text NOT NULL,
  "status" "membership_application_status" DEFAULT 'pending' NOT NULL,
  "form_digest" text UNIQUE NOT NULL, "request_digest" text NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL, "updated_at" timestamptz DEFAULT now() NOT NULL,
  "expires_at" timestamptz DEFAULT (now() + interval '720 hours') NOT NULL,
  "reviewer_id" uuid REFERENCES "administrator"("id"), "reviewed_at" timestamptz, "review_note" text,
  CONSTRAINT "membership_application_decision" CHECK (
    ("status" IN ('approved','rejected') AND "reviewer_id" IS NOT NULL AND "reviewed_at" IS NOT NULL AND "review_note" IS NOT NULL AND length("review_note") BETWEEN 1 AND 2000) OR
    ("status" IN ('pending','expired') AND "reviewer_id" IS NULL AND "reviewed_at" IS NULL AND "review_note" IS NULL)
  )
);
CREATE UNIQUE INDEX "membership_application_active_email" ON "membership_application" (lower("email")) WHERE "status" IN ('pending','approved');
CREATE INDEX "membership_application_expiry" ON "membership_application" ("expires_at","id") WHERE "status"='pending';
CREATE INDEX "membership_application_created" ON "membership_application" ("created_at","id");
--> statement-breakpoint
-- NULL means the real application system actor; never provision a fake administrator.
ALTER TABLE "admin_audit_log" ALTER COLUMN "actor_id" DROP NOT NULL;
