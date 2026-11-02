#!/usr/bin/env bash
# Copy the SQLite database to backups/ with a timestamp and keep the newest 14 copies.
#   bash scripts/backup-db.sh                       # prisma/dev.db → backups/dev-YYYY-MM-DD_HHMMSS.db
#   DB_FILE=prisma/other.db BACKUP_DIR=/srv/bak KEEP=30 bash scripts/backup-db.sh
# Daily cron (see DEPLOY.md):  15 3 * * * cd ~/teachback && bash scripts/backup-db.sh >> logs/backup.log 2>&1
set -euo pipefail
cd "$(dirname "$0")/.."
DB="${DB_FILE:-prisma/dev.db}"
DIR="${BACKUP_DIR:-backups}"
KEEP="${KEEP:-14}"

if [ ! -f "$DB" ]; then
  echo "$(date '+%F %T') no database at $DB, nothing to back up"
  exit 0
fi
mkdir -p "$DIR"
name="$(basename "$DB" .db)"
out="$DIR/$name-$(date +%Y-%m-%d_%H%M%S).db"

# sqlite3's .backup is safe while the app is writing; a plain copy is the fallback.
if command -v sqlite3 > /dev/null 2>&1; then
  sqlite3 "$DB" ".backup '$out'"
else
  cp "$DB" "$out"
fi
echo "$(date '+%F %T') backed up $DB → $out ($(du -h "$out" | cut -f1))"

# Keep the newest $KEEP backups of this database, delete older ones.
ls -1t "$DIR/$name"-*.db 2> /dev/null | tail -n +"$((KEEP + 1))" | while read -r old; do
  rm -f -- "$old"
  echo "$(date '+%F %T') removed old backup $old"
done
