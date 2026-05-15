#!/bin/bash
set -e

echo "Waiting for Cloud SQL Proxy..."
for i in $(seq 1 30); do
  if echo > /dev/tcp/127.0.0.1/5432 2>/dev/null; then
    echo "Proxy ready"
    break
  fi
  sleep 1
done

echo "Proxy ready, running migration..."
exec node migrate.js