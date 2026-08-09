#!/usr/bin/env bash
#
# PROTOTYPE — scenario fixture for PR #167. Throwaway; do not merge.
#
# Local branches with no commit in the last 90 days, oldest first.

set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

cutoff=$(( $(date +%s) - 90 * 24 * 60 * 60 ))

git -c color.ui=false for-each-ref --sort=committerdate \
  --format='%(refname:short)|%(committerdate:short)|%(authorname)' refs/heads \
  | while IFS='|' read -r name day author; do
      if [ "$(date -d "$day" +%s)" -lt "$cutoff" ]; then
        echo "$name $day $author"
      fi
    done
