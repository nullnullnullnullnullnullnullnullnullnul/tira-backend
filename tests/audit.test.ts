// Integration tests for the task_history.changed_by audit trail.
//
// Verifies the contract documented in docs/database/migrations.md
// and migration 0014:
// - When the request carries an X-User-Id header, the audit trigger
//   records changed_by = <that user_id>.
// - When the request does NOT carry the header, the trigger records
//   changed_by = NULL.
//
// These tests hit a real Postgres reached via the standard DB_*
// env vars and assume the schema has already been migrated (the CI
// job runs `npm run db:migrate` before invoking jest).

import request from "supertest";

import { createApp } from "../src/app";
import pool from "../src/db";
import { resetDatabase, seedMembership, seedTeam, seedUser } from "./helpers/setup";

const app = createApp();

afterAll(async () => {
  await pool.end();
});

describe("audit changed_by", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("records changed_by from X-User-Id when the header is present", async () => {
    const alice = await seedUser("alice", "leader");
    const bob = await seedUser("bob", "user");
    const teamId = await seedTeam("Alpha", alice.user_id);
    await seedMembership(teamId, bob.user_id, "user");

    const createRes = await request(app)
      .post("/tasks")
      .set("X-User-Id", alice.user_id)
      .send({
        created_by: alice.user_id,
        team_id: teamId,
        assigned_to: bob.user_id,
        title: "alpha task one",
        status: "pending",
        priority: "medium",
        deadline: new Date(Date.now() + 86_400_000).toISOString(),
      });

    expect(createRes.status).toBe(201);
    const taskId: string = createRes.body.task_id;

    const updateRes = await request(app)
      .patch(`/tasks/${taskId}`)
      .set("X-User-Id", alice.user_id)
      .send({ status: "ongoing" });

    expect(updateRes.status).toBe(200);

    const audit = await pool.query(
      `SELECT change_type, field, old_value, new_value, changed_by
       FROM task_history
       WHERE task_id = $1
       ORDER BY changed_at DESC
       LIMIT 1`,
      [taskId],
    );

    expect(audit.rows[0]).toMatchObject({
      change_type: "UPDATE",
      field: "status",
      old_value: "pending",
      new_value: "ongoing",
      changed_by: alice.user_id,
    });
  });

  it("records changed_by = NULL when the header is absent", async () => {
    const alice = await seedUser("alice", "leader");
    const bob = await seedUser("bob", "user");
    const teamId = await seedTeam("Alpha", alice.user_id);
    await seedMembership(teamId, bob.user_id, "user");

    const createRes = await request(app)
      .post("/tasks")
      .send({
        created_by: alice.user_id,
        team_id: teamId,
        assigned_to: bob.user_id,
        title: "alpha task two",
        status: "pending",
        priority: "low",
        deadline: new Date(Date.now() + 86_400_000).toISOString(),
      });

    expect(createRes.status).toBe(201);
    const taskId: string = createRes.body.task_id;

    const updateRes = await request(app)
      .patch(`/tasks/${taskId}`)
      .send({ priority: "high" });

    expect(updateRes.status).toBe(200);

    const audit = await pool.query(
      `SELECT changed_by FROM task_history WHERE task_id = $1 ORDER BY changed_at DESC LIMIT 1`,
      [taskId],
    );

    expect(audit.rows[0].changed_by).toBeNull();
  });
});
