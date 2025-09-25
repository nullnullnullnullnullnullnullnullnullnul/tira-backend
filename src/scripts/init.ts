import { ulid } from 'ulid';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const SALT = 10;
const DB_SUPERUSER = process.env.DB_SUPERUSER || 'postgres';
const DB_SUPERPASS = process.env.DB_SUPERPASS || '';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432;
const DB_USER = process.env.DB_USER || 'tira';
const DB_PASSWORD = process.env.DB_PASSWORD || 'supersecret';
const DB_NAME = process.env.DB_NAME || 'tira_db';

// Clients
const superClient = new Client({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_SUPERUSER,
  password: DB_SUPERPASS,
  database: 'postgres'
});
const dbClient = new Client({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME
});

// Data
const users = [
  { username: 'alice', email: 'alice@example.com', role: 'leader', password: 'password123' },
  { username: 'bob', email: 'bob@example.com', role: 'leader', password: 'secret456' },
  { username: 'charlie', email: 'charlie@example.com', role: 'user', password: 'mypassword' },
  { username: 'diana', email: 'diana@example.com', role: 'user', password: 'passw0rd' },
  { username: 'eve', email: 'eve@example.com', role: 'user', password: '12345678' }
];
const teams = [
  { ownerUsername: 'alice', name: 'Alpha Team' },
  { ownerUsername: 'bob', name: 'Beta Squad' },
  { ownerUsername: 'alice', name: 'Gamma Group' }
];
const tasks = [
  { title: 'Setup project', description: 'Initialize repository and environment', status: 'pending', priority: 'low' },
  { title: 'Design database', description: 'Define tables and relationships', status: 'ongoing', priority: 'medium' },
  { title: 'Implement API', description: 'Create REST endpoints', status: 'pending', priority: 'high' }
];
const comments = [
  { content: 'Remember to add indexes.' },
  { content: 'Check foreign key constraints.' },
  { content: 'Update README after API is done.' }
];

// Keep track of inserted IDs
const userIdMap: Record<string, string> = {};
const teamIdMap: Record<string, string> = {};

// Functions
async function runSqlFile(client: Client, filename: string) {
  const sql = fs.readFileSync(path.join(__dirname, filename), 'utf-8');
  await client.query(sql);
  console.log(`${filename} executed`);
}

async function insertUsers() {
  for (const user of users) {
    const id = ulid();
    const hash = await bcrypt.hash(user.password, SALT);
    await dbClient.query(
      `INSERT INTO users (user_id, username, email, pwd_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (username) DO NOTHING`,
      [id, user.username, user.email, hash, user.role]
    );
    userIdMap[user.username] = id;
    console.log(`Inserted user: ${user.username}`);
  }
}

async function insertTeams() {
  for (const team of teams) {
    const ownerId = userIdMap[team.ownerUsername];
    if (!ownerId) {
      console.warn(`Owner ${team.ownerUsername} not found, skipping team ${team.name}`);
      continue;
    }
    const teamId = ulid();
    await dbClient.query(
      `INSERT INTO teams (team_id, owner_id, name)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      [teamId, ownerId, team.name]
    );
    teamIdMap[team.name] = teamId;
    console.log(`Inserted team: ${team.name}`);
  }
}

async function insertTeamMembers() {
  for (const team of teams) {
    const teamId = teamIdMap[team.name];
    if (!teamId) continue;
    for (const user of users) {
      if (user.username !== team.ownerUsername) {
        const tmId = ulid();
        await dbClient.query(
          `INSERT INTO team_members (team_members_id, team_id, user_id, role, invited_at, joined_at)
           VALUES ($1, $2, $3, $4, NOW(), NOW())
           ON CONFLICT (team_id, user_id) DO NOTHING`,
          [tmId, teamId, userIdMap[user.username], user.role]
        );
      }
    }
    console.log(`Added members to team: ${team.name}`);
  }
}

async function insertTasks() {
  for (const team of teams) {
    const teamId = teamIdMap[team.name];
    if (!teamId) continue;
    for (const taskTemplate of tasks) {
      const taskId = ulid();
      const assignedTo = Object.values(userIdMap)[Math.floor(Math.random() * Object.values(userIdMap).length)];
      const createdBy = userIdMap[team.ownerUsername];
      await dbClient.query(
        `INSERT INTO tasks (task_id, team_id, assigned_to, created_by, title, description, status, priority, deadline)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW() + INTERVAL '7 days')
         ON CONFLICT (task_id) DO NOTHING`,
        [taskId, teamId, assignedTo, createdBy, taskTemplate.title, taskTemplate.description, taskTemplate.status, taskTemplate.priority]
      );
    }
  }
  console.log('Tasks inserted');
}

async function insertComments() {
  const taskRows = await dbClient.query(`SELECT task_id FROM tasks`);
  for (const task of taskRows.rows) {
    for (const commentTemplate of comments) {
      const commentId = ulid();
      const authorId = Object.values(userIdMap)[Math.floor(Math.random() * Object.values(userIdMap).length)];
      await dbClient.query(
        `INSERT INTO comments (comment_id, task_id, author_id, content)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (comment_id) DO NOTHING`,
        [commentId, task.task_id, authorId, commentTemplate.content]
      );
    }
  }
  console.log('Comments inserted');
}

// Main
async function main() {
  try {
    await superClient.connect();
    // Terminates other connections to the database
    await superClient.query(
      `SELECT pg_terminate_backend(pid)
       FROM pg_stat_activity
       WHERE datname = $1 AND pid <> pg_backend_pid()`,
      [DB_NAME]
    );
    // Drops database and user
    await superClient.query(`DROP DATABASE IF EXISTS ${DB_NAME}`);
    await superClient.query(`DROP USER IF EXISTS ${DB_USER}`);
    // Recreates everything
    await superClient.query(`CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}'`);
    await superClient.query(`CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}`);
    await superClient.end();
    await dbClient.connect();
    await runSqlFile(dbClient, 'db.sql');
    // Inserts testing data
    await insertUsers();
    await insertTeams();
    await insertTeamMembers();
    await insertTasks();
    await insertComments();
    console.log('Database setup complete');
  } catch (err) {
    console.error(err);
  } finally {
    await dbClient.end();
  }
}

main();
