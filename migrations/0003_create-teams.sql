-- Up Migration

CREATE TABLE teams (
  team_id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  name VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT teams_owner_id_fk FOREIGN KEY (owner_id)
  REFERENCES users (user_id)
  ON DELETE CASCADE
  ON UPDATE CASCADE,
  CONSTRAINT teams_name_owner_uq UNIQUE (name, owner_id)
);


-- Down Migration

DROP TABLE teams;
