#!/usr/bin/env bash
#
# PROTOTYPE — scenario fixture for PR #167. Throwaway; do not merge.
#
# One tag per line, newest first, with the date it points at.
# Pass a count to cap the output; the default is every tag.

set -euo pipefail

limit="${1:-0}"

cd "$(git rev-parse --show-toplevel)"

if [ "$limit" -gt 0 ]; then
  git for-each-ref --sort=-creatordate \
    --format='%(refname:short) %(creatordate:short)' refs/tags | head -n "$limit"
else
  git for-each-ref --sort=-creatordate \
    --format='%(refname:short) %(creatordate:short)' refs/tags
fi
