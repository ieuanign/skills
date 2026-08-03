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
//   mode: 'gated' | 'unattended',
//   maxFixCycles: number,  // the profile's Fix cycles key; absent ⇒ the profile's default of 2
//   suiteCommand: string   // the profile's Full-suite command; 'none' or absent ⇒ every suite is not-run
// }
// subLanes contains only the CURRENT wave's sub-lanes; worktree is absolute.
// issueBody is the issue's body verbatim, which the host already fetched at intake — the
// reviewer's Spec axis reads it from its arguments rather than fetching it, keeping its
// Bash read-only and git-only. Omit it and the reviewer runs no spec axis.
// Returns per-lane:
// { issue, mode, ending: {category: 'HALT'|'FAILED', reason: string}|null, subResults: [...] }
// mode is the run mode the host parsed, carried out unchanged rather than re-derived — whatever
// concludes the lane reads it off the result it already holds.
// An ending ends its SUB-lane, so the lane's ending is a roll-up for reporting only: FAILED if
// any sub-lane ended FAILED, else HALT if any did, else null. The label decides nothing — the
// conclusion mode alone decides the push, the PR and the worktree.
// subResults: [{branch, area, ending, commits, plannedCommits, madeCommits, deviations, disputed,
//               criterionVerdicts, reviewNotes, fixedFindings, wontFix, suite, attempts}]
// suite: {state: 'passed'|'failed'|'not-run', failing: [ids], output} — always present, whatever
// ended the sub-lane. 'not-run' is a state of its own and is never reported as passed.
// attempts: [{stage, trigger, debugger, outcome}] — the ledger's attempt log, recorded on every
// sub-lane and rendered only on one that ended. A wip: commit is listed but never counted.

// The harness may deliver args as a JSON string; normalize to an object.
const input = typeof args === 'string' ? JSON.parse(args) : args

const writerType = 'code-writer'

// The fix-cycle bound is a repository fact, not a constant: a repository with a flaky suite wants
// more cycles, and one that would rather read every finding itself answers 0. The host passes the
// profile's value; the 2 below is the profile's own default, reached only when a host passed no
// number at all. `|| 2` would be wrong — it turns a deliberate 0 back into two cycles.
const MAX_FIX = Number.isInteger(input.maxFixCycles) && input.maxFixCycles >= 0 ? input.maxFixCycles : 2

// Passed in, never re-derived. Nothing here branches on it yet — the notifier and the unattended
// conclusion will. Anything but 'unattended' is gated, so an unknown mode never suppresses a gate.
const MODE = input.mode === 'unattended' ? 'unattended' : 'gated'

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

// The FINAL permitted attempt only: it is the only call after which the pipeline is certain to
// give up, and a wip: commit on a sub-lane that then succeeds would stop meaning "ended".
function giveUpClause(lane, c, tries) {
  if (tries < 2) return ''
  return `\nThis is the FINAL permitted attempt — nothing runs after it. If you still cannot get green, do not leave the work uncommitted: commit what exists as \`wip(<scope>): #${lane.issue} - commit ${c.ordinal} FAILED - <reason>\` and return FAILED anyway. That commit is evidence for the human, not work.`
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

// The give-up path's abandoned work: evidence, not work. Listed so the human sees it, never
// counted — counting it would report `1 planned, 2 made` for a sub-lane that made one.
// A commit line is free text the writer composed to the schema's "sha + message" description, so
// the sha and whatever separator it chose are stripped before the prefix is read: `ddd1234 - wip(…)`
// is the same commit as `ddd1234 wip(…)`, and a miscount here is the one thing the exclusion exists
// to prevent.
const isWip = line => /^\W*(?:[0-9a-f]{7,40}\b\W*)?wip[(:]/i.test(line)

function absorb(rec, writerResult) {
  rec.commits.push(...(writerResult.commits || []))
  rec.madeCommits = rec.commits.filter(l => !isWip(l)).length // kept live so a sub-lane that ends early still reports its counts
  rec.deviations += writerResult.deviations || 0
  rec.disputed += writerResult.disputed || 0
}

// Opened when a recovery starts and closed when its outcome is known, so the log is appended
// without any loop asking whether the sub-lane will end.
const attemptOf = (rec, stage, trigger) => {
  const a = { stage, trigger, debugger: '', outcome: '' }
  rec.attempts.push(a)
  return a
}

// An ending is recorded on the sub-lane's own record, and returning from the sub-lane body is
// what stops every later stage of THAT sub-lane and nothing else — sub-lanes are separate
// branches, worktrees and pull requests, so the lane keeps going.
const end = (rec, category, reason, payload) => {
  rec.ending = { category, reason }
  if (payload) Object.assign(rec, payload)
  // An attempt still open when the sub-lane ends: the ending is its outcome.
  const open = rec.attempts[rec.attempts.length - 1]
  if (open && !open.outcome) open.outcome = reason
  // The ledger has no rendering for an absent suite state, so a sub-lane that never reached the
  // gate names the ending that stopped it rather than reading as green.
  if (rec.suite.state === 'not-run' && !rec.suite.output) {
    rec.suite.output = `the sub-lane ended before the suite gate ran: ${reason}`
  }
}
const halt = (rec, reason, payload) => end(rec, 'HALT', reason, payload)
const failed = (rec, reason, payload) => end(rec, 'FAILED', reason, payload)

const laneResults = await parallel(input.lanes.map(lane => async () => {
  const subResults = []

  const runSubLane = async (sub, rec) => {
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
        const attempt = attemptOf(rec, 'Implement', `commit ${c.ordinal} returned FAILED (debug+fix attempt ${tries} of 2)`)
        const diag = await agent(
          `A code-writer returned FAILED while implementing commit ${c.ordinal} ("${c.message}") of plan ${lane.planPath}. This is debug+fix attempt ${tries} of 2 — after 2 the sub-lane ends.\nIts return: ${JSON.stringify(res)}\nReproduce inside the checkout at ${sub.worktree} (branch ${sub.branch}) and diagnose. When owner=code-writer, phrase the handoff as a finding (file:line — defect — failure scenario).`,
          { agentType: 'debugger', label: `debug:#${lane.issue}:c${c.ordinal}:t${tries}`, phase: 'Implement', schema: DEBUG_SCHEMA }
        )
        if (!diag) return failed(rec, `debugger died after FAILED commit ${c.ordinal}`)
        attempt.debugger = `${diag.owner}: ${diag.rootCause}`
        if (diag.owner === 'retry') {
          res = await agent(
            writerPrompt(lane, sub, `Mode 1 — implement commit ${c.ordinal} ("${c.message}"). A previous attempt failed transiently (debugger: ${diag.rootCause}); retry attempt ${tries} of 2.${giveUpClause(lane, c, tries)}`),
            { agentType: writerType, label: `retry:#${lane.issue}:c${c.ordinal}:t${tries}`, phase: 'Implement', schema: WRITER_SCHEMA }
          )
          attempt.outcome = `the retry returned ${res ? res.result : 'nothing'}`
        } else if (diag.owner === 'code-writer') {
          res = await agent(
            writerPrompt(lane, sub, `Mode 2 — fix this debugger-diagnosed defect (commit the fix as fix(<scope>): #<issue> - ...). Fix attempt ${tries} of 2.\nDiagnosis: ${diag.rootCause}\nFinding: ${diag.finding || '(see diagnosis)'}\nThen check git log: if plan commit ${c.ordinal} ("${c.message}") was never committed, complete it afterward under Mode 1 rules as its own commit with the plan's exact message.${giveUpClause(lane, c, tries)}`),
            { agentType: writerType, label: `debugfix:#${lane.issue}:c${c.ordinal}:t${tries}`, phase: 'Implement', schema: WRITER_SCHEMA }
          )
          attempt.outcome = `the fix returned ${res ? res.result : 'nothing'}`
        } else {
          return halt(rec, `debugger routed to ${diag.owner}: ${diag.rootCause}`, { diag })
        }
      }
      if (!res) return failed(rec, `writer died on commit ${c.ordinal}`)
      if (res.result === 'FAILED') {
        absorb(rec, res) // the final attempt was told to commit what exists — pick that evidence up
        return halt(rec, `commit ${c.ordinal} still FAILED after 2 debug+fix attempts — the commit was never produced`)
      }
      if (res.result === 'BLOCKED') return halt(rec, `writer BLOCKED on commit ${c.ordinal}: ${res.notes || ''}`)
      if (res.result !== 'COMMITTED') return failed(rec, `commit ${c.ordinal} still ${res.result} after debug routing`)
      absorb(rec, res)
      log(`#${lane.issue}: commit ${c.ordinal}/${sub.commits.length} of ${sub.branch} done`)
    }

    // 2. Review → fix cycles (writer may dispute; contested disputes end the sub-lane)
    let cycles = 0
    let disputes = []
    while (true) {
      const disputeClause = disputes.length
        ? `\nThe code-writer DISPUTED these findings with the evidence below — re-verify each against that evidence. Retract any where the evidence holds (record retractions in notes); list any you STILL confirm in contestedFindings — those end the sub-lane with the stalemate unbroken, so contest only what you can re-confirm with a concrete failure scenario:\n${disputes.join('\n')}`
        : ''
      const review = await agent(
        `Review branch ${sub.branch} against the plan at ${lane.planPath} (absolute path; read it with the Read tool).\nDiff exactly the range ${sub.base}..${sub.branch} — the base may itself be a stacked feature branch; never review the base's own commits.${disputeClause}${specClause(lane, sub)}`,
        { agentType: 'reviewer', label: `review:${tag}${cycles ? ':r' + cycles : ''}`, phase: 'Review', schema: REVIEW_SCHEMA }
      )
      // Both are returns the loop cannot use, not verdicts about the code.
      if (!review) return failed(rec, 'reviewer died')
      if (review.verdict === 'ERROR') return failed(rec, `reviewer ERROR: ${review.notes || ''}`)
      rec.reviewNotes = review.notes || ''
      // Recorded before every ending below so an ended sub-lane still carries them; the
      // last review's verdicts win. Read nowhere else in this file — the spec axis is
      // reported, never blocking, so nothing branches on them.
      rec.criterionVerdicts = review.criterionVerdicts || []
      if (review.contestedFindings && review.contestedFindings.length) {
        return halt(rec, `contested findings — reviewer still confirms ${review.contestedFindings.length} finding(s) the writer disputed`,
          { contested: review.contestedFindings, disputes })
      }
      if (disputes.length) rec.wontFix.push(...disputes) // reviewer retracted them — documented won't-fix
      disputes = []
      if (review.verdict === 'APPROVED') break
      if (cycles >= MAX_FIX) {
        return halt(rec, `still CHANGES_REQUESTED after ${MAX_FIX} fix cycles — the findings are still open`, { review })
      }
      cycles++
      const attempt = attemptOf(rec, 'Review', `CHANGES_REQUESTED — ${review.findings.length} finding(s), fix cycle ${cycles} of ${MAX_FIX}`)
      const fix = await agent(
        writerPrompt(lane, sub, `Mode 2 — apply these reviewer findings (dispute any you can refute, with evidence):\n${review.findings.join('\n')}`),
        { agentType: writerType, label: `fix:#${lane.issue}:r${cycles}`, phase: 'Review', schema: WRITER_SCHEMA }
      )
      attempt.outcome = `the fix returned ${fix ? fix.result : 'nothing'}`
      if (!fix || fix.result !== 'COMMITTED') {
        const reason = `fix cycle ${cycles} returned ${fix ? fix.result : 'nothing'}${fix && fix.disputed ? ` (DISPUTED: ${fix.disputed})` : ''}`
        const stopped = fix && fix.result === 'BLOCKED' // a reasoned refusal, not a break
        return (stopped ? halt : failed)(rec, reason, { review, fix })
      }
      absorb(rec, fix)
      disputes = fix.disputedFindings || []
      rec.fixedFindings.push(...review.findings.filter(f => !disputes.includes(f)))
      log(`#${lane.issue}: fix cycle ${cycles} committed${disputes.length ? ` (${disputes.length} disputed)` : ''}, re-reviewing`)
    }

    // 3. Suite gate — the repo's own full suite, once per sub-lane, after the findings settle.
    // Nothing about this stage is special: the same question labels its endings as every other's.
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
          return failed(rec, `suite gate died on ${sub.branch} — the suite never ran`)
        }
        rec.suite = { state: suite.state, failing: suite.failing || [], output: suite.output || '' }
        log(`#${lane.issue}: ${sub.branch} suite ${rec.suite.state}${round > 1 ? ` (round ${round})` : ''}`)
        if (rec.suite.state !== 'failed') break

        // Progress-sensitive, not a flat cap: a shrinking set of the same failures is not progress.
        const fresh = rec.suite.failing.filter(id => !seen.has(id))
        rec.suite.failing.forEach(id => seen.add(id))
        roundsWithoutNewFailure = fresh.length ? 1 : roundsWithoutNewFailure + 1
        const redReason = `suite red on ${sub.branch} — ${rec.suite.failing.length} failing test(s): ${rec.suite.failing.join(', ')}`
        const attempt = attemptOf(rec, 'Suite', `${redReason} (round ${round} of at most ${SUITE_CEILING})`)
        if (roundsWithoutNewFailure >= 2) return halt(rec, `${redReason} — 2 rounds brought no previously unseen failure`)
        // Checked before the debugger, so no agent is spent on a round that cannot run. A
        // mis-parsed identifier list looks new every round and would reset the counter forever.
        if (round >= SUITE_CEILING) return halt(rec, `${redReason} — the ${SUITE_CEILING}-round ceiling`)

        // A red suite is a failure, not a finding: the gate observed only that it is red, and the
        // breakage is usually outside the writer's commit scope. Same routing as a FAILED commit.
        const diag = await agent(
          `The repository's full test suite is red on branch ${sub.branch}, after its review loop settled. This is round ${round} of at most ${SUITE_CEILING} for this sub-lane.\nThe suite gate ran \`${suiteCommand}\` inside ${sub.worktree} and returned: ${JSON.stringify(rec.suite)}\nReproduce inside that checkout and diagnose. The breakage is often outside the commit scope of the work on this branch — say so if it is. When owner=code-writer, phrase the handoff as a finding (file:line — defect — failure scenario).`,
          { agentType: 'debugger', label: `suitedebug:${tag}:r${round}`, phase: 'Suite', schema: DEBUG_SCHEMA }
        )
        if (!diag) return failed(rec, `debugger died on a red suite on ${sub.branch}: ${redReason}`)
        attempt.debugger = `${diag.owner}: ${diag.rootCause}`
        if (diag.owner === 'code-writer') {
          const fix = await agent(
            writerPrompt(lane, sub, `Mode 2 — the repository's full suite is red and a debugger diagnosed it. Fix it and commit as fix(<scope>): #${lane.issue} - ... . Suite round ${round}.\nDiagnosis: ${diag.rootCause}\nFinding: ${diag.finding || '(see diagnosis)'}\nFailing: ${rec.suite.failing.join(', ')}`),
            { agentType: writerType, label: `suitefix:${tag}:r${round}`, phase: 'Suite', schema: WRITER_SCHEMA }
          )
          attempt.outcome = `the fix returned ${fix ? fix.result : 'nothing'}`
          if (!fix || fix.result !== 'COMMITTED') {
            const reason = `suite fix round ${round} returned ${fix ? fix.result : 'nothing'} — ${redReason}`
            const stopped = fix && fix.result === 'BLOCKED'
            return (stopped ? halt : failed)(rec, reason)
          }
          absorb(rec, fix)
        } else if (diag.owner === 'retry') {
          attempt.outcome = 'a retry — the gate runs again, with nothing to fix'
        } else {
          // replan | user — the route reads the same here as in the implement loop.
          return halt(rec, `debugger routed a red suite to ${diag.owner}: ${diag.rootCause} — ${redReason}`, { diag })
        }
      }
    }

    // 4. Commit-breakdown check — plain list diff, reported and never blocking
    log(`#${lane.issue}: ${sub.branch} done (${rec.plannedCommits} planned, ${rec.madeCommits} made)`)
  }

  for (const sub of lane.subLanes) {
    const rec = {
      branch: sub.branch, area: sub.area || null, ending: null,
      // Both counts are scoped to THIS run: on resume sub.commits is the remainder, so the
      // pair still detects a split or an append, it just isn't the plan's grand total.
      commits: [], plannedCommits: sub.commits.length, madeCommits: 0,
      deviations: 0, disputed: 0, criterionVerdicts: [], reviewNotes: '',
      fixedFindings: [], wontFix: [], attempts: [],
      // Never absent: the ledger renders passed / failed / not-run-and-why, and has no rendering
      // for a missing value. A sub-lane an ending stops never reaches the gate, and must still
      // say so — end() fills the why in, since only it knows what stopped it.
      suite: { state: 'not-run', failing: [], output: '' },
    }
    subResults.push(rec)
    await runSubLane(sub, rec)
  }

  // Reporting only, and FAILED wins — the same precedence notifications.md applies to the
  // per-issue label. Each sub-lane's own ending is what decides its disposition, since each
  // sub-lane is its own pull request.
  const ended = subResults.filter(r => r.ending)
  const rollUp = ended.find(r => r.ending.category === 'FAILED') || ended[0]
  return { issue: lane.issue, mode: MODE, ending: rollUp ? { ...rollUp.ending } : null, subResults }
}))

const done = laneResults.filter(Boolean)
const count = c => done.filter(l => l.ending && l.ending.category === c).length
log(`${done.filter(l => !l.ending).length} lane(s) completed, ${count('HALT')} HALT, ${count('FAILED')} FAILED`)
return done
