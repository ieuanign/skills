export const meta = {
  name: 'dev-loop-plan',
  description: 'Phase A of /dev-loop — fan out implementation plans, one architect per issue',
  whenToUse: 'Invoked by the /dev-loop skill; not standalone.',
  phases: [{ title: 'Plan', detail: 'one architecture-engineer per issue, parallel' }],
}

// args: {
//   issues: [{ number, title, project?, answers? }],
//   agentNamespace: string  // the roster's registry namespace; absent ⇒ bare names
// }

// The harness may deliver args as a JSON string; normalize to an object.
const input = typeof args === 'string' ? JSON.parse(args) : args

const PLAN_SCHEMA = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['READY', 'BLOCKED'] },
    planPath: { type: 'string', description: 'repo-relative path of the plan file written' },
    summary: { type: 'string', description: '3-5 bullet summary of the approach' },
    openQuestions: { type: 'array', items: { type: 'string' }, description: 'empty array when READY' },
  },
  required: ['status', 'planPath', 'summary', 'openQuestions'],
}

// A role is resolved against the namespace the host discovered, never a literal: the same definition
// registers bare when linked into `.claude/agents/` and `<plugin>:<name>` when installed, so a bare
// literal RUNS ONLY FOR THE MAINTAINER. Absent ⇒ bare, trailing colon tolerated; check enforces it.
const NS = String(input.agentNamespace || '').trim().replace(/:+$/, '')
const roleAgent = role => (NS ? `${NS}:${role}` : role)

const agentType = roleAgent('architecture-engineer')

// The lane-and-stage marker every prompt leads with, so a transcript identifies its lane and stage
// without parsing prompt prose. Inert to the agent; only the cost report reads it. Written out in
// full here, in phase-execute.js and in cost-report.mjs — a script imports nothing; check compares.
const STAGE = { PLAN: 'plan', WRITE: 'write', REVIEW: 'review', SUITE: 'suite', NOTIFY: 'notify' }
const mark = (issue, stage) => `[dev-loop lane=${issue} stage=${stage}]\n`

// One shape for both ways an architect can fail to produce a plan. A requested issue is never
// silently dropped, so every path out of a thunk below produces one of these.
const died = (number, why) => ({ issue: number, status: 'DIED', planPath: '', summary: why, openQuestions: [] })

// Honest about what a throw actually carried: a dead agent often throws a bare value with neither a
// message nor a stack, and a summary promising an empty trace helps nobody. The same shape as
// phase-execute.js's, which cannot be shared — a phase script imports nothing.
function crashLine(err) {
  const message = err && typeof err.message === 'string' ? err.message.trim() : ''
  if (message) return message
  if (err === null || err === undefined) return `it threw ${String(err)}, carrying no message`
  let shown
  try { shown = typeof err === 'symbol' ? err.toString() : String(err) } catch { shown = '(unprintable)' }
  return `it threw a ${typeof err} value (${shown || 'empty'}), carrying no message`
}

// try/catch around the whole thunk, not `.catch` on the promise: a synchronous throw out of
// agent() never builds the chain, so a trailing .catch would not be there to catch it — and that
// is the case where the issue disappears from the batch entirely.
const results = await parallel(input.issues.map(iss => async () => {
  try {
    const r = await agent(
      mark(iss.number, STAGE.PLAN) +
      `Mode 1 — implementation plan for GitHub issue #${iss.number} ("${iss.title}") in this repository.` +
      (iss.project ? ` Project slug: ${iss.project}.` : '') +
      (iss.answers ? ` The user answered your previous open questions as follows — incorporate them and do not re-ask: ${iss.answers}` : '') +
      ` Fetch the issue yourself, explore the code, write the plan file, and report status, plan path, summary, and open questions.`,
      { agentType, label: `plan:#${iss.number}`, phase: 'Plan', schema: PLAN_SCHEMA }
    )
    // A throw is the same outcome as an architect that returned nothing and takes the same entry.
    // What that emptiness MEANT is not knowable from here, so the summary says what happened
    // rather than asserting a crash.
    return r ? { issue: iss.number, ...r } : died(iss.number, "the architect returned nothing — it was skipped, or it died after the runner's retries; re-run this lane")
  } catch (err) {
    return died(iss.number, `architect threw — re-run this lane: ${crashLine(err)}`)
  }
}))

// No filter: every requested issue leaves this script with an entry. The thunks cannot throw, so
// a null here is the runner itself dropping one, which is the same unattributable loss.
const ok = results.map((r, i) => r || died(input.issues[i].number, "the workflow runner for this issue returned nothing — it was skipped, or it died after the runner's retries; re-run this lane"))
log(`${ok.length}/${input.issues.length} plans returned (${ok.filter(r => r.status === 'READY').length} READY, ${ok.filter(r => r.status === 'BLOCKED').length} BLOCKED, ${ok.filter(r => r.status === 'DIED').length} DIED)`)
return ok
