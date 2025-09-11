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
- bcrypt

## example cURL
```bash
# make user
curl -s -X POST http://localhost:3000/users \
  -H 'Content-Type: application/json' \
  -d '{"username":"Ada Lovelace","email":"ada@example.com", "role": "user","password":"meow"}' | jq

# all users
curl -s 'http://localhost:3000/users/' | jq

# search by name
curl -s 'http://localhost:3000/users?name=ada' | jq

# get by id
curl -s http://localhost:3000/users/1 | jq

# delete user
curl -X DELETE http://localhost:3000/users/1
```

### Notes
- Default port: `3000` (use `PORT` to change it).
- Using `npm run ...`
