#!/usr/bin/env bash
# Back up the SQLite database out of the Docker volume into ./backups with a timestamp; keep the newest 14.
#   bash scripts/docker-backup.sh                    → backups/teachback-YYYY-MM-DD_HHMMSS.db
#   BACKUP_DIR=/srv/backups/teachback KEEP=30 bash scripts/docker-backup.sh
# Needs the container running. Daily cron (DEPLOY.md):
#   15 3 * * * cd /srv/teachback && bash scripts/docker-backup.sh >> backups/backup.log 2>&1
set -euo pipefail
cd "$(dirname "$0")/.."
SERVICE="${SERVICE:-teachback}"
DIR="${BACKUP_DIR:-backups}"
KEEP="${KEEP:-14}"
DB=/app/data/teachback.db
SNAP=/app/data/.backup-snapshot.db

mkdir -p "$DIR"
out="$DIR/teachback-$(date +%Y-%m-%d_%H%M%S).db"

# 1. Consistent snapshot inside the container (sqlite3 .backup is safe while the app writes).
docker compose exec -T "$SERVICE" sh -c "test -f $DB || { echo 'no database at $DB yet' >&2; exit 3; }; rm -f $SNAP; sqlite3 $DB \".backup '$SNAP'\""
# 2. Copy it out of the volume, 3. remove the snapshot inside.
docker compose cp "$SERVICE:$SNAP" "$out"
docker compose exec -T "$SERVICE" rm -f "$SNAP"
echo "$(date '+%F %T') backed up $SERVICE:$DB → $out ($(du -h "$out" | cut -f1))"

# Keep the newest $KEEP backups, delete older ones.
ls -1t "$DIR"/teachback-*.db 2> /dev/null | tail -n +"$((KEEP + 1))" | while read -r old; do
  rm -f -- "$old"
  echo "$(date '+%F %T') removed old backup $old"
done
