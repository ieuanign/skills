#!/usr/bin/env bash
#
# /dev-loop's stack linker. Records a finished batch's pull requests as a stack on GitHub.
#
#   stack-link.sh <pr-number> <pr-number> [<pr-number>...]     # bottom to top
#
# acts/gate-2.md's "Stack linking" step specifies its behaviour; this is only the
# implementation. Run it ONCE per batch, after every sub-lane has pushed and opened its pull
# request — never per layer, because a half-linked stack shows a reviewer a chain that stops
# short of the work.
#
# It prints ONE machine-readable line on standard output and nothing else:
#
#   STACK: linked - <the tool's own summary of what it recorded>
#   STACK: skipped - <why>          nothing was attempted; today's behaviour stands
#   STACK: failed - <why>           attempted and refused; every pull request is untouched
#
# The linked line relays gh's summary rather than composing one. See the note at the call site:
# this script cannot tell a pull request number from a stack number, so a count of its own
# arguments would be a claim it has not earned.
#
# Exit 0 for linked and skipped, 1 for failed. THE CALLER MUST NOT TREAT A FAILURE AS FATAL:
# the stack is a bonus, and losing it never costs the run the work it just pushed. The exit code
# exists so the caller can tell "refused" from "not applicable" without parsing prose; what to do
# about either is the contract's, and the answer is "report it and carry on".
#
# Four properties look like details and are not. Each is load-bearing:
#
# 1. ARGUMENTS ARE PR NUMBERS, NEVER BRANCH NAMES, and non-numeric input is refused here rather
#    than passed through. `gh stack link` accepts both: given a branch it PUSHES it and opens a
#    pull request of its own, with its own title and body. That would overwrite what the run
#    just authored -- the Closes line, the plan's summary bullets, the findings ledger. The
#    numeric guard below is what keeps this command additive.
#
# 2. `--open` IS NEVER PASSED. It marks the stack's pull requests ready for review, and
#    draft-versus-ready is decided per sub-lane by the terminal-state table. A batch-wide flag
#    here would override every one of those decisions from the wrong place.
#
# 3. A MISSING EXTENSION IS A SILENT NO-OP, not an error and not a prompt. The skill must stay
#    copyable to any machine, so no gate checks for the extension and no run fails for want of
#    it. `gh stack --help` is the probe: it exits 0 when installed and 1 when not, needs no
#    authentication and makes no network call. `gh extension list` cannot be used -- it exits 0
#    either way, so it would have to be grepped, and its output is version-dependent.
#
# 4. NO `--base` IS PASSED. It defaults to the repository's default branch, which is this
#    pipeline's trunk by construction: layer 1 is always based on origin/<DEFAULT>. Passing one
#    would mean deriving the default branch here, and this script would stop being a thing you
#    can hand a list of numbers.
#
# `gh stack link` writes no local tracking state and changes no branch, which is what makes it
# safe while lane worktrees still hold those branches checked out. Do not swap it for `submit`,
# `init`, or `add`: all three keep state under the common git directory that every linked
# worktree shares, so concurrent lanes would race over the same files.

# No `-e`, deliberately, where notify.sh has it: every command below is already the condition of
# an `if` or a `case`, and the two failures that matter -- the absent extension and a refused link
# -- are outcomes this script reports rather than errors it dies of. Under `-e` the probe would
# terminate the script before it could print the `skipped` line the caller reads.
set -uo pipefail

# Fewer than two pull requests is not a chain, so nothing is attempted -- not even the probe.
# The common case is a single-lane batch, and it must pay nothing for a feature it cannot use.
if [ "$#" -lt 2 ]; then
  echo "STACK: skipped - fewer than two pull requests ($# given); a stack needs at least two"
  exit 0
fi

for arg in "$@"; do
  case "$arg" in
    ''|*[!0-9]*)
      # Refused rather than forwarded. See note 1: a branch name here would have the tool open
      # pull requests of its own over the ones the run authored.
      #
      # Flattened like the failure below: the caller parses ONE line, and a rejected argument is
      # by definition not a number -- so it can perfectly well contain the newline that would
      # turn this single result into what reads as two.
      printf 'STACK: failed - %s\n' "$(printf '%s' "'$arg' is not a pull request number; this command takes numbers only, never branch names" | tr '\n' ' ')"
      exit 1
      ;;
  esac
done

if ! gh stack --help >/dev/null 2>&1; then
  echo "STACK: skipped - the gh-stack extension is not installed; the batch keeps its branch-name base chaining"
  exit 0
fi

# stdin closed: an unattended run has no terminal, and a command that decided to ask something
# would hang the run rather than fail it.
#
# BOTH streams are captured, not stderr alone. gh-stack writes its progress and its errors to
# stderr and nothing at all to stdout today -- but a version that reported a failure on stdout
# would leave `out` empty, and this script would print a bare `STACK: failed - ` for a failure
# whose cause it had been handed. Keeping both costs nothing and removes the case where the
# message goes missing.
if out="$(gh stack link "$@" </dev/null 2>&1)"; then
  # THE TOOL'S OWN SUMMARY, not a count composed here. This script cannot know what its
  # arguments were: `gh stack link` also accepts a STACK number as the first argument, as a
  # shortcut for appending to an existing stack, and a stack number is numeric so it passes the
  # guard above indistinguishably from a pull request number. Composing `linked $# pull requests
  # ($*)` therefore published a falsehood on that path -- it reported a stack number as though it
  # were a pull request, which is the one thing the POC in #48 recorded as never safe to write,
  # since `#<stack>` renders as a broken reference to a pull request that does not exist.
  #
  # Appending to an existing stack is out of this pipeline's contract anyway -- it links each
  # chain once, at the end of a batch -- but the script cannot detect the form without an extra
  # API call per argument, so it stops claiming what it cannot verify. gh already says exactly
  # what happened ("Created stack with 4 PRs (stack #84)", "Stack #84 is already up to date"),
  # and relaying it is the same rule the failure path below already follows.
  summary="$(printf '%s' "$out" | grep '✓' | tail -n 1)"
  # Fall back to the last non-empty line, then to everything: a future version that drops the
  # tick, or a locale that mangles it, must still report something true rather than nothing.
  [ -n "$summary" ] || summary="$(printf '%s' "$out" | grep -v '^[[:space:]]*$' | tail -n 1)"
  [ -n "$summary" ] || summary="$out"
  printf 'STACK: linked - %s\n' "$(printf '%s' "$summary" | tr '\n' ' ')"
  exit 0
fi

# Reported verbatim and never retried. Every failure mode the tool has -- no stacks feature on
# the repository, bad credentials, an unresolvable number, no network -- exits non-zero with the
# cause in this message, and none of them edits a pull request on the way out. The message is the
# only thing that tells them apart, so it is relayed rather than summarised.
printf 'STACK: failed - %s\n' "$(printf '%s' "$out" | tr '\n' ' ')"
exit 1
