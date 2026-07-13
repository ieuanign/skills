export const meta = {
  name: 'dev-loop-execute',
  description: 'Phase B of /dev-loop — per-lane implement, review, fix cycles, and conformance sign-off',
  whenToUse: 'Invoked by the /dev-loop skill per wave; not standalone.',
  phases: [
    { title: 'Implement', detail: 'code-writer per plan commit, sequential within a lane' },
    { title: 'Review', detail: 'reviewer + fix cycles (capped)' },
    { title: 'Sign-off', detail: 'architect Mode 2 conformance' },
  ],
}

// args: {
//   lanes: [{ issue, planPath, subLanes: [{ branch, worktree, base, area?, commits: [{ordinal, message}] }] }],
//   lite: boolean, maxFixCycles: number
// }
// subLanes contains only the CURRENT wave's sub-lanes; worktree is absolute.
// Returns per-lane:
// { issue, halted: string|null, subResults: [{branch, area, commits, deviations, disputed, reviewNotes, signoff}] }

// The harness may deliver args as a JSON string; normalize to an object.
const input = typeof args === 'string' ? JSON.parse(args) : args

const writerType = input.lite ? 'code-writer-lite' : 'code-writer'
const architectType = input.lite ? 'architecture-engineer-lite' : 'architecture-engineer'
const MAX_FIX = input.maxFixCycles || 2

const WRITER_SCHEMA = {
  type: 'object',
  properties: {
    result: { type: 'string', enum: ['COMMITTED', 'BLOCKED', 'FAILED'] },
    commits: { type: 'array', items: { type: 'string' }, description: 'sha + message per commit made' },
    verified: { type: 'string' },
    deviations: { type: 'number' },
    disputed: { type: 'number' },
    disputedFindings: { type: 'array', items: { type: 'string' }, description: 'each finding you refused to apply, restated with your refuting evidence — length matches disputed' },
    dirty: { type: 'string' },
    worktree: { type: 'string' },
    failing: { type: 'string', description: 'exact red command — FAILED only' },
    notes: { type: 'string' },
  },
  required: ['result'],
}
const REVIEW_SCHEMA = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['APPROVED', 'CHANGES_REQUESTED', 'ERROR'] },
    findings: { type: 'array', items: { type: 'string' }, description: 'file:line — defect — failure scenario — suggested fix' },
    contestedFindings: { type: 'array', items: { type: 'string' }, description: 'disputed findings you STILL confirm after re-verifying against the writer\'s evidence — empty unless disputes were given' },
    notes: { type: 'string' },
  },
  required: ['verdict', 'findings'],
}
const SIGNOFF_SCHEMA = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['PASS', 'PASS-WITH-NOTES', 'FAIL', 'ERROR'] },
    violations: { type: 'array', items: { type: 'string' } },
  },
  required: ['verdict'],
}
const DEBUG_SCHEMA = {
  type: 'object',
  properties: {
    rootCause: { type: 'string' },
    owner: { type: 'string', enum: ['code-writer', 'replan', 'user', 'retry'] },
    confidence: { type: 'string' },
    reproduced: { type: 'string' },
    finding: { type: 'string', description: 'when owner=code-writer: file:line — defect — failure scenario' },
  },
  required: ['rootCause', 'owner'],
}

function writerPrompt(lane, sub, instruction) {
  return `${instruction}\nPlan: ${lane.planPath} (absolute path — .scratch exists only in the main worktree).\nWork in the checkout at ${sub.worktree} on branch ${sub.branch} — cd there first, verify \`git branch --show-current\` prints ${sub.branch} (return BLOCKED if not), and work only inside that checkout.`
}

function absorb(rec, writerResult) {
  rec.commits.push(...(writerResult.commits || []))
  rec.deviations += writerResult.deviations || 0
  rec.disputed += writerResult.disputed || 0
}

const laneResults = await parallel(input.lanes.map(lane => async () => {
  const subResults = []
  const halt = reason => ({ issue: lane.issue, halted: reason, subResults })

  for (const sub of lane.subLanes) {
    const rec = {
      branch: sub.branch, area: sub.area || null,
      commits: [], deviations: 0, disputed: 0, reviewNotes: '', signoff: null,
      fixedFindings: [], wontFix: [],
    }
    subResults.push(rec)

    // 1. Implement each plan commit sequentially
    for (const c of sub.commits) {
      let res = await agent(
        writerPrompt(lane, sub, `Mode 1 — implement commit ${c.ordinal} ("${c.message}") from the plan's Commit / PR breakdown.`),
        { agentType: writerType, label: `write:#${lane.issue}:c${c.ordinal}`, phase: 'Implement', schema: WRITER_SCHEMA }
      )
      let tries = 0
      while (res && res.result === 'FAILED' && tries < 2) {
        tries++
        const diag = await agent(
          `A code-writer returned FAILED while implementing commit ${c.ordinal} ("${c.message}") of plan ${lane.planPath}. This is debug+fix attempt ${tries} of 2 — after 2 the lane stops and asks the human.\nIts return: ${JSON.stringify(res)}\nReproduce inside the checkout at ${sub.worktree} (branch ${sub.branch}) and diagnose. When owner=code-writer, phrase the handoff as a finding (file:line — defect — failure scenario).`,
          { agentType: 'debugger', label: `debug:#${lane.issue}:c${c.ordinal}:t${tries}`, phase: 'Implement', schema: DEBUG_SCHEMA }
        )
        if (!diag) return halt(`debugger died after FAILED commit ${c.ordinal}`)
        if (diag.owner === 'retry') {
          res = await agent(
            writerPrompt(lane, sub, `Mode 1 — implement commit ${c.ordinal} ("${c.message}"). A previous attempt failed transiently (debugger: ${diag.rootCause}); retry attempt ${tries} of 2.`),
            { agentType: writerType, label: `retry:#${lane.issue}:c${c.ordinal}:t${tries}`, phase: 'Implement', schema: WRITER_SCHEMA }
          )
        } else if (diag.owner === 'code-writer') {
          res = await agent(
            writerPrompt(lane, sub, `Mode 2 — fix this debugger-diagnosed defect (commit the fix as fix(<scope>): #<issue> - ...). Fix attempt ${tries} of 2.\nDiagnosis: ${diag.rootCause}\nFinding: ${diag.finding || '(see diagnosis)'}\nThen check git log: if plan commit ${c.ordinal} ("${c.message}") was never committed, complete it afterward under Mode 1 rules as its own commit with the plan's exact message.`),
            { agentType: writerType, label: `debugfix:#${lane.issue}:c${c.ordinal}:t${tries}`, phase: 'Implement', schema: WRITER_SCHEMA }
          )
        } else {
          const h = halt(`debugger routed to ${diag.owner}: ${diag.rootCause}`)
          h.diag = diag
          return h
        }
      }
      if (!res) return halt(`writer died on commit ${c.ordinal}`)
      if (res.result === 'FAILED') return halt(`commit ${c.ordinal} still FAILED after 2 debug+fix attempts — human decision needed`)
      if (res.result === 'BLOCKED') return halt(`writer BLOCKED on commit ${c.ordinal}: ${res.notes || ''}`)
      if (res.result !== 'COMMITTED') return halt(`commit ${c.ordinal} still ${res.result} after debug routing`)
      absorb(rec, res)
      log(`#${lane.issue}: commit ${c.ordinal}/${sub.commits.length} of ${sub.branch} done`)
    }

    // 2. Review → fix cycles (writer may dispute; contested disputes halt for human arbitration)
    let cycles = 0
    let disputes = []
    while (true) {
      const disputeClause = disputes.length
        ? `\nThe code-writer DISPUTED these findings with the evidence below — re-verify each against that evidence. Retract any where the evidence holds (record retractions in notes); list any you STILL confirm in contestedFindings — those halt the lane for human arbitration, so contest only what you can re-confirm with a concrete failure scenario:\n${disputes.join('\n')}`
        : ''
      const review = await agent(
        `Review branch ${sub.branch} against the plan at ${lane.planPath} (absolute path; read it with the Read tool).\nDiff exactly the range ${sub.base}..${sub.branch} — the base may itself be a stacked feature branch; never review the base's own commits.${disputeClause}`,
        { agentType: 'reviewer', label: `review:#${lane.issue}${sub.area ? ':' + sub.area : ''}${cycles ? ':r' + cycles : ''}`, phase: 'Review', schema: REVIEW_SCHEMA }
      )
      if (!review) return halt('reviewer died')
      if (review.verdict === 'ERROR') return halt(`reviewer ERROR: ${review.notes || ''}`)
      rec.reviewNotes = review.notes || ''
      if (review.contestedFindings && review.contestedFindings.length) {
        const h = halt(`NEEDS ARBITRATION — reviewer still confirms ${review.contestedFindings.length} finding(s) the writer disputed`)
        h.contested = review.contestedFindings
        h.disputes = disputes
        return h
      }
      if (disputes.length) rec.wontFix.push(...disputes) // reviewer retracted them — documented won't-fix
      disputes = []
      if (review.verdict === 'APPROVED') break
      if (cycles >= MAX_FIX) {
        const h = halt(`still CHANGES_REQUESTED after ${MAX_FIX} fix cycles — human decision needed`)
        h.review = review
        return h
      }
      cycles++
      const fix = await agent(
        writerPrompt(lane, sub, `Mode 2 — apply these reviewer findings (dispute any you can refute, with evidence):\n${review.findings.join('\n')}`),
        { agentType: writerType, label: `fix:#${lane.issue}:r${cycles}`, phase: 'Review', schema: WRITER_SCHEMA }
      )
      if (!fix || fix.result !== 'COMMITTED') {
        const h = halt(`fix cycle ${cycles} returned ${fix ? fix.result : 'nothing'}${fix && fix.disputed ? ` (DISPUTED: ${fix.disputed})` : ''}`)
        h.review = review
        h.fix = fix
        return h
      }
      absorb(rec, fix)
      disputes = fix.disputedFindings || []
      rec.fixedFindings.push(...review.findings.filter(f => !disputes.includes(f)))
      log(`#${lane.issue}: fix cycle ${cycles} committed${disputes.length ? ` (${disputes.length} disputed)` : ''}, re-reviewing`)
    }

    // 3. Conformance sign-off
    const sign = await agent(
      `Mode 2 — conformance sign-off.\nPlan: ${lane.planPath} (absolute path).\nImplementation ref: ${sub.branch}, base ${sub.base} — judge only this issue's commits in ${sub.base}..${sub.branch}.`,
      { agentType: architectType, label: `signoff:#${lane.issue}${sub.area ? ':' + sub.area : ''}`, phase: 'Sign-off', schema: SIGNOFF_SCHEMA }
    )
    if (!sign) return halt('sign-off agent died')
    if (sign.verdict === 'FAIL' || sign.verdict === 'ERROR') {
      const h = halt(`sign-off ${sign.verdict}`)
      h.sign = sign
      return h
    }
    rec.signoff = sign
    log(`#${lane.issue}: ${sub.branch} signed off (${sign.verdict})`)
  }
  return { issue: lane.issue, halted: null, subResults }
}))

const done = laneResults.filter(Boolean)
log(`${done.filter(l => !l.halted).length} lane(s) completed, ${done.filter(l => l.halted).length} halted`)
return done
