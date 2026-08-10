export const meta = {
  name: 'pr-comments-fix',
  description: 'The fix phase of /pr-comments — implement, review and suite over one branch',
  whenToUse: 'Invoked by the /pr-comments skill once its table has fix rows; not standalone.',
  phases: [
    { title: 'Implement', detail: 'code-writer per fix row, sequential on one branch' },
    { title: 'Review', detail: 'reviewer + fix cycles (capped)' },
    { title: 'Suite', detail: "the repo's full suite, once", model: 'haiku' },
  ],
}

// Derived from skills/dev-loop/phase-execute.js, and deliberately a copy rather than a shared
// dependency: that script runs many lanes over many issues, this one runs one pull request's fix
// rows on the branch the pull request already has. What must not drift from it — the two debug+fix
// attempts with the give-up clause on the final one, the review loop's no-progress threshold under
// its 5-fix-cycle ceiling, the suite gate's 8-round and 2-rounds-without-a-new-failure bounds, the
// HALT and FAILED labels, and the one sentence every stage that returned nothing carries.
//
// It emits no lane-and-stage marker. The cost report buckets transcripts by that marker's issue
// number, and one written here would file this run's under the /dev-loop lane sharing the number.

// args: {
//   pr: number,                    // the pull request being fixed; reaches every label and prompt
//   planPath: string,              // absolute — the writer reads it before anything else
//   worktree: string,              // absolute — the checkout every agent works in
//   branch: string,                // the pull request's own branch, the only one this touches
//   base: string,                  // the sha the review diffs from, captured before anything landed
//   commits: [string],             // one commit message per fix row, IN ORDER; position = ordinal
//   suiteCommand: string,          // 'none' or absent ⇒ the suite is not-run
//   fixCycleThreshold: number,     // the review loop's NO-PROGRESS THRESHOLD, not a flat cap; absent ⇒ 2
//   agentNamespace: string         // the roster's registry namespace; absent ⇒ bare names
// }

// Returns the record directly — there is one branch, one worktree and one pull request, so there is
// nothing to nest it in:
// { branch, ending: {category, reason}|null, commits, plannedCommits, madeCommits, deviations,
//   disputed, reviewNotes, fixedFindings, wontFix, openFindings, reviewTrajectory, suite, attempts }
//
// reviewTrajectory: one entry per CHANGES_REQUESTED round, whether it brought unseen findings.
// suite: {state: 'passed'|'failed'|'not-run', failing, output} — always present; not-run is never passed.
// attempts: [{stage, trigger, debugger, outcome}] — a wip: commit is listed but never counted.

// The harness may deliver args as a JSON string; normalize to an object.
const input = typeof args === 'string' ? JSON.parse(args) : args

// The same definition registers bare when linked into `.claude/agents/` and `<plugin>:<name>` when
// installed, so a literal type RUNS ONLY FOR THE MAINTAINER. Absent ⇒ bare; a trailing colon is fine.
const NS = String(input.agentNamespace || '').trim().replace(/:+$/, '')
const roleAgent = role => (NS ? `${NS}:${role}` : role)

const writerType = roleAgent('code-writer')

const pr = input.pr
const planPath = String(input.planPath || '')
const worktree = String(input.worktree || '')
const branch = String(input.branch || '')
const base = String(input.base || '')

// Flat message strings, and a row's POSITION here is the ordinal every prompt, label and log line
// names — so the list the caller passes and the plan file it wrote cannot number the same fix twice.
const commits = Array.isArray(input.commits) ? input.commits : []

// The position the counter must REACH, not a count of rounds tolerated. `|| 2` would be wrong —
// it turns a deliberate 0 back into two cycles.
const NO_PROGRESS_THRESHOLD = Number.isInteger(input.fixCycleThreshold) && input.fixCycleThreshold >= 0 ? input.fixCycleThreshold : 2

// Applied whatever the trajectory says: a mis-compared finding list looks new every round and would
// reset the threshold forever. Lower than the suite gate's — a cycle here costs two agents, not one.
const REVIEW_CEILING = 5

// Configuration, never discovery: a discovered command that needs infrastructure nobody stood up
// returns a red result that means nothing. 'none' is a real, persisted answer.
const suiteCommand = String(input.suiteCommand || '').trim()
const suiteConfigured = Boolean(suiteCommand) && suiteCommand.toLowerCase() !== 'none'
const SUITE_CEILING = 8

// The return contracts, as JSON schemas the runner validates each dispatch against. The CONTRACT
// KEYS are the contract — every branch below splits on an enum value, never on the prose around it.
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
// No spec axis and so no criterionVerdicts: a pull request's comments are not an issue's acceptance
// criteria, and a reviewer asked for verdicts on a checklist nobody wrote would invent one.
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
// The suite gate is the one role with no agent definition to carry its format, so this schema and
// the prompt below are its whole specification. not-run is a state of its own, never passed.
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

function writerPrompt(instruction) {
  return `${instruction}\nPlan: ${planPath} (absolute path — it lives in the main worktree).\nWork in the checkout at ${worktree} on branch ${branch} — cd there first, verify \`git branch --show-current\` prints ${branch} (return BLOCKED if not), and work only inside that checkout.`
}

// The FINAL permitted attempt only: it is the only call after which the run is certain to give up,
// and a wip: commit on a run that then succeeded would stop meaning "ended".
function giveUpClause(ordinal, tries) {
  if (tries < 2) return ''
  return `\nThis is the FINAL permitted attempt — nothing runs after it. If you still cannot get green, do not leave the work uncommitted: commit what exists as \`wip(<scope>): #${pr} - commit ${ordinal} FAILED - <reason>\` and return FAILED anyway. That commit is evidence for the human, not work.`
}

// No agent type and no persona: loading a role definition — merge-base rules, blocking bars,
// dispute handling — to run one command is waste. The command is quoted, never described.
function suitePrompt() {
  return `Run this repository's full test suite once and report what it did. Nothing else: fix nothing, commit nothing, modify no file.\ncd ${worktree} (branch ${branch}) and run exactly this command:\n${suiteCommand}\nReturn state 'passed' when it exits 0, 'failed' when it does not, and 'not-run' when the command cannot run at all (no such script, no such runner) — never 'passed' for a suite you did not actually run. When it failed, put every failing test in failing using the runner's own identifier for it (file path plus test name), and the command's output in output.`
}

// The give-up path's abandoned work, listed but never counted — counting it would report
// `1 planned, 2 made` for a run that made one. A commit line is free text, so the sha is stripped.
const isWip = line => /^\W*(?:[0-9a-f]{7,40}\b\W*)?wip[(:]/i.test(line)

// Of `file:line — defect — failure scenario — fix`, only the first two clauses identify a finding,
// line number dropped: a fix above it shifts the line, and the same defect must still match.
const squash = s => String(s).toLowerCase().replace(/\s+/g, ' ').trim()
const findingIdentity = finding => {
  // No em-dash ⇒ one part, so the whole finding stands as its own identity — the safe direction.
  const parts = String(finding).split(/\s+[—–]\s+/)
  const where = squash(parts[0] || '').replace(/:\d+(:\d+)?$/, '') // file:line, file:line:col
  // NUL separator: nothing a reviewer writes can forge a collision across the two clauses.
  return `${where}\u0000${parts.length > 1 ? squash(parts[1]) : ''}`
}

// Never phrased as an agent that died: from here a skip and a death after the runner's retries are
// indistinguishable. The label stays FAILED — a transport break is the clearest thing to retry.
const returnedNothing = stage => `${stage} returned nothing — it was skipped, or it died after the runner's retries`

// What a throw leaves behind, said honestly: a dead agent often throws a bare value carrying
// neither a message nor a stack, so this promises a trace only where one exists.
function crashReason(err) {
  const stack = err && typeof err.stack === 'string' ? err.stack.trim() : ''
  const message = err && typeof err.message === 'string' ? err.message.trim() : ''
  if (stack) return `the run threw — ${message || 'the error carried no message'}\n${stack}`
  if (message) return `the run threw — ${message}; no stack trace was attached`
  return `the run threw ${describe(err)}; it carried neither a message nor a stack trace`
}

// String() throws on a symbol, and a crash handler that crashes defeats its own purpose.
function describe(err) {
  if (err === null) return 'null'
  if (err === undefined) return 'undefined'
  let shown
  try { shown = typeof err === 'symbol' ? err.toString() : String(err) } catch { shown = '(unprintable)' }
  return `a ${typeof err} value (${shown || 'empty'})`
}

const rec = {
  branch, ending: null,
  // Both counts are scoped to THIS run: `commits` is the fix rows dispatched, so the pair still
  // detects a split or an append against the log the caller reads off the branch afterwards.
  commits: [], plannedCommits: commits.length, madeCommits: 0,
  deviations: 0, disputed: 0, reviewNotes: '',
  // openFindings: reviewer findings the run finished without applying or retracting — filled in
  // only where one is left open, and the ledger's account of what the branch still owes.
  fixedFindings: [], wontFix: [], openFindings: [], attempts: [],
  // One entry per CHANGES_REQUESTED review round — whether it brought previously-unseen findings
  // or repeated prior ones. Appended without the loop asking whether the run will end.
  reviewTrajectory: [],
  // Never absent: the ledger renders passed / failed / not-run-and-why, and has no rendering for a
  // missing value. A run an ending stops never reaches the gate, and must still say so.
  suite: { state: 'not-run', failing: [], output: '' },
}

function absorb(writerResult) {
  rec.commits.push(...(writerResult.commits || []))
  rec.madeCommits = rec.commits.filter(l => !isWip(l)).length // kept live so a run that ends early still reports its counts
  rec.deviations += writerResult.deviations || 0
  rec.disputed += writerResult.disputed || 0
}

// Opened when a recovery starts and closed when its outcome is known, so the log is appended
// without any loop asking whether the run will end.
const attemptOf = (stage, trigger) => {
  const a = { stage, trigger, debugger: '', outcome: '' }
  rec.attempts.push(a)
  return a
}

// An ending is recorded on the record, and returning from the run body is what stops every later
// stage — there is one branch here, so an ending is the whole run's.
const end = (category, reason, payload) => {
  rec.ending = { category, reason }
  if (payload) Object.assign(rec, payload)
  // An attempt still open when the run ends: the ending is its outcome.
  const open = rec.attempts[rec.attempts.length - 1]
  if (open && !open.outcome) open.outcome = reason
  // The ledger has no rendering for an absent suite state, so a run that never reached the gate
  // names the ending that stopped it rather than reading as green.
  if (rec.suite.state === 'not-run' && !rec.suite.output) {
    rec.suite.output = `the run ended before the suite gate ran: ${reason}`
  }
}
const halt = (reason, payload) => end('HALT', reason, payload)
const failed = (reason, payload) => end('FAILED', reason, payload)

const run = async () => {

  // 1. Implement each fix row sequentially, in one worktree, so a later row opens a file with the
  // earlier ones already applied.
  for (const [index, message] of commits.entries()) {
    const ordinal = index + 1
    let res = await agent(
      writerPrompt(`Mode 1 — implement commit ${ordinal} ("${message}") from the plan's Commit / PR breakdown.`),
      { agentType: writerType, label: `write:#${pr}:c${ordinal}`, phase: 'Implement', schema: WRITER_SCHEMA }
    )
    let tries = 0
    while (res && res.result === 'FAILED' && tries < 2) {
      tries++
      const attempt = attemptOf('Implement', `commit ${ordinal} returned FAILED (debug+fix attempt ${tries} of 2)`)
      const diag = await agent(
        `A code-writer returned FAILED while implementing commit ${ordinal} ("${message}") of plan ${planPath}. This is debug+fix attempt ${tries} of 2 — after 2 the run ends.\nIts return: ${JSON.stringify(res)}\nReproduce inside the checkout at ${worktree} (branch ${branch}) and diagnose. When owner=code-writer, phrase the handoff as a finding (file:line — defect — failure scenario).`,
        { agentType: roleAgent('debugger'), label: `debug:#${pr}:c${ordinal}:t${tries}`, phase: 'Implement', schema: DEBUG_SCHEMA }
      )
      if (!diag) return failed(returnedNothing(`the debugger on FAILED commit ${ordinal}`))
      attempt.debugger = `${diag.owner}: ${diag.rootCause}`
      if (diag.owner === 'retry') {
        res = await agent(
          writerPrompt(`Mode 1 — implement commit ${ordinal} ("${message}"). A previous attempt failed transiently (debugger: ${diag.rootCause}); retry attempt ${tries} of 2.${giveUpClause(ordinal, tries)}`),
          { agentType: writerType, label: `retry:#${pr}:c${ordinal}:t${tries}`, phase: 'Implement', schema: WRITER_SCHEMA }
        )
        attempt.outcome = `the retry returned ${res ? res.result : 'nothing'}`
      } else if (diag.owner === 'code-writer') {
        res = await agent(
          writerPrompt(`Mode 2 — fix this debugger-diagnosed defect (commit the fix as fix(<scope>): #${pr} - ...). Fix attempt ${tries} of 2.\nDiagnosis: ${diag.rootCause}\nFinding: ${diag.finding || '(see diagnosis)'}\nThen check git log: if commit ${ordinal} ("${message}") was never committed, complete it afterward under Mode 1 rules as its own commit with that exact message.${giveUpClause(ordinal, tries)}`),
          { agentType: writerType, label: `debugfix:#${pr}:c${ordinal}:t${tries}`, phase: 'Implement', schema: WRITER_SCHEMA }
        )
        attempt.outcome = `the fix returned ${res ? res.result : 'nothing'}`
      } else {
        return halt(`debugger routed to ${diag.owner}: ${diag.rootCause}`, { diag })
      }
    }
    if (!res) return failed(returnedNothing(`the writer on commit ${ordinal}`))
    // Absorbed before the result is read, so a writer that committed and THEN stopped still reports
    // what it landed: the caller pushes on what git holds, and a dropped list under-reports it.
    absorb(res)
    if (res.result === 'FAILED') {
      return halt(`commit ${ordinal} still FAILED after 2 debug+fix attempts — the commit was never produced`)
    }
    if (res.result === 'BLOCKED') return halt(`writer BLOCKED on commit ${ordinal}: ${res.notes || ''}`)
    if (res.result !== 'COMMITTED') return failed(`commit ${ordinal} still ${res.result} after debug routing`)
    log(`#${pr}: commit ${ordinal}/${commits.length} of ${branch} done`)
  }

  // 2. Review → fix cycles. PROGRESS-SENSITIVE under a hard ceiling, as the suite gate is: a flat
  // count cannot tell a stuck loop from a working one. The writer may dispute; contested disputes end it.
  let cycles = 0                  // fix cycles spent — what the hard ceiling bounds
  let noProgressRounds = 0        // consecutive rounds that brought nothing previously unseen
  const seenFindings = new Set()  // every finding identity this review loop has shown
  let disputes = []
  while (true) {
    const disputeClause = disputes.length
      ? `\nThe code-writer DISPUTED these findings with the evidence below — re-verify each against that evidence. Retract any where the evidence holds (record retractions in notes); list any you STILL confirm in contestedFindings — those end the run with the stalemate unbroken, so contest only what you can re-confirm with a concrete failure scenario:\n${disputes.join('\n')}`
      : ''
    const review = await agent(
      `Review branch ${branch} against the plan at ${planPath} (absolute path; read it with the Read tool).\nDiff exactly the range ${base}..${branch} — that base is a commit on this same branch, taken before this run wrote anything, and everything under it is the pull request's own work; never review it.${disputeClause}`,
      { agentType: roleAgent('reviewer'), label: `review:#${pr}${cycles ? ':r' + cycles : ''}`, phase: 'Review', schema: REVIEW_SCHEMA }
    )
    // Both are returns the loop cannot use, not verdicts about the code.
    if (!review) return failed(returnedNothing('the reviewer'))
    if (review.verdict === 'ERROR') return failed(`reviewer ERROR: ${review.notes || ''}`)
    rec.reviewNotes = review.notes || ''
    const contested = review.contestedFindings || []
    // Everything this review leaves open, recorded the moment it is known rather than at each
    // ending that reads it — so an exit added to this loop later cannot report them as resolved.
    rec.openFindings = contested.length ? contested
      : review.verdict === 'APPROVED' ? [] : (review.findings || [])
    if (contested.length) {
      return halt(`contested findings — reviewer still confirms ${contested.length} finding(s) the writer disputed`,
        { contested, disputes })
    }
    if (disputes.length) rec.wontFix.push(...disputes) // reviewer retracted them — documented won't-fix
    disputes = []
    if (review.verdict === 'APPROVED') break

    // The counter, and the trajectory the escalation carries. Computed here, before either bound is
    // read, so an ending reports the round that produced it as well as the ones before.
    const identities = (review.findings || []).map(findingIdentity)
    const fresh = identities.filter(id => !seenFindings.has(id))
    identities.forEach(id => seenFindings.add(id))
    // A round is no-progress only when EVERY finding in it matched a prior round's. The counter is
    // 1 after the FIRST round either way, so the threshold is a position, not a tolerated count.
    noProgressRounds = fresh.length ? 1 : noProgressRounds + 1
    // One phrase, two readers — the trajectory and the attempt trigger below. Written once so the
    // ledger and the attempt log cannot describe the same round differently.
    const freshness = fresh.length ? `${fresh.length} previously unseen` : 'none previously unseen'
    rec.reviewTrajectory.push(`round ${rec.reviewTrajectory.length + 1}: ${review.findings.length} finding(s), ${freshness}`)
    // The trajectory IS the per-round account the escalation carries, so the reason below states
    // only which bound fired. A reason that also summarised the rounds could contradict it.
    const trajectory = `Trajectory — ${rec.reviewTrajectory.join('; ')}.`

    // BOTH bounds are checked here, before this cycle's writer is dispatched, so nothing is spent
    // on a cycle that cannot run. The threshold is read first: it is the more specific finding.
    if (noProgressRounds >= NO_PROGRESS_THRESHOLD) {
      const why = NO_PROGRESS_THRESHOLD === 0
        ? 'this repository spends no fix cycle at all (its Fix cycles answer is 0)'
        : `the no-progress counter reached this repository's no-progress threshold of ${NO_PROGRESS_THRESHOLD}`
      return halt(`still CHANGES_REQUESTED and the review loop is not progressing — ${why}. The findings are still open. ${trajectory}`, { review })
    }
    if (cycles >= REVIEW_CEILING) {
      return halt(`still CHANGES_REQUESTED at the ${REVIEW_CEILING}-fix-cycle ceiling — the findings are still open. ${trajectory}`, { review })
    }

    cycles++
    const attempt = attemptOf('Review',
      `CHANGES_REQUESTED — ${review.findings.length} finding(s), ${freshness} — ` +
      `fix cycle ${cycles} of at most ${REVIEW_CEILING} (no-progress threshold ${NO_PROGRESS_THRESHOLD})`)
    const fix = await agent(
      writerPrompt(`Mode 2 — apply these reviewer findings (dispute any you can refute, with evidence):\n${review.findings.join('\n')}`),
      { agentType: writerType, label: `fix:#${pr}:r${cycles}`, phase: 'Review', schema: WRITER_SCHEMA }
    )
    attempt.outcome = `the fix returned ${fix ? fix.result : 'nothing'}`
    if (!fix || fix.result !== 'COMMITTED') {
      if (fix) absorb(fix) // it may have committed some of them before stopping
      const reason = fix
        ? `fix cycle ${cycles} returned ${fix.result}${fix.disputed ? ` (DISPUTED: ${fix.disputed})` : ''}`
        : returnedNothing(`fix cycle ${cycles}'s writer`)
      const stopped = fix && fix.result === 'BLOCKED' // a reasoned refusal, not a break
      return (stopped ? halt : failed)(reason, { review, fix })
    }
    absorb(fix)
    disputes = fix.disputedFindings || []
    rec.fixedFindings.push(...review.findings.filter(f => !disputes.includes(f)))
    log(`#${pr}: fix cycle ${cycles} committed${disputes.length ? ` (${disputes.length} disputed)` : ''}, re-reviewing`)
  }

  // 3. Suite gate — the repo's own full suite, once, after the findings settle. Nothing about this
  // stage is special: the same question labels its endings as every other's.
  if (!suiteConfigured) {
    // A declared 'none' is answered, not unanswered — so no agent is spent to run nothing.
    rec.suite = { state: 'not-run', failing: [], output: 'no full-suite command is configured for this repository' }
    log(`#${pr}: ${branch} suite not run — no full-suite command configured`)
  } else {
    const seen = new Set()          // every failing identifier this run has ever shown
    let roundsWithoutNewFailure = 0 // consecutive red rounds that brought nothing previously unseen
    let round = 0
    while (true) {
      round++
      const suffix = round > 1 ? `:r${round}` : ''
      // Deliberately no agent type, cheapest model, lowest effort: loading a role definition to run
      // one command is waste on a gate that runs up to SUITE_CEILING times. Labelled, so it is named.
      const suite = await agent(suitePrompt(), {
        label: `suite:#${pr}${suffix}`, phase: 'Suite', model: 'haiku', effort: 'low', schema: SUITE_SCHEMA,
      })
      if (!suite) {
        rec.suite = { state: 'not-run', failing: [], output: returnedNothing('the suite gate') }
        return failed(`${returnedNothing(`the suite gate on ${branch}`)}; the suite never ran`)
      }
      rec.suite = { state: suite.state, failing: suite.failing || [], output: suite.output || '' }
      log(`#${pr}: ${branch} suite ${rec.suite.state}${round > 1 ? ` (round ${round})` : ''}`)
      if (rec.suite.state !== 'failed') break

      // Progress-sensitive, not a flat cap: a shrinking set of the same failures is not progress.
      const fresh = rec.suite.failing.filter(id => !seen.has(id))
      rec.suite.failing.forEach(id => seen.add(id))
      roundsWithoutNewFailure = fresh.length ? 1 : roundsWithoutNewFailure + 1
      const redReason = `suite red on ${branch} — ${rec.suite.failing.length} failing test(s): ${rec.suite.failing.join(', ')}`
      const attempt = attemptOf('Suite', `${redReason} (round ${round} of at most ${SUITE_CEILING})`)
      if (roundsWithoutNewFailure >= 2) return halt(`${redReason} — 2 rounds brought no previously unseen failure`)
      // Checked before the debugger, so no agent is spent on a round that cannot run. A mis-parsed
      // identifier list looks new every round and would reset the counter forever.
      if (round >= SUITE_CEILING) return halt(`${redReason} — the ${SUITE_CEILING}-round ceiling`)

      // A red suite is a failure, not a finding: the gate observed only that it is red, and the
      // breakage is usually outside the writer's commit scope. Same routing as a FAILED commit.
      const diag = await agent(
        `The repository's full test suite is red on branch ${branch}, after its review loop settled. This is round ${round} of at most ${SUITE_CEILING}.\nThe suite gate ran \`${suiteCommand}\` inside ${worktree} and returned: ${JSON.stringify(rec.suite)}\nReproduce inside that checkout and diagnose. The breakage is often outside the commit scope of the work this run added — say so if it is. When owner=code-writer, phrase the handoff as a finding (file:line — defect — failure scenario).`,
        { agentType: roleAgent('debugger'), label: `suitedebug:#${pr}:r${round}`, phase: 'Suite', schema: DEBUG_SCHEMA }
      )
      if (!diag) return failed(`${returnedNothing(`the debugger on a red suite on ${branch}`)}; ${redReason}`)
      attempt.debugger = `${diag.owner}: ${diag.rootCause}`
      if (diag.owner === 'code-writer') {
        const fix = await agent(
          writerPrompt(`Mode 2 — the repository's full suite is red and a debugger diagnosed it. Fix it and commit as fix(<scope>): #${pr} - ... . Suite round ${round}.\nDiagnosis: ${diag.rootCause}\nFinding: ${diag.finding || '(see diagnosis)'}\nFailing: ${rec.suite.failing.join(', ')}`),
          { agentType: writerType, label: `suitefix:#${pr}:r${round}`, phase: 'Suite', schema: WRITER_SCHEMA }
        )
        attempt.outcome = `the fix returned ${fix ? fix.result : 'nothing'}`
        if (!fix || fix.result !== 'COMMITTED') {
          if (fix) absorb(fix) // whatever it landed before stopping is on the branch
          const reason = fix
            ? `suite fix round ${round} returned ${fix.result} — ${redReason}`
            : `${returnedNothing(`suite fix round ${round}'s writer`)}; ${redReason}`
          const stopped = fix && fix.result === 'BLOCKED'
          return (stopped ? halt : failed)(reason)
        }
        absorb(fix)
      } else if (diag.owner === 'retry') {
        attempt.outcome = 'a retry — the gate runs again, with nothing to fix'
      } else {
        // replan | user — the route reads the same here as in the implement loop.
        return halt(`debugger routed a red suite to ${diag.owner}: ${diag.rootCause} — ${redReason}`, { diag })
      }
    }
  }

  log(`#${pr}: ${branch} done (${rec.plannedCommits} planned, ${rec.madeCommits} made)`)
}

// One catch for every ending site: a throw would otherwise reject the call and lose the whole
// record, where the branch it describes already holds commits somebody has to account for.
try {
  await run()
} catch (err) {
  if (!rec.ending) failed(crashReason(err))
  log(`#${pr}: the run threw — returning it attributed rather than losing it`)
}
return rec
