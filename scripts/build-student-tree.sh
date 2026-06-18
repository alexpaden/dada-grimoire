#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

out_dir="${1:-student-bundle}"
root="$out_dir/grimoire-student-src"
tarball="$out_dir/grimoire-student-src.tar.gz"

rm -rf "$root"
mkdir -p "$root"

git ls-files --cached --others --exclude-standard | sort | while IFS= read -r file; do
  [ -e "$file" ] || continue
  case "$file" in
    ADMIN/*|OUTLINE.md|INSTRUCTOR.md|.claude/*|.vscode/*|CURSOR_SETUP.md|seed/flags.generated.json)
      echo "deny tracked instructor path: $file" >&2
      exit 1
      ;;
  esac
  mkdir -p "$root/$(dirname "$file")"
  cp "$file" "$root/$file"
done

if find "$root" -name '__pycache__' -o -name '*.pyc' | grep -q .; then
  echo "deny bytecode in export" >&2
  exit 1
fi

tar -C "$out_dir" -czf "$tarball" grimoire-student-src
echo "wrote $tarball"
