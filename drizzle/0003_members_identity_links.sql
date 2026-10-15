-- A10 will extend this empty identity anchor; never import public placeholder profiles.
CREATE TABLE "leadership_profile_identity" (
  "id" uuid PRIMARY KEY NOT NULL, "display_name" text NOT NULL, "role_title" text NOT NULL,
  "affiliation" text DEFAULT '' NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL, "updated_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member" (
  "id" uuid PRIMARY KEY NOT NULL,
  "first_name" text NOT NULL CHECK (length("first_name") BETWEEN 1 AND 80),
  "last_name" text NOT NULL CHECK (length("last_name") BETWEEN 1 AND 80),
  "email" text NOT NULL CHECK (length("email") BETWEEN 3 AND 254),
  "phone" text DEFAULT '' NOT NULL CHECK (length("phone") <= 80),
  "affiliation" text DEFAULT '' NOT NULL CHECK (length("affiliation") <= 200),
  "career_stage" text DEFAULT '' NOT NULL CHECK ("career_stage" IN ('','high_school_student','undergraduate_student','graduate_postgraduate_student','postdoctoral_researcher','early_career','mid_career','experienced','retired')),
  "research_interests" text[] DEFAULT '{}'::text[] NOT NULL CHECK (cardinality("research_interests") <= 5 AND "research_interests" <@ ARRAY['atmosphere_air_quality','climate_science','earth_space_informatics','energy_resources_environment','space_weather']::text[]),
  "status" text DEFAULT 'active' NOT NULL CONSTRAINT "member_status" CHECK ("status" IN ('active','inactive')),
  "join_date" date NOT NULL, "notes" text DEFAULT '' NOT NULL CHECK (length("notes") <= 2000),
  "version" integer DEFAULT 1 NOT NULL CONSTRAINT "member_version" CHECK ("version" >= 1),
  "creation_key" uuid UNIQUE NOT NULL, "creation_digest" text NOT NULL,
  "leadership_profile_id" uuid UNIQUE REFERENCES "leadership_profile_identity"("id"),
  "created_at" timestamptz DEFAULT now() NOT NULL, "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX "member_email_normalized" ON "member" (lower("email"));
CREATE INDEX "member_created" ON "member" ("created_at","id");
--> statement-breakpoint
CREATE TABLE "membership_application_member" (
  "application_id" uuid PRIMARY KEY REFERENCES "membership_application"("id"),
  "member_id" uuid NOT NULL REFERENCES "member"("id"),
  "associated_by" uuid NOT NULL REFERENCES "administrator"("id"),
  "created_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX "membership_application_member_person" ON "membership_application_member" ("member_id");
