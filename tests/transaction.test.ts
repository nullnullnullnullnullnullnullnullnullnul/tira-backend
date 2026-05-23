// Integration tests for transactional atomicity of writes wrapped
// in withAuditedTransaction.
//
// Each createTask in the service runs four existence/membership
// checks before its INSERT. If any check fails the helper ROLLBACKs,
// so no partial state can leak into the database. This file verifies
// that behaviour end-to-end through the HTTP layer.

import request from "supertest";

import { createApp } from "../src/app";
import pool from "../src/db";
import { resetDatabase, seedMembership, seedTeam, seedUser } from "./helpers/setup";

const app = createApp();

afterAll(async () => {
  await pool.end();
});

describe("createTask transaction atomicity", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("rolls back when the assigned user is not a team member", async () => {
    const alice = await seedUser("alice", "leader");
    const bob = await seedUser("bob", "user");
    const teamId = await seedTeam("Alpha", alice.user_id);
    // Note: bob is NOT seeded as a member of Alpha.

    const before = await pool.query("SELECT count(*)::int FROM tasks");
    expect(before.rows[0].count).toBe(0);

    const res = await request(app)
      .post("/tasks")
      .set("X-User-Id", alice.user_id)
      .send({
        created_by: alice.user_id,
        team_id: teamId,
        assigned_to: bob.user_id,
        title: "should never persist",
        status: "pending",
        priority: "medium",
        deadline: new Date(Date.now() + 86_400_000).toISOString(),
      });

    // The exact error class depends on the ErrorHandler middleware;
    // what matters is the request did not succeed and no task row
    // was committed.
    expect(res.status).toBeGreaterThanOrEqual(400);

    const after = await pool.query("SELECT count(*)::int FROM tasks");
    expect(after.rows[0].count).toBe(0);
  });

  it("commits the task when every membership check passes", async () => {
    const alice = await seedUser("alice", "leader");
    const bob = await seedUser("bob", "user");
    const teamId = await seedTeam("Alpha", alice.user_id);
    await seedMembership(teamId, bob.user_id, "user");

    const res = await request(app)
      .post("/tasks")
      .set("X-User-Id", alice.user_id)
      .send({
        created_by: alice.user_id,
        team_id: teamId,
        assigned_to: bob.user_id,
        title: "should persist",
        status: "pending",
        priority: "medium",
        deadline: new Date(Date.now() + 86_400_000).toISOString(),
      });

    expect(res.status).toBe(201);

    const count = await pool.query("SELECT count(*)::int FROM tasks");
    expect(count.rows[0].count).toBe(1);
  });
});
