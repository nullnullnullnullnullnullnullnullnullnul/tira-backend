import { Pool, PoolClient } from "pg";
import { env } from "../config/env";

/**
 * Any object that can run a `query()`: either the shared pool (the
 * default) or a PoolClient checked out for a transaction. Repository
 * functions accept this type so the same code path serves both
 * single-statement reads/writes and multi-statement transactional
 * sequences. See src/utils/transaction.ts for the helper that runs a
 * callback inside an audited transaction.
 */
export type Executor = Pool | PoolClient;

/**
 * Shared Postgres connection pool.
 *
 * Defaults are tuned for a small backend behind a single-instance
 * Postgres: 10 connections is enough headroom for typical request
 * concurrency, statement_timeout kills runaway queries before they
 * exhaust the pool, and the idle timeout keeps the connection table
 * trim during quiet periods.
 *
 * Every limit is overridable via env var (see `env.db`) so the same
 * binary can be tuned per environment without recompiling.
 */
const pool = new Pool({
  user: env.db.user,
  password: env.db.pass,
  host: env.db.host,
  port: env.db.port,
  database: env.db.database,
  max: env.db.poolMax,
  min: env.db.poolMin,
  idleTimeoutMillis: env.db.idleTimeoutMs,
  connectionTimeoutMillis: env.db.connectionTimeoutMs,
  statement_timeout: env.db.statementTimeoutMs,
});

pool.on("error", (err) => {
  // An idle client in the pool emitted an error. Log it and let pg
  // reconnect on the next checkout; do not crash the process.
  console.error("[db] idle client error", err);
});

export default pool;
