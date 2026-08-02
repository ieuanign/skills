export const meta = {
  name: 'dev-loop-execute',
  description: 'Phase B of /dev-loop — per-lane implement, review, and fix cycles',
  whenToUse: 'Invoked by the /dev-loop skill per wave; not standalone.',
  phases: [
    { title: 'Implement', detail: 'code-writer per plan commit, sequential within a lane' },
    { title: 'Review', detail: 'reviewer + fix cycles (capped)' },
    { title: 'Suite', detail: "the repo's full suite, once per sub-lane", model: 'haiku' },
  ],
}

// args: {
//   lanes: [{ issue, issueBody, planPath, subLanes: [{ branch, worktree, base, area?, commits: [{ordinal, message}] }] }],
//   maxFixCycles: number,
//   suiteCommand: string   // the profile's Full-suite command; 'none' or absent ⇒ every suite is not-run
// }
// subLanes contains only the CURRENT wave's sub-lanes; worktree is absolute.
// issueBody is the issue's body verbatim, which the host already fetched at intake — the
// reviewer's Spec axis reads it from its arguments rather than fetching it, keeping its
// Bash read-only and git-only. Omit it and the reviewer runs no spec axis.
// Returns per-lane:
// { issue, ending: {category: 'HALT'|'UNRESOLVED', reason: string}|null, subResults: [...] }
// ending null = the lane completed clean. HALT = nothing reviewable exists, no PR.
// UNRESOLVED = the code exists and is not clean; the lane's conclusion decides what that means.
// subResults: [{branch, area, commits, plannedCommits, madeCommits, deviations, disputed,
//               criterionVerdicts, reviewNotes, fixedFindings, wontFix, suite}]
// suite: {state: 'passed'|'failed'|'not-run', failing: [ids], output} — always present, whatever
// ended the sub-lane. 'not-run' is a state of its own and is never reported as passed.

// The harness may deliver args as a JSON string; normalize to an object.
const input = typeof args === 'string' ? JSON.parse(args) : args

const writerType = 'code-writer'
const MAX_FIX = input.maxFixCycles || 2

// Configuration, never discovery: a discovered command that needs infrastructure this pipeline
// does not stand up returns a red result that means nothing. 'none' is a real, persisted answer.
const suiteCommand = String(input.suiteCommand || '').trim()
const suiteConfigured = Boolean(suiteCommand) && suiteCommand.toLowerCase() !== 'none'
const SUITE_CEILING = 8

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
    criterionVerdicts: {
      type: 'array',
      description: 'Spec axis: one entry per acceptance criterion in the issue body, in the issue\'s order — empty when no issue body was passed. Never blocking: these change neither verdict nor findings.',
      items: {
        type: 'object',
        properties: {
          criterion: { type: 'string', description: 'the criterion, quoted or trimmed to its first clause' },
          verdict: { type: 'string', enum: ['met', 'partial', 'not-met'] },
          evidence: { type: 'string', description: 'file:line, the test that shows it, or what you looked for and did not find' },
        },
        required: ['criterion', 'verdict', 'evidence'],
      },
    },
    notes: { type: 'string' },
  },
  required: ['verdict', 'findings'],
}
const SUITE_SCHEMA = {
  type: 'object',
  properties: {
    state: { type: 'string', enum: ['passed', 'failed', 'not-run'] },
    failing: { type: 'array', items: { type: 'string' }, description: "the runner's own identifier per failing test — empty unless state is failed" },
    output: { type: 'string', description: "the command's output, trimmed to the failing portion if it is long" },
  },
  required: ['state', 'failing', 'output'],
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

// The body is fenced rather than interpolated bare: issue bodies are markdown and routinely
// contain the same headings and checklists the surrounding prompt uses.
// The scope line matters on multi-PR plans: the criteria belong to the whole issue but the
// range is one sub-lane, so without it every early PR reads as failing work not yet due.
function specClause(lane, sub) {
  if (!lane.issueBody) {
    return `\n\nNo issue body was passed, so there is no spec axis this run — return an empty criterionVerdicts and say so in notes.`
  }
  const scope = `You are judging ONE sub-lane of this issue${sub.area ? ` (area: ${sub.area})` : ''} — the range above, no more. A criterion the plan's Commit / PR breakdown delivers in a different sub-lane is 'partial', naming that sub-lane; never 'not-met'.`
  return `\n\nSpec axis — issue #${lane.issue}'s body verbatim, between the markers below. Judge the diff against its acceptance criteria and return one criterionVerdicts entry per criterion, in the issue's order. ${scope} These NEVER block: they stay out of findings, do not change the verdict, and trigger no fix cycle.\n<<<<ISSUE-BODY\n${lane.issueBody}\nISSUE-BODY>>>>`
}

// No agent type and no persona: loading a role definition — merge-base rules, blocking bars,
// dispute handling — to run one command is waste. The command is quoted, never described.
function suitePrompt(sub) {
  return `Run this repository's full test suite once and report what it did. Nothing else: fix nothing, commit nothing, modify no file.\ncd ${sub.worktree} (branch ${sub.branch}) and run exactly this command:\n${suiteCommand}\nReturn state 'passed' when it exits 0, 'failed' when it does not, and 'not-run' when the command cannot run at all (no such script, no such runner) — never 'passed' for a suite you did not actually run. When it failed, put every failing test in failing using the runner's own identifier for it (file path plus test name), and the command's output in output.`
}

function absorb(rec, writerResult) {
  rec.commits.push(...(writerResult.commits || []))
  rec.madeCommits = rec.commits.length // kept live so a sub-lane that ends early still reports its counts
  rec.deviations += writerResult.deviations || 0
  rec.disputed += writerResult.disputed || 0
}

const laneResults = await parallel(input.lanes.map(lane => async () => {
  const subResults = []
  const end = (category, reason) => ({ issue: lane.issue, ending: { category, reason }, subResults })
  const halt = reason => end('HALT', reason)
  const unresolved = reason => end('UNRESOLVED', reason)

  for (const sub of lane.subLanes) {
    const rec = {
      branch: sub.branch, area: sub.area || null,
      // Both counts are scoped to THIS run: on resume sub.commits is the remainder, so the
      // pair still detects a split or an append, it just isn't the plan's grand total.
      commits: [], plannedCommits: sub.commits.length, madeCommits: 0,
      deviations: 0, disputed: 0, criterionVerdicts: [], reviewNotes: '',
      fixedFindings: [], wontFix: [],
      // Never absent: the ledger renders passed / failed / not-run-and-why, and has no rendering
      // for a missing value. A sub-lane the review loop ends never reaches the gate, and must
      // still say so — an empty slot is exactly the "reads as green" this state exists to prevent.
      suite: { state: 'not-run', failing: [], output: 'the sub-lane ended before the suite gate ran' },
    }
    subResults.push(rec)
    const tag = `#${lane.issue}${sub.area ? ':' + sub.area : ''}`

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
      if (res.result === 'FAILED') return halt(`commit ${c.ordinal} still FAILED after 2 debug+fix attempts — the commit was never produced`)
      if (res.result === 'BLOCKED') return halt(`writer BLOCKED on commit ${c.ordinal}: ${res.notes || ''}`)
      if (res.result !== 'COMMITTED') return halt(`commit ${c.ordinal} still ${res.result} after debug routing`)
      absorb(rec, res)
      log(`#${lane.issue}: commit ${c.ordinal}/${sub.commits.length} of ${sub.branch} done`)
    }

    // 2. Review → fix cycles (writer may dispute; contested disputes end the lane UNRESOLVED)
    let cycles = 0
    let disputes = []
    while (true) {
      const disputeClause = disputes.length
        ? `\nThe code-writer DISPUTED these findings with the evidence below — re-verify each against that evidence. Retract any where the evidence holds (record retractions in notes); list any you STILL confirm in contestedFindings — those end the lane UNRESOLVED with the stalemate unbroken, so contest only what you can re-confirm with a concrete failure scenario:\n${disputes.join('\n')}`
        : ''
      const review = await agent(
        `Review branch ${sub.branch} against the plan at ${lane.planPath} (absolute path; read it with the Read tool).\nDiff exactly the range ${sub.base}..${sub.branch} — the base may itself be a stacked feature branch; never review the base's own commits.${disputeClause}${specClause(lane, sub)}`,
        { agentType: 'reviewer', label: `review:${tag}${cycles ? ':r' + cycles : ''}`, phase: 'Review', schema: REVIEW_SCHEMA }
      )
      if (!review) return halt('reviewer died')
      if (review.verdict === 'ERROR') return halt(`reviewer ERROR: ${review.notes || ''}`)
      rec.reviewNotes = review.notes || ''
      // Recorded before every ending below so an UNRESOLVED lane still carries them; the
      // last review's verdicts win. Read nowhere else in this file — the spec axis is
      // reported, never blocking, so nothing branches on them.
      rec.criterionVerdicts = review.criterionVerdicts || []
      if (review.contestedFindings && review.contestedFindings.length) {
        const u = unresolved(`contested findings — reviewer still confirms ${review.contestedFindings.length} finding(s) the writer disputed`)
        u.contested = review.contestedFindings
        u.disputes = disputes
        return u
      }
      if (disputes.length) rec.wontFix.push(...disputes) // reviewer retracted them — documented won't-fix
      disputes = []
      if (review.verdict === 'APPROVED') break
      if (cycles >= MAX_FIX) {
        const u = unresolved(`still CHANGES_REQUESTED after ${MAX_FIX} fix cycles — the code exists, its findings are open`)
        u.review = review
        return u
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

    // 3. Suite gate — the repo's own full suite, once per sub-lane, after the findings settle.
    // Every ending here is UNRESOLVED and never HALT: the gate runs only once the plan's commits
    // exist and a review approved them, and the categories turn on whether reviewable code does.
    if (!suiteConfigured) {
      // A declared 'none' is answered, not unanswered — so no agent is spent to run nothing.
      rec.suite = { state: 'not-run', failing: [], output: 'no full-suite command is configured for this repository' }
      log(`#${lane.issue}: ${sub.branch} suite not run — no full-suite command configured`)
    } else {
      const seen = new Set()          // every failing identifier this sub-lane has ever shown
      let roundsWithoutNewFailure = 0 // consecutive red rounds that brought nothing previously unseen
      let round = 0
      while (true) {
        round++
        const suffix = round > 1 ? `:r${round}` : ''
        const suite = await agent(suitePrompt(sub), {
          label: `suite:${tag}${suffix}`, phase: 'Suite', model: 'haiku', effort: 'low', schema: SUITE_SCHEMA,
        })
        if (!suite) {
          rec.suite = { state: 'not-run', failing: [], output: 'the suite gate died before it reported' }
          return unresolved(`suite gate died on ${sub.branch} — the suite never ran`)
        }
        rec.suite = { state: suite.state, failing: suite.failing || [], output: suite.output || '' }
        log(`#${lane.issue}: ${sub.branch} suite ${rec.suite.state}${round > 1 ? ` (round ${round})` : ''}`)
        if (rec.suite.state !== 'failed') break

        // Progress-sensitive, not a flat cap: a shrinking set of the same failures is not progress.
        const fresh = rec.suite.failing.filter(id => !seen.has(id))
        rec.suite.failing.forEach(id => seen.add(id))
        roundsWithoutNewFailure = fresh.length ? 1 : roundsWithoutNewFailure + 1
        const redReason = `suite red on ${sub.branch} — ${rec.suite.failing.length} failing test(s): ${rec.suite.failing.join(', ')}`
        if (roundsWithoutNewFailure >= 2) return unresolved(`${redReason} — 2 rounds brought no previously unseen failure`)
        // Checked before the debugger, so no agent is spent on a round that cannot run. A
        // mis-parsed identifier list looks new every round and would reset the counter forever.
        if (round >= SUITE_CEILING) return unresolved(`${redReason} — the ${SUITE_CEILING}-round ceiling`)

        // A red suite is a failure, not a finding: the gate observed only that it is red, and the
        // breakage is usually outside the writer's commit scope. Same routing as a FAILED commit.
        const diag = await agent(
          `The repository's full test suite is red on branch ${sub.branch}, after its review loop settled. This is round ${round} of at most ${SUITE_CEILING} for this sub-lane.\nThe suite gate ran \`${suiteCommand}\` inside ${sub.worktree} and returned: ${JSON.stringify(rec.suite)}\nReproduce inside that checkout and diagnose. The breakage is often outside the commit scope of the work on this branch — say so if it is. When owner=code-writer, phrase the handoff as a finding (file:line — defect — failure scenario).`,
          { agentType: 'debugger', label: `suitedebug:${tag}:r${round}`, phase: 'Suite', schema: DEBUG_SCHEMA }
        )
        if (!diag) return unresolved(`debugger died on a red suite on ${sub.branch}: ${redReason}`)
        if (diag.owner === 'code-writer') {
          const fix = await agent(
            writerPrompt(lane, sub, `Mode 2 — the repository's full suite is red and a debugger diagnosed it. Fix it and commit as fix(<scope>): #${lane.issue} - ... . Suite round ${round}.\nDiagnosis: ${diag.rootCause}\nFinding: ${diag.finding || '(see diagnosis)'}\nFailing: ${rec.suite.failing.join(', ')}`),
            { agentType: writerType, label: `suitefix:${tag}:r${round}`, phase: 'Suite', schema: WRITER_SCHEMA }
          )
          if (!fix || fix.result !== 'COMMITTED') {
            return unresolved(`suite fix round ${round} returned ${fix ? fix.result : 'nothing'} — ${redReason}`)
          }
          absorb(rec, fix)
        } else if (diag.owner !== 'retry') {
          // replan | user — UNRESOLVED, not HALT: the code exists and has been reviewed.
          return unresolved(`debugger routed a red suite to ${diag.owner}: ${diag.rootCause} — ${redReason}`)
        }
      }
    }

    // 4. Commit-breakdown check — plain list diff, reported and never blocking
    log(`#${lane.issue}: ${sub.branch} done (${rec.plannedCommits} planned, ${rec.madeCommits} made)`)
  }
  return { issue: lane.issue, ending: null, subResults }
}))

const done = laneResults.filter(Boolean)
const count = c => done.filter(l => l.ending && l.ending.category === c).length
log(`${done.filter(l => !l.ending).length} lane(s) completed, ${count('UNRESOLVED')} UNRESOLVED, ${count('HALT')} HALT`)
return done
