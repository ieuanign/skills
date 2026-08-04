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
# rejects their top-level return; only this AsyncFunction shape over the Workflow
# globals parses them. Same mechanism as the gitignored
# .scratch/dev-loop-checks/harness.mjs — the two must stay in step. Compile only:
# the function is never called, because running a phase script dispatches agents.
# Non-global by design: the host assumes one export, so /g would pass scripts it rejects.
compile='
const fs = require("node:fs")
const src = fs.readFileSync(process.argv[1], "utf8").replace(/^export const meta/m, "const meta")
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
new AsyncFunction("args", "agent", "parallel", "pipeline", "log", "budget", src)
'

while IFS= read -r script; do
  rel="${script#"$REPO/"}"
  if out="$(node -e "$compile" "$script" 2>&1)"; then
    echo "ok    syntax $rel"
  else
    echo "FAIL  syntax $rel" >&2
    echo "$out" >&2
    failed=1
  fi
done < <(find "$REPO/skills" -name 'phase-*.js' -not -path '*/node_modules/*' | sort)

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
    echo "FAIL  literal agent type in $rel — resolve it through roleAgent(); see contracts.md Roles" >&2
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
