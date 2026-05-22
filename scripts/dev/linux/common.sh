#!/bin/bash

fail() {
    echo "ERROR: $*" >&2
    exit 1
}

is_windows_interop_path() {
    case "$1" in
        /mnt/c/*|/mnt/C/*) return 0 ;;
        *) return 1 ;;
    esac
}

linux_node_ready() {
    local node npm major
    node=$(command -v node 2>/dev/null || true)
    npm=$(command -v npm 2>/dev/null || true)
    [ -n "$node" ] && [ -n "$npm" ] || return 1
    is_windows_interop_path "$node" && return 1
    is_windows_interop_path "$npm" && return 1
    major=$(node -p "process.versions.node.split('.')[0]" 2>/dev/null || echo 0)
    [ "${major:-0}" -ge 18 ] 2>/dev/null
}

load_nvm() {
    export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
    if [ -s "$NVM_DIR/nvm.sh" ]; then
        # shellcheck disable=SC1091
        . "$NVM_DIR/nvm.sh"
    fi
}

prefer_linux_node_path() {
    load_nvm
    if [ -d "$NVM_DIR/versions/node" ]; then
        local active
        active=$(ls -1 "$NVM_DIR/versions/node" 2>/dev/null | sort -V | tail -1)
        if [ -n "$active" ] && [ -d "$NVM_DIR/versions/node/$active/bin" ]; then
            export PATH="$NVM_DIR/versions/node/$active/bin:/usr/local/bin:/usr/bin:/bin:${PATH}"
            return
        fi
    fi
    export PATH="/usr/local/bin:/usr/bin:/bin:${PATH}"
}

install_node_via_nvm() {
    export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
    if [ ! -s "$NVM_DIR/nvm.sh" ]; then
        echo "Installing nvm..."
        curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
    fi
    load_nvm
    type nvm >/dev/null 2>&1 || fail "nvm install failed"
    echo "Installing Node.js 22..."
    nvm install 22
    nvm alias default 22
    nvm use default
    hash -r
}

ensure_node_installed() {
    prefer_linux_node_path
    linux_node_ready && return 0
    install_node_via_nvm
    prefer_linux_node_path
    linux_node_ready || fail "Node.js install failed"
}

use_linux_node() {
    prefer_linux_node_path
    linux_node_ready || fail "Linux Node.js 18+ required — run: bash scripts/dev/linux/setup.sh"
}

wait_for_http() {
    local url=$1
    local max=${2:-60}
    for ((i = 0; i < max; i++)); do
        curl -sf "$url" >/dev/null 2>&1 && return 0
        sleep 1
    done
    fail "timed out waiting for $url"
}

wait_for_http_while_alive() {
    local url=$1
    local supervisor_pid=$2
    local max=${3:-90}
    for ((i = 0; i < max; i++)); do
        curl -sf "$url" >/dev/null 2>&1 && return 0
        kill -0 "$supervisor_pid" 2>/dev/null || fail "API stack exited during startup"
        sleep 1
    done
    fail "timed out waiting for $url"
}

assert_pids_alive() {
    sleep "${1:-5}"
    shift
    for pid in "$@"; do
        kill -0 "$pid" 2>/dev/null || fail "process exited during startup (pid $pid)"
    done
}

watch_pids() {
    while sleep 1; do
        for pid in "$@"; do
            kill -0 "$pid" 2>/dev/null || fail "process exited (pid $pid)"
        done
    done
}
