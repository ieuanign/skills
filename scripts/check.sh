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

# --- bundled ES modules ------------------------------------------------------
# Supporting files a skill ships as real, importable modules — unlike the phase
# scripts above, which parse only under the Workflow globals. `node --check` reads
# the .mjs extension and parses them as modules, top-level await included.
while IFS= read -r mod; do
  rel="${mod#"$REPO/"}"
  if out="$(node --check "$mod" 2>&1)"; then
    echo "ok    syntax $rel"
  else
    echo "FAIL  syntax $rel" >&2
    echo "$out" >&2
    failed=1
  fi
done < <(find "$REPO/skills" -name '*.mjs' -not -path '*/node_modules/*' | sort)

# --- the suite gate's prompt opening -----------------------------------------
# The suite gate is dispatched with deliberately no agent type, so cost-log.mjs
# names that stage from the opening sentence of phase-execute.js's suitePrompt().
# A phase script imports nothing, so the two cannot share a constant, and without
# this a reworded sentence would move the gate's spend into `other` in silence.
if out="$(REPO="$REPO" node --input-type=module -e '
const { readFile } = await import("node:fs/promises")
const repo = process.env.REPO
const { SUITE_OPENING } = await import(repo + "/skills/dev-loop/cost-log.mjs")
const src = await readFile(repo + "/skills/dev-loop/phase-execute.js", "utf8")
const body = src.split("function suitePrompt")[1] || ""
const opening = (body.match(/return `([^\n`]*)/) || [])[1] || ""
if (!opening) throw new Error("no suitePrompt() template literal found in phase-execute.js")
if (!SUITE_OPENING.test(opening)) {
  throw new Error("suitePrompt() opens with " + JSON.stringify(opening) + ", which SUITE_OPENING in cost-log.mjs does not match")
}
' 2>&1)"; then
  echo "ok    suite-gate prompt opening"
else
  echo "FAIL  suite-gate prompt opening" >&2
  echo "$out" >&2
  failed=1
fi

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
