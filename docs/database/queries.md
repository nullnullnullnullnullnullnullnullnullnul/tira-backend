# Representative queries

A walk through the non-trivial SQL the application emits today. The
goal is to show what the query patterns look like in practice and why
each one is shaped the way it is; the source of truth is the
repository files under
[`src/repositories/`](../../src/repositories/).

The point of reading these together is the recurring shape: every
read is a parameterised query, every list query carries pagination
via `COUNT(*) OVER()` and `LIMIT / OFFSET`, every filter column is
indexed (see [`schema.md#indexes`](schema.md#indexes)), and every
write that fires an audit trigger runs inside `withAuditedTransaction`
so the trigger can attribute the change.

## Pagination pattern

Every list endpoint returns `{ data, pagination: { total, page,
pageSize, totalPages } }`. To avoid a second round trip for the count,
each list query computes `total` in the same statement using a
window function:

```sql
SELECT *,
       COUNT(*) OVER() AS total_count
FROM <table>
<where>
ORDER BY <col> <DESC|ASC>
LIMIT $n OFFSET $m
```

`COUNT(*) OVER()` returns the total row count after the WHERE clause
but before the LIMIT, attached to every row. The helper
`createPaginatedResult` in
[`src/models/pagination.ts`](../../src/models/pagination.ts) reads
`total_count` off the first row and assembles the wrapper.

Tradeoff: every row in the page now carries the same `total_count`
value, which is a few extra bytes per row in the result set. In
return, the database scans the matching rows once instead of twice.

## Dynamic filter pattern

`selectTask` and `selectTeam` accept an open-ended filter object and
turn it into a parameterised `WHERE`. The pattern (from
[`src/repositories/task.repository.ts`](../../src/repositories/task.repository.ts)):

```ts
const conditions: string[] = [];
const values: any[] = [];
Object.entries(filter).forEach(([key, value]) => {
  if (value === undefined || value === null) return;
  if (key === 'title') {
    values.push(`%${value}%`);
    conditions.push(`title ILIKE $${values.length}`);
  } else if (key === 'date_start') {
    values.push((value as Date).toISOString());
    conditions.push(`deadline >= $${values.length}`);
  } else if (key === 'date_end') {
    values.push((value as Date).toISOString());
    conditions.push(`deadline <= $${values.length}`);
  } else {
    values.push(value);
    conditions.push(`${key} = $${values.length}`);
  }
});
const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
```

Two things keep this safe:

- The values are always pushed onto `values` and referenced as
  `$N`, never interpolated into the SQL string. The only string
  interpolation is the column name in the `=` branch, and the only
  columns reaching that branch are the keys of a TypeScript
  `TaskFilter` type whose shape the controller validates first. The
  user-supplied value never touches the SQL string.
- The `key === 'title'` branch wraps the value in `%...%` before
  pushing it, so the wildcards live in the value (escaped by the
  parameter binding) rather than in the SQL.

This pattern is used in:

- `selectTask` in `task.repository.ts`
- `selectTeam` in `team.repository.ts`
- `selectTag` and `selectTaskTag` in `tag.repository.ts`
- `selectUsers` in `user.repository.ts`
- `selectComments` in `comment.repository.ts`

## "Teams a user belongs to"

From
[`src/repositories/team.repository.ts`](../../src/repositories/team.repository.ts).
A `JOIN` against `team_members` plus the same `COUNT(*) OVER()`
pagination trick:

```sql
SELECT t.team_id,
       t.owner_id,
       t.name,
       t.created_at,
       COUNT(*) OVER() AS total_count
FROM teams AS t
INNER JOIN team_members AS tm ON t.team_id = tm.team_id
WHERE tm.user_id = $1
ORDER BY t.created_at DESC
LIMIT $2 OFFSET $3
```

Backed by `team_members_user_id_idx` (the `WHERE tm.user_id`) plus
the implicit FK index on `team_members.team_id` for the join. Without
the user_id index, this degrades to a sequential scan of
`team_members` for every call.

## "Members of a team, with their user fields"

Also from `team.repository.ts`. The shape is the mirror of the
above:

```sql
SELECT u.user_id,
       u.username,
       u.email,
       u.role,
       u.created_at,
       COUNT(*) OVER() AS total_count
FROM team_members AS tm
INNER JOIN users AS u ON tm.user_id = u.user_id
WHERE tm.team_id = $1
ORDER BY u.created_at ASC
LIMIT $2 OFFSET $3
```

Note the projection: `pwd_hash` is intentionally not selected. The
column lives on `users` for authentication but the team-members
endpoint has no business returning it, so the projection keeps it out
of the result rather than relying on the application to filter the
hash out later.

## "All task IDs in teams the user belongs to"

From
[`src/repositories/activity.repository.ts`](../../src/repositories/activity.repository.ts).
Used by the activity feed to scope the audit query to tasks the user
has visibility into:

```sql
SELECT DISTINCT t.task_id
FROM tasks AS t
JOIN team_members AS tm ON t.team_id = tm.team_id
WHERE tm.user_id = $1
```

`DISTINCT` because a user can belong to a team in only one row, but
the explicit `DISTINCT` documents the contract ("we want a set of
task ids") regardless. This array is then fed into the
`task_history IN (...)` query immediately below.

## "Audit feed for those tasks"

```sql
SELECT *,
       COUNT(*) OVER() AS total_count
FROM task_history
WHERE task_id IN ($1, $2, ..., $N)
ORDER BY changed_at DESC
LIMIT $N+1 OFFSET $N+2
```

Backed by `task_history_changed_at_idx (changed_at DESC)` and
`task_history_task_id_idx (task_id)`. The `IN` placeholders are
built from the array of task ids returned by the previous query;
each is a parameter binding (`$1, $2, ...`), never an interpolated
literal.

`task_history` is append-only and only written by triggers; the
application never issues `INSERT` against it directly.

## Dynamic UPDATE pattern

From `task.repository.ts`:

```ts
const setClauses = keys.map((k, i) => `${k} = $${i + 1}`);
const values = keys.map(k => {
  const val = (fields as any)[k];
  return val instanceof Date ? val.toISOString() : val;
});
await db.query(`
  UPDATE tasks
  SET ${setClauses.join(', ')}, last_modified_at = NOW()
  WHERE task_id = $${keys.length + 1}
  RETURNING *;
  `,
  [...values, task_id]
);
```

Same safety rationale as the dynamic filter: column names come from
a TypeScript `Partial<Task>` type that the service validates upstream
(rejecting unknown keys before they reach the repository), values
are bound as parameters.

`last_modified_at = NOW()` is set explicitly here even though the
`update_last_modified_at_tr` trigger would also bump it. The
duplication is intentional: the trigger is the safety net, the
explicit assignment is the documentation. Either one alone would
be enough; keeping both makes the intent obvious at every call site.

## "Add a member, but only if not already on the team"

From `team.repository.ts`:

```sql
INSERT INTO team_members (
  team_members_id, team_id, user_id, role, invited_at, joined_at
) VALUES (
  $1, $2, $3, $4, $5, $6
)
ON CONFLICT (team_id, user_id) DO NOTHING
RETURNING *
```

The `(team_id, user_id)` unique constraint defined in
[`0005_create-team-members.sql`](../../migrations/0005_create-team-members.sql)
is what `ON CONFLICT` keys on. `DO NOTHING + RETURNING *` returns the
inserted row on success and zero rows on conflict, which the service
layer reads as "already a member".

This is preferable to a `SELECT ... INSERT` pair: the unique
constraint and `ON CONFLICT` resolve the race on the database side,
whereas the read-then-write version races against concurrent invites
to the same user.

## Audited writes

Every write whose audit trigger needs an actor goes through
[`withAuditedTransaction`](../../src/utils/transaction.ts), which
acquires a pooled client, opens a transaction, emits

```sql
SELECT set_config('app.current_user_id', $1, true)
```

and then runs the caller's repository calls against that client. The
third argument `is_local = true` scopes the setting to the current
transaction, so the actor cannot leak out to the next user of the
pooled connection.

`set_config(...)` is used in place of `SET LOCAL app.current_user_id
= $1` because `SET` does not accept query parameters, only literal
SQL tokens. `set_config` does, which lets us bind the user_id
safely without string interpolation.

In the services layer the pattern looks like:

```ts
return withAuditedTransaction(actingUserId, async (db) => {
  const task = (await taskRepository.selectTask({ task_id }, 1, 1, db)).data[0];
  if (!task) throw new NotFoundError('Task');
  ...
  return commentRepository.insertComment(comment, db);
});
```

Two things are worth noting:

- Every repository call inside the callback takes `db` (the
  transaction client) as its last argument. Mixing in a
  `pool.query(...)` call would break both atomicity (it would run
  on a different connection that has not BEGUN) and audit
  attribution (the `set_config` is transaction-local).
- The repository functions accept `db: Executor = pool` precisely
  so the same function can be used inside a transaction or
  standalone. `Executor = Pool | PoolClient` is exported from
  [`src/db/index.ts`](../../src/db/index.ts).

Audited write paths today: `createTask`, `updateTask`,
`createComment`, `addTagToTask`, `removeTagFromTask`. Together they
cover every audit trigger fired by application writes (the triggers
in [`0012_create-audit-triggers.sql`](../../migrations/0012_create-audit-triggers.sql)).

The integration tests in
[`tests/audit.test.ts`](../../tests/audit.test.ts) and
[`tests/audit-comments-tags.test.ts`](../../tests/audit-comments-tags.test.ts)
exercise the contract end to end against a real Postgres.
