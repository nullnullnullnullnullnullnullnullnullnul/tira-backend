-- Up Migration
-- Replaces task_history.change_type and task_history.entity (both
-- VARCHAR(10)) with custom ENUM types so the valid values are
-- enforced by the database, not just by the trigger functions.
--
-- Before: a typo in a future trigger function ('CRREATE') would
-- silently insert a degenerate row that no consumer can recognise.
-- After: the same typo fails the INSERT with a clean cast error.
--
-- The existing trigger functions in 0011 (rewritten by 0014 and
-- 0015) insert string literals like 'UPDATE' and 'COMMENT' into
-- these columns. Postgres auto-casts string literals to enum types
-- in INSERT context, so no trigger function needs to change.

CREATE TYPE task_history_change_type_enum AS ENUM ('CREATE', 'UPDATE', 'DELETE');
CREATE TYPE task_history_entity_enum AS ENUM ('TASK', 'COMMENT', 'TAG');

ALTER TABLE task_history
ALTER COLUMN change_type TYPE task_history_change_type_enum
USING change_type::task_history_change_type_enum;

ALTER TABLE task_history
ALTER COLUMN entity TYPE task_history_entity_enum
USING entity::task_history_entity_enum;


-- Down Migration
-- Revert the columns back to VARCHAR(10) and drop the enum types.
-- Existing data survives (the enum-to-text cast is lossless for the
-- six values that ever appear in these columns).

ALTER TABLE task_history
ALTER COLUMN change_type TYPE VARCHAR(10)
USING change_type::TEXT;

ALTER TABLE task_history
ALTER COLUMN entity TYPE VARCHAR(10)
USING entity::TEXT;

DROP TYPE task_history_entity_enum;
DROP TYPE task_history_change_type_enum;
