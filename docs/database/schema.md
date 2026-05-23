# Database schema

This document is a reading guide to the schema. It is hand-written, not
auto-generated, and is meant to be read alongside the migrations under
[`migrations/`](../../migrations). For migration mechanics see
[`migrations.md`](migrations.md); for the audit-attribution contract see
[`decisions.md`](decisions.md).

## Conventions

These hold across every table unless a migration says otherwise.

- **Primary keys**: ULID stored as `TEXT`, generated client-side by the
  application. The only exception is [`task_history`](#task_history),
  whose rows are inserted exclusively by triggers and so use
  `UUID DEFAULT gen_random_uuid()`.
- **Timestamps**: `TIMESTAMPTZ`, never `TIMESTAMP`. Defaulted to `now()`
  for "created_at"-style columns. Storing offsets in the column type
  side-steps the entire class of "the API server moved timezones"
  bugs.
- **Enums**: defined once in
  [`0001_initial-enums.sql`](../../migrations/0001_initial-enums.sql)
  (`user_role_enum`, `task_status_enum`, `task_priority_enum`). New
  values require an additive migration (`ALTER TYPE ... ADD VALUE`).
- **Identifier style**: lowercase, snake_case, never quoted. Tables are
  plural (`users`, `tasks`); join tables are noun_noun (`team_members`,
  `task_tags`).
- **Foreign keys**: every FK has an explicit `CREATE INDEX` in
  [`0010_create-indexes.sql`](../../migrations/0010_create-indexes.sql)
  - Postgres does NOT create one automatically, and every repository
  in this project filters by at least one FK column.
- **Deletes**: cascade by default along ownership edges (team owns tags,
  tasks, members; task owns task_tags, history, comments). User
  references on `tasks` and `comments` use `ON DELETE SET NULL` so the
  record survives a user deletion as an orphaned-but-readable row.
- **Audit log**: writes to `tasks` (UPDATE), `comments` (INSERT), and
  `task_tags` (INSERT / DELETE) fire triggers that append to
  `task_history`. The actor is read from the
  `app.current_user_id` session variable; see
  [`migrations.md#audit-log-how-changed_by-gets-populated`](migrations.md#audit-log-how-changed_by-gets-populated).

## Tables

### `users`

Defined in
[`0002_create-users.sql`](../../migrations/0002_create-users.sql).

| Column | Type | Notes |
|---|---|---|
| `user_id` | `TEXT` PK | ULID |
| `username` | `VARCHAR(50)` UNIQUE NOT NULL | service-level rule: 3-16 chars, alphanumeric |
| `email` | `VARCHAR(254)` UNIQUE | nullable; UNIQUE treats multiple NULLs as distinct |
| `pwd_hash` | `TEXT` NOT NULL | bcrypt |
| `role` | `user_role_enum` NOT NULL | `leader` or `user` |
| `created_at` | `TIMESTAMPTZ` DEFAULT `now()` | |

Email is intentionally nullable: this lets the schema accept
service-account or imported users without an address. Once product
requires email-on-signup, flip it to NOT NULL in a new migration.

### `teams`

Defined in
[`0003_create-teams.sql`](../../migrations/0003_create-teams.sql).

| Column | Type | Notes |
|---|---|---|
| `team_id` | `TEXT` PK | ULID |
| `owner_id` | `TEXT` NOT NULL FK -> `users.user_id` | ON DELETE CASCADE |
| `name` | `VARCHAR(50)` NOT NULL | UNIQUE per owner |
| `created_at` | `TIMESTAMPTZ` DEFAULT `now()` | |

Uniqueness is `(name, owner_id)`: two different owners can each have
their own "Backend" team. Deleting an owner cascades to their teams,
which in turn cascades to that team's tags, tasks, and members.

### `team_members`

Defined in
[`0005_create-team-members.sql`](../../migrations/0005_create-team-members.sql).

| Column | Type | Notes |
|---|---|---|
| `team_members_id` | `TEXT` PK | ULID |
| `team_id` | `TEXT` NOT NULL FK -> `teams.team_id` | ON DELETE CASCADE |
| `user_id` | `TEXT` NOT NULL FK -> `users.user_id` | ON DELETE CASCADE |
| `role` | `user_role_enum` | nullable so an invite can pre-date the role decision |
| `invited_at` | `TIMESTAMPTZ` | set when the invite is created |
| `joined_at` | `TIMESTAMPTZ` | set when the invite is accepted |
| | | UNIQUE `(team_id, user_id)` |

The owner of a team is stored in `teams.owner_id`, not as a
`team_members` row, so ownership and membership are separate concerns.

### `tasks`

Defined in
[`0006_create-tasks.sql`](../../migrations/0006_create-tasks.sql).

| Column | Type | Notes |
|---|---|---|
| `task_id` | `TEXT` PK | ULID |
| `team_id` | `TEXT` NOT NULL FK -> `teams.team_id` | ON DELETE CASCADE |
| `assigned_to` | `TEXT` FK -> `users.user_id` | ON DELETE SET NULL |
| `created_by` | `TEXT` FK -> `users.user_id` | ON DELETE SET NULL |
| `title` | `VARCHAR(100)` NOT NULL | |
| `description` | `VARCHAR(300)` | short summary |
| `status` | `task_status_enum` NOT NULL DEFAULT `'pending'` | |
| `priority` | `task_priority_enum` NOT NULL DEFAULT `'medium'` | |
| `deadline` | `TIMESTAMPTZ` NOT NULL | not constrained to the future, see below |
| `content` | `TEXT` | long-form body |
| `last_modified_at` | `TIMESTAMPTZ` NOT NULL DEFAULT `now()` | maintained by trigger |

There is intentionally no `CHECK (deadline > now())`: `now()` is
non-immutable and Postgres only evaluates CHECK constraints at
INSERT / UPDATE time, so the predicate is meaningless beyond that
moment. "Deadline is in the future" is enforced in the service layer.

`last_modified_at` is kept current by the `update_last_modified_at_tr`
trigger (BEFORE UPDATE), so application code never has to remember
to bump it.

### `task_tags`

Defined in
[`0007_create-task-tags.sql`](../../migrations/0007_create-task-tags.sql).

| Column | Type | Notes |
|---|---|---|
| `task_tags_id` | `TEXT` PK | ULID |
| `task_id` | `TEXT` NOT NULL FK -> `tasks.task_id` | ON DELETE CASCADE |
| `tag_id` | `TEXT` NOT NULL FK -> `tags.tag_id` | ON DELETE CASCADE |
| | | UNIQUE `(task_id, tag_id)` |

A surrogate `task_tags_id` is used in addition to the natural unique
key so the row has a stable ULID identifier consistent with the rest
of the schema; the unique constraint still prevents duplicate
tag-on-task rows.

### `tags`

Defined in
[`0004_create-tags.sql`](../../migrations/0004_create-tags.sql).

| Column | Type | Notes |
|---|---|---|
| `tag_id` | `TEXT` PK | ULID |
| `team_id` | `TEXT` NOT NULL FK -> `teams.team_id` | ON DELETE CASCADE |
| `name` | `VARCHAR(20)` NOT NULL | UNIQUE per team |

Tags are team-scoped: two teams can each have an "urgent" tag without
conflict.

### `comments`

Defined in
[`0009_create-comments.sql`](../../migrations/0009_create-comments.sql).

| Column | Type | Notes |
|---|---|---|
| `comment_id` | `TEXT` PK | ULID |
| `task_id` | `TEXT` NOT NULL FK -> `tasks.task_id` | ON DELETE CASCADE |
| `author_id` | `TEXT` FK -> `users.user_id` | ON DELETE SET NULL |
| `content` | `VARCHAR(300)` | service-level rule: 1-300 chars |
| `created_at` | `TIMESTAMPTZ` DEFAULT `now()` | |

Deleting a comment's author leaves the comment in place with
`author_id = NULL`; deleting the task removes the comment entirely.

### `task_history`

Defined in
[`0008_create-task-history.sql`](../../migrations/0008_create-task-history.sql)
and extended in
[`0014_audit-changed-by.sql`](../../migrations/0014_audit-changed-by.sql).

| Column | Type | Notes |
|---|---|---|
| `history_id` | `UUID` PK DEFAULT `gen_random_uuid()` | trigger-generated, not application-generated |
| `task_id` | `TEXT` NOT NULL FK -> `tasks.task_id` | ON DELETE CASCADE |
| `change_type` | `task_history_change_type_enum` NOT NULL | one of `CREATE`, `UPDATE`, `DELETE` (migration 0018) |
| `entity` | `task_history_entity_enum` NOT NULL | one of `TASK`, `COMMENT`, `TAG` (migration 0018) |
| `field` | `VARCHAR(50)` | which column changed (e.g. `status`, `priority`) |
| `old_value` | `TEXT` | NULL for `CREATE` rows |
| `new_value` | `TEXT` | NULL for `DELETE` rows |
| `changed_at` | `TIMESTAMPTZ` DEFAULT `now()` | |
| `changed_by` | `TEXT` | actor ULID, or NULL when un-attributed |

`task_history` is append-only: no migration grants UPDATE or DELETE on
it to the application role beyond the blanket CRUD grants in
[`0013_grants-and-default-privileges.sql`](../../migrations/0013_grants-and-default-privileges.sql),
but the application never issues either. The rows exist only because
triggers fire them; application code only reads `task_history`.

`changed_by` is NULL when no actor could be attributed (the
`app.current_user_id` session variable was empty at write time). See
[`decisions.md#audit-attribution-via-session-variable`](decisions.md#audit-attribution-via-session-variable).

## Indexes

[`0010_create-indexes.sql`](../../migrations/0010_create-indexes.sql)
covers every FK column the application filters on, plus two
composites that match real query patterns:

| Index | Backs |
|---|---|
| `tasks_team_id_idx` | `selectTask` filtered by `team_id` |
| `tasks_assigned_to_idx` | `selectTask` filtered by `assigned_to` |
| `tasks_created_by_idx` | `selectTask` filtered by `created_by` |
| `tasks_deadline_idx` | `selectTask` ordered by `deadline DESC`, deadline range filters |
| `tasks_status_priority_idx` | composite for the task list endpoint when filtering both |
| `comments_task_id_idx` | `selectComments` filtered by `task_id` |
| `comments_author_id_idx` | `selectComments` filtered by `author_id` |
| `team_members_user_id_idx` | "teams I belong to" join in `selectTeamsByUser` |
| `task_tags_tag_id_idx` | reverse lookup "tasks carrying this tag" |
| `task_history_task_id_idx` | "audit for this task" |
| `task_history_changed_at_idx` | DESC for "recent activity" feeds |

## Triggers

Defined in
[`0011_create-audit-functions.sql`](../../migrations/0011_create-audit-functions.sql)
and bound in
[`0012_create-audit-triggers.sql`](../../migrations/0012_create-audit-triggers.sql),
then extended in
[`0014_audit-changed-by.sql`](../../migrations/0014_audit-changed-by.sql)
and corrected in
[`0015_audit-coalesce-empty-current-setting.sql`](../../migrations/0015_audit-coalesce-empty-current-setting.sql).

| Trigger | On | Fires | Function |
|---|---|---|---|
| `update_last_modified_at_tr` | `tasks` | BEFORE UPDATE | `set_last_modified_at_fn` (touches `last_modified_at`) |
| `log_task_changes_tr` | `tasks` | AFTER UPDATE | `log_task_changes_fn` (one history row per changed column among status, priority, assigned_to, title, description) |
| `log_comment_activity_tr` | `comments` | AFTER INSERT | `log_comment_activity_fn` |
| `log_tag_activity_tr` | `task_tags` | AFTER INSERT or DELETE | `log_tag_activity_fn` |

Trigger functions read the actor with:

```sql
acting_user TEXT := NULLIF(current_setting('app.current_user_id', true), '');
```

The application emits the setting once per audited transaction via
`SELECT set_config('app.current_user_id', $1, true)` (transaction-
local). See `src/utils/transaction.ts`.

## Relationships at a glance

```
users 1---* teams (owner_id)
users *---* teams via team_members
teams 1---* tags
teams 1---* tasks
tasks *---* tags via task_tags
tasks 1---* comments  (author = users)
tasks 1---* task_history  (changed_by = users)
```

Cascades follow the ownership edges:

- delete `users` -> cascade `teams` (where owner) -> cascade tags, tasks, members
- delete `users` -> SET NULL on `tasks.assigned_to`, `tasks.created_by`, `comments.author_id`
- delete `teams` -> cascade tags, tasks, team_members
- delete `tasks` -> cascade task_tags, comments, task_history
- delete `tags` -> cascade task_tags (history rows from that cascade carry `changed_by = NULL`, see [`decisions.md`](decisions.md#tag-cascade-leaves-audit-rows-un-attributed))

## Grants

[`0013_grants-and-default-privileges.sql`](../../migrations/0013_grants-and-default-privileges.sql)
gives the application role `tira` the standard CRUD on every table in
`public`, plus `ALTER DEFAULT PRIVILEGES` so any future table or
sequence created in that schema inherits the same grants without
needing a follow-up migration.

Migrations themselves run as `tira` (per `.env` `DATABASE_URL`), so
DDL and its accompanying grants execute under the same role that the
application uses at runtime.
