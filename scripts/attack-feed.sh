#!/usr/bin/env bash
# Color-coded live activity feed for the instructor's 2nd screen.
#   green bg = worker marker observed
#   red      = server error
#   yellow   = admin-role request
#   magenta  = operator tooling / worker activity
#   cyan     = reports
set -euo pipefail
cd "$(dirname "$0")/.."

RED=$'\033[31m'; YEL=$'\033[33m'; MAG=$'\033[35m'; CYN=$'\033[36m'; DIM=$'\033[2m'; RST=$'\033[0m'
WIN=$'\033[1;30;42m'   # bold black on green — the money line

# Tail the backend and worker together.
docker compose logs -f backend render-worker 2>&1 | while IFS= read -r line; do
  case "$line" in
    *MARKER\ OBSERVED*)               echo "${WIN}${line}${RST}" ;;
    *" 5"[0-9][0-9]" "*)              echo "${RED}${line}${RST}" ;;
    *role=admin*)                     echo "${YEL}${line}${RST}" ;;
    */api/me/preset*|*/api/admin/deface*|*\[worker\]*) echo "${MAG}${line}${RST}" ;;
    */report*|*/api/reports*)         echo "${CYN}${line}${RST}" ;;
    *)                                echo "${DIM}${line}${RST}" ;;
  esac
done
