# Database migrations

This document covers migration mechanics: the tool, the file layout,
how to author one, and the audit-attribution contract. For a tour of
the resulting schema see [`schema.md`](schema.md); for the
representative SQL the application issues see [`queries.md`](queries.md);
for the rationale behind ORM-less SQL, ULID PKs, and the audit
session-variable approach see [`decisions.md`](decisions.md).

## Tool

[`node-pg-migrate`](https://salsita.github.io/node-pg-migrate/) v8, in
SQL-file mode. The choice was driven by three goals:

- Plain `.sql` migration files so they read like Postgres, lint with
  `sqlfluff`, and can be applied with any Postgres client (not only via
  the migrate CLI).
- A single tool that ships both the runner and the scaffolding command,
  so contributors do not have to glue together flyway + a wrapper + a
  versioning convention.
- A minimal lockfile-style state table (`pgmigrations`) so the schema's
  history is queryable from inside the database.

## Layout

All migrations live in `migrations/` at the repo root. Filenames follow

```
NNNN_<kebab-case-description>.sql
```

where `NNNN` is a sequential four-digit number. Sequential numbers
were chosen over the default unix-timestamp prefix because:

- They sort the same way in any tool (alphabetical = numerical).
- They make the history easy to read at a glance ("migration 7 adds
  X").
- Multiple contributors are unlikely on this project so the
  numbering-collision risk that timestamps solve does not apply.

A migration file contains two sections separated by exact-match
comments:

```sql
-- Up Migration
CREATE TABLE foo (...);

-- Down Migration
DROP TABLE foo;
```

Both sections are required. The down section must restore the schema
to exactly the state before the up section ran. Migrations that cannot
be cleanly reversed (e.g. dropping a column with live data) should say
so in the comment but still provide a best-effort down.

## Conventions

- One concern per migration. "Add the orders table" or "add the
  fraud_score index" is correct granularity. "Schema v2" is not.
- Lowercase identifiers, snake_case, no quoted identifiers.
- Foreign-key columns get an explicit `CREATE INDEX` in the same
  migration; Postgres does not create one automatically.
- Functions (`CREATE OR REPLACE FUNCTION`) and triggers (`CREATE
  TRIGGER`) live in separate migrations from the tables they reference,
  so they can be re-created independently.
- Any new write target that the audit triggers should know about needs
  a corresponding trigger entry. The session-variable pattern from
  migration 0014 is the contract: every new audit-emitting function
  must read `current_setting('app.current_user_id', true)` and pass
  the result to `changed_by`.

## Commands

```
npm run db:migrate           # apply all pending up migrations
npm run db:migrate:down      # roll back the most recent migration
npm run db:migrate:create    # scaffold a new SQL migration file
```

The migrate commands all read the database connection from
`DATABASE_URL` in `.env` (loaded automatically by node-pg-migrate via
its built-in dotenv support). Keep `DATABASE_URL` in sync with the
`DB_*` variables that the application server reads.

Higher-level commands that chain migrations with prep and seed:

```
npm run db:init              # first-time setup (cluster + role + db + migrate + seed)
npm run db:reset             # drop + recreate db + migrate + seed
npm run db:seed              # just insert seed data
```

## Authoring a new migration

```
npm run db:migrate:create -- add-orders-table
```

Generates `migrations/<timestamp>_add-orders-table.sql`. Rename the
prefix to the next sequential number (`0015_`, `0016_`, ...) before
committing.

Fill in both `-- Up Migration` and `-- Down Migration` sections.
Lint locally with:

```
sqlfluff lint migrations/<your-file>.sql
```

CI runs the same lint and rejects unformatted SQL.

## Verifying a migration before opening a PR

```
npm run db:reset                 # apply from scratch, ensuring all migrations
                                 # produce a usable state
npm run db:migrate:down          # roll back your migration
npm run db:migrate               # roll forward again
```

The down + up cycle is the cheapest check that your down migration
is correct.

## Audit log: how `changed_by` gets populated

Triggers in `0011_create-audit-functions.sql` (rewritten by
`0014_audit-changed-by.sql` and corrected by `0015_audit-coalesce-
empty-current-setting.sql`) read a Postgres session setting at write
time:

```sql
acting_user TEXT := NULLIF(current_setting('app.current_user_id', true), '');
```

The application is expected to emit, at the start of every transaction
that performs writes:

```sql
SELECT set_config('app.current_user_id', $1, true);
```

The third argument `is_local = true` scopes the setting to the
current transaction so the value cannot leak into the next pooled
connection user. The `NULLIF(..., '')` wrap is important:
`current_setting(..., missing_ok)` returns the *empty string*, not
NULL, when no value has been set in the current transaction. Without
the NULLIF, audit rows from un-attributed writes would record
`changed_by = ''`, breaking the convention that NULL means "we do
not know who".

The middleware that emits the `set_config` lives in
`src/utils/transaction.ts` (`withAuditedTransaction`). It is invoked
by services that need atomicity plus audit attribution; see
`createTask` and `updateTask` in `src/services/tasks.service.ts` for
the pattern. Until JWT authentication ships, the user id arrives
via the `X-User-Id` request header (parsed by
`src/middleware/UserContext.ts`); that is intentionally an
unauthenticated stand-in and is documented as such.
