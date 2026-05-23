-- Up Migration
-- A task whose assigned_to or created_by user is deleted becomes
-- orphaned (those FKs are ON DELETE SET NULL) but the task survives.
-- No "deadline > now()" check: now() is non-immutable and Postgres
-- evaluates a CHECK only at INSERT / UPDATE time, so a constraint of
-- "always in the future" can never actually hold. Validation that the
-- deadline is in the future belongs in the service layer at write time.

CREATE TABLE tasks (
  task_id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  assigned_to TEXT,
  created_by TEXT,
  title VARCHAR(100) NOT NULL,
  description VARCHAR(300),
  status task_status_enum NOT NULL DEFAULT 'pending',
  priority task_priority_enum NOT NULL DEFAULT 'medium',
  deadline TIMESTAMPTZ NOT NULL,
  content TEXT,
  last_modified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT tasks_team_id_fk FOREIGN KEY (team_id)
  REFERENCES teams (team_id)
  ON DELETE CASCADE,
  CONSTRAINT tasks_assigned_to_fk FOREIGN KEY (assigned_to)
  REFERENCES users (user_id)
  ON DELETE SET NULL,
  CONSTRAINT tasks_created_by_fk FOREIGN KEY (created_by)
  REFERENCES users (user_id)
  ON DELETE SET NULL
);


-- Down Migration

DROP TABLE tasks;
