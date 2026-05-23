-- Up Migration
-- Fixes a Postgres-behaviour mismatch in migration 0014.
--
-- `current_setting('app.current_user_id', true)` returns the empty
-- string '' when the setting has never been SET LOCAL'd in the
-- current transaction, NOT NULL as 0014 and the docs/migrations.md
-- contract claimed. That meant audit rows from un-attributed writes
-- carried `changed_by = ''` instead of NULL, which is a less honest
-- representation of "we do not know who" and breaks the documented
-- expectation that NULL = un-attributed.
--
-- Wrap the lookup in NULLIF(..., '') so the empty string collapses
-- to NULL. The contract documented in docs/database/migrations.md
-- now matches reality.

CREATE OR REPLACE FUNCTION log_task_changes_fn()
RETURNS TRIGGER AS $$
DECLARE
  acting_user TEXT := NULLIF(current_setting('app.current_user_id', true), '');
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
  acting_user TEXT := NULLIF(current_setting('app.current_user_id', true), '');
BEGIN
  INSERT INTO task_history (task_id, change_type, entity, field, new_value, changed_by)
  VALUES (NEW.task_id, 'CREATE', 'COMMENT', 'content', NEW.content, acting_user);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_tag_activity_fn()
RETURNS TRIGGER AS $$
DECLARE
  acting_user TEXT := NULLIF(current_setting('app.current_user_id', true), '');
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
-- Revert to the migration-0014 versions of the functions (which
-- leave the empty-string-vs-NULL inconsistency in place).

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
