#!/usr/bin/env bash
# Topic text must be in the server HTML (no JS needed) so scrapers can reach it — BotLens protects it.
# Usage: bash scripts/check-ssr.sh   (expects the app on $BASE, default localhost:3000)
set -uo pipefail
BASE="${BASE:-http://localhost:3000}"
html=$(curl -s "$BASE/library/photosynthesis")
for needle in "Calvin cycle" "stroma" "Where the oxygen comes from"; do
  if grep -q "$needle" <<<"$html"; then echo "ok   server HTML contains \"$needle\""; else echo "FAIL server HTML misses \"$needle\""; exit 1; fi
done
# The primer is server-rendered too (streamed after its progress screen, but in the same HTML response).
html=$(curl -s "$BASE/library/photosynthesis/learn?depth=full")
for needle in "RuBisCO" "Common mistake" "Now teach it to Pip"; do
  if grep -q "$needle" <<<"$html"; then echo "ok   primer HTML contains \"$needle\""; else echo "FAIL primer HTML misses \"$needle\""; exit 1; fi
done
