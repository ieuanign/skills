#!/usr/bin/env bash
#
# PROTOTYPE — scenario fixture for PR #167. Throwaway; do not merge.
#
# Every local branch, most recently committed first.

set -euo pipefail

# Assigned first rather than `cd "$(...)"`: bash returns 0 for `cd ""`, so a
# failed rev-parse would sail past set -e and report the caller's branches.
root=$(git rev-parse --show-toplevel)
cd "$root"

git for-each-ref --sort=-committerdate \
  --format='%(refname:short)|%(committerdate:short)|%(authorname)' refs/heads
