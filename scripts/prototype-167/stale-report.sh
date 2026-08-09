#!/usr/bin/env bash
#
# PROTOTYPE — scenario fixture for PR #167. Throwaway; do not merge.
#
# Local branches with no commit in the last 90 days, oldest first.

set -euo pipefail

# Sourced by the script's own directory, not the caller's cwd, and before the cd.
. "$(dirname "${BASH_SOURCE[0]}")/ref-format.sh"

cd "$(git rev-parse --show-toplevel)"

cutoff=$(( $(date +%s) - 90 * 24 * 60 * 60 ))

git -c color.ui=false for-each-ref --sort=committerdate --format="$REF_FORMAT" refs/heads \
  | while IFS='|' read -r name day committer; do
      if [ "$(date -d "$day" +%s)" -lt "$cutoff" ]; then
        echo "$name $day $committer"
      fi
    done
