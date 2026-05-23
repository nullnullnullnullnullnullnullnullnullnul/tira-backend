-- Up Migration
-- Removes the ON UPDATE CASCADE clause from teams.owner_id's foreign
-- key. Primary keys in this schema are ULIDs, generated client-side
-- and never mutated after insert. ON UPDATE CASCADE is therefore
-- dead code that only exists as a footgun: if someone ever issues an
-- UPDATE users SET user_id = ... it would silently rewrite owner_id
-- across the teams table rather than failing loudly. Dropping the
-- clause leaves the default behaviour (NO ACTION) in place, which
-- aborts the UPDATE on the parent and surfaces the real intent.
-- ON DELETE CASCADE is retained: deleting a user does cascade to
-- their owned teams (and onward to tasks, tags, team_members) by
-- design.

ALTER TABLE teams
DROP CONSTRAINT teams_owner_id_fk;

ALTER TABLE teams
ADD CONSTRAINT teams_owner_id_fk FOREIGN KEY (owner_id)
REFERENCES users (user_id)
ON DELETE CASCADE;


-- Down Migration
-- Restores ON UPDATE CASCADE on the FK (the original behaviour from
-- migration 0003). Note this re-introduces the footgun described
-- above; revert only if you are sure you want it back.

ALTER TABLE teams
DROP CONSTRAINT teams_owner_id_fk;

ALTER TABLE teams
ADD CONSTRAINT teams_owner_id_fk FOREIGN KEY (owner_id)
REFERENCES users (user_id)
ON DELETE CASCADE
ON UPDATE CASCADE;
