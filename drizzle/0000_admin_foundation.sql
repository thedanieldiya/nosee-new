CREATE TYPE "public"."admin_role" AS ENUM('super_admin', 'editor', 'research_group_lead');--> statement-breakpoint
CREATE TABLE "admin_account" (
	"id" uuid PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"password" text,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_audit_log" (
	"id" uuid PRIMARY KEY NOT NULL,
	"actor_id" uuid NOT NULL,
	"action" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_login_attempt" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer NOT NULL,
	"started_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_rate_limit" (
	"id" uuid PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"count" integer NOT NULL,
	"last_request" bigint NOT NULL,
	CONSTRAINT "admin_rate_limit_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "admin_session" (
	"id" uuid PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "administrator" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"role" "admin_role" NOT NULL,
	"research_group_id" uuid,
	"active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "administrator_email_unique" UNIQUE("email"),
	CONSTRAINT "administrator_group_scope" CHECK (("administrator"."role" = 'research_group_lead' AND "administrator"."research_group_id" IS NOT NULL) OR ("administrator"."role" <> 'research_group_lead' AND "administrator"."research_group_id" IS NULL))
);
--> statement-breakpoint
CREATE TABLE "admin_verification" (
	"id" uuid PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_account" ADD CONSTRAINT "admin_account_user_id_administrator_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."administrator"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_audit_log" ADD CONSTRAINT "admin_audit_log_actor_id_administrator_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."administrator"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_session" ADD CONSTRAINT "admin_session_user_id_administrator_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."administrator"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "admin_account_provider" ON "admin_account" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX "admin_account_user" ON "admin_account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "admin_audit_actor_time" ON "admin_audit_log" USING btree ("actor_id","created_at");--> statement-breakpoint
CREATE INDEX "admin_session_user" ON "admin_session" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "administrator_email_normalized" ON "administrator" USING btree (lower("email"));