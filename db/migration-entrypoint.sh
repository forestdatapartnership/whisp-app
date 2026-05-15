#!/bin/bash
set -e

cleanup() {
  kill 1 2>/dev/null || true
  exit 0
}
trap cleanup EXIT

echo "Waiting for Cloud SQL Proxy..."
for i in $(seq 1 30); do
  if echo > /dev/tcp/127.0.0.1/5432 2>/dev/null; then
    echo "Proxy ready"
    break
  fi
  sleep 1
done

node migrate.js
kill 1
