#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"
API_DIR="$ROOT_DIR/api"
APP_DIR="$ROOT_DIR/app"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

echo ""
echo "=== Installing dev dependencies ==="

ensure_node_installed

echo "App (npm)..."
(cd "$APP_DIR" && npm install)

echo "API (pip editable)..."
(cd "$API_DIR" && pip install -e .)

echo ""
echo "Done. Run scripts/dev/linux/start.sh to start the dev stack."
