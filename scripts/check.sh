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
