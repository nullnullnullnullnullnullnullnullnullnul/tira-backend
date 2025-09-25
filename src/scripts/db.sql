-- Variables
-- \set db_user `echo $DB_USER`
-- \set db_pass `echo $DB_PASS`
-- \set db_name `echo $DB_NAME`

-- CREATE USER :db_user WITH PASSWORD :'db_pass';

-- CREATE DATABASE :db_name OWNER :db_user;
-- CREATE DATABASE test;

-- CONNECT
-- \c :db_name;
-- \c test;


-- ====================================
-- ============== ENUMS ===============
-- ====================================

CREATE TYPE user_role_enum AS ENUM('leader', 'user');
CREATE TYPE task_status_enum AS ENUM('pending', 'ongoing', 'done', 'canceled');
CREATE TYPE task_priority_enum AS ENUM('high', 'medium', 'low');


-- ====================================
-- ============== TABLES ==============
-- ====================================

-- users
CREATE TABLE users(
  user_id       CHAR(26) PRIMARY KEY,
  username      VARCHAR(50) NOT NULL,
  email         VARCHAR(254),
  pwd_hash      TEXT NOT NULL,
  role          user_role_enum NOT NULL,
  created_at    TIMESTAMP DEFAULT NOW(),
  last_login    TIMESTAMP DEFAULT NULL,
  CONSTRAINT users_username_uq UNIQUE(username), 
  CONSTRAINT users_email_uq UNIQUE(email)
);

-- tags
CREATE TABLE tags(
  tag_id        CHAR(26) PRIMARY KEY,
  name          VARCHAR(20) NOT NULL,
  CONSTRAINT tags_name_uq UNIQUE(name)
);

-- teams
CREATE TABLE teams(
  team_id       CHAR(26) PRIMARY KEY,
  owner_id      CHAR(26) NOT NULL,
  name          VARCHAR(50) NOT NULL,
  created_at    TIMESTAMP DEFAULT NOW(),
  CONSTRAINT teams_owner_id_fk FOREIGN KEY (owner_id)
    REFERENCES users(user_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
    -- removes/update on user_id update
  CONSTRAINT name_uq UNIQUE(name, owner_id) -- name + owner_id 
);

-- team members
CREATE TABLE team_members(
  team_members_id   CHAR(26) PRIMARY KEY,
  team_id           CHAR(26) NOT NULL,
  user_id           CHAR(26) NOT NULL,
  role              user_role_enum,
  invited_at        TIMESTAMP,
  joined_at         TIMESTAMP,
  CONSTRAINT team_members_team_id_fk FOREIGN KEY (team_id)
    REFERENCES teams(team_id)
    ON DELETE CASCADE,
  CONSTRAINT team_members_user_id_fk FOREIGN KEY (user_id)
    REFERENCES users(user_id)
    ON DELETE CASCADE,
  CONSTRAINT team_members_team_user_uq UNIQUE(team_id, user_id)
);

-- tasks
CREATE TABLE tasks(
  task_id           CHAR(26) PRIMARY KEY,
  team_id           CHAR(26) NOT NULL,
  assigned_to       CHAR(26),
  created_by        CHAR(26),
  title             VARCHAR(100) NOT NULL,
  description       VARCHAR(300),
  status            task_status_enum NOT NULL DEFAULT 'pending',
  priority          task_priority_enum NOT NULL DEFAULT 'medium',
  deadline          TIMESTAMP NOT NULL,
  content           TEXT,
  last_modified_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT tasks_team_id_fk FOREIGN KEY (team_id)
    REFERENCES teams(team_id)
    ON DELETE CASCADE,
  CONSTRAINT tasks_assigned_to_fk FOREIGN KEY (assigned_to)
    REFERENCES users(user_id)
    ON DELETE SET NULL,
  CONSTRAINT tasks_created_by_fk FOREIGN KEY (created_by)
    REFERENCES users(user_id)
    ON DELETE SET NULL,
  CONSTRAINT tasks_deadline_ck CHECK (deadline IS NULL OR deadline > NOW())
); -- May be orphaned but we dont lose them.

-- task tags
CREATE TABLE task_tags(
  task_tags_id  CHAR(26) PRIMARY KEY,
  task_id       CHAR(26) NOT NULL,
  tag_id        CHAR(26) NOT NULL,
  CONSTRAINT task_tags_task_id_fk FOREIGN KEY (task_id)
    REFERENCES tasks(task_id)
    ON DELETE CASCADE,
  CONSTRAINT task_tags_tag_id_fk FOREIGN KEY (tag_id)
    REFERENCES tags(tag_id)
    ON DELETE CASCADE
);

-- task status history
CREATE TABLE task_status_history(
  history_id    CHAR(26) PRIMARY KEY,
  task_id       CHAR(26),
  changed_by    CHAR(26),
  status        task_status_enum,
  changed_at    TIMESTAMP DEFAULT NOW(),
  CONSTRAINT task_status_history_task_id_fk FOREIGN KEY (task_id)
    REFERENCES tasks(task_id)
    ON DELETE SET NULL,
  CONSTRAINT task_status_history_changed_by_fk FOREIGN KEY (changed_by)
    REFERENCES users(user_id)
    ON DELETE SET NULL
);

-- comments
CREATE TABLE comments(
  comment_id    CHAR(26) PRIMARY KEY,
  task_id       CHAR(26) NOT NULL,
  author_id     CHAR(26),
  content       VARCHAR(300),
  created_at    TIMESTAMP DEFAULT NOW(),
  CONSTRAINT comments_task_id_fk FOREIGN KEY (task_id)
    REFERENCES tasks(task_id)
    ON DELETE CASCADE,
  CONSTRAINT comments_author_id_fk FOREIGN KEY (author_id)
    REFERENCES users(user_id)
    ON DELETE SET NULL
);


-- ====================================
-- ============= INDEXES ==============
-- ====================================
-- For better performance on frequent queries
-- CREATE INDEX users_username_idx ON users(username); -> psql creates indexes for unique constraint
CREATE INDEX tasks_team_idx ON tasks(team_id);
CREATE INDEX tasks_assigned_to_idx ON tasks(assigned_to);
CREATE INDEX comments_task_idx ON comments(task_id);


-- ====================================
-- ============ FUNCTIONS =============
-- ====================================

CREATE OR REPLACE FUNCTION set_last_modified_at_fn()
RETURNS TRIGGER AS
$$
BEGIN
  NEW.last_modified_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ====================================
-- ============ TRIGGERS ==============
-- ====================================

CREATE TRIGGER update_last_modified_at_tr
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION set_last_modified_at_fn();

GRANT CONNECT ON DATABASE tira_db TO tira;
GRANT USAGE ON SCHEMA public TO tira;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO tira;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO tira;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO tira;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO tira;
