#!/usr/bin/env bash
# Runs the AI smoke test in demo mode (no API calls). For the real API: DEMO_MODE=false bash scripts/ai-smoke.sh
set -euo pipefail
cd "$(dirname "$0")/.."
DEMO_MODE="${DEMO_MODE:-true}" node --env-file-if-exists=.env --import tsx scripts/ai-smoke.ts
