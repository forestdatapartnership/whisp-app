#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"
API_DIR="$ROOT_DIR/api"
APP_DIR="$ROOT_DIR/app"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

API_PORT="${API_PORT:-8001}"
APP_PORT="${APP_PORT:-3001}"
API_URL="http://localhost:$API_PORT/api"

PIDS=()

usage() {
    echo "Usage: $(basename "$0") [--install]"
    exit "${1:-0}"
}

cleanup() {
    for pid in "${PIDS[@]}"; do
        kill "$pid" 2>/dev/null
        wait "$pid" 2>/dev/null
    done
}
trap cleanup EXIT INT TERM

check_app_deps() { [ -d "$APP_DIR/node_modules" ]; }
check_api_deps() {
    (cd "$API_DIR" && python -c "import uvicorn, celery, prometheus_fastapi_instrumentator" 2>/dev/null)
}

for arg in "$@"; do
    case "$arg" in
        --install) INSTALL=1 ;;
        -h|--help) usage ;;
        *) echo "Unknown option: $arg"; usage 1 ;;
    esac
done

if [ "${INSTALL:-0}" = "1" ]; then
    bash "$SCRIPT_DIR/setup.sh"
elif ! check_app_deps || ! check_api_deps; then
    fail "missing dependencies — run: bash scripts/dev/linux/setup.sh"
fi

ENV_LOCAL="$APP_DIR/.env.local"
if [ -f "$ENV_LOCAL" ] && grep -q "^API_URL=" "$ENV_LOCAL"; then
    sed -i "s|^API_URL=.*|API_URL=$API_URL|" "$ENV_LOCAL"
else
    echo "API_URL=$API_URL" >> "$ENV_LOCAL"
fi

bash "$SCRIPT_DIR/api-start.sh" &
API_SUPERVISOR=$!
PIDS+=($API_SUPERVISOR)
wait_for_http_while_alive "$API_URL/health" "$API_SUPERVISOR" 90

ensure_node_installed
use_linux_node
(cd "$APP_DIR" && npm run dev -- --port "$APP_PORT") &
PIDS+=($!)
wait_for_http "http://localhost:$APP_PORT" 120

echo "API: $API_URL  App: http://localhost:$APP_PORT"
watch_pids "${PIDS[@]}"
