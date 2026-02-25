#!/usr/bin/env bash
set -euo pipefail

SOURCE_DIR="${1:-../notes-content}"
TARGET_DIR="content"
SYNC_INTERVAL="${SYNC_INTERVAL:-1}"
SYNC_IGNORE_FILE="${SOURCE_DIR}/.quartz-syncignore"

if ! command -v rsync >/dev/null 2>&1; then
  echo "Error: rsync is required but not found."
  exit 1
fi

if [ ! -d "$SOURCE_DIR" ]; then
  echo "Error: source directory '$SOURCE_DIR' not found."
  exit 1
fi

sync_once() {
  EXCLUDE_FROM_ARGS=()
  if [ -f "${SYNC_IGNORE_FILE}" ]; then
    EXCLUDE_FROM_ARGS=(--exclude-from "${SYNC_IGNORE_FILE}")
  fi

  rsync -a --delete \
    --exclude ".git/" \
    --exclude ".gitignore" \
    --exclude ".obsidian/" \
    --exclude ".github/" \
    --exclude ".quartz-syncignore" \
    --exclude ".DS_Store" \
    --exclude "*.base" \
    "${EXCLUDE_FROM_ARGS[@]}" \
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
