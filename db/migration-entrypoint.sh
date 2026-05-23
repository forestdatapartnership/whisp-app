#!/bin/bash
set -e

DB_HOST="${DB_HOST:-cloud-sql-proxy}"
DB_PORT="${DB_PORT:-5432}"

echo "Waiting for database at ${DB_HOST}:${DB_PORT}..."
ready=false
for i in $(seq 1 30); do
  if echo > "/dev/tcp/${DB_HOST}/${DB_PORT}" 2>/dev/null; then
    ready=true
    break
  fi
  sleep 1
done

if [ "$ready" != true ]; then
  echo "Database not reachable at ${DB_HOST}:${DB_PORT} after 30s"
  exit 1
fi

echo "Database ready, running migration..."
exec node migrate.js
