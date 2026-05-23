-- Up Migration
-- Adds a `changed_by` column to task_history and rewrites the three
-- INSERT-emitting audit functions so they populate it.
--
-- The value is read at trigger time from a Postgres session variable:
--   SET LOCAL app.current_user_id = '<ulid>'
-- The application is expected to emit that SET LOCAL at the start of
-- every transaction that issues writes (an Express middleware will
-- do it once the auth flow lands). When the setting is absent,
-- current_setting('app.current_user_id', true) returns NULL and
-- changed_by stays NULL on the inserted row, so this migration is
-- safe to apply before the app-side wiring exists: existing audit
-- rows keep working, new rows get NULL until the middleware ships.
--
-- The session-variable pattern is preferred over a trigger argument
-- because triggers cannot accept dynamic per-row arguments from the
-- caller; the only way to thread "who is making this change" through
-- a trigger is via session/transaction state.

ALTER TABLE task_history
ADD COLUMN changed_by TEXT;

CREATE OR REPLACE FUNCTION log_task_changes_fn()
RETURNS TRIGGER AS $$
DECLARE
  acting_user TEXT := current_setting('app.current_user_id', true);
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO task_history (task_id, change_type, entity, field, old_value, new_value, changed_by)
    VALUES (NEW.task_id, 'UPDATE', 'TASK', 'status', OLD.status::text, NEW.status::text, acting_user);
  END IF;

  IF OLD.priority IS DISTINCT FROM NEW.priority THEN
    INSERT INTO task_history (task_id, change_type, entity, field, old_value, new_value, changed_by)
    VALUES (NEW.task_id, 'UPDATE', 'TASK', 'priority', OLD.priority::text, NEW.priority::text, acting_user);
  END IF;

  IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
    INSERT INTO task_history (task_id, change_type, entity, field, old_value, new_value, changed_by)
    VALUES (NEW.task_id, 'UPDATE', 'TASK', 'assigned_to', OLD.assigned_to, NEW.assigned_to, acting_user);
  END IF;

  IF OLD.title IS DISTINCT FROM NEW.title THEN
    INSERT INTO task_history (task_id, change_type, entity, field, old_value, new_value, changed_by)
    VALUES (NEW.task_id, 'UPDATE', 'TASK', 'title', OLD.title, NEW.title, acting_user);
  END IF;

  IF OLD.description IS DISTINCT FROM NEW.description THEN
    INSERT INTO task_history (task_id, change_type, entity, field, old_value, new_value, changed_by)
    VALUES (NEW.task_id, 'UPDATE', 'TASK', 'description', OLD.description, NEW.description, acting_user);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_comment_activity_fn()
RETURNS TRIGGER AS $$
DECLARE
  acting_user TEXT := current_setting('app.current_user_id', true);
BEGIN
  INSERT INTO task_history (task_id, change_type, entity, field, new_value, changed_by)
  VALUES (NEW.task_id, 'CREATE', 'COMMENT', 'content', NEW.content, acting_user);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_tag_activity_fn()
RETURNS TRIGGER AS $$
DECLARE
  acting_user TEXT := current_setting('app.current_user_id', true);
  tag_name VARCHAR(20);
BEGIN
  IF (TG_OP = 'INSERT') THEN
    SELECT name INTO tag_name FROM tags WHERE tag_id = NEW.tag_id;
    INSERT INTO task_history (task_id, change_type, entity, field, new_value, changed_by)
    VALUES (NEW.task_id, 'CREATE', 'TAG', 'tag', tag_name, acting_user);
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    SELECT name INTO tag_name FROM tags WHERE tag_id = OLD.tag_id;
    INSERT INTO task_history (task_id, change_type, entity, field, old_value, changed_by)
    VALUES (OLD.task_id, 'DELETE', 'TAG', 'tag', tag_name, acting_user);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;


-- Down Migration
--
-- WARNING: DESTRUCTIVE. Rolling this migration down drops the
-- changed_by column, which IS NOT recoverable: every audit row's
-- attribution disappears with the column, and node-pg-migrate has
-- no facility to back up data before the DROP. Do NOT run
-- `npm run db:migrate:down` past this point in production unless
-- you have already exported task_history elsewhere.
--
-- Restore the original (changed_by-less) audit functions and drop
-- the column. Existing audit rows are preserved minus their
-- changed_by data; the column itself goes away.

CREATE OR REPLACE FUNCTION log_task_changes_fn()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO task_history (task_id, change_type, entity, field, old_value, new_value)
    VALUES (NEW.task_id, 'UPDATE', 'TASK', 'status', OLD.status::text, NEW.status::text);
  END IF;

  IF OLD.priority IS DISTINCT FROM NEW.priority THEN
    INSERT INTO task_history (task_id, change_type, entity, field, old_value, new_value)
    VALUES (NEW.task_id, 'UPDATE', 'TASK', 'priority', OLD.priority::text, NEW.priority::text);
  END IF;

  IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
    INSERT INTO task_history (task_id, change_type, entity, field, old_value, new_value)
    VALUES (NEW.task_id, 'UPDATE', 'TASK', 'assigned_to', OLD.assigned_to, NEW.assigned_to);
  END IF;

  IF OLD.title IS DISTINCT FROM NEW.title THEN
    INSERT INTO task_history (task_id, change_type, entity, field, old_value, new_value)
    VALUES (NEW.task_id, 'UPDATE', 'TASK', 'title', OLD.title, NEW.title);
  END IF;

  IF OLD.description IS DISTINCT FROM NEW.description THEN
    INSERT INTO task_history (task_id, change_type, entity, field, old_value, new_value)
    VALUES (NEW.task_id, 'UPDATE', 'TASK', 'description', OLD.description, NEW.description);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_comment_activity_fn()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO task_history (task_id, change_type, entity, field, new_value)
  VALUES (NEW.task_id, 'CREATE', 'COMMENT', 'content', NEW.content);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_tag_activity_fn()
RETURNS TRIGGER AS $$
DECLARE
  tag_name VARCHAR(20);
BEGIN
  IF (TG_OP = 'INSERT') THEN
    SELECT name INTO tag_name FROM tags WHERE tag_id = NEW.tag_id;
    INSERT INTO task_history (task_id, change_type, entity, field, new_value)
    VALUES (NEW.task_id, 'CREATE', 'TAG', 'tag', tag_name);
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    SELECT name INTO tag_name FROM tags WHERE tag_id = OLD.tag_id;
    INSERT INTO task_history (task_id, change_type, entity, field, old_value)
    VALUES (OLD.task_id, 'DELETE', 'TAG', 'tag', tag_name);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE task_history DROP COLUMN changed_by;
