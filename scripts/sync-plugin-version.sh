#!/usr/bin/env bash
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"

# `changeset version` bumps package.json only — it has no knowledge of
# .claude-plugin/plugin.json, which CLAUDE.md requires to hold the same version.
# Chained after it in the `version` script so a release never has to be hand-synced.
# Rewrites the version string in place rather than re-serialising, to leave the
# rest of the file byte-identical.
REPO="$REPO" node <<'EOF'
const fs = require('node:fs')
const repo = process.env.REPO
const target = `${repo}/.claude-plugin/plugin.json`

const wanted = JSON.parse(fs.readFileSync(`${repo}/package.json`, 'utf8')).version
const raw = fs.readFileSync(target, 'utf8')
const current = JSON.parse(raw).version

if (current === wanted) {
  console.log(`plugin.json already at ${wanted}`)
  process.exit(0)
}

const patched = raw.replace(/("version"\s*:\s*)"[^"]*"/, `$1"${wanted}"`)
if (JSON.parse(patched).version !== wanted) {
  console.error(`FAIL  could not rewrite the version in ${target}`)
  process.exit(1)
}

fs.writeFileSync(target, patched)
console.log(`plugin.json ${current} -> ${wanted}`)
EOF
