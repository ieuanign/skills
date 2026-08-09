#!/usr/bin/env bash
set -euo pipefail

# What .scratch/ is holding, so stale working material is visible rather than
# guessed at.

REPO="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO"

for dir in .scratch/*/; do
  [ -d "$dir" ] || continue
  printf '%s\t%s\n' "$(du -sh "$dir" | cut -f1)" "${dir%/}"
done
