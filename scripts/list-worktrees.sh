#!/usr/bin/env bash

# One worktree path per line, so a maintainer can see what is attached without
# reading git's own column layout.

git worktree list | awk '{print $1}'
