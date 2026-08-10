#!/usr/bin/env node
// The prerequisites an unattended run cannot supply for itself, and the ones it defaults instead.
//
//   node preconditions.mjs <repo-root> dev-loop|pr-comments
//
// `.mjs` on purpose: this ships into arbitrary repositories, and a `.js` file's module system is
// decided by whichever package.json happens to be nearest once it is installed.

import { existsSync, readFileSync, realpathSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const PROFILE = 'docs/agents/dev-loop.md'
const WORKTREEINCLUDE = '.worktreeinclude'

const profileKey = (key, supplies) => ({
  label: key,
  where: `\`${PROFILE}\`, under \`## ${key}\``,
  supplies,
  answered: profile => hasContent(profile, key),
})

const worktreeinclude = supplies => ({
  label: `\`${WORKTREEINCLUDE}\``,
  where: 'the repository root, tracked, in gitignore syntax',
  supplies,
  answered: (_profile, root) => existsSync(join(root, WORKTREEINCLUDE)),
})

// The caller selects the remediation as well as the key set: naming a run that cannot supply the
// thing is worse than naming nothing, and `/pr-comments` asks for neither the file nor a PR shape.
const CALLERS = {
  'dev-loop': {
    blocking: [
      profileKey('Setup command', 'one gated `/dev-loop` run asks for it at the first provisioning'),
      profileKey('Full-suite command', "one gated `/dev-loop` run asks for it at Act 0's step 9"),
      worktreeinclude('one gated `/dev-loop` run offers the candidates and writes the file'),
    ],
    defaults: [
      ['Branch template', '`feat/{issue}`, sub-lanes `feat/{issue}-{area}`'],
      ['PR title format', '`<type>(<scope>): #<issue> - <title>`'],
      ['PR body template', 'the core elements alone, in the order Gate 2 lists them'],
      ['Fix cycles', '`2`'],
    ],
  },
  'pr-comments': {
    blocking: [
      profileKey('Setup command', 'one gated `/pr-comments` run asks for it at Step 6'),
      profileKey('Full-suite command', 'one gated `/pr-comments` run asks for it at Step 6'),
      worktreeinclude('one gated `/dev-loop` run writes it at Act 0; `/pr-comments` never asks for it'),
    ],
    defaults: [['Fix cycles', '`2`']],
  },
}

/**
 * The profile's `## <Heading>` sections, lowercased, → the lines beneath each.
 *
 * Fenced lines are content and never headings: the PR body template's own fence carries `##` lines,
 * and reading one as a section would end the template early and invent sections nobody wrote.
 */
function sections(text) {
  const found = new Map()
  let key = null
  let fenced = false
  for (const line of text.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced
    else if (!fenced && /^#{1,6}\s/.test(line)) {
      const heading = /^##\s+(\S.*?)\s*$/.exec(line)
      key = heading ? heading[1].toLowerCase() : null
      if (key && !found.has(key)) found.set(key, [])
      continue
    }
    if (key) found.get(key).push(line)
  }
  return found
}

// Any non-blank content answers the key, whatever it says: `none` and `0` are answers like any
// other, and a module that judged a value would re-decide what a human already settled.
const hasContent = (profile, key) =>
  (profile.get(key.toLowerCase()) ?? []).some(line => line.trim() !== '')

function check(root, caller) {
  // A repository with no profile is missing every key, which is a report and not an error.
  let text = ''
  try {
    text = readFileSync(join(root, PROFILE), 'utf8')
  } catch {}
  const profile = sections(text)
  const spec = CALLERS[caller]
  return {
    blocking: spec.blocking.filter(entry => !entry.answered(profile, root)),
    defaults: spec.defaults.filter(([key]) => !hasContent(profile, key)),
  }
}

const NEVER_PERSISTED =
  'Used for this run and written to no profile — one gated run is what persists an answer.'

function render({ blocking, defaults }) {
  const cannot = blocking.map(e => `- **${e.label}** — ${e.where} — ${e.supplies}.`)
  const taken = defaults.map(([key, value]) => `- **${key}** — ${value}`)
  return [
    '### Missing, cannot run',
    '',
    ...(cannot.length ? cannot : ['None.']),
    '',
    '### Missing, default taken',
    '',
    ...(taken.length ? [NEVER_PERSISTED, '', ...taken] : ['None.']),
  ].join('\n')
}

const USAGE = `usage: preconditions.mjs <repo-root> <dev-loop|pr-comments>

Prints two blocks for the caller named: the prerequisites an unattended run cannot supply for
itself, and the ones it takes a default for. Exits non-zero when the first block is non-empty.
Reads the repo profile and stats one file — it writes nothing and reaches nothing.`

function main(argv) {
  const [root, caller] = argv
  // Both arguments are required: a silent success on none would read as every prerequisite present.
  if (argv.length !== 2 || !root || !Object.hasOwn(CALLERS, caller)) {
    process.stderr.write(`${USAGE}\n`)
    return 2
  }
  const report = check(root, caller)
  process.stdout.write(`${render(report)}\n`)
  return report.blocking.length ? 1 : 0
}

// Node resolves a module's own path through symlinks and leaves argv[1] as the caller typed it, so a
// skill folder reached through one makes these differ — and an unresolved compare skips main() silently.
const invokedDirectly = invoked => {
  if (!invoked) return false
  if (import.meta.url === pathToFileURL(invoked).href) return true
  try {
    return import.meta.url === pathToFileURL(realpathSync(invoked)).href
  } catch {
    return false
  }
}

if (invokedDirectly(process.argv[1])) {
  process.exitCode = main(process.argv.slice(2))
}
