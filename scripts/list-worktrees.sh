#!/usr/bin/env bash
set -euo pipefail

# One worktree path per line, so a maintainer can see what is attached without
# reading git's own column layout.

REPO="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO"

# --porcelain, not the column layout: its columns are whitespace-separated, so a
# path containing a space comes back truncated.
git worktree list --porcelain | sed -n 's/^worktree //p'
