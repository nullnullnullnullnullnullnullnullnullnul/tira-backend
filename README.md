# Tira

[![ci](https://github.com/nullnullnullnullnullnullnullnullnullnul/tira-backend/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/nullnullnullnullnullnullnullnullnullnul/tira-backend/actions/workflows/ci.yml)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![node: 20.x](https://img.shields.io/badge/node-20.x-339933.svg)](https://nodejs.org/)
[![postgres: 17](https://img.shields.io/badge/postgres-17-336791.svg)](https://www.postgresql.org/)

Tira is a RESTful task management API written in TypeScript on top of
Express and PostgreSQL. The codebase is intentionally ORM-less: every
query is plain parameterised SQL, the schema is versioned with
`node-pg-migrate` in SQL-file mode, and an append-only `task_history`
table fed by Postgres triggers records who changed what and when.

The project is primarily a portfolio piece for DBA / data-analyst work,
so the database side (migrations, triggers, transactional audit, SQL
linting, integration tests against a real Postgres) is treated as the
main artefact rather than a backdrop.

## Status

| Area | State |
|---|---|
| Users / Teams / Tasks / Tags / Comments CRUD | implemented |
| Versioned schema (15 SQL migrations) | implemented |
| Audit trail (`task_history` + triggers) | implemented |
| Transactional `changed_by` attribution via `X-User-Id` | implemented |
| Integration tests against real Postgres | implemented |
| CI: typecheck, schema apply, sqlfluff, jest | implemented |
| OpenAPI / Swagger UI at `/api-docs` | implemented |
| JWT authentication and authorization | roadmap |
| Activity history API routes | roadmap |

## Tech stack

- TypeScript, Node.js 20.x
- Express 5
- PostgreSQL 17 (older 14+ should also work; CI runs against 17)
- `node-pg-migrate` v8 (SQL-file mode)
- `pg` (no ORM)
- jest + supertest for integration tests
- sqlfluff for SQL linting (Postgres dialect)

## Layout

```
tira-backend/
  migrations/         versioned .sql migrations (NNNN_*.sql)
  scripts/            shell helpers for local DB setup
  src/                application code
    controllers/      thin HTTP layer
    services/         business logic; wraps audited writes in transactions
    repositories/     SQL queries; every fn accepts an optional pg client
    middleware/       X-User-Id parser, error handler, etc.
    utils/            withAuditedTransaction, AppError hierarchy
  tests/              jest integration tests (hit a real Postgres)
  docs/database/      schema and migration notes
  openapi.yaml        OpenAPI 3.0 specification
  .github/workflows/  CI definition
```

## Getting started

### Prerequisites

- Node.js 20.x
- PostgreSQL 17 (any 14+ should work for local dev)

### Install

```bash
git clone https://github.com/nullnullnullnullnullnullnullnullnullnul/tira-backend.git
cd tira-backend
npm install
```

### Configuration

Create a `.env` file in the project root:

```env
PORT=3000
DB_USER=tira
DB_PASS=tira
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=tira_db
DB_SUPERUSER=postgres
DB_SUPERPASS=postgres
```

### Database

| Command | Description |
|---|---|
| `npm run db:start` | Start a local PostgreSQL instance from `.postgres_data/` |
| `npm run db:stop` | Stop that local PostgreSQL instance |
| `npm run db:init` | Create role + database, then run `db:reset` |
| `npm run db:reset` | Prep, migrate, and seed the database |
| `npm run db:migrate` | Apply pending migrations (`node-pg-migrate ... up`) |
| `npm run db:migrate:down` | Roll back the most recent migration |
| `npm run db:migrate:create` | Scaffold a new migration file |
| `npm run db:seed` | Seed sample data |

See [docs/database/migrations.md](docs/database/migrations.md) for the
migration conventions (sequential `NNNN_*.sql` naming, why SQL-file mode,
audit trigger contract).

### Run

Development server (hot reload):

```bash
npm run dev
```

Production build:

```bash
npm run build
npm start
```

OpenAPI is served at `http://localhost:3000/api-docs` once the server is
up.

## Testing

Integration tests hit a real Postgres reached via the standard `DB_*`
env vars and assume the schema has already been migrated.

```bash
# One-time: start postgres and apply migrations
npm run db:init

# Run the suite
npm test
```

The CI workflow runs jest against an ephemeral `postgres:17` service
container, so any test that passes locally against the same major
version should pass on CI too.

## Conventions

- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/)
  (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `ci:`, ...). Each commit
  is meant to be bisect-safe.
- **Branches**: short prefixed names matching the change kind, e.g.
  `feat/...`, `chore/...`, `docs/...`.
- **Pull requests**: include a "Test plan" checklist in the body. Squash
  on merge if the branch is a single logical change; otherwise keep the
  individual commits.
- **Encoding**: ASCII only in source, commits, and PR text. No emoji,
  no smart quotes, no em-dashes.
- **SQL**: linted with `sqlfluff` (Postgres dialect, two-space indent,
  lower-case keywords/functions). See `.sqlfluff` at the repo root.

## API overview

All endpoints return JSON. Pagination is supported via `page` and
`pageSize` query parameters on list routes. The audited write routes
honour an `X-User-Id` header which the audit triggers read out of
`app.current_user_id` to populate `task_history.changed_by` (placeholder
until JWT auth lands).

### Users `/users`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/users` | List users with optional filters (username, email, role, id) |
| POST | `/users` | Create a user |
| PATCH | `/users/:id` | Update a user (username, email, password) |
| DELETE | `/users/:id` | Delete a user |

User creation enforces:
- Username: 3-16 characters, alphanumeric only
- Email: standard format with subdomain support
- Password: 8-16 characters, at least one uppercase, one lowercase, one digit, and one special character
- Role: `user` or `leader`

### Teams `/teams`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/teams` | Create a team |
| GET | `/teams/user/:user_id` | List teams for a user |
| PATCH | `/teams/:team_id` | Update team name |
| GET | `/teams/:team_id/members` | Get team members |
| POST | `/teams/:team_id/members` | Add a member to a team |
| DELETE | `/teams/:team_id/members/:user_id` | Remove a member from a team |

### Tasks `/tasks`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/tasks` | List tasks with filters (team, assignee, status, priority, date range) |
| POST | `/tasks` | Create a task (audited) |
| PATCH | `/tasks/:task_id` | Update a task (audited) |
| GET | `/teams/:team_id/tasks` | Get tasks for a team |

### Tags `/tags`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/tags/teams/:team_id` | Create a tag for a team |
| GET | `/tags/teams/:team_id` | List tags for a team |
| GET | `/tags/teams/:team_id/:tag_id` | Get a specific tag |
| PATCH | `/tags/teams/:team_id/:tag_id` | Update a tag name |
| DELETE | `/tags/teams/:team_id/:tag_id` | Delete a tag |
| POST | `/tags/tasks/:task_id` | Attach a tag to a task (audited) |
| DELETE | `/tags/tasks/:task_id/:tag_id` | Detach a tag from a task (audited) |

### Comments `/comments`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/comments` | List comments with filters (task, author) |
| POST | `/comments/tasks/:task_id` | Create a comment on a task (audited) |
| PATCH | `/comments/:comment_id` | Update a comment |
| DELETE | `/comments/:comment_id` | Delete a comment |

## License

[MIT](LICENSE)
