CREATE TABLE `publish_runs` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `trigger_type` text NOT NULL,
  `trigger_label` text,
  `published_count` integer DEFAULT 0 NOT NULL,
  `published_slugs` text,
  `created_at` integer DEFAULT (strftime('%s', 'now'))
);
