/**
 * Drop the application database and role, then recreate both from
 * scratch. Used by `npm run db:reset` (and transitively by db:init)
 * to get a clean slate before running migrations and seeding.
 *
 * Requires a Postgres instance reachable at DB_HOST:DB_PORT with the
 * DB_SUPERUSER credentials capable of dropping and creating databases
 * and roles. Run scripts/setup_db.sh first if you do not have one
 * locally.
 */

import { Client } from "pg";

import { env } from "../config/env";

async function main(): Promise<void> {
  const superClient = new Client({
    host: env.db.host,
    port: env.db.port,
    user: env.super.user,
    password: env.super.pass,
    database: "postgres",
  });

  await superClient.connect();
  try {
    await superClient.query(
      `SELECT pg_terminate_backend(pid)
       FROM pg_stat_activity
       WHERE datname = $1 AND pid <> pg_backend_pid()`,
      [env.db.database],
    );
    await superClient.query(`DROP DATABASE IF EXISTS ${env.db.database}`);
    await superClient.query(`DROP ROLE IF EXISTS ${env.db.user}`);
    await superClient.query(`CREATE USER ${env.db.user} WITH PASSWORD '${env.db.pass}'`);
    await superClient.query(`CREATE DATABASE ${env.db.database} OWNER ${env.db.user}`);
    console.log(`[prep] database ${env.db.database} (owner ${env.db.user}) recreated`);
  } finally {
    await superClient.end();
  }
}

main().catch((err) => {
  console.error("[prep] failed:", err);
  process.exit(1);
});
