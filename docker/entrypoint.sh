#!/bin/sh
# Container start: apply migrations, then run the app. Never seeds or resets
# (demo data: `docker compose exec teachback npm run demo:reset`).
# With arguments it runs those instead, without migrating, e.g.
#   docker compose run --rm --no-deps teachback sh
set -e
cd "$(dirname "$0")/.."

if [ "$#" -gt 0 ]; then
  exec "$@"
fi

echo "[entrypoint] applying database migrations (${DATABASE_URL})"
node_modules/.bin/prisma migrate deploy

echo "[entrypoint] starting Teachback on ${HOSTNAME:-0.0.0.0}:${PORT:-3000}"
exec node_modules/.bin/next start -H "${HOSTNAME:-0.0.0.0}" -p "${PORT:-3000}"
