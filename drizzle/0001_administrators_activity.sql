ALTER TABLE "administrator" ADD COLUMN "access_version" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "admin_session" ADD COLUMN "access_version" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "admin_audit_log" ADD COLUMN "target_type" text;
ALTER TABLE "admin_audit_log" ADD COLUMN "target_id" uuid;
ALTER TABLE "admin_audit_log" ADD COLUMN "target_label" text;
ALTER TABLE "admin_audit_log" ADD COLUMN "changes" jsonb;
CREATE INDEX "admin_audit_time" ON "admin_audit_log" ("created_at", "id");
--> statement-breakpoint
CREATE TABLE "admin_invitation" (
  "id" uuid PRIMARY KEY NOT NULL,
  "first_name" text NOT NULL, "last_name" text NOT NULL, "email" text NOT NULL,
  "role" "admin_role" NOT NULL CHECK ("role" IN ('super_admin', 'editor')),
  "issuer_id" uuid NOT NULL REFERENCES "administrator"("id"),
  "token_digest" text, "expires_at" timestamptz NOT NULL,
  "revoked_at" timestamptz, "accepted_at" timestamptz,
  "accepted_user_id" uuid REFERENCES "administrator"("id"),
  "created_at" timestamptz DEFAULT now() NOT NULL, "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX "admin_invitation_token" ON "admin_invitation" ("token_digest");
CREATE UNIQUE INDEX "admin_invitation_pending_email" ON "admin_invitation" (lower("email")) WHERE "revoked_at" IS NULL AND "accepted_at" IS NULL;
CREATE UNIQUE INDEX "admin_invitation_accepted_user" ON "admin_invitation" ("accepted_user_id");
--> statement-breakpoint
CREATE TABLE "admin_invitation_send" (
  "id" uuid PRIMARY KEY NOT NULL, "invitation_id" uuid NOT NULL REFERENCES "admin_invitation"("id"),
  "status" text NOT NULL CHECK ("status" IN ('sending', 'accepted', 'failed', 'unconfirmed')),
  "provider_message_id" text,
  "created_at" timestamptz DEFAULT now() NOT NULL, "updated_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX "admin_invitation_send_time" ON "admin_invitation_send" ("invitation_id", "created_at");
