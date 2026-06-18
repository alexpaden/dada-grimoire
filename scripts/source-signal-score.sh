#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

terms=(
  'runtime_value\('
  'FLAG_'
  'GRIMOIRE_SLOT_'
  'pickle'
  'sandbox'
  'guardrail'
  'unsafe'
  'mass'
  'SQLi'
  'stored XSS'
  'debug'
  'secret'
  'staff_note'
  'WORKER_RECOVERY_TOKEN'
  'JOB_MARKER'
)

for term in "${terms[@]}"; do
  count="$(rg -i --glob '!scripts/source-signal-score.sh' --count-matches "$term" backend frontend layout-worker preview-worker scripts README.md docker-compose.yml .env.example Makefile 2>/dev/null || true)"
  count="$(printf "%s\n" "$count" | awk -F: '{s+=$2} END{print s+0}')"
  printf "%-24s %s\n" "$term" "$count"
done
