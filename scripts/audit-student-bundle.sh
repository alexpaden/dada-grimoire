#!/usr/bin/env bash
# Audit what the repo would actually ship to students.
#
# Scope = the git-tracked manifest (plus untracked-but-not-ignored files), i.e.
# exactly what a `git clone` / archive hands over. Instructor-only material
# (.env, ADMIN/, INSTRUCTOR.md, OUTLINE.md, generated flags) lives locally and is
# gitignored, so it must never appear in the manifest. Intentional onboarding
# files (.vscode/, .claude/readme.workflows, CURSOR_SETUP.md) are allowed.
set -euo pipefail
cd "$(dirname "$0")/.."

status=0
manifest="$(mktemp)"
trap 'rm -f "$manifest"' EXIT

git ls-files --cached --others --exclude-standard | sort > "$manifest"

echo "student bundle manifest: shipped files only"
cat "$manifest"
echo

# 1. Spoiler / junk paths must not be in the shipped manifest.
echo "checking shipped manifest for instructor-only paths..."
if grep -nE '(^|/)\.env$|(^|/)ADMIN/|(^|/)INSTRUCTOR\.md$|(^|/)OUTLINE\.md$|(^|/)flags\.generated\.json$|(^|/)__pycache__/|\.pyc$' "$manifest"; then
  echo "deny: shipped manifest includes instructor-only / junk paths"
  status=1
fi

# 2. No real secret VALUES in any shipped file (hex flags, markers, salts).
#    Public warm-up strings (flag{welcome_operator}) and REPLACE_ placeholders are fine.
echo "scanning shipped files for real secret values..."
while IFS= read -r f; do
  [ -f "$f" ] || continue
  # 48-hex = GRIMOIRE_SALT; require non-hex boundaries so image digests (64-hex
  # sha256) and lockfile hashes don't false-positive.
  if grep -InE 'flag\{[0-9a-f]{8}|marker\{[0-9a-f]|canary\{[0-9a-f]|(^|[^0-9a-f])[0-9a-f]{48}([^0-9a-f]|$)' "$f"; then
    echo "deny: real secret value in shipped file: $f"
    status=1
  fi
done < "$manifest"

if [ "$status" -eq 0 ]; then
  echo "OK: student bundle is clean."
fi
exit "$status"
