-- Up Migration
-- Aligns the schema with the contract enforced at the service layer:
-- createComment validates 1-300 chars and rejects empty content, so a
-- NULL value can never come from the application. Promoting the
-- column to NOT NULL closes the gap where a NULL inserted out-of-band
-- (psql, a future migration, a script) would slip past validation.
--
-- Existing NULL rows get coerced to '' on the way to NOT NULL. The
-- service rejects '' as a 0-char comment, but rows that already exist
-- with NULL content are degenerate either way; '' is the least-bad
-- non-null representation. In a fresh schema there will be no such
-- rows, so the UPDATE is a no-op.

UPDATE comments
SET content = ''
WHERE content IS NULL;

ALTER TABLE comments ALTER COLUMN content SET NOT NULL;


-- Down Migration

ALTER TABLE comments ALTER COLUMN content DROP NOT NULL;
