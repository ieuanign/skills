#!/usr/bin/env bash
#
# PROTOTYPE — scenario fixture for PR #167. Throwaway; do not merge.
#
# One tag per line, newest first, with the date it points at.

set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

git for-each-ref --sort=-creatordate \
  --format='%(refname:short) %(creatordate:short)' refs/tags
