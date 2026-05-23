/**
 * Drop the application database and role, then recreate both from
 * scratch. Used by `npm run db:reset` (and transitively by db:init)
 * to get a clean slate before running migrations and seeding.
 *
 * Requires a Postgres instance reachable at DB_HOST:DB_PORT with the
 * DB_SUPERUSER credentials capable of dropping and creating databases
 * and roles. Run scripts/setup_db.sh first if you do not have one
 * locally.
 *
 * The values being interpolated come from `.env`, not from end users,
 * but they still pass through DDL statements that Postgres does not
 * accept as parameterised queries (CREATE DATABASE / CREATE ROLE
 * take literal tokens, not $1 placeholders). To keep the script safe
 * even if `.env` is fetched from a less-trusted source, identifiers
 * are validated against the standard Postgres identifier regex and
 * the password literal has its single quotes doubled before
 * interpolation.
 */

import { Client } from "pg";

import { env } from "../config/env";

// Postgres unquoted identifier: start with a letter or underscore,
// followed by letters / digits / underscores, total length <= 63.
// We deliberately do not support double-quoted identifiers (which
// allow any character but invite confusion downstream).
const IDENT_RE = /^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/;

function assertIdent(name: string, label: string): string {
  if (!IDENT_RE.test(name)) {
    throw new Error(
      `[prep] invalid ${label} ${JSON.stringify(name)}: must match ${IDENT_RE} (Postgres identifier rules)`,
    );
  }
  return name;
}

// Escape a value for inclusion as a Postgres string literal: double
// any embedded single quote and wrap the result in single quotes.
// This is exactly the same escaping Postgres applies to non-E'...'
// literals, and is safe for any byte sequence that does not contain
// a NUL (Postgres rejects those at parse time, which fails closed).
function quoteLiteral(value: string): string {
  if (value.includes("\x00")) {
    throw new Error("[prep] password contains a NUL byte, refusing to interpolate");
  }
  return `'${value.replace(/'/g, "''")}'`;
}

async function main(): Promise<void> {
  const dbName = assertIdent(env.db.database, "DB_NAME");
  const dbUser = assertIdent(env.db.user, "DB_USER");
  const dbPassLiteral = quoteLiteral(env.db.pass);

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
      [dbName],
    );
    await superClient.query(`DROP DATABASE IF EXISTS ${dbName}`);
    await superClient.query(`DROP ROLE IF EXISTS ${dbUser}`);
    await superClient.query(`CREATE USER ${dbUser} WITH PASSWORD ${dbPassLiteral}`);
    await superClient.query(`CREATE DATABASE ${dbName} OWNER ${dbUser}`);
    console.log(`[prep] database ${dbName} (owner ${dbUser}) recreated`);
  } finally {
    await superClient.end();
  }
}

main().catch((err) => {
  console.error("[prep] failed:", err);
  process.exit(1);
});
