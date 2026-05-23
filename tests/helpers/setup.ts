// Shared test helpers. Imported by every test file.

import bcrypt from "bcrypt";
import { ulid } from "ulid";

import pool from "../../src/db";

/**
 * Wipe every application table in the right order so tests start
 * from a known empty state. pgmigrations is left untouched (it
 * tracks the migration history; truncating it would force a
 * re-migrate on the next test).
 */
export async function resetDatabase(): Promise<void> {
  await pool.query(`
    TRUNCATE TABLE
      task_history,
      task_tags,
      comments,
      tasks,
      tags,
      team_members,
      teams,
      users
    RESTART IDENTITY CASCADE
  `);
}

export interface SeededUser {
  user_id: string;
  username: string;
}

/**
 * Insert a single user with bcrypt-hashed password and return its id.
 */
export async function seedUser(username: string, role: "leader" | "user" = "user"): Promise<SeededUser> {
  const user_id = ulid();
  const pwd_hash = await bcrypt.hash("password123", 4);
  await pool.query(
    `INSERT INTO users (user_id, username, email, pwd_hash, role)
     VALUES ($1, $2, $3, $4, $5)`,
    [user_id, username, `${username}@test.local`, pwd_hash, role],
  );
  return { user_id, username };
}

/**
 * Insert a team owned by ownerId and return its id.
 */
export async function seedTeam(name: string, ownerId: string): Promise<string> {
  const team_id = ulid();
  await pool.query(`INSERT INTO teams (team_id, owner_id, name) VALUES ($1, $2, $3)`, [team_id, ownerId, name]);
  return team_id;
}

/**
 * Insert a team_members row joining userId to teamId.
 */
export async function seedMembership(teamId: string, userId: string, role: "leader" | "user" = "user"): Promise<void> {
  await pool.query(
    `INSERT INTO team_members (team_members_id, team_id, user_id, role, invited_at, joined_at)
     VALUES ($1, $2, $3, $4, now(), now())`,
    [ulid(), teamId, userId, role],
  );
}

/**
 * Insert a task directly (bypassing the service) for tests that
 * need a task to exist as a precondition.
 */
export async function seedTask(teamId: string, createdBy: string, assignedTo: string, title: string): Promise<string> {
  const task_id = ulid();
  await pool.query(
    `INSERT INTO tasks (task_id, team_id, assigned_to, created_by, title, deadline)
     VALUES ($1, $2, $3, $4, $5, now() + INTERVAL '1 day')`,
    [task_id, teamId, assignedTo, createdBy, title],
  );
  return task_id;
}

/**
 * Insert a tag directly (bypassing the service).
 */
export async function seedTag(teamId: string, name: string): Promise<string> {
  const tag_id = ulid();
  await pool.query(`INSERT INTO tags (tag_id, team_id, name) VALUES ($1, $2, $3)`, [tag_id, teamId, name]);
  return tag_id;
}
