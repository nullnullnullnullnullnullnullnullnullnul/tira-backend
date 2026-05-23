#!/bin/bash
# Bootstrap a local Postgres cluster under .postgres_data/ and ensure
# the superuser exists. Intended for first-time setup on a development
# machine that has Postgres installed but no running instance.
#
# After this script finishes, the cluster is up but the application
# database is not yet initialized. Run `npm run db:reset` (which
# chains prep + migrate + seed) to bring it to a usable state.
#
# In CI we do NOT run this script: the workflow uses a Postgres
# service container instead.

set -e

DB_DIR=".postgres_data"
LOG_FILE="postgres.log"

if ! command -v initdb &> /dev/null; then
    echo "Error: initdb is not installed."
    exit 1
fi

if [ ! -d "$DB_DIR" ]; then
    echo "Initializing database cluster in $DB_DIR..."
    initdb -D "$DB_DIR" --auth=trust --no-locale --encoding=UTF8
else
    echo "Database cluster already exists in $DB_DIR"
fi

echo "Starting PostgreSQL on port 5432..."
pg_ctl -D "$DB_DIR" -l "$LOG_FILE" -o "-p 5432 -k /tmp" start || true

echo "Waiting for PostgreSQL to start..."
until pg_isready -h localhost -p 5432; do
  sleep 1
done

echo "Ensuring superuser role exists..."
psql -h localhost -p 5432 -d postgres -c \
  "CREATE ROLE postgres WITH SUPERUSER LOGIN PASSWORD 'postgres';" \
  || echo "Role postgres already exists."

echo "Cluster ready. Run 'npm run db:reset' next."
