// The ONE construction shim for a /dev-loop phase script, shared by everything that loads one.
//
// A phase script is not a module. The Workflow tool compiles it as the body of an async function
// over its own globals, so it imports nothing, exports one `meta`, and uses a top-level `return`.
// `node --check` is a silent no-op on that shape and `--input-type=module` rejects the return;
// only the AsyncFunction below parses it.
//
// Two callers, one copy: `scripts/check.sh` compiles every phase script and never calls it, and
// `scripts/state-machine.mjs` compiles phase-execute.js and calls it with a scripted fake agent().
// They used to hold the shim separately, with a comment asking them to stay in step and nothing
// enforcing it — a drift that would have shown up as the harness testing a script the check
// script never parses, or the reverse.
//
// COMPILING IS NOT RUNNING. Running a phase script dispatches agents, so a caller that only wants
// to know the file parses must construct and stop, which is what the CLI mode at the bottom does.

import fs from 'node:fs'
import { pathToFileURL } from 'node:url'

// The Workflow runner's globals, in the order a phase script's body expects them.
export const RUNNER_GLOBALS = ['args', 'agent', 'parallel', 'pipeline', 'log', 'budget']

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor

// Non-global on purpose: the host assumes exactly one export, so /g would compile scripts it
// rejects.
export function compilePhaseScript(path) {
  const src = fs.readFileSync(path, 'utf8').replace(/^export const meta/m, 'const meta')
  return new AsyncFunction(...RUNNER_GLOBALS, src)
}

// `node scripts/lib/phase-script.mjs <path>` — compile and exit. Anything wrong with the file is
// a throw, which is the non-zero exit the caller reads.
if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const path = process.argv[2]
  if (!path) {
    console.error('usage: phase-script.mjs <phase-script-path>')
    process.exit(2)
  }
  compilePhaseScript(path)
}
