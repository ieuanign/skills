#!/usr/bin/env bash
#
# PROTOTYPE — scenario fixture for PR #167. Throwaway; do not merge.
#
# Every local branch, most recently committed first.

cd "$(git rev-parse --show-toplevel)"

git for-each-ref --sort=-committerdate \
  --format='%(refname:short)|%(committerdate:short)|%(authorname)' refs/heads
