#!/usr/bin/env bash
# Update the server to the latest commit: backup → pull → install → migrate → build → restart → health check.
# Never seeds or resets the database (that's `npm run demo:reset`, by hand, only before a demo).
#   cd ~/teachback && bash scripts/deploy.sh
set -euo pipefail
cd "$(dirname "$0")/.."
PORT="${PORT:-3000}"
step() { echo; echo "==> $*"; }

step "Backing up the database"
bash scripts/backup-db.sh

step "Pulling the latest code"
git pull --ff-only

step "Installing dependencies"
npm ci

step "Applying database migrations (no seed, no reset)"
npm run db:deploy

step "Building"
npm run build

step "Restarting with PM2"
mkdir -p logs
pm2 startOrRestart ecosystem.config.js --update-env
pm2 save

step "Health check"
for _ in $(seq 1 30); do
  if body=$(curl -fsS "http://127.0.0.1:$PORT/api/health" 2> /dev/null); then
    echo "$body"
    echo "Deployed $(git rev-parse --short HEAD)."
    exit 0
  fi
  sleep 1
done
echo "The app didn't answer /api/health within 30 s. Check: pm2 logs teachback --lines 50" >&2
exit 1
