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

# --- roster skill preloads ---------------------------------------------------
# An agent's `skills:` frontmatter preloads a skill of the declared dependency by
# `<plugin>:<skill>`. An entry that does not resolve is dropped SILENTLY: the
# agent launches without the method and returns less, which is indistinguishable
# from clean code. The manifest stage above sees none of that — `claude plugin
# validate --strict` passes on a wholly invented `<plugin>:<skill>`.
#
# `claude plugin details` reports a missing or disabled plugin on stdout, with an
# exit status that has differed between CLI versions, so the `Skills (` inventory
# line is the signal and the status is not. Every shape that does not resolve is
# a FAIL, never a skip — a silent skip is the failure this stage exists to catch.
#
# Its twin is the Act 0 intake sub-step of skills/dev-loop/SKILL.md, which checks
# these same entries against the live session; the two move together.
if command -v claude >/dev/null 2>&1; then
  preload_inventory=""
  preload_resolved=""
  preload_count=0
  preload_broken=0
  while IFS= read -r agent; do
    line="$(grep -m1 '^skills:' "$REPO/$agent")" || continue
    entries="$(printf '%s\n' "$line" | sed -nE 's/^skills:[[:space:]]*\[(.*)\][[:space:]]*$/\1/p' | tr ',' '\n')"
    if [ -z "$entries" ]; then
      echo "FAIL  roster skill preloads: $agent declares '$line', which this stage cannot read" >&2
      echo "      expected the one-line flow form: skills: [<plugin>:<skill>, ...]" >&2
      preload_broken=1
      continue
    fi
    while IFS= read -r entry; do
      entry="$(printf '%s' "$entry" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
      [ -n "$entry" ] || continue
      if ! printf '%s' "$entry" | grep -qE '^[A-Za-z0-9._-]+:[A-Za-z0-9._-]+$'; then
        echo "FAIL  roster skill preloads: $agent declares '$entry', which is not <plugin>:<skill>" >&2
        preload_broken=1
        continue
      fi
      plugin="${entry%%:*}"
      skill="${entry#*:}"
      # One details call per plugin, not per entry: it costs about three seconds,
      # against a suite that otherwise takes three in total.
      inventory="$(printf '%s\n' "$preload_inventory" | awk -F'\t' -v p="$plugin" '$1 == p {print $2; exit}')"
      if [ -z "$inventory" ]; then
        inventory="$(claude plugin details "$plugin" </dev/null 2>&1 | sed -nE 's/^[[:space:]]*Skills \([0-9]+\)[[:space:]]*//p')" || true
        preload_inventory="$preload_inventory$plugin	$inventory
"
      fi
      if [ -z "$inventory" ]; then
        echo "FAIL  roster skill preloads: $agent declares '$entry', and plugin '$plugin' lists no skills — missing, disabled, or the CLI's output moved" >&2
        preload_broken=1
      elif printf '%s' "$inventory" | tr ',' '\n' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | grep -qxF "$skill"; then
        preload_count=$((preload_count + 1))
        preload_resolved="$preload_resolved $entry"
      else
        echo "FAIL  roster skill preloads: $agent declares '$entry', and plugin '$plugin' exposes no skill '$skill'" >&2
        preload_broken=1
      fi
    done <<<"$entries"
  done < <(git -C "$REPO" ls-files 'agents/*.md' | sort)
  if [ "$preload_broken" -eq 1 ]; then
    failed=1
  elif [ "$preload_count" -eq 0 ]; then
    echo "FAIL  roster skill preloads: no agent declares a skills: entry, so nothing was resolved" >&2
    failed=1
  else
    echo "ok    roster skill preloads ($preload_count resolved:$preload_resolved)"
  fi
else
  echo "skip  roster skill preloads (claude not on PATH)"
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

# --- bundled module CLI entry through a symlink ------------------------------
# A skill invokes its bundled modules BY PATH, and on every dogfooded checkout
# that path runs through `.claude/skills/<name>`, a symlink. Node resolves a
# module's own path through symlinks when it sets import.meta.url but leaves
# argv[1] exactly as the caller typed it, so a main-module guard comparing the
# two unresolved is FALSE there and main() never runs — exit 0, no output. That
# is the worst shape a failure can take here: the caller reads a silent success
# as an empty result. read-comments.mjs printing nothing reads as a pull request
# with no unresolved comments; cost-report.mjs printing nothing reads as a run
# that cost nothing. Neither is visible to any other check — `node --check`
# compiles the broken guard happily, and nothing else runs these files.
#
# Every module with a `main` entry must therefore answer a MISSING argument with
# its usage on stderr and a non-zero exit, invoked through a symlinked parent.
# No arguments is what keeps this offline: neither module reaches the network
# before it has parsed one.
link_root="$(mktemp -d)"
ln -s "$REPO/skills" "$link_root/skills"
while IFS= read -r module; do
  rel="${module#"$REPO/"}"
  grep -q 'process.exitCode = main(' "$module" || continue
  out="$(node "$link_root/${rel}" 2>&1)" && rc=0 || rc=$?
  if [ "$rc" -ne 0 ] && [ -n "$out" ]; then
    echo "ok    cli entry via symlink $rel"
  else
    echo "FAIL  cli entry via symlink $rel: exit $rc with ${#out} bytes of output — expected a" >&2
    echo "      non-zero exit and a usage message. A main-module guard that compares" >&2
    echo "      import.meta.url to an UNRESOLVED process.argv[1] skips main() here." >&2
    failed=1
  fi
done < <(find "$REPO/skills" -name '*.mjs' -not -path '*/node_modules/*' | sort)
rm -rf "$link_root"

# --- pr-comment normaliser ---------------------------------------------------
# The syntax stage above proves read-comments.mjs parses; this one proves it
# EXCLUDES and CARRIES, over fixtures, with no network and nothing spawned.
if ! node "$REPO/scripts/pr-comment-read.mjs"; then
  failed=1
fi

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
# Each lane that runs a review loop states its hard ceiling twice on purpose: as
# prose, which is what a human reads, and as a constant in the phase script,
# which is what actually stops the loop. That is the same drift hazard the cost
# stage vocabulary above exists for, so it gets the same treatment rather than a
# seam of its own — the harness cannot catch it, because it would only ever
# assert whichever number the script happens to hold.
#
# The prose phrase carries no markup INSIDE it, which is what makes it greppable
# while still reading as a sentence. Every occurrence is collected, not just the
# first: two prose mentions that drifted from each other is the same failure.
#
# One `<phase script> <prose page>` pair per lane; a lane's prose lives with the
# lane, so a second script does not report against the first one's page.
while read -r ceiling_script ceiling_doc; do
  # `|| true` on both: pipefail turns a grep that matched nothing into a set -e
  # exit here, which would kill the run before the guard can name the empty side.
  ceiling_const="$(grep -m1 -oE '^const REVIEW_CEILING = [0-9]+' "$REPO/$ceiling_script" | grep -oE '[0-9]+' || true)"
  ceiling_prose="$(grep -oE 'hard ceiling of [0-9]+ fix cycles' "$REPO/$ceiling_doc" | grep -oE '[0-9]+' | sort -u || true)"
  if [ -z "$ceiling_const" ] || [ -z "$ceiling_prose" ]; then
    echo "FAIL  review-loop ceiling: nothing to compare" >&2
    echo "      $ceiling_script: ${ceiling_const:-no 'const REVIEW_CEILING = <n>'}" >&2
    echo "      $ceiling_doc: ${ceiling_prose:-no 'hard ceiling of <n> fix cycles'}" >&2
    failed=1
  elif [ "$ceiling_const" = "$ceiling_prose" ]; then
    echo "ok    review-loop ceiling $ceiling_script ($ceiling_const fix cycles)"
  else
    echo "FAIL  review-loop ceiling drifted" >&2
    echo "      $ceiling_script: $ceiling_const" >&2
    echo "      $ceiling_doc: $(echo "$ceiling_prose" | tr '\n' ' ')" >&2
    failed=1
  fi
done <<'CEILING_PAIRS'
skills/dev-loop/phase-execute.js docs/dev-loop-internals.md
CEILING_PAIRS

# --- profile split -----------------------------------------------------------
# Each of the three worktree keys resolves against one file with no fallback, so
# a heading left in both pins a repo to the copy nothing reads.
profile_worktree="docs/agents/worktree.md"
profile_pipeline="docs/agents/dev-loop.md"
split_missing=0
for heading in '## Setup command' '## Full-suite command' '## Fix cycles'; do
  if ! grep -qxF "$heading" "$REPO/$profile_worktree"; then
    echo "FAIL  profile split: '$heading' absent from $profile_worktree — the key resolves there and nowhere else" >&2
    split_missing=1
  elif grep -qxF "$heading" "$REPO/$profile_pipeline"; then
    echo "FAIL  profile split: '$heading' is in both $profile_worktree and $profile_pipeline — cut it from $profile_pipeline" >&2
    split_missing=1
  fi
done
if [ "$split_missing" -eq 0 ]; then
  echo "ok    profile split"
else
  failed=1
fi

# --- worktree removal guardrail ----------------------------------------------
# Every skill that removes a worktree states the never-force guard itself, none
# of them loading the others; the sentence carries no markup so it greps.
guard_phrase='Worktree removal never passes --force.'
guard_carriers=0
guard_missing=""
while IFS= read -r skill; do
  rel="${skill#"$REPO/"}"
  # A carrier names what it removes. A mention followed only by a flag is prose
  # about the rule — a skill documenting it, not one performing a removal.
  grep -qE 'worktree remove +[^-` ]' "$skill" || continue
  if grep -qF "$guard_phrase" "$skill"; then
    guard_carriers=$((guard_carriers + 1))
  else
    guard_missing="$guard_missing $rel"
  fi
done < <(find "$REPO/skills" -name 'SKILL.md' -not -path '*/node_modules/*' | sort)
if [ -n "$guard_missing" ]; then
  echo "FAIL  worktree removal guardrail missing from:$guard_missing" >&2
  echo "      each must state it verbatim, any markup outside the sentence: $guard_phrase" >&2
  failed=1
elif [ "$guard_carriers" -eq 0 ]; then
  echo "FAIL  worktree removal guardrail: no skill mentions 'worktree remove'" >&2
  failed=1
else
  echo "ok    worktree removal guardrail ($guard_carriers skills)"
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
