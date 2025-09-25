## Dependencies runtime
- express
- pg
- dotenv
## Dependencies dev
- typescript 
- ts-node
- @types/node
- @types/express
- jest
- ts-jest
- @types/jest
- cross-env
- ts-node-dev
- ulid

## Example cURL
### Users
```bash
# Make user
curl -s -X POST http://localhost:3000/users \
  -H 'Content-Type: application/json' \
  -d '{"username":"Ada Lovelace","email":"ada@example.com", "role": "user","password":"meow"}' | jq

# All users
curl -s 'http://localhost:3000/users/' | jq

# Search by name
curl -s 'http://localhost:3000/users?name=ada' | jq

# Get by id
curl -s http://localhost:3000/users/1 | jq

# Delete user
curl -X DELETE http://localhost:3000/users/1
```
### Teams
```bash
# Create a team
curl -s -X POST http://localhost:3000/teams \
  -H 'Content-Type: application/json' \
  -d '{"owner_id":"<user_id>","name":"<team_name>"}' | jq

# Get all teams for a user
curl -s "http://localhost:3000/teams/user/<user_id>" | jq

# Get team details (members included)
curl -s http://localhost:3000/teams/<team_id>/details/<user_id> | jq

# Update team name
curl -s -X PATCH http://localhost:3000/teams/<team_id> \
  -H 'Content-Type: application/json' \
  -d '{"name":"New Team Name","user_id":"<user_id>"}' | jq

# Add user to a team
curl -s -X POST http://localhost:3000/teams/<team_id>/members \
  -H 'Content-Type: application/json' \
  -d '{"userToAddId":"<user_id_to_add>","requestingUserId":"<owner_user_id>","role":"user"}' | jq

# Remove user from a team
curl -s -X DELETE http://localhost:3000/teams/<team_id>/members/<user_id>?performed_by=<owner_user_id> | jq

# Get team members
curl -s "http://localhost:3000/teams/<team_id>/members?user_id=<requesting_user_id>" | jq

# Get team tasks
curl -s "http://localhost:3000/teams/<team_id>/tasks?user_id=<requesting_user_id>" | jq
```
```

## PostgreSQL
```
psql -h 127.0.0.1 -p 5432 -U <user> -d <db_name> -f [OPTIONAL] <filename>
```

## Notes
- Default port: `3000` (use `PORT` to change it).
- Using `npm run ...`
