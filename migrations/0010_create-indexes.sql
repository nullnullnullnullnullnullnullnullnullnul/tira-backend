-- Up Migration
-- Postgres creates an index automatically for every PRIMARY KEY and UNIQUE
-- constraint, but NOT for foreign-key columns. Every repository in this
-- project filters by at least one foreign key (team_id, task_id, user_id,
-- ...), so without these indexes those queries degrade to sequential scans
-- as the tables grow. The composite indexes target combinations used by
-- the task list endpoint when filtering by status and priority together.

CREATE INDEX tasks_team_id_idx ON tasks (team_id);
CREATE INDEX tasks_assigned_to_idx ON tasks (assigned_to);
CREATE INDEX tasks_created_by_idx ON tasks (created_by);
CREATE INDEX tasks_deadline_idx ON tasks (deadline);
CREATE INDEX tasks_status_priority_idx ON tasks (status, priority);

CREATE INDEX comments_task_id_idx ON comments (task_id);
CREATE INDEX comments_author_id_idx ON comments (author_id);

CREATE INDEX team_members_user_id_idx ON team_members (user_id);

CREATE INDEX task_tags_tag_id_idx ON task_tags (tag_id);

CREATE INDEX task_history_task_id_idx ON task_history (task_id);
CREATE INDEX task_history_changed_at_idx ON task_history (changed_at DESC);


-- Down Migration

DROP INDEX task_history_changed_at_idx;
DROP INDEX task_history_task_id_idx;
DROP INDEX task_tags_tag_id_idx;
DROP INDEX team_members_user_id_idx;
DROP INDEX comments_author_id_idx;
DROP INDEX comments_task_id_idx;
DROP INDEX tasks_status_priority_idx;
DROP INDEX tasks_deadline_idx;
DROP INDEX tasks_created_by_idx;
DROP INDEX tasks_assigned_to_idx;
DROP INDEX tasks_team_id_idx;
