-- Up Migration

CREATE TABLE comments (
  comment_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  author_id TEXT,
  content VARCHAR(300),
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT comments_task_id_fk FOREIGN KEY (task_id)
  REFERENCES tasks (task_id)
  ON DELETE CASCADE,
  CONSTRAINT comments_author_id_fk FOREIGN KEY (author_id)
  REFERENCES users (user_id)
  ON DELETE SET NULL
);


-- Down Migration

DROP TABLE comments;
