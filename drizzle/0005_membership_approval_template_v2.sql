-- Expand the allowed versions; do not rewrite historical jobs, hashes, attempts or keys.
ALTER TABLE "membership_notification" DROP CONSTRAINT "membership_notification_template_version";
ALTER TABLE "membership_notification" ADD CONSTRAINT "membership_notification_template_version"
  CHECK ("template_version" = 1 OR ("template_version" = 2 AND "kind" = 'approval'));
