#!/usr/bin/env bash
# Restore a backup into the Docker volume, then start the app again.
#   bash scripts/docker-restore.sh backups/teachback-2026-11-04_031500.db
# Stops the container, copies the file in as the container's own user (uid 1000), restarts.
# The current database is kept next to it as teachback.db.before-restore.
set -euo pipefail
cd "$(dirname "$0")/.."
SERVICE="${SERVICE:-teachback}"
src="${1:?usage: bash scripts/docker-restore.sh backups/teachback-<stamp>.db}"
[ -f "$src" ] || { echo "No such file: $src" >&2; exit 1; }
dir="$(cd "$(dirname "$src")" && pwd)"
file="$(basename "$src")"

docker compose stop "$SERVICE"
# Runs a one-off container with the same volume; arguments skip the entrypoint's migrate + start.
docker compose run --rm --no-deps -v "$dir:/restore:ro" "$SERVICE" sh -c \
  "if [ -f /app/data/teachback.db ]; then cp /app/data/teachback.db /app/data/teachback.db.before-restore; fi && cp /restore/$file /app/data/teachback.db && rm -f /app/data/teachback.db-journal && echo restored $file"
docker compose up -d "$SERVICE"
echo "Restored $src. Migrations run on start; check: docker compose ps (healthy) and curl -s http://127.0.0.1:3001/api/health"
