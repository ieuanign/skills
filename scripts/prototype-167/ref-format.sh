#!/usr/bin/env bash
#
# PROTOTYPE — scenario fixture for PR #167. Throwaway; do not merge.
#
# Sourced, not run: the one `git for-each-ref --format` both reports print.

REF_FORMAT='%(refname:short)|%(committerdate:short)|%(committername)'
