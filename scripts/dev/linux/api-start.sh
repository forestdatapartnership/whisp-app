#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"
API_DIR="$ROOT_DIR/api"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

API_PORT="${API_PORT:-8001}"

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
    (cd "$API_DIR" && pip install -e .)
elif ! check_api_deps; then
    fail "missing API dependencies — run: bash scripts/dev/linux/setup.sh"
fi

redis_cli() {
    if [ -x /usr/bin/redis-cli ]; then
        /usr/bin/redis-cli "$@"
    elif command -v redis-cli >/dev/null 2>&1; then
        redis-cli "$@"
    else
        return 127
    fi
}

redis_server_cmd() {
    if [ -x /usr/bin/redis-server ]; then
        /usr/bin/redis-server "$@"
    elif command -v redis-server >/dev/null 2>&1; then
        redis-server "$@"
    else
        return 127
    fi
}

redis_ping() {
    local host="${1:-127.0.0.1}"
    local port="${2:-6379}"
    [ "$(redis_cli -h "$host" -p "$port" --connect-timeout 2 ping 2>/dev/null)" = "PONG" ]
}

redis_port_open() {
    timeout 1 bash -c "echo > /dev/tcp/$1/$2" 2>/dev/null
}

ensure_redis_installed() {
    if [ -x /usr/bin/redis-server ] || command -v redis-server >/dev/null 2>&1; then
        return 0
    fi
    if command -v apt-get >/dev/null 2>&1; then
        echo "Installing redis-server..."
        sudo DEBIAN_FRONTEND=noninteractive apt-get update -qq \
            -o APT::Update::Post-Invoke-Success::= \
            || sudo DEBIAN_FRONTEND=noninteractive apt-get update -qq
        sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq redis-server
        command -v redis-server >/dev/null 2>&1
        return $?
    fi
    return 1
}

start_redis() {
    local redis_host="127.0.0.1"
    local redis_port="${REDIS_PORT:-6379}"
    local redis_pid

    if redis_ping "$redis_host" "$redis_port"; then
        return 0
    fi

    ensure_redis_installed || fail "redis-server not available — run: sudo apt install redis-server"

    redis_server_cmd --bind "$redis_host" --port "$redis_port" --save "" --appendonly no &
    redis_pid=$!
    PIDS+=($redis_pid)

    for _ in $(seq 1 40); do
        redis_ping "$redis_host" "$redis_port" && return 0
        kill -0 "$redis_pid" 2>/dev/null || fail "redis-server exited during startup"
        redis_port_open "$redis_host" "$redis_port" && return 0
        sleep 0.25
    done
    fail "redis-server failed to start on $redis_host:$redis_port"
}

start_redis

(cd "$API_DIR" && python -m src 2>&1) &
PIDS+=($!)
wait_for_http "http://localhost:$API_PORT/health" 60

(cd "$API_DIR" && EE_HIGH_VOL=0 python -m celery -A src.worker.celery_app worker \
    -Q sync --concurrency=1 --pool=prefork --without-mingle --without-gossip --hostname sync@%h) &
SYNC_PID=$!
PIDS+=($SYNC_PID)

(cd "$API_DIR" && EE_HIGH_VOL=1 python -m celery -A src.worker.celery_app worker \
    -Q async --concurrency=1 --pool=prefork --without-mingle --without-gossip --hostname async@%h) &
ASYNC_PID=$!
PIDS+=($ASYNC_PID)

assert_pids_alive 8 "$SYNC_PID" "$ASYNC_PID"

echo "API ready: http://localhost:$API_PORT"
watch_pids "${PIDS[@]}"
