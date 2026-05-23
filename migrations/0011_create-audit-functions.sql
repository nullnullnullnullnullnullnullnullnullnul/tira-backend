-- Up Migration

CREATE OR REPLACE FUNCTION set_last_modified_at_fn()
RETURNS TRIGGER AS
$$
BEGIN
  NEW.last_modified_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_task_changes_fn()
RETURNS TRIGGER AS $$
BEGIN
  -- Status change
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO task_history (task_id, change_type, entity, field, old_value, new_value)
    VALUES (NEW.task_id, 'UPDATE', 'TASK', 'status', OLD.status::text, NEW.status::text);
  END IF;

  -- Priority change
  IF OLD.priority IS DISTINCT FROM NEW.priority THEN
    INSERT INTO task_history (task_id, change_type, entity, field, old_value, new_value)
    VALUES (NEW.task_id, 'UPDATE', 'TASK', 'priority', OLD.priority::text, NEW.priority::text);
  END IF;

  -- Assigned To change
  IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
    INSERT INTO task_history (task_id, change_type, entity, field, old_value, new_value)
    VALUES (NEW.task_id, 'UPDATE', 'TASK', 'assigned_to', OLD.assigned_to, NEW.assigned_to);
  END IF;

  -- Title change
  IF OLD.title IS DISTINCT FROM NEW.title THEN
    INSERT INTO task_history (task_id, change_type, entity, field, old_value, new_value)
    VALUES (NEW.task_id, 'UPDATE', 'TASK', 'title', OLD.title, NEW.title);
  END IF;

  -- Description change
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


-- Down Migration

DROP FUNCTION log_tag_activity_fn;
DROP FUNCTION log_comment_activity_fn;
DROP FUNCTION log_task_changes_fn;
DROP FUNCTION set_last_modified_at_fn;
