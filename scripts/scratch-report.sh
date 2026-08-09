#!/usr/bin/env bash
set -euo pipefail

# What .scratch/ is holding, so stale working material is visible rather than
# guessed at.

REPO="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO"

for d in .scratch/*/; do
  [ -d "$d" ] || continue
  printf '%s\t%s\n' "$(du -sh "$d" | cut -f1)" "${d%/}"
done
