export const meta = {
  name: 'dev-loop-plan',
  description: 'Phase A of /dev-loop — fan out implementation plans, one architect per issue',
  whenToUse: 'Invoked by the /dev-loop skill; not standalone.',
  phases: [{ title: 'Plan', detail: 'one architecture-engineer per issue, parallel' }],
}

// args: { issues: [{ number, title, project?, answers? }] }
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

const agentType = 'architecture-engineer'

// One shape for both ways an architect can fail to produce a plan. A requested issue is never
// silently dropped, so every path out of a thunk below produces one of these.
const died = (number, why) => ({ issue: number, status: 'DIED', planPath: '', summary: why, openQuestions: [] })

// Honest about what a throw actually carried: a dead agent often throws a bare value with neither
// a message nor a stack, and a summary promising a trace that is empty helps nobody. The same
// shape as phase-execute.js's, which cannot be shared — a phase script imports nothing, being
// compiled as one function over the runner's globals.
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
      `Mode 1 — implementation plan for GitHub issue #${iss.number} ("${iss.title}") in this repository.` +
      (iss.project ? ` Project slug: ${iss.project}.` : '') +
      (iss.answers ? ` The user answered your previous open questions as follows — incorporate them and do not re-ask: ${iss.answers}` : '') +
      ` Fetch the issue yourself, explore the code, write the plan file, and report status, plan path, summary, and open questions.`,
      { agentType, label: `plan:#${iss.number}`, phase: 'Plan', schema: PLAN_SCHEMA }
    )
    // A throw is the same outcome as a dead architect and takes the same entry.
    return r ? { issue: iss.number, ...r } : died(iss.number, 'architect died — re-run this lane')
  } catch (err) {
    return died(iss.number, `architect threw — re-run this lane: ${crashLine(err)}`)
  }
}))

// No filter: every requested issue leaves this script with an entry. The thunks cannot throw, so
// a null here is the runner itself dropping one, which is the same unattributable loss.
const ok = results.map((r, i) => r || died(input.issues[i].number, 'the workflow runner returned nothing for this issue — re-run this lane'))
log(`${ok.length}/${input.issues.length} plans returned (${ok.filter(r => r.status === 'READY').length} READY, ${ok.filter(r => r.status === 'BLOCKED').length} BLOCKED, ${ok.filter(r => r.status === 'DIED').length} DIED)`)
return ok
