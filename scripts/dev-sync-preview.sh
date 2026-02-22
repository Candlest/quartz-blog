#!/usr/bin/env bash
set -euo pipefail

SOURCE_DIR="${1:-../notes-content}"
TARGET_DIR="content"
SYNC_INTERVAL="${SYNC_INTERVAL:-1}"

if ! command -v rsync >/dev/null 2>&1; then
  echo "Error: rsync is required but not found."
  exit 1
fi

if [ ! -d "$SOURCE_DIR" ]; then
  echo "Error: source directory '$SOURCE_DIR' not found."
  exit 1
fi

sync_once() {
  rsync -a --delete \
    --exclude ".git/" \
    --exclude ".obsidian/" \
    --exclude ".github/" \
    --exclude ".DS_Store" \
    --exclude "个人/" \
    "${SOURCE_DIR}/" "${TARGET_DIR}/"
}

echo "[dev-sync] syncing from '${SOURCE_DIR}' to '${TARGET_DIR}'"
sync_once

(
  while true; do
    sleep "${SYNC_INTERVAL}"
    sync_once
  done
) &
SYNC_PID=$!

cleanup() {
  if kill -0 "$SYNC_PID" >/dev/null 2>&1; then
    kill "$SYNC_PID"
  fi
}
trap cleanup EXIT INT TERM

pnpm quartz build --serve --watch
