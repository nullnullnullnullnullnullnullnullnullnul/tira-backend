-- Up Migration
-- email is optional (nullable) but unique-when-present. In Postgres,
-- a UNIQUE constraint treats every NULL as distinct, so multiple users
-- can have a NULL email without violating users_email_uq. If the product
-- ever requires email-on-signup, change `email` to NOT NULL in a new
-- migration.

CREATE TABLE users (
  user_id TEXT PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(254),
  pwd_hash TEXT NOT NULL,
  role user_role_enum NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT users_username_uq UNIQUE (username),
  CONSTRAINT users_email_uq UNIQUE (email)
);


-- Down Migration

DROP TABLE users;
