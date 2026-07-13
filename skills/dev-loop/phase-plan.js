export const meta = {
  name: 'dev-loop-plan',
  description: 'Phase A of /dev-loop — fan out implementation plans, one architect per issue',
  whenToUse: 'Invoked by the /dev-loop skill; not standalone.',
  phases: [{ title: 'Plan', detail: 'one architecture-engineer per issue, parallel' }],
}

// args: { issues: [{ number, title, project?, answers? }], lite: boolean }
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

const agentType = input.lite ? 'architecture-engineer-lite' : 'architecture-engineer'

const results = await parallel(input.issues.map(iss => () =>
  agent(
    `Mode 1 — implementation plan for GitHub issue #${iss.number} ("${iss.title}") in this repository.` +
    (iss.project ? ` Project slug: ${iss.project}.` : '') +
    (iss.answers ? ` The user answered your previous open questions as follows — incorporate them and do not re-ask: ${iss.answers}` : '') +
    ` Fetch the issue yourself, explore the code, write the plan file, and report status, plan path, summary, and open questions.`,
    { agentType, label: `plan:#${iss.number}`, phase: 'Plan', schema: PLAN_SCHEMA }
  ).then(r => (r
    ? { issue: iss.number, ...r }
    : { issue: iss.number, status: 'DIED', planPath: '', summary: 'architect died — re-run this lane', openQuestions: [] }))
))

const ok = results.filter(Boolean)
log(`${ok.length}/${input.issues.length} plans returned (${ok.filter(r => r.status === 'READY').length} READY, ${ok.filter(r => r.status === 'BLOCKED').length} BLOCKED, ${ok.filter(r => r.status === 'DIED').length} DIED)`)
return ok
