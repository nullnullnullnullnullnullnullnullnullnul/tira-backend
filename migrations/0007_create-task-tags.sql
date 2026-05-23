-- Up Migration

CREATE TABLE task_tags (
  task_tags_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  CONSTRAINT task_tags_task_id_fk FOREIGN KEY (task_id)
  REFERENCES tasks (task_id)
  ON DELETE CASCADE,
  CONSTRAINT task_tags_tag_id_fk FOREIGN KEY (tag_id)
  REFERENCES tags (tag_id)
  ON DELETE CASCADE,
  CONSTRAINT task_tags_uq UNIQUE (task_id, tag_id)
);


-- Down Migration

DROP TABLE task_tags;
