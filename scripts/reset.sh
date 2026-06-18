#!/usr/bin/env bash
# One-command reset between (or during) rounds:
#   - wipe posts / comments / reports / deface banner / scores
#   - keep identities + runtime rows
#   - recreate the worker container fresh
# Instructor-only; run from the host between or during rounds.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "[reset] flushing feed + reseeding..."
docker compose exec -T backend python manage.py seed_ctf --flush

echo "[reset] recreating worker..."
docker compose up -d --force-recreate --no-deps render-worker

echo "[reset] done. (seed_ctf --flush already cleared the leaderboard solves.)"
