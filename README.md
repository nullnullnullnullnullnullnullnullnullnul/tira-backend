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
## PostgreSQL
```
psql -h 127.0.0.1 -p 5432 -U <user> -d <db_name> -f [OPTIONAL] <filename>
```

## Notes
- Default port: `3000` (use `PORT` to change it).
- Using `npm run ...`
