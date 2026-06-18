#!/usr/bin/env bash
# Mint fresh scoring tokens + secrets into .env for a class run.
# Fresh SECRET_KEY / GRIMOIRE_SALT / KIOSK_SECRET;
# autodetect the LAN IP. Re-run before each class. The .env it writes is gitignored.
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -f .env && "${1:-}" != "--force" ]]; then
  echo ".env already exists. Re-run with --force to overwrite (this rotates all flags)." >&2
  exit 1
fi

rand() { python3 -c "import secrets;print(secrets.token_hex(${1:-16}))"; }
token() { echo "flag{$(python3 -c "import secrets;print(secrets.token_hex(10))")}"; }

# LAN IP students will connect to (macOS en0, then Linux fallback, then loopback).
HOST_IP="$(ipconfig getifaddr en0 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}' || true)"
HOST_IP="${HOST_IP:-127.0.0.1}"

cp .env.example .env

# Secrets
sed -i.bak "s|^SECRET_KEY=.*|SECRET_KEY=$(rand 32)|" .env
sed -i.bak "s|^GRIMOIRE_SALT=.*|GRIMOIRE_SALT=$(rand 24)|" .env
sed -i.bak "s|^KIOSK_SECRET=.*|KIOSK_SECRET=$(rand 12)|" .env
sed -i.bak "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$(rand 12)|" .env
sed -i.bak "s|^HOST_IP=.*|HOST_IP=${HOST_IP}|" .env

# Scoring tokens.
for V in A B C D E F G; do
  sed -i.bak "s|^GRIMOIRE_SLOT_${V}=.*|GRIMOIRE_SLOT_${V}=$(token)|" .env
done

# Worker marker used by the instructor activity feed.
sed -i.bak "s|^JOB_MARKER=.*|JOB_MARKER=marker{$(python3 -c "import secrets;print(secrets.token_hex(10))")}|" .env

rm -f .env.bak
chmod 600 .env

echo "Wrote .env"
echo "  HOST_IP = ${HOST_IP}   ->  announce  http://${HOST_IP}:3000  on the TV"
echo "  Scoring tokens rotated. Keep .env + INSTRUCTOR.md off the student-facing repo."
echo
echo "  ACTION REQUIRED: set the per-deployment policy profiles in .env"
echo "  (IDENTITY_PROFILE / TV_RENDER_PROFILE / TOKEN_PROFILE) per ADMIN/INSTRUCTOR.md."
echo "  They are intentionally blank here and not stored in the repo. 'make up' will"
echo "  refuse to start until they are set."
echo "Next:  set the profiles, then  make up"
