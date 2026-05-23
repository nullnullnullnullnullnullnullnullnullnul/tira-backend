-- Up Migration

CREATE TABLE team_members (
  team_members_id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role user_role_enum,
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ,
  CONSTRAINT team_members_team_id_fk FOREIGN KEY (team_id)
  REFERENCES teams (team_id)
  ON DELETE CASCADE,
  CONSTRAINT team_members_user_id_fk FOREIGN KEY (user_id)
  REFERENCES users (user_id)
  ON DELETE CASCADE,
  CONSTRAINT team_members_team_user_uq UNIQUE (team_id, user_id)
);


-- Down Migration

DROP TABLE team_members;
