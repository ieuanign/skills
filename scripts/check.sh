#!/usr/bin/env bash
set -euo pipefail

# Repo verification entry point (`npm run check`) for maintainers of this repo.
# Every check runs even when an earlier one fails, so one break never hides the
# rest; the script exits non-zero at the end if any check failed.

REPO="$(cd "$(dirname "$0")/.." && pwd)"

failed=0

# --- plugin manifest ---------------------------------------------------------
# Validating the marketplace transitively validates plugin.json and its skills[]
# paths. Contributors without the CLI must still get a usable run, so skip.
if command -v claude >/dev/null 2>&1; then
  if out="$(claude plugin validate "$REPO" --strict 2>&1)"; then
    echo "ok    plugin manifest"
  else
    echo "FAIL  plugin manifest" >&2
    echo "$out" >&2
    failed=1
  fi
else
  echo "skip  plugin manifest (claude not on PATH)"
fi

# --- phase-script syntax -----------------------------------------------------
# `node --check` is a silent no-op on these files and `--input-type=module`
# rejects their top-level return; only an AsyncFunction over the Workflow globals
# parses them. That shim lives in scripts/lib/phase-script.mjs and is shared with
# the state-machine harness below, which needs the identical construction and
# used to hold its own copy with only a comment asking the two to stay in step.
# Compile only: the CLI mode never calls what it built, because running a phase
# script dispatches agents.
while IFS= read -r script; do
  rel="${script#"$REPO/"}"
  if out="$(node "$REPO/scripts/lib/phase-script.mjs" "$script" 2>&1)"; then
    echo "ok    syntax $rel"
  else
    echo "FAIL  syntax $rel" >&2
    echo "$out" >&2
    failed=1
  fi
done < <(find "$REPO/skills" -name 'phase-*.js' -not -path '*/node_modules/*' | sort)

# --- dev-loop state machine --------------------------------------------------
# The syntax stage above proves phase-execute.js parses. This one proves it
# BEHAVES: the harness compiles it through the same shim, hands it a scripted
# fake agent(), and drives every loop, bound and ending with nothing dispatched.
# It prints its own ok/FAIL line per scenario, so its output is streamed rather
# than captured, and its exit code is the only thing read here.
if ! node "$REPO/scripts/state-machine.mjs"; then
  failed=1
fi

# --- shell script syntax -----------------------------------------------------
# `bash -n` parses without executing. It covers the repo's own scripts and, more
# to the point, the two the PIPELINE executes by path at runtime —
# skills/dev-loop/notify.sh and stack-link.sh. A syntax error in either used to
# surface when a lane tried to run it, mid-run, with no shell there to diagnose
# it; the phase scripts above have had this protection all along.
#
# Deliberately NOT shellcheck. It is a hard dependency nobody here has, and its
# findings on the existing scripts are unverified — a check whose result has
# never been seen can only turn this suite red for the contributor unlucky
# enough to have the tool. This IS the repo's full-suite command, and a red
# result that means nothing is worse than no result. Propose it separately, once
# the existing scripts are known clean.
#
# `git ls-files` rather than `find`: only tracked scripts are the repo's problem,
# which keeps a scratch script in a working tree from failing everyone's run.
while IFS= read -r script; do
  if out="$(bash -n "$REPO/$script" 2>&1)"; then
    echo "ok    syntax $script"
  else
    echo "FAIL  syntax $script" >&2
    echo "$out" >&2
    failed=1
  fi
done < <(git -C "$REPO" ls-files '*.sh' | sort)

# --- roster listing from any directory ---------------------------------------
# list-agents.sh runs from wherever the caller stands, so a cwd-relative repo
# root leaves it listing nothing — silently, everywhere but scripts/.
if out="$(cd / && bash "$REPO/scripts/list-agents.sh" 2>&1)" \
  && [ -n "$out" ] && ! grep -qvE '^agents/.+\.md$' <<<"$out"; then
  echo "ok    list-agents.sh from any directory"
else
  echo "FAIL  list-agents.sh from any directory: expected agents/*.md paths, got" >&2
  echo "$out" >&2
  failed=1
fi

# --- bundled script executability --------------------------------------------
# The skill invokes its bundled scripts BY PATH, so one committed 644 is
# unrunnable while `bash -n` still passes — a different failure with the same
# blast radius, and invisible to every other check here.
#
# The index is the authority, not the working tree: git records the executable
# bit and that is what a consumer's `/plugin install` checks out. A local chmod
# that was never staged is exactly the case this must still catch.
while IFS= read -r entry; do
  mode="${entry%% *}"
  path="${entry#* }"
  if [ "$mode" = "100755" ]; then
    echo "ok    executable $path"
  else
    echo "FAIL  executable $path: recorded $mode, expected 100755 — the skill runs it by path" >&2
    failed=1
  fi
done < <(git -C "$REPO" ls-files -s -- 'skills/*.sh' | awk '{print $1, $4}' | sort -k2)

# --- bundled module syntax ---------------------------------------------------
# Ordinary ESM a host runs with node, unlike the phase scripts above — so plain
# `node --check` is the right tool and the AsyncFunction shim is not.
while IFS= read -r module; do
  rel="${module#"$REPO/"}"
  if out="$(node --check "$module" 2>&1)"; then
    echo "ok    syntax $rel"
  else
    echo "FAIL  syntax $rel" >&2
    echo "$out" >&2
    failed=1
  fi
done < <(find "$REPO/skills" -name '*.mjs' -not -path '*/node_modules/*' | sort)

# --- cost stage vocabulary ---------------------------------------------------
# The lane-and-stage marker's vocabulary is written out in all three files that
# touch it, because a phase script imports nothing. That triplication is only
# safe if something compares the copies: drift silently mis-buckets the split
# the cost report exists to produce, and no run goes red over it. Each file
# declares it on one line, values quoted and keys not, so the quoted words on
# that line ARE the vocabulary.
stage_vocab() {
  grep -m1 -E '^(export )?const STAGES? = ' "$1" \
    | grep -o "'[a-z]*'" | tr -d "'" | sort | tr '\n' ' '
}
vocab_plan="$(stage_vocab "$REPO/skills/dev-loop/phase-plan.js")"
vocab_exec="$(stage_vocab "$REPO/skills/dev-loop/phase-execute.js")"
vocab_report="$(stage_vocab "$REPO/skills/dev-loop/cost-report.mjs")"
if [ -z "$vocab_plan" ]; then
  echo "FAIL  cost stage vocabulary: no declaration found in phase-plan.js" >&2
  failed=1
elif [ "$vocab_plan" = "$vocab_exec" ] && [ "$vocab_plan" = "$vocab_report" ]; then
  echo "ok    cost stage vocabulary ($vocab_plan)"
else
  echo "FAIL  cost stage vocabulary drifted" >&2
  echo "      phase-plan.js:    $vocab_plan" >&2
  echo "      phase-execute.js: $vocab_exec" >&2
  echo "      cost-report.mjs:  $vocab_report" >&2
  failed=1
fi

# --- review-loop ceiling ------------------------------------------------------
# The review loop's hard ceiling is stated twice on purpose: as prose in
# docs/dev-loop-internals.md, which is what a human reads, and as a constant in
# the phase script, which is what actually stops the loop. That is the same triplication hazard the cost
# stage vocabulary above exists for, so it gets the same treatment rather than a
# seam of its own — the harness cannot catch it, because it would only ever
# assert whichever number the script happens to hold.
#
# The prose phrase carries no markup INSIDE it, which is what makes it greppable
# while still reading as a sentence. Every occurrence is collected, not just the
# first: two prose mentions that drifted from each other is the same failure.
ceiling_const="$(grep -m1 -oE '^const REVIEW_CEILING = [0-9]+' "$REPO/skills/dev-loop/phase-execute.js" | grep -oE '[0-9]+')"
ceiling_prose="$(grep -oE 'hard ceiling of [0-9]+ fix cycles' "$REPO/docs/dev-loop-internals.md" | grep -oE '[0-9]+' | sort -u)"
if [ -z "$ceiling_const" ] || [ -z "$ceiling_prose" ]; then
  echo "FAIL  review-loop ceiling: const=${ceiling_const:-not found} prose=${ceiling_prose:-not found}" >&2
  echo "      expected 'const REVIEW_CEILING = <n>' in phase-execute.js and 'hard ceiling of <n> fix cycles' in docs/dev-loop-internals.md" >&2
  failed=1
elif [ "$ceiling_const" = "$ceiling_prose" ]; then
  echo "ok    review-loop ceiling ($ceiling_const fix cycles)"
else
  echo "FAIL  review-loop ceiling drifted" >&2
  echo "      phase-execute.js: $ceiling_const" >&2
  echo "      internals doc:    $(echo "$ceiling_prose" | tr '\n' ' ')" >&2
  failed=1
fi

# --- agent types are resolved, never literal ---------------------------------
# A phase script dispatches roster agents by name, and the SAME definition is
# registered bare when it is linked into `.claude/agents/` and namespaced
# `<plugin>:<name>` when the plugin is installed. A bare literal therefore works
# for the maintainer — who links them — and dies on the FIRST dispatch for every
# consumer, which is the supported install path. Nothing else here can see that:
# the syntax check compiles a bare literal happily, and no check runs a phase
# script, because running one dispatches agents.
#
# So the rule is structural rather than a list of names: an agent type must come
# from the script's roleAgent() resolver and never from a quoted string. Two
# shapes to catch — the option written inline (`agentType: 'reviewer'`) and the
# hoisted alias an option is built from (`const writerType = 'code-writer'`).
while IFS= read -r script; do
  rel="${script#"$REPO/"}"
  if out="$(grep -nE "agentType[[:space:]]*[:=][[:space:]]*['\"\`]|^const [A-Za-z]*[Tt]ype[[:space:]]*=[[:space:]]*['\"\`]" "$script")"; then
    echo "FAIL  literal agent type in $rel — resolve it through roleAgent(); see docs/dev-loop-internals.md Roles" >&2
    echo "$out" >&2
    failed=1
  else
    echo "ok    agent types resolved $rel"
  fi
done < <(find "$REPO/skills" -name 'phase-*.js' -not -path '*/node_modules/*' | sort)

# --- version sync ------------------------------------------------------------
# `claude plugin validate --strict` passes when these two drift apart.
pkg_version="$(node -p "require('$REPO/package.json').version" 2>/dev/null)" || pkg_version=""
plugin_version="$(node -p "require('$REPO/.claude-plugin/plugin.json').version" 2>/dev/null)" || plugin_version=""
if [ -n "$pkg_version" ] && [ "$pkg_version" = "$plugin_version" ]; then
  echo "ok    version sync ($pkg_version)"
else
  echo "FAIL  version sync: package.json=${pkg_version:-?} .claude-plugin/plugin.json=${plugin_version:-?}" >&2
  failed=1
fi

exit "$failed"
