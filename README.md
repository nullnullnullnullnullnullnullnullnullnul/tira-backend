# Tira

**Tira** is a task management web application that provides APIs for managing users, teams, and tasks.  
It is built with Node.js, Express, and PostgreSQL, and uses TypeScript for development.

---

## Features
- User management (create, search, delete)
- Team management (create, update, add/remove members)
- Task management within teams
- RESTful API with Swagger documentation

---

## Requirements
- Node.js >= 18
- PostgreSQL >= 14

---

## Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/<your-username>/tira.git
   cd tira
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:  
   Create a `.env` file in the project root with the following keys:
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

---

## Dependencies

### Runtime
- express
- pg
- dotenv
- cors
- ulid
- swagger-ui-express

### Development
- typescript
- ts-node
- ts-node-dev
- @types/node
- @types/express
- jest
- ts-jest
- @types/jest
- @types/swagger-ui-express
- cross-env
- swagger-js-doc

---

## Running the Project
Start the development server:
```bash
npm run dev
```

Build and run in production:
```bash
npm run build
npm start
```

---

## Database Setup
Run migrations or load schema into PostgreSQL:
```bash
psql -h 127.0.0.1 -p 5432 -U <user> -d <db_name> -f <schema_file>.sql
```

---

## Example API Usage

### Users
```bash
# Create a user, role must be "user" or "leader"
curl -s -X POST http://localhost:3000/users   -H 'Content-Type: application/json'   -d '{"username":"","email":"","role":"","password":""}' | jq

# Get all users
curl -s http://localhost:3000/users | jq

# Search by name
curl -s http://localhost:3000/users?name=<username> | jq

# Get by ID
curl -s http://localhost:3000/users/<id> | jq

# Delete user
curl -X DELETE http://localhost:3000/users/<id>
```

### Teams
```bash
# Create a team
curl -s -X POST http://localhost:3000/teams   -H 'Content-Type: application/json'   -d '{"owner_id":"<user_id>","name":"<team_name>"}' | jq

# Get all teams for a user
curl -s http://localhost:3000/teams/user/<user_id> | jq

# Get team details (with members)
curl -s http://localhost:3000/teams/<team_id>/details/<user_id> | jq

# Update team name
curl -s -X PATCH http://localhost:3000/teams/<team_id>   -H 'Content-Type: application/json'   -d '{"name":"New Team Name","user_id":"<user_id>"}' | jq

# Add a user to a team
curl -s -X POST http://localhost:3000/teams/<team_id>/members   -H 'Content-Type: application/json'   -d '{"userToAddId":"<user_id_to_add>","requestingUserId":"<owner_user_id>","role":"user"}' | jq

# Remove a user from a team
curl -s -X DELETE http://localhost:3000/teams/<team_id>/members/<user_id>?performed_by=<owner_user_id> | jq

# Get team members
curl -s http://localhost:3000/teams/<team_id>/members?user_id=<requesting_user_id> | jq

# Get team tasks
curl -s http://localhost:3000/teams/<team_id>/tasks?user_id=<requesting_user_id> | jq
```

---

## Notes
- Default port: **3000** (can be changed via `PORT` in `.env`).
- Use `npm run <script>` for available commands.
- API documentation available at:  
  ```
  http://localhost:3000/api-docs
  ```

---

## Roadmap / TODO
- Make history table on database
- Implementing history table GET, DELETE routes
- Add authentication & authorization
- Add integration tests
