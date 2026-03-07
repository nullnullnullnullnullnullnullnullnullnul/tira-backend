# Tira

Tira is a RESTful task management API built with TypeScript, Express, and PostgreSQL. It provides endpoints for managing users, teams, tasks, tags, and comments, with built-in input validation, pagination, and interactive Swagger documentation.

## Features

- User management with role-based access (user/leader), bcrypt password hashing, and strict validation for usernames, emails, and passwords
- Team management with ownership, member roles, and member add/remove operations
- Task management with status tracking (pending, ongoing, done, canceled), priority levels (high, medium, low), deadlines, and assignee support
- Tag system scoped to teams for organizing and categorizing tasks
- Comment system for task discussions with character limits and pagination
- Pagination support across all list endpoints
- OpenAPI 3.0 specification with Swagger UI served at `/api-docs`
- Automated database setup and migration scripts
- ULID-based identifiers for all entities

## Tech Stack

- TypeScript
- Node.js >= 18
- Express 5
- PostgreSQL >= 14
- Swagger UI Express

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [PostgreSQL](https://www.postgresql.org/) >= 14

### Installation

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
DB_PASSWORD=
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=tira_db
DB_SUPERUSER=postgres
DB_SUPERPASS=
```

### Running

Development server with hot reload:

```bash
npm run dev
```

Production build:

```bash
npm run build
npm start
```

### Database Commands

| Command | Description |
|---|---|
| `npm run db:init` | Initialize the database schema and roles |
| `npm run db:start` | Start a local PostgreSQL instance |
| `npm run db:stop` | Stop the local PostgreSQL instance |

## API Overview

All endpoints return JSON. Pagination is supported via `page` and `pageSize` query parameters on list routes.

### Users `/users`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/users` | List users with optional filters (username, email, role, id) |
| POST | `/users` | Create a user |
| PATCH | `/users/:id` | Update a user (username, email, password) |
| DELETE | `/users/:id` | Delete a user |

User creation enforces the following rules:
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
| POST | `/tasks` | Create a task |
| GET | `/teams/:team_id/tasks` | Get tasks for a team |

### Tags `/tags`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/tags/teams/:team_id` | Create a tag for a team |
| GET | `/tags/teams/:team_id` | List tags for a team |
| GET | `/tags/teams/:team_id/:tag_id` | Get a specific tag |
| PATCH | `/tags/teams/:team_id/:tag_id` | Update a tag name |
| DELETE | `/tags/teams/:team_id/:tag_id` | Delete a tag |

### Comments `/comments`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/comments` | List comments with filters (task, author) |
| POST | `/comments/tasks/:task_id` | Create a comment on a task |
| PATCH | `/comments/:comment_id` | Update a comment |
| DELETE | `/comments/:comment_id` | Delete a comment |

Full API documentation is available at `http://localhost:3000/api-docs` when the server is running.

## Project Structure

```
tira-backend/
├── scripts/          # Database setup and migration scripts
├── src/              # Application source code
├── openapi.yaml      # OpenAPI 3.0 specification
├── package.json
└── tsconfig.json
```

## Roadmap

- Activity history table and API routes
- JWT authentication and authorization

## License

ISC
