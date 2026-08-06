#!/usr/bin/env node
//
// /dev-loop's execution state machine, driven end to end with NO agent dispatched.
//
// `skills/dev-loop/phase-execute.js` is the whole of the state machine — every loop, every
// bound, every ending — and its one outside dependency is the `agent()` global the Workflow runner
// supplies. That is the seam, and it is the highest one available: above every loop, above every
// bound, above every ending. Compiling the script with the shared shim and handing it a SCRIPTED
// FAKE `agent()` runs the machine deterministically for the price of a `node` process.
//
// Two observables per scenario, and no others:
//
//   1. the ordered labels the fake `agent()` was asked for — which stages ran, in what order;
//   2. the lane result — ending label, ending reason, terminal pull-request state, findings ledger.
//
// Nothing here asserts on an internal variable, a private helper, or prompt wording beyond an
// input a contract requires to be present. A test that breaks when a loop is refactored but its
// behaviour is unchanged is a bad test, and this file is meant to survive refactors of the file it
// tests. `phase-execute.js` is the specification **as against the prose**: with one implementation
// left, a document that disagrees with the script is the document's bug, and
// `docs/dev-loop-internals.md` explains why. That does not extend to this harness — these scenarios
// are the behaviour the script is held to, so a failing scenario is the script's bug until somebody
// changes the scenario on purpose.
//
// Run: `node scripts/state-machine.mjs` (also a stage of `npm run check`). Every scenario runs
// even when an earlier one fails, per the check script's convention; the exit code is non-zero if
// any failed.

import assert from 'node:assert/strict'
import { compilePhaseScript } from './lib/phase-script.mjs'

const EXECUTE = new URL('../skills/dev-loop/phase-execute.js', import.meta.url)
const phaseExecute = compilePhaseScript(EXECUTE)

// --- the fake runner ---------------------------------------------------------

// `script` maps a call label to what that call returns. A function value is called, so a scenario
// can throw from a stage. `null` is a stage that returned nothing — the deliberate dead agent.
// A label with NO entry is a harness bug, not a dead agent: it is collected and reported as one,
// because phase-execute.js catches every throw inside a lane and would otherwise turn a typo in
// this file into a plausible-looking FAILED ending.
async function runPhase(args, script) {
  const calls = []
  const logs = []
  const unscripted = []

  const agent = async (prompt, opts = {}) => {
    const label = String(opts.label || '')
    calls.push({ label, prompt, agentType: opts.agentType, phase: opts.phase })
    if (!Object.prototype.hasOwnProperty.call(script, label)) {
      unscripted.push(label)
      return null
    }
    const scripted = script[label]
    return typeof scripted === 'function' ? scripted() : scripted
  }

  // The runner's contract: a thunk that throws resolves to null rather than rejecting the call.
  const parallel = thunks =>
    Promise.all(thunks.map(t => Promise.resolve().then(t).catch(() => null)))
  const pipeline = () => {
    throw new Error('pipeline() is not used by phase-execute.js')
  }
  const log = message => logs.push(String(message))
  const budget = { total: null, spent: () => 0, remaining: () => Infinity }

  const result = await phaseExecute(args, agent, parallel, pipeline, log, budget)
  if (unscripted.length) {
    throw new Error(`the scenario dispatched labels it scripted no return for: ${unscripted.join(', ')}`)
  }
  return { result, calls, logs, labels: calls.map(c => c.label) }
}

// --- input builders ----------------------------------------------------------

const PLAN = '/main/.scratch/plans/1-thing.md'

const subLane = (issue, { area, commits, base = 'main' } = {}) => ({
  branch: area ? `feat/${issue}-${area}` : `feat/${issue}`,
  worktree: `/main/.claude/worktrees/${issue}${area ? '-' + area : ''}`,
  base,
  area,
  commits: commits || [{ ordinal: 1, message: `feat(x): #${issue} - the commit` }],
})

const lane = (issue, opts = {}) => ({
  issue,
  issueBody: opts.issueBody || '',
  planPath: PLAN,
  notified: opts.notified,
  subLanes: opts.subLanes || [subLane(issue, opts)],
})

// The args the host passes. Every scenario names the keys it cares about and inherits the rest.
const argsFor = (lanes, over = {}) => ({
  lanes,
  mode: 'gated',
  suiteCommand: 'npm run check',
  agentNamespace: 'ieuanign-skills',
  ...over,
})

// --- return builders ---------------------------------------------------------

const committed = (over = {}) => ({ result: 'COMMITTED', commits: ['abc1234 feat(x): #1 - the commit'], ...over })
const writerFailed = (over = {}) => ({ result: 'FAILED', commits: [], failing: 'npm test', ...over })
const approved = { verdict: 'APPROVED', findings: [] }
const changes = findings => ({ verdict: 'CHANGES_REQUESTED', findings })
const suitePassed = { state: 'passed', failing: [], output: '' }
const suiteRed = failing => ({ state: 'failed', failing, output: failing.join('\n') })
const toWriter = { rootCause: 'an off-by-one', owner: 'code-writer', finding: 'src/a.ts:1 — off by one — it drops the last row' }

const FINDING = 'src/a.ts:12 — the guard is missing — a null body throws — add the guard'
// The same defect in the same file, reported at a line the previous cycle's fix shifted. Finding
// identity drops the line, so this is NOT a new finding.
const FINDING_MOVED = 'src/a.ts:31 — the guard is missing — a null body throws — add the guard'
// A different defect, and the one after it a regression the fix for the second introduced.
const FINDING_B = 'src/b.ts:40 — the retry never backs off — a hot loop on every 429 — add a delay'
const FINDING_C = 'src/b.ts:41 — the delay is unbounded — a slow peer hangs the request — cap it'

// The one sentence every ending produced by an empty return has to carry. From where the pipeline
// sits a skip and a death after the runner's retries are the same observation, so an ending may
// not pick one — see `docs/dev-loop-internals.md`, *A call that came back with nothing*.
const EMPTY_RETURN = /returned nothing — it was skipped, or it died after the runner's retries/

// --- the scenario registry ---------------------------------------------------

const scenarios = []
const scenario = (name, fn) => scenarios.push({ name, fn })

const only = result => {
  assert.equal(result.length, 1, 'expected exactly one lane result')
  return result[0]
}
const promptFor = (calls, label) => {
  const call = calls.find(c => c.label === label)
  assert.ok(call, `no call was dispatched with label ${label}`)
  return call.prompt
}

// --- the clean path ----------------------------------------------------------

scenario('a clean sub-lane runs write, review, suite and opens a ready pull request', async () => {
  const { result, labels } = await runPhase(argsFor([lane(1)]), {
    'write:#1:c1': committed(),
    'review:#1': approved,
    'suite:#1': suitePassed,
  })
  assert.deepEqual(labels, ['write:#1:c1', 'review:#1', 'suite:#1'])
  const l = only(result)
  assert.equal(l.ending, null)
  const s = l.subResults[0]
  assert.equal(s.ending, null)
  assert.equal(s.suite.state, 'passed')
  assert.deepEqual(s.terminal, { pr: 'ready', reasons: [] })
})

// --- the review loop ---------------------------------------------------------

scenario('the motivating case: three cycles of disjoint findings, then approval', async () => {
  // Three reviews, three findings, at three different lines, disjoint on every round — the third
  // a regression the fix for the second introduced. Every cycle did real work, and the flat bound
  // this replaces stopped the loop here with the lane one cycle from green.
  const { result, labels } = await runPhase(argsFor([lane(1)]), {
    'write:#1:c1': committed(),
    'review:#1': changes([FINDING]),
    'fix:#1:r1': committed(),
    'review:#1:r1': changes([FINDING_B]),
    'fix:#1:r2': committed(),
    'review:#1:r2': changes([FINDING_C]),
    'fix:#1:r3': committed(),
    'review:#1:r3': approved,
    'suite:#1': suitePassed,
  })
  assert.deepEqual(labels, [
    'write:#1:c1',
    'review:#1', 'fix:#1:r1',
    'review:#1:r1', 'fix:#1:r2',
    'review:#1:r2', 'fix:#1:r3',
    'review:#1:r3',
    'suite:#1',
  ])
  const s = only(result).subResults[0]
  assert.equal(s.ending, null)
  assert.deepEqual(s.openFindings, [])
  assert.equal(s.terminal.pr, 'ready')
})

scenario('the stuck case: repeated findings halt at the threshold, one cycle in', async () => {
  const { result, labels } = await runPhase(argsFor([lane(1)], { fixCycleThreshold: 2 }), {
    'write:#1:c1': committed(),
    'review:#1': changes([FINDING]),
    'fix:#1:r1': committed(),
    // The same defect in the same file, at a line the fix shifted. Not a new finding.
    'review:#1:r1': changes([FINDING_MOVED]),
  })
  assert.deepEqual(labels, ['write:#1:c1', 'review:#1', 'fix:#1:r1', 'review:#1:r1'])
  // EARLIER than the flat bound of 2 it replaces, which spent both cycles before stopping.
  assert.equal(labels.filter(l => l.startsWith('fix:')).length, 1)
  const s = only(result).subResults[0]
  assert.equal(s.ending.category, 'HALT')
  assert.match(s.ending.reason, /not progressing/)
  assert.match(s.ending.reason, /no-progress threshold of 2/)
  assert.doesNotMatch(s.ending.reason, /ceiling/)
  assert.deepEqual(s.openFindings, [FINDING_MOVED])
  assert.equal(s.terminal.pr, 'draft')
  // The sub-lane ended before the gate, so the suite is not-run and says which ending stopped it.
  assert.equal(s.suite.state, 'not-run')
  assert.match(s.suite.output, /the sub-lane ended before the suite gate ran/)
})

scenario('every cycle bringing something new halts at the 5-fix-cycle ceiling, not beyond', async () => {
  const script = { 'write:#1:c1': committed() }
  // Six reviews, each with a finding nothing has seen, so the threshold never advances past 1.
  for (let round = 0; round <= 5; round++) {
    script[`review:#1${round ? ':r' + round : ''}`] = changes([`src/r${round}.ts:1 — defect ${round} — it breaks — fix it`])
    if (round < 5) script[`fix:#1:r${round + 1}`] = committed()
  }
  const { result, labels } = await runPhase(argsFor([lane(1)]), script)
  assert.equal(labels.filter(l => l.startsWith('fix:')).length, 5)
  assert.equal(labels.filter(l => l.startsWith('review:')).length, 6)
  assert.equal(labels[labels.length - 1], 'review:#1:r5')
  const s = only(result).subResults[0]
  assert.equal(s.ending.category, 'HALT')
  assert.match(s.ending.reason, /5-fix-cycle ceiling/)
  assert.doesNotMatch(s.ending.reason, /not progressing/)
  assert.equal(s.reviewTrajectory.length, 6)
})

scenario('a threshold of 0 spends no fix cycle at all, and 1 behaves the same way', async () => {
  // The counter is 1 the moment the first round returns, so a threshold of 1 is reached by that
  // round however new its findings were. Both answers are supported; 0 is the one the ask offers.
  for (const threshold of [0, 1]) {
    const { result, labels } = await runPhase(argsFor([lane(1)], { fixCycleThreshold: threshold }), {
      'write:#1:c1': committed(),
      'review:#1': changes([FINDING]),
    })
    assert.deepEqual(labels, ['write:#1:c1', 'review:#1'], `threshold ${threshold}`)
    const s = only(result).subResults[0]
    assert.equal(s.ending.category, 'HALT', `threshold ${threshold}`)
    assert.deepEqual(s.openFindings, [FINDING], `threshold ${threshold}`)
  }
})

scenario('a raised threshold shifts where the stuck case halts', async () => {
  const { result, labels } = await runPhase(argsFor([lane(1)], { fixCycleThreshold: 3 }), {
    'write:#1:c1': committed(),
    'review:#1': changes([FINDING]),
    'fix:#1:r1': committed(),
    'review:#1:r1': changes([FINDING]),
    'fix:#1:r2': committed(),
    'review:#1:r2': changes([FINDING_MOVED]),
  })
  // Two cycles where a threshold of 2 spent one, and the same findings the whole way.
  assert.equal(labels.filter(l => l.startsWith('fix:')).length, 2)
  const s = only(result).subResults[0]
  assert.equal(s.ending.category, 'HALT')
  assert.match(s.ending.reason, /no-progress threshold of 3/)
})

scenario('the ending carries the trajectory, round by round', async () => {
  const { result } = await runPhase(argsFor([lane(1)], { fixCycleThreshold: 2 }), {
    'write:#1:c1': committed(),
    'review:#1': changes([FINDING, FINDING_B]),
    'fix:#1:r1': committed(),
    'review:#1:r1': changes([FINDING_MOVED]),
  })
  const s = only(result).subResults[0]
  assert.deepEqual(s.reviewTrajectory, [
    'round 1: 2 finding(s), 2 previously unseen',
    'round 2: 1 finding(s), none previously unseen',
  ])
  assert.match(s.ending.reason, /Trajectory — round 1: 2 finding\(s\), 2 previously unseen; round 2: 1 finding\(s\), none previously unseen\./)
  // The attempt log says the same thing about the round that triggered its cycle.
  assert.match(s.attempts[0].trigger, /2 previously unseen/)
  // The reason states which bound fired and leaves the per-round account to the trajectory —
  // a reason that also summarised the rounds would contradict it, since round 1 brought new
  // findings and still moved the counter to 1.
  assert.doesNotMatch(s.ending.reason, /2 consecutive round\(s\) brought no previously unseen/)
})

scenario('a re-confirmed dispute still ends the sub-lane immediately', async () => {
  const { result, labels } = await runPhase(argsFor([lane(1)]), {
    'write:#1:c1': committed(),
    'review:#1': changes([FINDING]),
    'fix:#1:r1': committed({ disputed: 1, disputedFindings: [FINDING] }),
    'review:#1:r1': { verdict: 'CHANGES_REQUESTED', findings: [FINDING], contestedFindings: [FINDING] },
  })
  assert.deepEqual(labels, ['write:#1:c1', 'review:#1', 'fix:#1:r1', 'review:#1:r1'])
  const s = only(result).subResults[0]
  assert.equal(s.ending.category, 'HALT')
  assert.match(s.ending.reason, /contested findings/)
  assert.deepEqual(s.openFindings, [FINDING])
})

scenario('a fix-cycle writer BLOCKED is a reasoned refusal and takes the HALT label', async () => {
  const { result } = await runPhase(argsFor([lane(1)]), {
    'write:#1:c1': committed(),
    'review:#1': changes([FINDING]),
    'fix:#1:r1': { result: 'BLOCKED', commits: [], notes: 'the finding asks for a rewrite' },
  })
  const s = only(result).subResults[0]
  assert.equal(s.ending.category, 'HALT')
  assert.match(s.ending.reason, /fix cycle 1 returned BLOCKED/)
})

scenario('a reviewer that returned nothing and an ERROR reviewer both take the FAILED label', async () => {
  for (const [name, review, expected] of [
    ['empty', null, EMPTY_RETURN],
    ['ERROR', { verdict: 'ERROR', findings: [], notes: 'no diff' }, /reviewer ERROR/],
  ]) {
    const { result } = await runPhase(argsFor([lane(1)]), {
      'write:#1:c1': committed(),
      'review:#1': review,
    })
    const s = only(result).subResults[0]
    assert.equal(s.ending.category, 'FAILED', `the ${name} reviewer should end FAILED`)
    assert.match(s.ending.reason, expected)
  }
})

// --- the per-commit implement loop -------------------------------------------

scenario('the implement loop runs exactly two debug+fix attempts, then HALTs', async () => {
  const { result, labels } = await runPhase(argsFor([lane(1)]), {
    'write:#1:c1': writerFailed(),
    'debug:#1:c1:t1': toWriter,
    'debugfix:#1:c1:t1': writerFailed(),
    'debug:#1:c1:t2': toWriter,
    'debugfix:#1:c1:t2': writerFailed(),
  })
  assert.deepEqual(labels, [
    'write:#1:c1',
    'debug:#1:c1:t1', 'debugfix:#1:c1:t1',
    'debug:#1:c1:t2', 'debugfix:#1:c1:t2',
  ])
  const s = only(result).subResults[0]
  assert.equal(s.ending.category, 'HALT')
  assert.match(s.ending.reason, /still FAILED after 2 debug\+fix attempts/)
  // Nothing landed — not even a wip: commit — so there is nothing ahead of the base to open a
  // pull request for. The only ending in the pipeline that opens none.
  assert.equal(s.terminal.pr, 'none')
})

scenario("the give-up clause reaches the FINAL permitted attempt and no earlier one", async () => {
  const { calls } = await runPhase(argsFor([lane(1)]), {
    'write:#1:c1': writerFailed(),
    'debug:#1:c1:t1': toWriter,
    'debugfix:#1:c1:t1': writerFailed(),
    'debug:#1:c1:t2': toWriter,
    'debugfix:#1:c1:t2': writerFailed(),
  })
  assert.doesNotMatch(promptFor(calls, 'debugfix:#1:c1:t1'), /FINAL permitted attempt/)
  assert.match(promptFor(calls, 'debugfix:#1:c1:t2'), /FINAL permitted attempt/)
  assert.match(promptFor(calls, 'debugfix:#1:c1:t2'), /wip\(<scope>\)/)
})

scenario('the debugger route retry re-runs the writer with nothing to fix', async () => {
  const { result, labels } = await runPhase(argsFor([lane(1)]), {
    'write:#1:c1': writerFailed(),
    'debug:#1:c1:t1': { rootCause: 'a flaky network call', owner: 'retry' },
    'retry:#1:c1:t1': committed(),
    'review:#1': approved,
    'suite:#1': suitePassed,
  })
  assert.deepEqual(labels, ['write:#1:c1', 'debug:#1:c1:t1', 'retry:#1:c1:t1', 'review:#1', 'suite:#1'])
  const s = only(result).subResults[0]
  assert.equal(s.ending, null)
  assert.deepEqual(s.attempts.map(a => a.outcome), ['the retry returned COMMITTED'])
})

scenario('the debugger route code-writer fixes the defect and the sub-lane continues', async () => {
  const { result, labels } = await runPhase(argsFor([lane(1)]), {
    'write:#1:c1': writerFailed(),
    'debug:#1:c1:t1': toWriter,
    'debugfix:#1:c1:t1': committed(),
    'review:#1': approved,
    'suite:#1': suitePassed,
  })
  assert.deepEqual(labels, ['write:#1:c1', 'debug:#1:c1:t1', 'debugfix:#1:c1:t1', 'review:#1', 'suite:#1'])
  const s = only(result).subResults[0]
  assert.equal(s.ending, null)
  assert.equal(s.terminal.pr, 'ready')
})

scenario('the debugger routes replan and user end the sub-lane immediately', async () => {
  for (const owner of ['replan', 'user']) {
    const { result, labels } = await runPhase(argsFor([lane(1)]), {
      'write:#1:c1': writerFailed(),
      'debug:#1:c1:t1': { rootCause: 'the plan asked for the wrong module', owner },
    })
    assert.deepEqual(labels, ['write:#1:c1', 'debug:#1:c1:t1'], `route ${owner}`)
    const s = only(result).subResults[0]
    assert.equal(s.ending.category, 'HALT', `route ${owner}`)
    assert.match(s.ending.reason, new RegExp(`debugger routed to ${owner}`))
  }
})

scenario('a writer BLOCKED on a plan commit takes the HALT label', async () => {
  const { result } = await runPhase(argsFor([lane(1)]), {
    'write:#1:c1': { result: 'BLOCKED', commits: [], notes: 'the plan names a file that does not exist' },
  })
  const s = only(result).subResults[0]
  assert.equal(s.ending.category, 'HALT')
  assert.match(s.ending.reason, /writer BLOCKED on commit 1/)
})

// --- the suite gate ----------------------------------------------------------

scenario('the suite gate stops after 2 rounds that brought no previously unseen failure', async () => {
  const { result, labels } = await runPhase(argsFor([lane(1)]), {
    'write:#1:c1': committed(),
    'review:#1': approved,
    'suite:#1': suiteRed(['a.test.ts > one', 'a.test.ts > two']),
    'suitedebug:#1:r1': toWriter,
    'suitefix:#1:r1': committed(),
    'suite:#1:r2': suiteRed(['a.test.ts > two']),
  })
  assert.deepEqual(labels, [
    'write:#1:c1', 'review:#1',
    'suite:#1', 'suitedebug:#1:r1', 'suitefix:#1:r1',
    'suite:#1:r2',
  ])
  const s = only(result).subResults[0]
  assert.equal(s.ending.category, 'HALT')
  assert.match(s.ending.reason, /2 rounds brought no previously unseen failure/)
  assert.equal(s.suite.state, 'failed')
  assert.equal(s.terminal.pr, 'draft')
})

scenario('the suite gate stops at its 8-round ceiling when every round brings a new failure', async () => {
  const script = { 'write:#1:c1': committed(), 'review:#1': approved }
  for (let round = 1; round <= 8; round++) {
    script[`suite:#1${round > 1 ? ':r' + round : ''}`] = suiteRed([`a.test.ts > round ${round}`])
    if (round < 8) {
      script[`suitedebug:#1:r${round}`] = toWriter
      script[`suitefix:#1:r${round}`] = committed()
    }
  }
  const { result, labels } = await runPhase(argsFor([lane(1)]), script)
  assert.equal(labels.filter(l => l.startsWith('suite:')).length, 8)
  assert.equal(labels.filter(l => l.startsWith('suitedebug:')).length, 7)
  assert.equal(labels[labels.length - 1], 'suite:#1:r8')
  const s = only(result).subResults[0]
  assert.equal(s.ending.category, 'HALT')
  assert.match(s.ending.reason, /the 8-round ceiling/)
})

scenario('a suite gate that returned nothing is FAILED, and its suite is never reported as passed', async () => {
  const { result } = await runPhase(argsFor([lane(1)]), {
    'write:#1:c1': committed(),
    'review:#1': approved,
    'suite:#1': null,
  })
  const s = only(result).subResults[0]
  assert.equal(s.ending.category, 'FAILED')
  assert.equal(s.suite.state, 'not-run')
  assert.match(s.suite.output, EMPTY_RETURN)
})

scenario('no configured full-suite command means not-run, and dispatches nothing to say so', async () => {
  const { result, labels } = await runPhase(argsFor([lane(1)], { suiteCommand: 'none' }), {
    'write:#1:c1': committed(),
    'review:#1': approved,
  })
  assert.deepEqual(labels, ['write:#1:c1', 'review:#1'])
  const s = only(result).subResults[0]
  assert.equal(s.suite.state, 'not-run')
  // Not-run with no open findings and no unmet criterion is still a ready pull request.
  assert.equal(s.terminal.pr, 'ready')
})

// --- a stage that returned nothing -------------------------------------------

scenario('every stage that returned nothing says so, and none of them claims the agent died', async () => {
  const settled = { 'write:#1:c1': committed(), 'review:#1': approved }
  const red = suiteRed(['a.test.ts > one'])
  const cases = [
    ['the writer on a plan commit', { 'write:#1:c1': null }],
    ['the debugger', { 'write:#1:c1': writerFailed(), 'debug:#1:c1:t1': null }],
    ['the reviewer', { 'write:#1:c1': committed(), 'review:#1': null }],
    ['a fix-cycle writer', { ...settled, 'review:#1': changes([FINDING]), 'fix:#1:r1': null }],
    ['the suite gate', { ...settled, 'suite:#1': null }],
    ['the suite debugger', { ...settled, 'suite:#1': red, 'suitedebug:#1:r1': null }],
    ['a suite-fix writer', { ...settled, 'suite:#1': red, 'suitedebug:#1:r1': toWriter, 'suitefix:#1:r1': null }],
  ]
  for (const [stage, script] of cases) {
    const { result } = await runPhase(argsFor([lane(1)]), script)
    const s = only(result).subResults[0]
    // The label is unchanged: a break is worth retrying, whatever emptied the call.
    assert.equal(s.ending.category, 'FAILED', `${stage}: a break, never a verdict`)
    assert.match(s.ending.reason, EMPTY_RETURN, stage)
    assert.doesNotMatch(s.ending.reason, /\bdied\b(?! after the runner)/, `${stage}: nothing may assert a death`)
  }
})

// --- the notifier and the run handle -----------------------------------------

// The notifier is dispatched only under `unattended`, and only where the host passed the skill
// directory — one with no specification to read writes worse than nothing.
const unattended = over => ({ mode: 'unattended', skillDir: '/plugins/ieuanign-skills/skills/dev-loop', ...over })

scenario('the run handle reaches the notifier when the host supplies one', async () => {
  const { result, calls } = await runPhase(argsFor([lane(1)], unattended({ runHandle: 'session-abc-123' })), {
    'write:#1:c1': committed(),
    'review:#1': changes([FINDING]),
    'fix:#1:r1': committed(),
    'review:#1:r1': changes([FINDING]),
    'notify:#1': { label: 'applied', comment: 'posted', message: 'sent', detail: 'awaiting-human' },
  })
  const prompt = promptFor(calls, 'notify:#1')
  assert.match(prompt, /session-abc-123/)
  // The specification puts it on the ending comment and keeps it out of the one-line message.
  assert.match(prompt, /never in the message/)
  // An applied label is what makes the host stand back rather than writing a second verdict.
  assert.equal(only(result).notified, true)
})

scenario('an absent run handle omits the line and errors nothing', async () => {
  const { result, calls } = await runPhase(argsFor([lane(1)], unattended()), {
    'write:#1:c1': committed(),
    'review:#1': changes([FINDING]),
    'fix:#1:r1': committed(),
    'review:#1:r1': changes([FINDING]),
    'notify:#1': { label: 'applied', comment: 'posted', message: 'sent', detail: 'awaiting-human' },
  })
  assert.doesNotMatch(promptFor(calls, 'notify:#1'), /Run handle/)
  const l = only(result)
  // The lane's outcome is exactly what it would have been with a handle.
  assert.equal(l.notified, true)
  assert.equal(l.ending.category, 'HALT')
  assert.equal(l.subResults[0].terminal.pr, 'draft')
})

// --- terminal state is per sub-lane ------------------------------------------

scenario("one sub-lane's draft does not draft its sibling", async () => {
  const lanes = [lane(1, {
    subLanes: [
      subLane(1, { area: 'api' }),
      subLane(1, { area: 'ui', base: 'feat/1-api', commits: [{ ordinal: 2, message: 'feat(ui): #1 - the screen' }] }),
    ],
  })]
  const { result } = await runPhase(argsFor(lanes), {
    // api ends on the review loop's no-progress threshold
    'write:#1:c1': committed(),
    'review:#1:api': changes([FINDING]),
    'fix:#1:r1': committed(),
    'review:#1:api:r1': changes([FINDING]),
    // ui concludes clean
    'write:#1:c2': committed(),
    'review:#1:ui': approved,
    'suite:#1:ui': suitePassed,
  })
  const l = only(result)
  assert.equal(l.subResults.length, 2)
  assert.equal(l.subResults[0].terminal.pr, 'draft')
  assert.equal(l.subResults[1].terminal.pr, 'ready')
  assert.equal(l.subResults[1].ending, null)
  // The lane's own label is a roll-up for reporting only.
  assert.equal(l.ending.category, 'HALT')
})

// --- the runner -------------------------------------------------------------

let failed = 0
for (const { name, fn } of scenarios) {
  try {
    await fn()
    console.log(`ok    state machine: ${name}`)
  } catch (err) {
    console.error(`FAIL  state machine: ${name}`)
    console.error(String((err && err.stack) || err).replace(/^/gm, '      '))
    failed = 1
  }
}
process.exit(failed)
