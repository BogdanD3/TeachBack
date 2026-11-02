#!/usr/bin/env bash
# Production guards, against a real `next start` of the e2e build (.next-e2e, prisma/e2e.db, port 3101):
#  1. refuses to start without DEMO_MODE, or with a SESSION_SECRET shorter than 32 chars
#  2. GET /api/health → {ok, db, ai} with no secrets
#  3. session cookie is Secure; the botlens_force test cookie is ignored
# Run after a build, e.g.:  E2E_PROD=1 bash scripts/e2e.sh check-prod.sh   (or build .next-e2e yourself first)
set -uo pipefail
cd "$(dirname "$0")/.."
export NEXT_DIST_DIR=.next-e2e DATABASE_URL="file:./e2e.db" NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
P=3101
GOOD_SECRET="check-prod-local-only-secret-0123456789"
fail=0
ok() { echo "ok   $*"; }
bad() { echo "FAIL $*"; fail=1; }

refuses() { # $1 = label, rest = env assignments
  local label="$1"; shift
  local out
  out=$(env "$@" timeout 60 npx next start -p $P 2>&1); local code=$?
  if [ $code -eq 1 ] && grep -q "\[startup\]" <<<"$out"; then ok "refuses to start: $label ($(grep -m1 '\[startup\]' <<<"$out" | cut -c1-90))"
  else bad "should refuse to start ($label), exit $code"; fi
  if grep -q "$GOOD_SECRET" <<<"$out"; then bad "startup output leaks the secret"; fi
}
refuses "DEMO_MODE unset" -u DEMO_MODE SESSION_SECRET="$GOOD_SECRET"
refuses "short SESSION_SECRET" DEMO_MODE=true SESSION_SECRET="too-short-secret"
refuses "no SESSION_SECRET" -u SESSION_SECRET DEMO_MODE=false

env DEMO_MODE=true SESSION_SECRET="$GOOD_SECRET" npx next start -p $P > "$TMPDIR/check-prod.log" 2>&1 &
pid=$!
for _ in $(seq 1 60); do curl -fs "http://localhost:$P/api/health" > /dev/null 2>&1 && break; sleep 1; done

health=$(curl -s -w " %{http_code}" "http://localhost:$P/api/health")
if [[ "$health" == '{"ok":true,"db":true,"ai":"demo"} 200' ]]; then ok "GET /api/health → $health"; else bad "health: $health"; fi
if grep -qi "gemini\|secret\|key" <<<"$health"; then bad "health leaks config"; fi

hdr=$(curl -s -D - -o /dev/null -H "Content-Type: application/json" -d '{"email":"demo@teachback.app","password":"demo1234"}' "http://localhost:$P/api/auth/login")
if grep -i "^set-cookie: tb_session=" <<<"$hdr" | grep -qi "secure"; then ok "session cookie is Secure (and $(grep -io 'httponly' <<<"$hdr" | head -1))"; else bad "session cookie not Secure"; fi

code=$(curl -s -o /dev/null -w "%{http_code}" -H "Cookie: botlens_force=block" -H "Content-Type: application/json" -d '{"email":"demo@teachback.app","password":"demo1234"}' "http://localhost:$P/api/auth/login")
if [ "$code" = "200" ]; then ok "botlens_force cookie ignored in production (login → $code, not 403)"; else bad "botlens_force cookie honoured in production ($code)"; fi

kill $pid 2> /dev/null; wait $pid 2> /dev/null
exit $fail
