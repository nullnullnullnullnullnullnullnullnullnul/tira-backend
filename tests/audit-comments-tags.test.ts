// Integration tests for changed_by attribution on the comments and
// task_tags write paths.
//
// PR 3A wired createTask and updateTask through withAuditedTransaction.
// PR 3B extended the same pattern to createComment, addTagToTask, and
// removeTagFromTask, which together cover every audit trigger fired
// by application writes (the triggers in migration 0012 fire on
// UPDATE tasks, INSERT comments, and INSERT/DELETE task_tags).

import request from "supertest";

import { createApp } from "../src/app";
import pool from "../src/db";
import {
  resetDatabase,
  seedMembership,
  seedTag,
  seedTask,
  seedTeam,
  seedUser,
} from "./helpers/setup";

const app = createApp();

afterAll(async () => {
  await pool.end();
});

describe("audit changed_by on comments and task_tags", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("records changed_by on a new comment when X-User-Id is present", async () => {
    const alice = await seedUser("alice", "leader");
    const bob = await seedUser("bob", "user");
    const teamId = await seedTeam("Alpha", alice.user_id);
    await seedMembership(teamId, bob.user_id, "user");
    const taskId = await seedTask(teamId, alice.user_id, bob.user_id, "task with comment");

    const res = await request(app)
      .post(`/comments/tasks/${taskId}`)
      .set("X-User-Id", alice.user_id)
      .send({ author_id: alice.user_id, content: "first comment" });

    expect(res.status).toBe(201);

    const audit = await pool.query(
      `SELECT entity, change_type, new_value, changed_by
       FROM task_history
       WHERE task_id = $1 AND entity = 'COMMENT'`,
      [taskId],
    );

    expect(audit.rows[0]).toMatchObject({
      entity: "COMMENT",
      change_type: "CREATE",
      new_value: "first comment",
      changed_by: alice.user_id,
    });
  });

  it("records changed_by on add and remove of a task tag", async () => {
    const alice = await seedUser("alice", "leader");
    const bob = await seedUser("bob", "user");
    const teamId = await seedTeam("Alpha", alice.user_id);
    await seedMembership(teamId, bob.user_id, "user");
    const taskId = await seedTask(teamId, alice.user_id, bob.user_id, "task with tag");
    const tagId = await seedTag(teamId, "urgent");

    const addRes = await request(app)
      .post(`/tags/tasks/${taskId}`)
      .set("X-User-Id", alice.user_id)
      .send({ tag_id: tagId });
    expect(addRes.status).toBe(201);

    const removeRes = await request(app)
      .delete(`/tags/tasks/${taskId}/${tagId}`)
      .set("X-User-Id", bob.user_id);
    expect(removeRes.status).toBe(204);

    const audit = await pool.query(
      `SELECT change_type, new_value, old_value, changed_by
       FROM task_history
       WHERE task_id = $1 AND entity = 'TAG'
       ORDER BY changed_at ASC`,
      [taskId],
    );

    expect(audit.rows).toHaveLength(2);
    expect(audit.rows[0]).toMatchObject({
      change_type: "CREATE",
      new_value: "urgent",
      changed_by: alice.user_id,
    });
    expect(audit.rows[1]).toMatchObject({
      change_type: "DELETE",
      old_value: "urgent",
      changed_by: bob.user_id,
    });
  });

  it("records changed_by = NULL on a comment when X-User-Id is absent", async () => {
    const alice = await seedUser("alice", "leader");
    const bob = await seedUser("bob", "user");
    const teamId = await seedTeam("Alpha", alice.user_id);
    await seedMembership(teamId, bob.user_id, "user");
    const taskId = await seedTask(teamId, alice.user_id, bob.user_id, "untraced comment");

    const res = await request(app)
      .post(`/comments/tasks/${taskId}`)
      .send({ author_id: alice.user_id, content: "no header" });

    expect(res.status).toBe(201);

    const audit = await pool.query(
      `SELECT changed_by FROM task_history WHERE task_id = $1 AND entity = 'COMMENT'`,
      [taskId],
    );

    expect(audit.rows[0].changed_by).toBeNull();
  });
});
