ALTER TABLE `publish_runs` ADD `status` text DEFAULT 'success' NOT NULL;
ALTER TABLE `publish_runs` ADD `error_message` text;
ALTER TABLE `publish_runs` ADD `duration_ms` integer;
