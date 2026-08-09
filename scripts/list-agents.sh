#!/usr/bin/env bash
set -e

# Prints every roster agent definition in this repo, one path per line —
# the agents/ counterpart to scripts/list-skills.sh.

cd ..

find agents -name '*.md' | sort
