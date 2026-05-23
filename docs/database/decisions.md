# Architecture decisions

Short, ADR-style notes on the database-side choices that shape this
project. Each entry covers what was chosen, what was rejected, and
why. The format is deliberately lightweight - one section per
decision, no separate files per entry - because the project is small
enough that the rationale is more useful inline than scattered.

Entries are append-only: if a decision changes, add a new entry that
references the old one rather than rewriting history.

## ORM-less, parameterised SQL

**Decision**: every query is hand-written, parameterised SQL issued
through the [`pg`](https://node-postgres.com/) driver. No ORM, no
query builder, no schema-from-decorators.

**Why**:
- The project is primarily a portfolio piece for DBA / data-analyst
  work, so the SQL is the artefact, not a backdrop. An ORM would
  obscure exactly the thing the project is meant to showcase.
- Index choice, join shape, and lock behaviour are visible in the
  source, so a reader can audit them without learning an
  intermediate dialect.
- The total query surface is small enough (under a dozen distinct
  shapes) that the ergonomic argument for an ORM does not apply.

**Tradeoffs**:
- More boilerplate per repository function.
- The "dynamic filter" and "dynamic update" patterns reinvent
  fragments of a query builder; see
  [`queries.md`](queries.md#dynamic-filter-pattern) for the
  containment strategy (column names from typed keys, values from
  parameter bindings).

## Migration tool: node-pg-migrate in SQL-file mode

**Decision**: schema history is versioned with `node-pg-migrate` v8,
configured to take plain `.sql` files (`-j sql`).

**Why**: discussed in detail in
[`migrations.md#tool`](migrations.md#tool). Short version: plain SQL
lints with `sqlfluff`, reads like Postgres, and applies with any
client; the tool ships both the runner and the scaffolder so the
project is not assembling its own.

**Rejected**: TypeScript / JS migrations (would require executing
project code at apply time, makes `psql` reproduction harder),
Sqitch (a better tool for a more demanding pipeline, but overkill
here; reserved for the market-data project, which has the right
shape for it).

## Sequential migration numbering, not timestamps

**Decision**: filenames are `NNNN_<description>.sql` with
zero-padded, sequential four-digit numbers.

**Why**:
- The default `node-pg-migrate` scaffolder produces a unix
  timestamp prefix, which sorts the same way alphabetically and
  numerically but is noisy to read ("migration 0007 adds task_tags"
  is faster to recall than the timestamp form).
- Single-contributor project, so the collision risk that timestamps
  solve does not apply.

**Workflow note**: the scaffolder still generates the timestamped
filename - rename it to the next `NNNN_` before committing. See
[`migrations.md#authoring-a-new-migration`](migrations.md#authoring-a-new-migration).

## ULID primary keys stored as `TEXT`, not `CHAR(26)` or UUID

**Decision**: every application-managed PK is a ULID generated
client-side via the [`ulid`](https://github.com/ulid/javascript)
package and stored as `TEXT`.

**Why**:
- ULID gives time-ordered IDs (better B-tree locality than UUIDv4)
  without requiring a database extension or a server round trip for
  ID assignment.
- `TEXT` over `CHAR(26)`: `CHAR(N)` pads on read in Postgres and
  has no storage advantage over `TEXT` for variable-length string
  data; `TEXT` is the Postgres-idiomatic choice.
- ULIDs are picked by the application, not the database, which keeps
  inserts simple (no `RETURNING id` round trip needed when the
  service already knows the id).

**Exception**: `task_history.history_id` is `UUID DEFAULT
gen_random_uuid()`. Those rows are inserted by triggers, never by
application code, so there is no client to provide the id; letting
Postgres pick is simpler than threading a sequence into the
trigger function. See
[`schema.md#task_history`](schema.md#task_history).

## `TIMESTAMPTZ` everywhere

**Decision**: every timestamp column is `TIMESTAMPTZ`. `TIMESTAMP`
(without time zone) does not appear in any migration.

**Why**: storing offsets in the column type makes "what timezone was
the application server in" not a question the data has to answer.
`TIMESTAMPTZ` accepts any input timezone, normalises to UTC on
write, and returns UTC unless the session timezone is set. Mixing
`TIMESTAMP` and `TIMESTAMPTZ` in the same schema is a known source
of subtle off-by-an-hour bugs.

## Audit attribution via session variable

**Decision**: the actor for an audit row is read at trigger time
from `current_setting('app.current_user_id', true)`, which the
application sets per-transaction with `set_config(name, value,
is_local := true)`.

**Why**:
- A trigger function cannot accept dynamic per-row arguments from
  the caller, so the only way to thread "who did this" through a
  trigger is via session/transaction state.
- `is_local = true` scopes the setting to the current transaction,
  so the value cannot leak to the next user of the pooled
  connection.
- `set_config(...)` accepts query parameters; `SET LOCAL ... = $1`
  does not. So the application uses `set_config` to avoid string
  interpolation of the user id.

**Implementation**: see
[`src/utils/transaction.ts`](../../src/utils/transaction.ts) for
the helper, and [`migrations/0014_audit-changed-by.sql`](../../migrations/0014_audit-changed-by.sql)
for the trigger-side read.

**Audit gap deliberately accepted**:
[CASCADE delete from `tags` to `task_tags`](#tag-cascade-leaves-audit-rows-un-attributed)
fires the tag trigger without the application's actor in scope.

## `NULLIF(current_setting(...), '')` for missing-actor handling

**Decision**: trigger functions wrap their session-variable read in
`NULLIF(..., '')`, so an audit row written when no actor was
declared carries `changed_by = NULL` rather than `changed_by = ''`.

**Why**: `current_setting(name, missing_ok := true)` returns the
empty string `''`, not `NULL`, when the setting has never been
set in the current transaction. Without the `NULLIF`, un-attributed
writes would record `''` instead of `NULL`, breaking the convention
that NULL means "we do not know who".

**History**: migration 0014 originally got this wrong (followed the
docs claim that an unset setting returns NULL); migration 0015 is
the corrective fix. The integration tests in
[`tests/audit.test.ts`](../../tests/audit.test.ts) caught it.

## `X-User-Id` header as an auth placeholder

**Decision**: the audit middleware reads the actor from a
plain-text `X-User-Id` request header rather than from an
authenticated session. JWT-based authentication is on the roadmap.

**Why**: getting the audit-attribution wiring right end to end
(middleware -> transaction -> session variable -> trigger -> column)
is the load-bearing part. Decoupling it from the auth flow lets us
ship the schema, the helper, the tests, and the documentation
without first taking a position on JWT vs sessions vs OAuth.

**Tradeoff**: anyone with HTTP access to the server can impersonate
anyone else by setting the header. This is acceptable while the
project is local-only / portfolio code; the header parser is the
exact seam where the JWT subject claim will plug in, with no other
changes required.

## Tag CASCADE leaves audit rows un-attributed

**Decision**: the service-level `deleteTag` is intentionally NOT
wrapped in `withAuditedTransaction`. As a side effect, the audit
rows emitted by the CASCADE-driven `task_tags` deletes carry
`changed_by = NULL`.

**Why this happens**: when `pool.query("DELETE FROM tags ...")` runs
outside of `withAuditedTransaction`, Postgres opens its own implicit
transaction, the cascade fires `log_tag_activity_fn` for each
mapping it removes, and the trigger reads
`current_setting('app.current_user_id', true)` - which is the empty
string (NULLIF'd to NULL by migration 0015), because nothing called
`set_config`. If `deleteTag` were wrapped, the cascade would
correctly inherit the actor; the trigger code does not need any
change.

**Why not wrap `deleteTag`**: doing so purely to capture a cascade
side effect would surprise readers (the function performs no audited
write of its own), and adding a wrapper invites the assumption that
every `delete*` function is similarly wrapped. The two cleaner
fixes are (a) require callers of `deleteTag` to opt into an audited
transaction at the controller layer, or (b) emit an explicit
`task_history` row at the application level when deleting a tag.
Both are noted as future work.

**Recorded as a known limitation** rather than fixed because the
"delete a tag entirely" path is rare and the parent action
(intentionally removing the tag and its task associations) is
recoverable from the `tags` row being gone, even without
attribution on the cascaded rows.

## sqlfluff for SQL linting, Postgres dialect

**Decision**: SQL is linted with `sqlfluff` in CI, configured for
the Postgres dialect with two-space indent and lower-case
keywords / function names.

**Why**:
- Catches the obvious classes of inconsistency (mixed casing,
  trailing semicolons, dangling commas) so they do not accumulate
  unnoticed.
- Pure-text linter that runs without a database connection, so the
  CI job is fast and self-contained.

**Configuration**: see `.sqlfluff` at the repo root. The
non-default bits are `capitalisation.functions = lower` (so
custom trigger functions like `set_last_modified_at_fn` are not
uppercased) and an `ignore_words` list for the project's enum
types (`task_status_enum`, etc.) so they are not flagged as
unknown identifiers.

## Test database is the real Postgres, not a mock

**Decision**: integration tests in [`tests/`](../../tests/) hit a
real Postgres reached via the standard `DB_*` env vars. CI runs
them against a `postgres:17` service container; locally we use a
`postgres:17-alpine` docker container.

**Why**:
- Half the value of the audit trail is the trigger behaviour, and
  triggers cannot be mocked without writing a re-implementation
  worse than the original.
- pg-specific features (session variables, `ON CONFLICT`,
  `COUNT(*) OVER()`) cannot be exercised against a SQLite or
  in-memory stand-in.
- The CI cost is low (a `postgres:17` container starts in seconds)
  and the alternative (mocks) is a known source of false-green
  test runs.
