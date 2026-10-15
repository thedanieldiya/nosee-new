CREATE TABLE "membership_notification" (
  "id" uuid PRIMARY KEY NOT NULL,
  "application_id" uuid NOT NULL REFERENCES "membership_application"("id"),
  "kind" text NOT NULL CONSTRAINT "membership_notification_kind" CHECK ("kind" IN ('receipt','admin_alert','approval','rejection')),
  "recipient_key" text NOT NULL, "administrator_recipient" text, "from_address" text, "origin" text, "activation_key" text,
  "template_version" integer DEFAULT 1 NOT NULL CONSTRAINT "membership_notification_template_version" CHECK ("template_version" = 1),
  "state" text NOT NULL CONSTRAINT "membership_notification_state" CHECK ("state" IN ('held','queued','sending','accepted','failed','unconfirmed')),
  "attempts" integer DEFAULT 0 NOT NULL CONSTRAINT "membership_notification_attempts" CHECK ("attempts" BETWEEN 0 AND 5),
  "uncertain" boolean DEFAULT false NOT NULL, "next_attempt_at" timestamptz, "first_attempt_at" timestamptz,
  "claim_token" uuid, "lease_until" timestamptz, "payload_digest" text, "provider_message_id" text, "last_issue" text,
  "created_at" timestamptz DEFAULT now() NOT NULL, "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "membership_notification_claim" CHECK (("state"='sending' AND "claim_token" IS NOT NULL AND "lease_until" IS NOT NULL) OR ("state"<>'sending' AND "claim_token" IS NULL AND "lease_until" IS NULL)),
  CONSTRAINT "membership_notification_acceptance" CHECK (("state"='accepted' AND "provider_message_id" IS NOT NULL) OR ("state"<>'accepted' AND "provider_message_id" IS NULL)),
  CONSTRAINT "membership_notification_held" CHECK ("state"<>'held' OR ("attempts"=0 AND "next_attempt_at" IS NULL AND "activation_key" IS NULL))
);
CREATE UNIQUE INDEX "membership_notification_event" ON "membership_notification" ("application_id","kind","recipient_key");
CREATE INDEX "membership_notification_due" ON "membership_notification" ("next_attempt_at","id") WHERE "state" IN ('queued','unconfirmed');
--> statement-breakpoint
CREATE TABLE "membership_mail_control" ("id" text PRIMARY KEY NOT NULL, "next_dispatch_at" timestamptz DEFAULT now() NOT NULL);
INSERT INTO "membership_mail_control" ("id") VALUES ('membership');
-- No notification backfill: historical/disabled events are never silently approved for sending.
