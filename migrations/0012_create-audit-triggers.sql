-- Up Migration

CREATE TRIGGER update_last_modified_at_tr
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION set_last_modified_at_fn();

CREATE TRIGGER log_task_changes_tr
AFTER UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION log_task_changes_fn();

CREATE TRIGGER log_comment_activity_tr
AFTER INSERT ON comments
FOR EACH ROW
EXECUTE FUNCTION log_comment_activity_fn();

CREATE TRIGGER log_tag_activity_tr
AFTER INSERT OR DELETE ON task_tags
FOR EACH ROW
EXECUTE FUNCTION log_tag_activity_fn();


-- Down Migration

DROP TRIGGER log_tag_activity_tr ON task_tags;
DROP TRIGGER log_comment_activity_tr ON comments;
DROP TRIGGER log_task_changes_tr ON tasks;
DROP TRIGGER update_last_modified_at_tr ON tasks;
