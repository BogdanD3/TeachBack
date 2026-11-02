#!/usr/bin/env bash
# Start an isolated dev server, run one or more checks, stop the server.
#   bash scripts/e2e.sh auth.py
#   bash scripts/e2e.sh learning.py "shots.py --login /library /map" check-404.sh
# Isolation: own build dir (.next-e2e), own port (3100) and own database (prisma/e2e.db,
# freshly migrated and seeded each run) — your `npm run dev` and prisma/dev.db are untouched.
set -euo pipefail
cd "$(dirname "$0")/.."
export NEXT_TELEMETRY_DISABLED=1 PYTHONUNBUFFERED=1 SHOTS="${SHOTS:-screenshots}"
export NEXT_DIST_DIR="${NEXT_DIST_DIR:-.next-e2e}" PORT="${PORT:-3100}"
export BASE="http://localhost:$PORT" DATABASE_URL="file:./e2e.db"
mkdir -p "$SHOTS"

npx prisma migrate deploy > /dev/null 2>&1
npx prisma db seed 2>&1 | grep -E "Seeded|rror" || true

cmd=""
for s in "$@"; do
  if [[ "$s" == *.sh ]]; then step="bash scripts/$s"; else step=".venv/bin/python scripts/e2e/$s"; fi
  cmd+="${cmd:+ && }$step"
done
.venv/bin/python .claude/skills/webapp-testing/scripts/with_server.py \
  --server "npx next dev -p $PORT" --port "$PORT" --timeout 90 \
  -- bash -c "$cmd"
