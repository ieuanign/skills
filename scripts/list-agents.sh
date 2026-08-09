#!/usr/bin/env bash
set -euo pipefail

# Prints every roster agent definition in this repo, one path per line —
# the agents/ counterpart to scripts/list-skills.sh.

REPO="$(cd "$(dirname "$0")/.." && pwd)"

cd "$REPO"
find agents -name '*.md' | sort
