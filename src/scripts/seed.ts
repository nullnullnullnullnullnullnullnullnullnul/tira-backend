/**
 * Insert development seed data: 5 users, 3 teams (with cross-membership),
 * 9 tasks distributed across teams, and 3 comments per task.
 *
 * Idempotent: every INSERT uses ON CONFLICT DO NOTHING so re-running
 * the script will not duplicate rows but also will not refresh stale
 * ones (run `npm run db:reset` if you want a clean slate).
 *
 * Assumes the schema has already been created via `npm run db:migrate`.
 */

import bcrypt from "bcrypt";
import { Client } from "pg";
import { ulid } from "ulid";

import { env } from "../config/env";

const SALT = 10;

const users = [
  { username: "alice", email: "alice@example.com", role: "leader", password: "password123" },
  { username: "bob", email: "bob@example.com", role: "leader", password: "secret456" },
  { username: "charlie", email: "charlie@example.com", role: "user", password: "mypassword" },
  { username: "diana", email: "diana@example.com", role: "user", password: "passw0rd" },
  { username: "eve", email: "eve@example.com", role: "user", password: "12345678" },
];

const teams = [
  { ownerUsername: "alice", name: "Alpha Team" },
  { ownerUsername: "bob", name: "Beta Squad" },
  { ownerUsername: "alice", name: "Gamma Group" },
];

const tasks = [
  { title: "Setup project", description: "Initialize repository and environment", status: "pending", priority: "low" },
  { title: "Design database", description: "Define tables and relationships", status: "ongoing", priority: "medium" },
  { title: "Implement API", description: "Create REST endpoints", status: "pending", priority: "high" },
];

const comments = [
  { content: "Remember to add indexes." },
  { content: "Check foreign key constraints." },
  { content: "Update README after API is done." },
];

const userIdMap: Record<string, string> = {};
const teamIdMap: Record<string, string> = {};

async function insertUsers(client: Client): Promise<void> {
  for (const user of users) {
    const id = ulid();
    const hash = await bcrypt.hash(user.password, SALT);
    await client.query(
      `INSERT INTO users (user_id, username, email, pwd_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (username) DO NOTHING`,
      [id, user.username, user.email, hash, user.role],
    );
    userIdMap[user.username] = id;
  }
  console.log(`[seed] inserted ${users.length} users`);
}

async function insertTeams(client: Client): Promise<void> {
  for (const team of teams) {
    const ownerId = userIdMap[team.ownerUsername];
    if (!ownerId) {
      console.warn(`[seed] owner ${team.ownerUsername} missing, skipping team ${team.name}`);
      continue;
    }
    const teamId = ulid();
    await client.query(
      `INSERT INTO teams (team_id, owner_id, name)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      [teamId, ownerId, team.name],
    );
    teamIdMap[team.name] = teamId;
  }
  console.log(`[seed] inserted ${teams.length} teams`);
}

async function insertTeamMembers(client: Client): Promise<void> {
  for (const team of teams) {
    const teamId = teamIdMap[team.name];
    if (!teamId) continue;
    for (const user of users) {
      if (user.username === team.ownerUsername) continue;
      const tmId = ulid();
      await client.query(
        `INSERT INTO team_members (team_members_id, team_id, user_id, role, invited_at, joined_at)
         VALUES ($1, $2, $3, $4, now(), now())
         ON CONFLICT (team_id, user_id) DO NOTHING`,
        [tmId, teamId, userIdMap[user.username], user.role],
      );
    }
  }
  console.log(`[seed] inserted team memberships`);
}

async function insertTasks(client: Client): Promise<void> {
  for (const team of teams) {
    const teamId = teamIdMap[team.name];
    if (!teamId) continue;
    for (const taskTemplate of tasks) {
      const taskId = ulid();
      const userIds = Object.values(userIdMap);
      const assignedTo = userIds[Math.floor(Math.random() * userIds.length)];
      const createdBy = userIdMap[team.ownerUsername];
      await client.query(
        `INSERT INTO tasks (task_id, team_id, assigned_to, created_by, title, description, status, priority, deadline)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now() + INTERVAL '7 days')
         ON CONFLICT (task_id) DO NOTHING`,
        [taskId, teamId, assignedTo, createdBy, taskTemplate.title, taskTemplate.description, taskTemplate.status, taskTemplate.priority],
      );
    }
  }
  console.log(`[seed] inserted tasks`);
}

async function insertComments(client: Client): Promise<void> {
  const taskRows = await client.query(`SELECT task_id FROM tasks`);
  for (const task of taskRows.rows) {
    for (const commentTemplate of comments) {
      const commentId = ulid();
      const userIds = Object.values(userIdMap);
      const authorId = userIds[Math.floor(Math.random() * userIds.length)];
      await client.query(
        `INSERT INTO comments (comment_id, task_id, author_id, content)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (comment_id) DO NOTHING`,
        [commentId, task.task_id, authorId, commentTemplate.content],
      );
    }
  }
  console.log(`[seed] inserted comments`);
}

async function main(): Promise<void> {
  const client = new Client({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.pass,
    database: env.db.database,
  });

  await client.connect();
  try {
    await insertUsers(client);
    await insertTeams(client);
    await insertTeamMembers(client);
    await insertTasks(client);
    await insertComments(client);
    console.log("[seed] complete");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
