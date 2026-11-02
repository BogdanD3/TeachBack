#!/usr/bin/env bash
# Start the dev server, run one or more e2e scripts, stop the server.
#   bash scripts/e2e.sh auth.py
#   bash scripts/e2e.sh "shots.py /library /map"
set -euo pipefail
cd "$(dirname "$0")/.."
export NEXT_TELEMETRY_DISABLED=1 PYTHONUNBUFFERED=1 SHOTS="${SHOTS:-screenshots}"
mkdir -p "$SHOTS"
cmd=""
for s in "$@"; do
  cmd+="${cmd:+ && }.venv/bin/python scripts/e2e/$s"
done
.venv/bin/python .claude/skills/webapp-testing/scripts/with_server.py \
  --server "npm run dev -- -p 3000" --port 3000 --timeout 90 \
  -- bash -c "$cmd"
