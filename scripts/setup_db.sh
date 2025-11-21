#!/bin/bash
set -e

DB_DIR=".postgres_data"
LOG_FILE="postgres.log"
DB_NAME="tira_db"
DB_USER="tira"
DB_PASS="tira"

# Check if initdb is available
if ! command -v initdb &> /dev/null; then
    echo "Error: initdb is not installed."
    exit 1
fi

# Initialize database cluster if it doesn't exist
if [ ! -d "$DB_DIR" ]; then
    echo "Initializing database in $DB_DIR..."
    initdb -D "$DB_DIR" --auth=trust --no-locale --encoding=UTF8
else
    echo "Database directory $DB_DIR already exists."
fi

# Start PostgreSQL
echo "Starting PostgreSQL on port 5432..."
pg_ctl -D "$DB_DIR" -l "$LOG_FILE" -o "-p 5432 -k /tmp" start || true

# Wait for it to be ready
echo "Waiting for PostgreSQL to start..."
until pg_isready -h localhost -p 5432; do
  sleep 1
done

# Create User and Database if they don't exist
# We use 'postgres' user (default superuser in local initdb) to create our app user
echo "Setting up user and database..."
# Create 'postgres' user so init.ts can use it
psql -h localhost -p 5432 -d postgres -c "CREATE ROLE postgres WITH SUPERUSER LOGIN PASSWORD 'postgres';" || echo "Role postgres already exists."

psql -h localhost -p 5432 -d postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" || echo "User $DB_USER already exists."
psql -h localhost -p 5432 -d postgres -c "ALTER USER $DB_USER WITH SUPERUSER;" # Give superuser for simplicity in dev
psql -h localhost -p 5432 -d postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" || echo "Database $DB_NAME already exists."

# Run init script
echo "Running schema initialization..."

npx ts-node src/scripts/init.ts

echo "Database setup complete!"
