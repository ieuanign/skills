#!/usr/bin/env bash
set -euo pipefail

# One worktree path per line, so a maintainer can see what is attached without
# reading git's own column layout.

REPO="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO"

git worktree list | awk '{print $1}'
