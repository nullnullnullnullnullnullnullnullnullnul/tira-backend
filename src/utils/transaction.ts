import { PoolClient } from "pg";

import pool from "../db";

/**
 * Run `fn` inside a Postgres transaction, optionally setting the
 * `app.current_user_id` session variable so audit triggers can attach
 * the change to whoever performed it.
 *
 * Acquires a fresh client from the pool, BEGINs, sets the session
 * variable when `actingUserId` is provided, runs `fn(client)`, and
 * either COMMITs or ROLLBACKs based on the outcome. The client is
 * always released back to the pool.
 *
 * The caller passes the client through to every repository function
 * in the callback so all queries join the same transaction. Mixing
 * `pool.query(...)` calls with this client breaks both atomicity
 * and audit attribution (the SET LOCAL only applies to the txn
 * that ran it).
 *
 * `set_config(name, value, is_local)` is used in place of
 * `SET LOCAL name = $1`: SET does not accept query parameters, but
 * set_config does, which lets us pass the user_id safely without
 * string interpolation.
 *
 * @example
 *   return withAuditedTransaction(req.userId, async (client) => {
 *     await teamRepo.selectMembers(team_id, 1, 1, client);
 *     return taskRepo.insertTask(task, client);
 *   });
 */
export async function withAuditedTransaction<T>(
  actingUserId: string | undefined,
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    if (actingUserId) {
      await client.query("SELECT set_config('app.current_user_id', $1, true)", [actingUserId]);
    }
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
}
