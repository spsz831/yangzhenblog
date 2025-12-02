-- Manually apply the changes from 0001_odd_captain_marvel.sql
-- This is needed because the migration history is out of sync
ALTER TABLE users ADD COLUMN nickname text;
ALTER TABLE users ADD COLUMN avatar text;
