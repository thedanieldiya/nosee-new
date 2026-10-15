ALTER TABLE member ADD COLUMN deleted_at timestamp with time zone;
--> statement-breakpoint
DROP INDEX member_email_normalized;
--> statement-breakpoint
CREATE UNIQUE INDEX member_email_normalized ON member (lower(email)) WHERE deleted_at IS NULL;
--> statement-breakpoint
ALTER TABLE member ADD CONSTRAINT member_deleted_profile CHECK (deleted_at IS NULL OR leadership_profile_id IS NULL);
