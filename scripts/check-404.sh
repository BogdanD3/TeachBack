#!/usr/bin/env bash
# Every not-found case must return a real HTTP 404 (BotLens counts 404s to spot scanners).
# Usage: bash scripts/check-404.sh   (expects the app on localhost:3000)
set -uo pipefail
BASE="${BASE:-http://localhost:3000}"
fail=0
check() {
  local path="$1" want="$2" cookie="${3:-}"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" ${cookie:+-H "Cookie: $cookie"} "$BASE$path")
  if [ "$code" = "$want" ]; then echo "ok   $code $path"; else echo "FAIL $code (want $want) $path"; fail=1; fi
}
check /no-such-page 404
check /library/no-such-topic 404
check /community/no-such-thread 404
check /teach/no-such-topic 404
check /report/no-such-session 404
check /lesson/no-such-gap 404
check /library/no-such-topic/learn 404
check "/library/no-such-topic/learn?depth=full" 404
check /library/photosynthesis 200
check /library/photosynthesis/learn 200
check /community 200
exit $fail
