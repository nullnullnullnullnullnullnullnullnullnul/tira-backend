-- Up Migration

CREATE TABLE tags (
  tag_id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  name VARCHAR(20) NOT NULL,
  CONSTRAINT tags_team_id_fk FOREIGN KEY (team_id)
  REFERENCES teams (team_id)
  ON DELETE CASCADE,
  CONSTRAINT tags_team_name_uq UNIQUE (team_id, name)
);


-- Down Migration

DROP TABLE tags;
