# ieuanign-skills

## 0.13.0

### Minor Changes

- [#117](https://github.com/ieuanign/skills/pull/117) [`ccc076c`](https://github.com/ieuanign/skills/commit/ccc076c22ddcba71d74c92a77c8f832393f3792a) Thanks [@ieuanign](https://github.com/ieuanign)! - `/dev-loop`: a sub-lane of a split issue that finished its own job cleanly now opens a **ready** pull request. Before this, it could not — `ready` was unreachable for any issue `pr-separation.md` split.

  **Two correct rules composed into a broken one.** The reviewer judges one sub-lane's commit range but was handed the whole issue's acceptance criteria, and recorded a criterion another sub-lane delivers as `partial` so that an early pull request would not read as a failure of work not yet due. The terminal-state table then drafts on any criterion that is `partial` or `not-met`. So every pull request of a split issue drafted, including the top of the chain — and the draft signal, which also carries open findings, a red suite and an ending mid-pipeline, stopped meaning anything.

  **Ownership is now a fact the plan states and the host applies.** On a plan holding two or more pull requests, the architect names on each pull request entry the acceptance criteria that pull request delivers — ordinals into the issue's checklist plus each criterion's first clause — in the same `Commit / PR breakdown` the host already parses for commits. The host reads them off and hands each reviewer only its own. Anything the plan left unlisted falls to the **last sub-lane in plan order**, which is what makes a single-pull-request plan own its whole checklist, makes a plan written before this change run unchanged, and stops a criterion the architect missed from going unjudged. Falls-to-last is the host's rather than the phase script's: a phase script sees one layer's sub-lanes with their commit lists already built, so it cannot identify the last sub-lane of a lane that spans layers.

  **The reviewer judges only what it was given**, against its own range, and an owned criterion it cannot find is `not-met` rather than `partial`. The `out of this range → partial` rule is deleted — not reworded — from `contracts.md`, the reviewer agent and the execute phase's prompt, because a reviewer never sees another sub-lane's criterion now. It still receives the issue body verbatim and whole: a checklist line rarely reads as its own specification, and the pipeline does not rewrite what a human wrote.

  **Nothing new to reason about.** The verdict vocabulary (`met | partial | not-met`), the reviewer's return schema and the ready predicate are unchanged. The predicate gained no filtering clause — it simply now sees only the criteria the sub-lane owns. A sub-lane owning none returns an empty list and is vacuously met, the path the no-issue-body case already takes. A single-pull-request plan, and an issue with no acceptance criteria, behave exactly as they do today.

  Corrected in passing: the findings ledger described criterion verdicts as informational, "nothing in the pipeline branches on it", while the terminal-state table has drafted pull requests on them all along. [ADR-0003](https://github.com/ieuanign/skills/blob/main/docs/adr/0003-criterion-ownership.md) carries the decision and its rejected alternatives.

- [#118](https://github.com/ieuanign/skills/pull/118) [`798bde3`](https://github.com/ieuanign/skills/commit/798bde3323f75e17e810103140faef43d862885e) Thanks [@ieuanign](https://github.com/ieuanign)! - `/dev-loop`: the last pull request of a chain now carries a **whole-issue roll-up** — every acceptance criterion of the issue, its verdict, and which sub-lane judged it — beneath its own criteria section.

  Scoping each reviewer to the criteria its sub-lane owns leaves every pull request body listing only its own slice, and the pipeline never ticks the issue's own checklist. So on a split issue nothing showed the issue's completeness in one place, on exactly the unattended runs where nobody watched. Whoever merges the end of a chain can now see whether the issue as a whole was delivered without opening every pull request under it.

  **No new cost and no new state.** The host assembles it from sub-lane records it is already carrying across layers, so no agent is dispatched and no stage is added to any loop. It is reporting only: it feeds no predicate and changes no terminal-state row. Every row stays decided per sub-lane from that sub-lane's own inputs, and a sibling's unmet criterion never drafts another sub-lane's pull request — the sub-lane that owns the gap has already drafted for it.

  Omitted on a lane with a single sub-lane, where it would repeat the section above it verbatim. Both execution modes compose it identically, the pull request body being the host's in both.

## 0.12.0

### Minor Changes

- [#110](https://github.com/ieuanign/skills/pull/110) [`0edbc67`](https://github.com/ieuanign/skills/commit/0edbc67789eb6870e9b7f0b465d3f560ba7ca35a) Thanks [@ieuanign](https://github.com/ieuanign)! - `/dev-loop`'s review loop stops abandoning lanes that are still converging.

  Its bound was a flat count, so it could not tell a loop that is stuck from one that is working. On the run that prompted this, three reviews produced three findings at three different lines, disjoint on every round, the third a regression created by the fix for the second — every cycle doing real work — and the bound fired anyway. The developer ran the next cycle by hand and it went green.

  **The loop takes the progress-sensitive shape the suite gate already had.** After a `CHANGES_REQUESTED` review the counter advances by one unless a previously unseen finding appeared, and a new finding resets it to 1. At the repository profile's **Fix cycles** value the loop stops — that key is now the **no-progress threshold** rather than a flat cap, default `2`, and `0` still spends no fix cycle at all.

  ```
  cycle 1: {A, B, C}   all unseen                    → count 1
  cycle 2: {A, B}      subset, nothing new           → count 2 → stop

  cycle 1: {A}                                       → count 1
  cycle 2: {B}         B unseen                      → reset to 1
  cycle 3: {C}         C unseen (regression from B)  → reset to 1
  cycle 4: {}          approved                      → done
  ```

  The first trace is the stuck case, and note it now stops **earlier** than the flat bound it replaces: the threshold catches a loop repeating itself, and a hard ceiling of **5 fix cycles** does the ordinary bounding. Both are checked before a cycle's writer is dispatched, so nothing is spent on a cycle that cannot run.

  **Finding identity** is the normalised file and defect clause, with the line number dropped as the volatile part — a fix shifts lines, and a shifted line is not a new defect. A round counts as no-progress only when _every_ finding in it matches a prior round's. It is deliberately conservative, because declaring sameness is what ends the loop early, and it is host arithmetic in plain code: no agent is dispatched to decide it and the reviewer's return contract is unchanged.

  **The escalation carries the trajectory.** An ending on either bound names which bound fired and states, per round, whether it brought previously-unseen findings or repeated prior ones — in the ending reason, in the findings ledger, and in the attempt log. That is what tells a reader whether one more cycle was worth running before they read a line of the diff.

  **Expect this to behave as a flat bound of 5 on most runs.** Independent reviewer invocations rarely word the same defect identically, so the threshold fires rarely. That is the design, recorded in [ADR-0002](docs/adr/0002-review-loop-progress-sensitive-bound.md) so nobody later "fixes" the counter for not advancing.

  **The per-commit implement loop is deliberately unchanged.** Its give-up clause instructs the writer of the final permitted attempt, and no earlier one, to commit abandoned work as evidence — which needs the last attempt known at dispatch time, and a progress-sensitive counter cannot supply that. `contracts.md` records the divergence so it is not tidied away.

  The contract was edited first and both execution modes in the same change. The ceiling is stated in the contract's prose and held as a phase-script constant, and `npm run check` compares them — the same drift check the cost-stage vocabulary already gets. Eight harness scenarios cover the motivating case, the stuck case, the ceiling, a threshold of `0`, a raised threshold, the trajectory, and that a re-confirmed dispute still ends a sub-lane immediately.

- [#112](https://github.com/ieuanign/skills/pull/112) [`09af8d9`](https://github.com/ieuanign/skills/commit/09af8d90df18942d2a1edc1af3594a3a9c057746) Thanks [@ieuanign](https://github.com/ieuanign)! - An unattended `/dev-loop` run now carries a **run handle** — the identifier that locates its own transcript.

  Endings already carried a resume command that re-derives everything from artifacts. That is correct, and it is not the same thing as being able to see what the reviewer actually said on cycle two: reconstructing that meant reading commit timestamps and inferring where one cycle ended and the next began. The evidence for the review-loop change in this same release had to be recovered exactly that way.

  The host reads the session identifier from its environment at intake and passes it into the phase scripts' arguments — the same class of fact as the skill directory and the agent namespace, both of which the host can see and a script cannot. It needs no new principle, only one more argument.

  **It is written in exactly two places.** The **ending comment on the issue**, by the notifier mid-lane and by the host for a lane that threw, where no notifier ever ran — which also closes a hole, because that lane was owed an ending comment nothing was writing. And the **pull request body** of an ended sub-lane, which is the only copy that outlives the run.

  **It is deliberately not in the message.** That is one line for triage from a phone; a handle in it would crowd out the reason, which is the thing the line exists to carry.

  **Where the environment shows no identifier the handle is omitted silently** — a missing line, never an error, never a question, and no lane's outcome changes.

  **It is a run handle and not a resume identifier**, and the distinction is load-bearing: an unattended conclusion removes an ended sub-lane's worktree, so the state a session resume would restore is the state the conclusion just deleted. `/dev-loop <n>` is unchanged and remains the resume mechanism.

### Patch Changes

- [#111](https://github.com/ieuanign/skills/pull/111) [`477fb4c`](https://github.com/ieuanign/skills/commit/477fb4c4d4adad175cc0bb1ccd69efba5334161c) Thanks [@ieuanign](https://github.com/ieuanign)! - `/dev-loop` now actually asks for the two repository-profile keys Phase B needs.

  **Full-suite command** and **Fix cycles** were both documented as asked before a repository's first execution phase, and no step performed either ask. The obligation was asserted in passive voice in two places and implemented by none, so every repository has silently run on the defaults since the keys were introduced — including this one, whose profile carried one of the two only because somebody typed it by hand. That is why the bound which ended the motivating lane was never a number anyone chose.

  **Act 0 gains step 9, and it is the only place either is asked.** It skips entirely unless the run will reach Phase B, and skips any key the profile already carries — a persisted value is an answer, and `none` and `0` are answers like any other, so the ordinary run asks nothing and a repository is asked at most once ever. It is not a gate: it raises no question about the batch's work, so gate suppression does not touch it, and it sits at intake because that is the last point at which a human who typed `auto` is reliably still watching.

  The **Fix cycles** prompt describes the no-progress threshold it now is, not the flat cap it was — a higher answer buys tolerance for a repository whose reviews repeat themselves, not more cycles for one that is converging. Both prompts state the default that applies if declined, so a repository can decline and still run.

  The passive assertions that a value was "ask-then-persisted before this first runs" are replaced by references to the step that now does it, and the hard rule about one-time preconditions gains the general form: **every one of them belongs to a named step that performs it**, because an obligation carried only by a key's own description is one nothing does.

  This repository's own profile gains its **Fix cycles** answer.

- [#113](https://github.com/ieuanign/skills/pull/113) [`4f74466`](https://github.com/ieuanign/skills/commit/4f74466e09990d72d7c4424f54a48530549c32a7) Thanks [@ieuanign](https://github.com/ieuanign)! - `/dev-loop`'s unattended messages now have a stated format.

  The specification stated a content requirement — an ending says why in one line, so it can be triaged from a phone — and the skill stated the mechanism. Nothing stated the **shape**, so every message was composed freshly and drifted between runs.

  **Five state tokens partition across the three message events** already in the event table, so no message carries two axes at once. That partition is load-bearing rather than tidy: an ended sub-lane opens a _draft_ pull request, so a single enum spanning endings and pull-request states would force one token to say both.

  | Message    | Writer                       | Tokens           |
  | ---------- | ---------------------------- | ---------------- |
  | started    | host, at intake              | `start`          |
  | ending     | notifier, mid-lane           | `halt`, `failed` |
  | completion | host, after the phase script | `draft`, `ready` |

  The shape is the issue number, the state token, the reason where one exists, then the link — the pull request link where a pull request exists, the issue link otherwise:

  ```
  [#105](https://github.com/ieuanign/skills/issues/105) start: <issue link>
  [#105](https://github.com/ieuanign/skills/issues/105) halt: still CHANGES_REQUESTED after 2 fix cycles — 3 findings open
  <issue link>
  [#105](https://github.com/ieuanign/skills/issues/105) draft: 2 findings open, suite green
  <pr link>
  [#105](https://github.com/ieuanign/skills/issues/105) ready:
  <pr link>
  ```

  The reason is retained because triage from a phone is that line's whole purpose. A lane with one sub-lane — the common case — emits the single-line shape exactly; a lane with several emits one line per sub-lane under a shared header. No message carries the run handle, and the two ending tokens are the ending labels in lower case, so there is no second vocabulary to keep in step with `contracts.md`.

  The format is stated in `notifications.md` and nowhere else — the skill's mechanism section still states only the command for each event. The four closing tokens being exhaustive is what makes the existing one-closing-message-per-lane property readable by inspection: a `start` with none of them after it is a run that died.

- [#108](https://github.com/ieuanign/skills/pull/108) [`f209df8`](https://github.com/ieuanign/skills/commit/f209df8bc501d69b8cbefb658e29b347f972b800) Thanks [@ieuanign](https://github.com/ieuanign)! - `/dev-loop`'s execution state machine now has a test harness, tracked in the repository and run by `npm run check`. No behaviour changed: `contracts.md`, `notifications.md` and both phase scripts are untouched, and the harness passes against the implementation as it stands.

  **The seam already existed and was already used.** A phase script is not a module — the Workflow tool compiles it as the body of an async function over its own globals — so `node --check` is a silent no-op on one and only an `AsyncFunction` parses it. The check script has loaded them that way all along, construct-only, because running one dispatches agents. Handing that same constructor a **scripted fake `agent()`** runs the whole machine instead: every loop, every bound, every ending, for the price of a `node` process and no dispatches at all. It is the highest seam available, and no new one is introduced anywhere.

  **The shim is now one copy rather than two that were asked to match.** It moves to `scripts/lib/phase-script.mjs`, which the check script calls as a CLI and the harness imports as a function. Previously the check script carried it inline with a comment naming a gitignored harness it "must stay in step" with — an untracked file nothing could compare it against, and one a provisioned worktree never had.

  **Fifteen scenarios, two observables each**: the ordered labels the fake `agent()` was asked for, and the lane result — ending label, ending reason, terminal pull-request state, findings ledger. They cover the review loop reaching its bound with the findings open, the implement loop's two debug+fix attempts and its give-up clause landing on the final permitted one and no earlier, all four debugger routes, the suite gate's progress-sensitive rounds and its eight-round ceiling, the ending labels a bound and a reasoned refusal take against the ones a dead agent and an unusable return take, and terminal state computed per sub-lane so that one sub-lane's draft does not draft its sibling.

  Nothing asserts on an internal variable, a private helper, or prompt wording beyond an input a contract requires to be present — a test that breaks when a loop is refactored but its behaviour is unchanged is a bad test, and this file has to survive refactors of the file it tests.

- [#109](https://github.com/ieuanign/skills/pull/109) [`5e345a1`](https://github.com/ieuanign/skills/commit/5e345a15ce62f9d0c585ab7aa0c3e7a69cb9086a) Thanks [@ieuanign](https://github.com/ieuanign)! - A `/dev-loop` stage that returns nothing no longer produces an ending saying the agent "died".

  From where the pipeline sits that was an assertion it could not support. An agent skipped mid-run and an agent dead after the runner's own retries both resolve the call to nothing, and nothing is the whole of what the script sees — so a developer triaging from a phone read "died" and went looking for a crash that may never have happened. Every such ending now says the stage **returned nothing, and that it was skipped or died after the runner's retries**, which is the wording a lane whose result came back empty already carried. One condition, one voice.

  Seven sites: the writer on a plan commit, the debugger, the reviewer, a fix-cycle writer, the suite gate, the suite debugger, and a suite-fix writer — plus the architect's `DIED` summary in the planning phase, which said the same thing about the same observation.

  **The ending label is unchanged, and `contracts.md` now records why so it is not re-proposed.** A transient break keeps **FAILED**, because that label answers exactly one question — _is this worth retrying?_ — and a transport timeout is its clearest affirmative. No new label, no classification stage, and no agent dispatched to adjudicate a transport failure it could not reproduce. Calling it a halt would assert that something deliberately stopped, which is the one thing here known not to have happened.

  The contract was edited first and both execution modes in the same change. A harness scenario drives all seven stages and asserts, for each, that the ending carries the shared sentence and that nothing in it claims a death.

## 0.11.0

### Minor Changes

- [#95](https://github.com/ieuanign/skills/pull/95) [`06665cf`](https://github.com/ieuanign/skills/commit/06665cf34aa2681f05ea351f8d6f12b35b4ac6f3) Thanks [@ieuanign](https://github.com/ieuanign)! - `docs/agents/coding-standards.md` is retired. What replaces it is a rule for where a consuming repo's configuration lives at all, recorded as this repo's first ADR — and three consequences that follow from applying it.

  **The rule, in one question: would this still bind if the plugin were uninstalled?** Yes → `CLAUDE.md` and `.claude/rules/`. No, because it is meaningless without the plugin → `docs/agents/`. It is the same in every repo → the skill. It varies by machine → nowhere, and it gets probed at runtime. Two corollaries do the actual work: nothing under `docs/agents/` may restate a fact the repo states elsewhere, and no machine fact may enter a committed file. [ADR-0001](docs/adr/0001-config-boundary.md) carries the reasoning and the rejected alternatives.

  **The standards rubric was half a copy, and the copy is gone.** Its Hard rules section quoted `CLAUDE.md` verbatim with nothing to re-sync it, so the `reviewer` met the same rule twice at two bindingness levels — binding at priority 4 from `CLAUDE.md`, "always a judgement call" at priority 5 from the derived copy — and a drifted copy could silently contradict its own source. What survives is the half that exists nowhere else: which baseline smells this repo's patterns deliberately trip. That file is now `docs/agents/smell-overrides.md`, named for what it holds rather than what it was distilled from.

  **It is written from real rejections, never distilled in advance.** `/setup-ieuanign-skills` Part 1 no longer drafts anything at setup time; it records a finding the user brings back, and grills whether it has recurred and whether the deliberate thing is the pattern or the hunk. An override guessed from a `CLAUDE.md` is a suppression nobody justified — the old skill already told its own drafter to cut its guesses. **An absent file is now the correct state** of a repo where nothing has recurred, so `/code-review-mp`'s "run setup if this is missing" prompt is removed and the `reviewer` is told never to report it missing.

  **The stack convention became a binding rule rather than a profile key.** `gh stack rebase`, never `git rebase` plus a force-push: the stack exists on GitHub whether or not the plugin does, so by the uninstall test it belongs in `.claude/rules/`. The pipeline never needed a key for it either — `stack-link.sh` probes for the extension and `/dev-loop` never rebases anything.

  **`/setup-ieuanign-skills` gains Part 3**, which proposes the `.claude/rules/` set — PR separation, stacked-PR handling, comment and scratch conventions — and writes only what the user accepts. The rule bodies live in templates beside the skill, so nothing restates them. Where `gh-stack` is absent it prints one line and persists nothing, per the second corollary.

  **Overlapping changes are now the repository's call.** `.claude/rules/pr-separation.md` declares `additive` (the default, and today's behaviour), `strict`, or `parallel`, and Gate 1's classification defers to it — moving only the line between additive and same-region co-touch. A real dependency still stacks whatever the repo says, or the upper pull request does not build against its base. `contracts.md` is normative and was edited first; the classification stays single-version across both execution modes.

  **Two hooks, one file.** `pr-separation.md` also carries the order a change splits in and a changed-file limit, read through the architect's existing "per the repo's PR separation policy" deferral. The limit binds the plan and never the diff: by review time the only agent that could split a pull request no longer runs in that lane, so a diff-phrased limit would burn fix cycles and end a sub-lane over working, tested code.

  `README.md` gains [How to improve your `/dev-loop`](docs/improving-dev-loop.md), which is why each of these pays off rather than what each says — the text stays in the templates.

  **Out of scope, so it is not re-derived:** whether stacked-versus-flat is a developer choice. It is not. A real dependency and a multi-PR plan are facts about the work, and `/dev-loop` always stacks them.

## 0.10.0

### Minor Changes

- [#87](https://github.com/ieuanign/skills/pull/87) [`ea8bb41`](https://github.com/ieuanign/skills/commit/ea8bb414bf118861509ac6004b3866fee8d55a25) Thanks [@ieuanign](https://github.com/ieuanign)! - Roster: the architect, writer, debugger and reviewer returns now carry a budget that constrains their **form**, not their length. The notifier is untouched — its return is three fixed lines and one optional sentence, with no prose to budget.

  Each of those four ended its contract with an open-ended instruction — `code-writer` said "Then bullets:", `debugger` said "Then prose:", `reviewer` said "Then `NOTES:`". Only the architect gave a count. A model handed "then prose" with no budget writes to the length the task feels to deserve, which is always long. Unattended that prose is spent for nothing: the orchestrator routes on the machine-readable leading lines and the bullets, and no human is there to skim past the rest.

  **A word or bullet cap is the wrong instrument.** It forces the model to choose which facts to sacrifice, and it reliably keeps the narrative and drops the specifics, because narrative reads as "the answer" and specifics read as "detail". The instrument used instead is the one already proven in this repo — the reviewer's finding line, whose slots leave nowhere to put filler and which nobody ever had to cap. Bullets fill slots: `<what> — <where: file:line, path, or command> — <so what: the consequence, or the next action it enables>`. A bullet missing `where` is an unevidenced claim; one missing `so what` is something nobody can act on.

  **The compression direction is stated explicitly, and that clause is what keeps this from degrading into meaning loss.** Terse instructions cause models to compress by _summarising_ — abstracting specifics into smooth sentences. So the budget names which way to cut: delete sentences, never facts; keep paths, line numbers, shas, exact commands, error strings, counts and names verbatim; cut the prose around them. The filler ban names concrete patterns rather than saying "be concise" — preamble, restating the input, narrating the order you worked in, what went well, and any closing summary. The test is not length: if the orchestrator's next action is identical with and without a sentence, it is not information.

  Two agents take a variant. The **debugger**'s return ends in an evidence chain that is genuinely sequential and does not decompose into slots — it keeps prose and is governed by the cut test alone, with the steps that establish the mechanism named as payload so the filler ban never eats them. The **architect** keeps its existing 3–5 bullet summary and gains the compression direction and the filler ban; the count is framed as a shape rather than a limit, so it never reads as a licence to drop a fact, and open questions are exempt from compression entirely.

  No machine-readable leading line changes. `contracts.md` is untouched by design: the keys are the contract, and this governs only the prose after them.

- [#91](https://github.com/ieuanign/skills/pull/91) [`9c03116`](https://github.com/ieuanign/skills/commit/9c0311616826cefa8732ee0fce9e1c0ca9e3f03b) Thanks [@ieuanign](https://github.com/ieuanign)! - `/dev-loop`: Gate 2's worktree removal now names the gitignored artifacts it destroys before destroying them, and the architect no longer plans work that expects one to survive.

  Removing a lane's worktree takes its gitignored files with it. The dirty-work guard does not cover them — `git worktree remove` without `--force` refuses on tracked modifications and untracked non-ignored files, deletes ignored ones without a word, and `git status --porcelain`, the signal every refusal path reads, does not list them either. So a lane could be instructed to produce an artifact at a path the pipeline was about to delete, be graded on it, and report clean. Observed for real: a lane's plan named a gitignored scratch directory in its File touchpoints and required runnable checks there; the reviewer ran and passed them, Gate 2 pushed, opened the PR and removed the worktree, and the checks then existed on no machine.

  **The destruction stays, and it is the intended behaviour rather than an oversight.** A lane's gitignored output — scratch checks, generated fixtures, captured logs, coverage — is working material, and cleaning it up once the branch is pushed is a reason to remove the worktree rather than a cost of doing so. The alternatives were weighed and rejected in `contracts.md` so they are not re-derived: keeping the worktree strands one per lane that writes anything, and cleanup mode removes none of them; copying the files back writes a lane's throwaway output into the main checkout, where nothing ever reaps it.

  **What changes is that the loss is announced, in two places.** Before removing, the conclusion reports every File touchpoint the plan named that `git check-ignore` calls ignored and that exists in the worktree, as paths going with the removal — and the same list becomes a **Local-only artifacts** section in the pull request body. Both, because they reach different people: an unattended run has nobody reading the first, and the worktree it describes is gone moments later, so the pull request is the only copy that outlives the run. The list is targeted and never `--ignored=matching`, whose every line would be the dependencies and copied-in config that provisioning put there on purpose. Nothing is copied out and nothing is kept, so the durable-artifact rule follows from the report rather than from a mechanism: a path that must outlive its sub-lane is committed, which is what makes it survive and also what takes it off this list.

  **The architect applies the same rule in advance.** Its File touchpoints section now says that a gitignored path is working material that does not outlive the worktree it is written in — name it if the work touches it, since the conclusion reads that section to say what the removal destroys, but never write a plan that expects it to still be there. That closes the upstream cause: the pipeline can no longer require a file at a path it is about to delete. The architect checks with the same child-probe form [#46](https://github.com/ieuanign/skills/issues/46) fixed in Act 0, and for the same reason sharpened: a touchpoint marked **create** does not exist at plan time, so asking about the bare directory is guaranteed to answer "not ignored" exactly when it matters.

- [#91](https://github.com/ieuanign/skills/pull/91) [`27d4c5f`](https://github.com/ieuanign/skills/commit/27d4c5fb952a12aeeba0b8624ed3eb7df9d1ee5e) Thanks [@ieuanign](https://github.com/ieuanign)! - `/setup-ieuanign-skills` now seeds the workflow label vocabulary an unattended run needs, alongside the coding-standards rubric it already wrote.

  `/dev-loop auto` resolves three label **roles** — in-progress, awaiting-human, failed — through the consuming repository's `docs/agents/triage-labels.md`, and skips silently for any role that file gives no string for. In a freshly installed repository it gives none, so an unattended run wrote no labels at all. [#7](https://github.com/ieuanign/skills/issues/7) closed the discoverability half by documenting the manual steps in `README.md`; this closes the convenience half by making them one command.

  **It belongs here because this is the only setup skill this plugin owns**, and because the file dev-loop resolves its roles through is frequently absent entirely: `setup-matt-pocock-skills` writes it, and per that skill only when Matt's `triage` skill is installed. So this part assumes neither ran — it creates `docs/agents/triage-labels.md` when absent, with the `# Triage Labels` heading and preamble that skill establishes and no triage table of its own, leaving room for that skill to add one above later.

  **The Workflow roles section is appended, and an existing triage table is never touched.** The two families are different kinds of label and the separation is the point: a triage label is a human classifying an issue before anyone works it, a workflow label is a run reporting where it got to. Folding them into one table invites someone to hand-apply in-progress, which is a live claim marker a separate orchestration system reads. A `### Triage labels` entry is added to the `## Agent skills` block in the shape `setup-matt-pocock-skills` establishes — updated in place when present, never duplicated — and an absent block is left alone with a pointer at that skill, the same posture Part 1 already takes.

  **The roles are fixed and the strings are the user's**, agreed before anything is written; a role left with no string is a real answer and stays skipped silently. **Label creation is offered, never run unprompted** — the exact `gh label create` lines for the strings the tracker does not already have, run only on an explicit yes, because creating a label mutates the user's repository. A tracker that is not GitHub gets the role names and a note to create the equivalents itself, and no `gh` command at all.

  Nothing about _when_ a role is applied is restated: `notifications.md` is cited as the source, in the skill and in the file it writes. The skill folder gains `workflow-labels-template.md` as the section's skeleton, matching how `coding-standards-template.md` already works, and `SKILL.md` is reorganised into two independent parts so either can run alone. `README.md`'s manual steps now point at the skill as the shortcut and stay correct for anyone doing it by hand.

  **Out of scope, so it is not re-derived:** the messaging channel's two environment variables. They are per-machine, not per-repository, and this skill configures a repository; `README.md` documents them and that is the right home.

### Patch Changes

- [#91](https://github.com/ieuanign/skills/pull/91) [`e269ee3`](https://github.com/ieuanign/skills/commit/e269ee37cd1c3cd5f3208124554ff9d149b4a33a) Thanks [@ieuanign](https://github.com/ieuanign)! - `/dev-loop`: Act 0's two gitignore preconditions no longer report a correctly-configured repo as unconfigured, and no longer append a `.gitignore` line the file already carries.

  Both checks probed the directory itself — `git check-ignore -q .claude/worktrees`. A gitignore pattern with a trailing slash matches directories only, and `git check-ignore` cannot classify a bare path as a directory unless that directory exists on disk. `.claude/worktrees/` does not exist before the first lane is provisioned, which is exactly when Act 0 runs. So the check reported "not ignored" for a path that is ignored, and the remedy fired on a repo that needed nothing: every fresh clone that had not yet run a lane gained another `.claude/worktrees/` line, and the run reported a fix the user did not need. The `.scratch` check had the same shape and misfired in any repo whose entry is written `.scratch/` rather than `.scratch`.

  **Both now probe a path underneath the directory** — `git check-ignore -q .claude/worktrees/probe`. Everything under an ignored directory is ignored, so the child answers the same question without needing the classification that was failing, and the probe path need not exist. Verified against every form the entry can take: `.scratch`, `.scratch/` and `/.scratch/` all report ignored with the directory absent from disk, and a repo that ignores neither still reports "not ignored" for the child, so a genuinely unignored path is still detected and still remedied.

  **Neither remedy appends a line `.gitignore` already carries.** Appending is idempotent in effect and not on disk, so this is the guard against a check that misfires for some reason nobody has thought of yet growing the file by one line per run — belt and braces behind the probe rather than a second fix for the same bug.

- [#93](https://github.com/ieuanign/skills/pull/93) [`fdb35e8`](https://github.com/ieuanign/skills/commit/fdb35e85a7871328e885b5dad6413b014ddde93d) Thanks [@ieuanign](https://github.com/ieuanign)! - `/dev-loop` Mode W now resolves its roster agents against the registry namespace the host discovers, instead of naming them with bare literals that only ever worked for a maintainer.

  The same agent definition is registered under two different names depending on how it arrived: bare — `code-writer` — when it is linked into a repository's own `.claude/agents/`, and namespaced `<plugin>:<name>` — `ieuanign-skills:code-writer` — when the plugin is installed. `/plugin install` is the supported install path, so the namespaced form is the ordinary one and the bare form is the maintainer's, which is exactly backwards from what the phase scripts assumed. Both carried bare literals — `phase-plan.js` for the architect, `phase-execute.js` for the writer, reviewer, debugger and notifier — so **every dispatch in an installed plugin died on an unresolvable agent type**: Phase A returned DIED for every lane and Phase B never got a lane past its first commit.

  **The namespace is discovered, never derived.** Act 0 reads it off the host's own agent roster — find `code-writer` among the available types, take the prefix or the empty string — at the one place the run mode and the execution mode are already settled, and carries that single value to both phase scripts in their args. The roster is the registry's own answer, so nothing infers it from a path, a package name or a manifest, and renaming the plugin or the marketplace needs no edit. A trailing colon is tolerated on the way in, because writing one is a plausible reading of "namespace" and the failure it would otherwise cause is total rather than partial.

  **Mode A needed no change and got none.** Its host dispatches by the name its own roster lists, which is already correct; only a workflow script is blind to the registry. This is the same class of fact as `skillDir`, which the host already passes for the same reason, and contracts.md's Roles section now states the rule normatively — the Agent column names each role's _definition_, not the string that dispatches it.

  **`npm run check` gained a structural guard**, because nothing in the suite could see this: the syntax check compiles a bare literal happily, and no check runs a phase script, since running one dispatches agents. An agent type in a phase script must now come from the script's `roleAgent()` resolver and never from a quoted string — verified red against the pre-fix files, where it catches all six sites.

## 0.9.0

### Minor Changes

- [`075772a`](https://github.com/ieuanign/skills/commit/075772ab346c98cd6d3606fe6ec5d97aeb44de73) Thanks [@ieuanign](https://github.com/ieuanign)! - `dev-loop`: a stacked batch now ends with a real stack on GitHub, not a sentence in a pull request body.

  The pipeline already sequenced dependent work — it chained the bases, it wrote "Stacked on #\<A\>'s PR" into the body — but GitHub was never told those pull requests form a chain. So a reviewer reconstructed the ordering from base branches, nothing kept the chain rebased, and the ordering was prose rather than data.

  Gate 2 gains a fifth step. Once the batch's last layer has pushed and opened its pull requests, the host walks the base relation, collects each maximal chain, and hands that chain's PR **numbers** — bottom to top — to a new bundled `stack-link.sh`. A reviewer gets a real stack in the GitHub UI, each pull request showing only its own layer's diff, plus the tool's own rebase, view and merge commands over the chain.

  The link is purely additive and fires after the pull requests already exist, so `Closes #<n>`, the plan's summary bullets, the findings ledger and every draft-versus-ready decision survive it untouched. Three refusals are what keep it that way, and each is enforced in the script rather than asserted in prose:

  - **numbers, never branch names** — given a branch the tool pushes it and opens a pull request of its own, overwriting what the run just authored, so a non-numeric argument is refused before any call is made;
  - **never the ready-for-review flag** — draft-versus-ready is the terminal-state table's, decided per sub-lane, and a batch-wide flag here would override every one of those from the wrong place;
  - **`link` and nothing else** — `init`, `add` and `submit` all keep tracking state under the common git directory every linked worktree shares, so concurrent lanes would race over the same files. `link` writes none, which is also what lets it run while lane worktrees still hold those branches checked out.

  **A machine without the extension behaves exactly as it does today.** The script probes for it, exits having called nothing, and the batch keeps its branch-name base chaining and its stacked note. No gate checks for the extension, no precondition asks about it, and no run fails or prompts for want of it — the skill stays copyable to any machine.

  A failed link is reported with the tool's own message and then left alone: every pull request is already open and untouched, and losing the stack never costs the run the work.

  Two correctness points the design needed and now states.

  **A batch is not necessarily one stack.** A layer holding two independent lanes with a third stacked on one of them is one chain of two and one chain of one, so the host links per chain rather than per batch — handing all three to one call would tell reviewers the independent lane is what the top layer builds on. A chain of one is not a stack, which is why an ordinary unstacked batch reaches the step and calls nothing.

  **A gap in a chain is shown, never closed up.** A sub-lane that ends with nothing ahead of its base opens no pull request, while the sub-lane above it is still based on its branch — so a naive walk would hand the link the two pull requests either side of the hole and stack the upper on the lower. The walk stops at a sub-lane with no pull request: the runs either side are separate chains, and the gap is reported naming the sub-lane that produced none. Whether such a layer should run at all is a separate, still-open question and nothing here decides it.

- [`8608647`](https://github.com/ieuanign/skills/commit/860864706166904815da7f5fb6a8bdd010eb25e2) Thanks [@ieuanign](https://github.com/ieuanign)! - `dev-loop`: two lanes editing the same lines are now sequenced, not declared dependent.

  Gate 1's touchpoint intersection sorted every overlap into two outcomes: an additive shared file, where both lanes append to a registry and stay parallel, and a real dependency, where B consumes what A creates and gets stacked on it. A third case exists in practice and had no home — two lanes editing the same _region_ of a file, which is not a dependency at all but still cannot run concurrently without a textual conflict. It lived in a footnote a human had to remember.

  It is now one of three outcomes the host applies:

  - **additive co-touch** → stay in the same layer, note it, accept the trivial rebase
  - **same-region co-touch** → the later lane drops to the next layer, based on the branch below, with **no dependency claimed**
  - **real dependency** → B is stacked on A, and the discovered-blocker comment is posted to B's issue

  The last two produce the same branch shape and differ only in what they assert. That is the whole point: only a real dependency posts the comment, and only a real dependency asks the human anything. Collapsing same-region into dependency would tell a reviewer that B builds on A when it does not, and leave a permanent, wrong comment on B's issue; collapsing it into additive would send two lanes at the same lines concurrently and hand someone an avoidable conflict.

  This matters more now that a stack is a real object on GitHub rather than a sentence in a body — the claim gets published.

  The classification stays the host's own work in plain reading, and the contract now says why no agent can take it: one architect runs per issue, in parallel, and none can see another lane's plan, so the intersection is inherently cross-lane. It is not a cost decision that a better agent could revisit.

  Sequencing is what _avoids_ the conflict rather than deferring it — the later lane branches from the earlier one, so its writer opens the file with the earlier edit already in it. A next layer based on the trunk instead would hit the same conflict one layer later.

- [#83](https://github.com/ieuanign/skills/pull/83) [`1ebab7a`](https://github.com/ieuanign/skills/commit/1ebab7a03a5eb638b725bda90cf7631087099c5b) Thanks [@ieuanign](https://github.com/ieuanign)! - `dev-loop`: an unattended run now stacks the way a supervised one does, with nobody there to be asked.

  This is smaller than it sounds, because the supervised path never asked a human to _classify_ an overlap. The host does the intersection and the classification itself, in plain reading, with no agent and no prompt; the human is handed only the **remedy**, and only in the dependency case, choosing between stacking B on A — already marked recommended — and deferring B out of the batch.

  So the unattended path needs no new judgement stage and no extra agent. It runs the identical intersection, applies the identical three outcomes, and takes the recommended remedy. Previously the suppression table answered that question with _defer it out of the batch_, deferred to a spec that did not exist yet; it now answers **stack B on A**.

  **Defer drops out, and the contract says why rather than leaving it implied.** It is a human's "not this batch" — a scheduling judgement made from context the pipeline does not hold, about work someone wants to review this afternoon. Unattended there is nobody whose afternoon it is, and taking it would silently return less work than was asked for.

  The discovered-blocker comment was already a machine action and carries over unchanged, so the reason a lane was stacked is still recorded on the issue. The same-region outcome still posts nothing, exactly as under supervision. At the end, the unattended conclusion links the batch's pull requests through the same bundled script with the same absent-extension fallback — that step asks nothing, so gate suppression never touches it and it has no row in the suppression table.

  **Two costs are accepted and recorded rather than engineered around**, each with the failure it produces named, so neither is later mistaken for an oversight:

  - A **misclassification is unattended**: a real dependency read as additive puts both lanes in the same layer, and B's worktree never contains A's code. That surfaces as a red suite gate or a failed writer in B's lane — an attributable, bounded failure the existing debugger path already handles, not a silent bad merge.
  - A **same-region co-touch read as additive still conflicts when someone merges**. The run's job ends at the pull request, so that conflict lands on the human doing the merge, exactly where it lands today.

### Patch Changes

- [#80](https://github.com/ieuanign/skills/pull/80) [`fb28265`](https://github.com/ieuanign/skills/commit/fb282657db5c2175a1f52c6f062d34020eed2d4d) Thanks [@ieuanign](https://github.com/ieuanign)! - `dev-loop`: the pipeline gains a word for the chain, and stops using one word for two shapes.

  It said **wave** for a set of lanes that run concurrently and had nothing at all for a chain of branches each based on the one below. Those are different shapes — a wave holding three independent lanes is not a chain of anything — so every sentence about ordering was ambiguous, and none of it lined up with the vocabulary a developer meets in `gh stack --help`.

  The horizontal thing is now a **layer** and the vertical thing a **stack**, with a **trunk** at the bottom and a **top**. The rename is exhaustive across the skill, the contract and the phase scripts, and `CONTEXT.md` gains both terms — it defined neither before, so these are additions rather than rewrites.

  Renaming wave → _stack_ was the original proposal and would have been wrong: it turns "wave 2 runs after wave 1" into "stack 2 runs after stack 1", which asserts the opposite of the truth. Those are two layers of one stack.

  Nothing behaves differently. The layer rule reads exactly as the wave rule did — anything based on the trunk runs in layer 1, anything based on a branch that receives its commits in layer N runs in layer N+1.

- [#86](https://github.com/ieuanign/skills/pull/86) [`6224482`](https://github.com/ieuanign/skills/commit/622448232798cfad44b48555e70418b463e7b882) Thanks [@ieuanign](https://github.com/ieuanign)! - `npm run check` now verifies the shell scripts, including the two the pipeline executes.

  The repo's whole verification surface checked the plugin manifest, the phase scripts, the cost-stage vocabulary and version sync — and no shell script at all, though there are six. Two of them the pipeline invokes **by path at runtime**: `notify.sh` for every message under an unattended run, and `stack-link.sh` for Gate 2's stack linking. A syntax error in either was discovered when a lane tried to run it, mid-run, with no shell available to diagnose it. The phase scripts have had exactly this protection all along.

  Two checks, in the shape the file already uses:

  - **Syntax** — `bash -n` over every tracked `*.sh`.
  - **Executable bit** — every `*.sh` under `skills/` must be recorded `100755` in git's index. The skill runs these by path, so one committed `644` is unrunnable while `bash -n` still passes. The index is the authority rather than the working tree, because that is what a consumer's install checks out and a local `chmod` that was never staged is precisely the case worth catching.

  `shellcheck` is deliberately **not** adopted. It is a hard dependency nobody here has, and its findings on the six existing scripts are unverified — adding a check whose result has never been seen could only turn this suite red for a contributor who happens to have the tool. This is the **Full-suite command** `/dev-loop`'s suite gate runs, and `contracts.md` is explicit that a red result meaning nothing is worse than no result. It is worth proposing separately, once the existing scripts are known clean.

## 0.8.0

### Minor Changes

- [#75](https://github.com/ieuanign/skills/pull/75) [`61eaa61`](https://github.com/ieuanign/skills/commit/61eaa6101d1361683232742893d7ee74d8086f74) Thanks [@ieuanign](https://github.com/ieuanign)! - `dev-loop`: a per-lane cost log, replacing the token ceiling that was dropped.

  The whole point of this pipeline is that it is cheap enough to run on every issue, and until now there was no way to tell whether any given run was. A baseline existed — 63 completed supervised lanes, a median lane cost and a per-stage split — but it came from a one-off analysis script rather than from anything the pipeline does, so every change was argued against a number nobody could reproduce from a run, and a regression would have stayed invisible until someone re-ran the analysis by hand.

  **Every agent both phase scripts dispatch now leads its prompt with `[dev-loop lane=<issue> stage=<stage>]`** ([#28](https://github.com/ieuanign/skills/issues/28)), so an agent's own transcript identifies it without anyone pattern-matching prose. The inferences it replaces read wording that exists to instruct an agent rather than to identify it, and any prompt edit silently broke them; planning had it worse still, running before a plan file exists and so carrying no plan path to infer a lane from — while being roughly three tenths of a lane's cost. The stage vocabulary is one named list per script, in the baseline's own words: plan, write, review, suite, notify. A recovery is charged to the stage that needed it, so a debugger on a red suite is suite cost. The marker is inert — nothing returns it and no parsing depends on it.

  **`cost-report.mjs` reads those transcripts and prints what a lane cost and which stage spent it** ([#30](https://github.com/ieuanign/skills/issues/30)):

  ```
  [#28](https://github.com/ieuanign/skills/issues/28)
  Cost: 641K excluding cache reads (target 608K, +5%)
    write 44% · plan 29% · review 27% · suite 0.4%
  ```

  The metric is input plus cache creation plus output, excluding cache reads — the baseline's metric, and the comparison is meaningless against any other. The split is the point rather than a garnish: a bare total says a lane was expensive, the split says which dial to turn. A lane with no records reports that it was **not measured**, never a total of zero, which would read as free. The target is a constant in the script; it prints a percentage and gates nothing.

  **An unattended run leaves one log per lane under `.scratch/dev-loop-cost/<issue>.txt`** ([#31](https://github.com/ieuanign/skills/issues/31)), written after the last wave from every transcript directory the run captured — the host is the only part of the pipeline holding a shell, a workflow script having no filesystem access. One file per lane so a parallel batch does not interleave; that directory is already gitignored, so nothing accumulates in version control. Written for **every** lane, whatever its ending, because improvement data collected only on the clean path hides exactly the lanes worth looking at. Nothing goes to the issue thread or the PR body, a supervised run writes none, and a failure to produce a log changes no lane's ending and no run's conclusion.

  **Nothing halts on tokens, and `contracts.md` now says so as a standing rule.** The ceiling this replaces could not work: the runner's budget total is unset unless a human typed a budget directive, so it silently never fired under exactly the unattended run it was meant to guard; its spend figure is turn-wide and shared across the host and every lane, while the measured baseline is per-lane; and it counts output tokens, which is not the baseline's metric. It was also unnecessary — a lane is already bounded in agent invocations from five directions, and the most expensive lane in the measured set was not stuck but thirteen commits of genuine work against a median of three. A token ceiling would not have caught a runaway; it would have refused a big issue.

## 0.7.0

### Minor Changes

- [#72](https://github.com/ieuanign/skills/pull/72) [`ca77c76`](https://github.com/ieuanign/skills/commit/ca77c76eb8a4dc3b170937910bdd41ff240e351e) Thanks [@ieuanign](https://github.com/ieuanign)! - `dev-loop`: a lane that throws comes back attributed instead of vanishing.

  A lane that died from a terminal API error left no trace at all. The workflow runner resolves a thrown thunk to nothing and both phase scripts filtered their results for truthiness, so the lane disappeared from the returned array entirely — no entry, no issue number, no reason, no record of which issue was lost. Supervised mode survives this because a human counts lanes at Gate 2; unattended there is nothing to count against.

  Each per-lane closure is now wrapped once. A throw is caught and converted into an ending of the shape the lane would have produced itself: the issue number, the **FAILED** category, and a reason built from the error message plus the stack trace where one exists. A genuinely dead agent frequently throws neither, so the wording says so rather than promising a trace that will be empty.

  The crashed lane's partial sub-results come back with it, **attempt log included** — the record most worth keeping from a lane that crashed mid-recovery. Each unfinished sub-lane takes the same ending and is run through the terminal-state table, so the host meets a complete row at Gate 2 rather than a record with no `terminal` it cannot dispose of. Per the terminal-category split the label decides nothing: a crashed lane with commits on its branch pushes and opens a draft pull request like any other ending.

  **Neither phase script can drop a requested issue any more.** Both final filters became maps that attribute a null, which — now that the thunks cannot throw — can only be the runner itself dropping a lane, and is exactly as unattributable as the throw used to be. A throw in the planning phase's per-issue thunk returns the same `DIED` entry a dead architect already produced.

  The attribution is **mode-neutral**: the catch, the category and the reason are identical under `gated` and `unattended`, because a lane vanishing is a bug in the gated path too — there it shows up as a lane silently missing from the Gate 2 report.

  The wrapper is also the single point later work hooks an ending-time dispatch into. The lane body has seventeen ending sites, and threading anything through each of them is how two writers drift apart.

- [#72](https://github.com/ieuanign/skills/pull/72) [`ca77c76`](https://github.com/ieuanign/skills/commit/ca77c76eb8a4dc3b170937910bdd41ff240e351e) Thanks [@ieuanign](https://github.com/ieuanign)! - `dev-loop`: an optional messaging channel, as a bundled script reading its payload on standard input.

  Notification messages interpolate agent-generated free text — halt reasons, diagnoses, stack traces — which carries backticks, dollar signs, quotes and newlines. Composing a shell string around that fails silently on exactly the message that matters most, because the worst failures produce the ugliest text. `notify.sh` ships with the skill in the shape that closes that at its root: the payload arrives on standard input and is handed straight to the HTTP client to URL-encode, so it never enters a shell string and there is deliberately no variable holding it anywhere in the script.

  **Silent unless configured.** With either of its two environment variables missing it says nothing and exits successfully, which is what makes the channel genuinely optional at zero cost — no profile key, no ask-then-persist question, no intake precondition, and no error on every lane for a developer who never set it up. It drains its input before exiting, so a caller piping into an unconfigured channel never takes a broken pipe. A send that fails still exits 0: messaging is best-effort by specification, and no notification failure may change a lane's outcome.

  Rejected, so it is not re-derived: a protocol server. Payload safety was the one real argument for a typed integration and standard input closes it several rungs lower, while a server costs a runtime process, a dependency absent from this package, and a registration living outside the skill — the machine-precondition coupling this pipeline has deliberately been removing.

- [#72](https://github.com/ieuanign/skills/pull/72) [`ca77c76`](https://github.com/ieuanign/skills/commit/ca77c76eb8a4dc3b170937910bdd41ff240e351e) Thanks [@ieuanign](https://github.com/ieuanign)! - `dev-loop`: an unattended run now says what it is doing, at its start and at its end.

  `/dev-loop auto`'s human touchpoints were its two gates, and unattended mode removes both by definition without putting anything in their place. A developer who started a batch and walked away learned that a lane halted only by opening GitHub, and a batch could finish partly halted and partly shipped at a time they did not choose. Both host boundaries are now written up.

  **Lane start.** Act 0's final step adds the in-progress label and sends a started message, per lane. Its position _is_ the guarantee rather than a comment about one — Act 1 is the first agent dispatch, so both writes land before a single token is spent and a session that dies during planning still leaves the marker on the issue. It fires only for lanes that survived intake, so an issue this run dropped or refused is never marked as being worked on. After planning, the architect's summary bullets and open questions are commented on the issue — never the plan file, which survives on disk at tens of kilobytes and which no agent ever reads the comment version of.

  **Lane conclusion.** Gate 2 gains a fourth step, per lane and at the lane's last wave. Every lane loses its in-progress label without exception; then one rule decides what replaces it, from flags the phase-script result already carries. A lane whose closure **threw** takes the failed role — the case that previously left no trace at all. A lane the **notifier already labelled** is left standing, because a second verdict over the first is how two writers come to disagree in public. A **draft** with neither takes awaiting-human. A **ready** pull request takes nothing.

  **Exactly one closing message per lane**, unconditional, carrying each pull request's link and its ready-or-draft state. Unconditional is the point: paired with the started message it is the run's dead-session signal, so a start with no close plus a stale in-progress label reads as a dead run by inspection.

  The mode guard is **one line**, next to gate suppression. Each boundary is marked `⟨notify⟩` and states only _what_ to run, never _whether_ — three sites each testing the mode is three places for the guard to drift. A shared mechanism section says how a host write is made and nothing about what it says: free text goes in on standard input at every boundary, and label **roles** resolve to strings through the consuming repository's own triage-label documentation, resolved once at Act 0. No label string appears anywhere in the skill, and a role that repository has no string for is skipped silently — seeding labels is its setup work.

  This also closes a gap in the specification. It assumed every draft came from an ending, but a clean sub-lane drafts on an unmet acceptance criterion **alone**, and no notifier ever runs for that one — so without the amendment that draft would reach a human wearing no label at all. `notifications.md` now names the two drafts with no ending behind them and gives both to the host.

  The session-stopped class — a rate limit, a closed terminal, a sleeping machine — is named as uncoverable rather than quietly ignored: no code runs, so only what already reached GitHub survives. A watchdog stays out of scope; the human typed the command and can see their own terminal.

  Nothing here fires under `gated`, whose human touchpoints are its two gates.

- [#72](https://github.com/ieuanign/skills/pull/72) [`ca77c76`](https://github.com/ieuanign/skills/commit/ca77c76eb8a4dc3b170937910bdd41ff240e351e) Thanks [@ieuanign](https://github.com/ieuanign)! - `dev-loop`: a **notifier** joins the roster, writing a lane's ending from inside the running phase script.

  The host is blind while a phase script runs — a workflow script has no shell — so a lane that ended mid-script had no writer able to tell anyone. A run of several lanes can have one end at minute three while the rest run for another forty, and the developer should learn about it at minute three rather than when the wave returns.

  The notifier is the fifth roster agent, at the cheapest model and the lowest effort: it exists to run two or three commands in a context the host cannot reach, not to reason. Per ending it swaps the issue's label, comments the ending with its stack trace where one exists, and sends the one-line message. Its definition points at `notifications.md` for every rule it implements and restates none of them; what it adds is _how_ to execute safely — free text goes in on standard input (`--body-file -`, a quoted heredoc, `printf | notify.sh`) and never into a composed shell string.

  It is dispatched **once per lane at the crash wrapper**, not once per ending site: the label is per issue, so a lane with two ended sub-lanes still writes once, and the dispatch fires as that lane returns rather than when the wave does. The role is chosen by the script rather than the agent — `notifications.md` states the question that selects a role and `contracts.md` records that its two ending labels answer that same question, so **HALT** maps to awaiting-human and **FAILED** to failed. That keeps the mapping mechanical instead of a judgement made at the cheapest tier.

  **Neither write can change what the lane returned.** A notifier that dies, throws, or finds no label string for its role leaves the ending, the sub-results and the terminal state exactly as they were, and a dispatch that failed does not claim the label was written — the host relabels that lane instead. A lane that _threw_ is the host's too: a throw unwinds past the dispatch point, which is the latency the specification already accepts.

  Nothing fires under `gated`, where both gates already put every one of these outcomes in front of a human.

### Patch Changes

- [#72](https://github.com/ieuanign/skills/pull/72) [`11b3bd3`](https://github.com/ieuanign/skills/commit/11b3bd342c992c769a13a36bdf692bf995d6d8d6) Thanks [@ieuanign](https://github.com/ieuanign)! - `dev-loop`: the README says what an unattended run needs before it can report anything.

  Both of the reporting channels an unattended run uses are optional and **silent when absent** — which is what makes them cost nothing to skip, and also what made them impossible to discover. A developer who installed the plugin and ran `/dev-loop auto` got no labels and no messages, with nothing anywhere naming what to set up: the three workflow labels were mapped only in this repo's own `docs/agents/triage-labels.md`, which never installs into a consumer, and the two environment variables were named only in a comment inside `notify.sh`, a file nobody has reason to open.

  The README now carries both, with the commands: `gh label create` lines for the three labels, where to map roles to strings and that the names are yours to choose, and the two variables with what happens when each is missing. It also says plainly that neither applies to a supervised run.

  `notifications.md` gains the durability clause the rest of the file implied but never stated: **no notification failure changes the lane it is reporting.** A failed `gh` command, a role with no label string, a label string naming a label the tracker does not have, an unreachable channel — each is reported and let go, and the lane's ending, push, pull request and worktree are what they would have been anyway. A run whose reporting is broken still does the work.

## 0.6.0

### Minor Changes

- [#69](https://github.com/ieuanign/skills/pull/69) [`5ef38c1`](https://github.com/ieuanign/skills/commit/5ef38c1a0f7a7def6643ac117e32e4af77b5903a) Thanks [@ieuanign](https://github.com/ieuanign)! - `dev-loop`: one push per sub-lane, and a worktree removed only once its work reached the remote.

  The push cadence recorded as the standing default — the host pushes after each plan commit — was never implementable. The whole commit loop runs inside a single workflow call and a workflow script has no shell, so the host's first control point is that call returning; reaching it otherwise would mean changing the writer's contract, which never pushes, or spending an agent invocation on one git command, which the skill's hard rules forbid in terms. Nothing in the pipeline consumed an intermediate push either — the reviewer diffs local refs — so the only thing one could feed is a repository's own push-triggered CI, which gains nothing from running against a branch the pipeline is still committing to. `contracts.md` now records **why** it is dead, so it is not re-proposed.

  What replaces it is one rule: **a sub-lane's branch reaches the remote exactly once**, at the end of its wave — a sub-lane that concluded clean pushes immediately before its pull request is created, and one that ended performs that same single push. The push is guarded on the branch being ahead of its base, read from git rather than inferred from the commit list the writers reported, so a sub-lane that ended before it committed anything attempts nothing. It is **never a force-push, in either mode**: every push the pipeline makes is a fast-forward by construction, so forcing is never the fix, and there is no ceiling, ending or absent human that unlocks it. A rejected push stops that sub-lane's conclusion where it stands — no pull request, worktree kept, git's own message reported verbatim.

  The accepted cost is recorded rather than solved: this version is always one wave, so a three-issue batch holds the first-finished sub-lane's pull request until the slowest one ends.

  Underneath it was a hazard worth naming. The old rule kept an ended lane's worktree for review while pushing only on the approved path, so an ended lane could hold the only copy of its work on a local branch that never reached the remote. **One invariant replaces the two-case treatment:** a sub-lane's worktree is removed when, and only when, its work has reached the remote _and_ no human is expected to resume in it. Two rules make it safe, and neither is negotiable. **Push succeeds first, remove second** — after removal the remote branch is the only copy, so a push that did not succeed keeps the worktree. **A dirty worktree keeps itself** — `git worktree remove` without `--force` already refuses on tracked modifications or untracked non-ignored files, and that refusal _is_ the guard, which is why the pipeline never passes `--force` and can never talk its way past one.

  The invariant's second condition is what splits the modes: under `gated` a human is present and is expected to pick the branch up in that checkout, so an ended sub-lane keeps its worktree; under `unattended` nobody is there to resume, the condition is vacuous, and removal proceeds. This **reverses** the previous rule under `unattended` only. A held sub-lane falls out of the first condition rather than needing a rule of its own: it has pushed nothing, so removing it would destroy work that exists nowhere else. The main worktree is never a candidate under any condition.

  The skill's closing guarantee is restated, because the old one is no longer true: an `unattended` run ends with only the main worktree remaining unless a removal was refused or a push failed, and a `gated` run additionally keeps every worktree its human was offered and did not take.

- [#69](https://github.com/ieuanign/skills/pull/69) [`5ef38c1`](https://github.com/ieuanign/skills/commit/5ef38c1a0f7a7def6643ac117e32e4af77b5903a) Thanks [@ieuanign](https://github.com/ieuanign)! - `dev-loop`: `cleanup` lists the worktrees it cannot prove are done, instead of deleting them.

  Cleanup mode scanned every worktree and removed the ones whose branch was merged. That predicate was never the right one: a branch merges the moment its pull request lands, which says nothing about whether the run holding that checkout has finished with it — so cleanup could delete an active worktree out from under a batch still in flight, and the failure looked exactly like the scan working correctly.

  Now that every normal path removes its own worktree the moment its work reaches the remote, the scan is also unnecessary. Cleanup **removes no worktree at all**. It lists every one still standing with what can actually be observed about it — uncommitted or untracked work, meaning a removal that was refused; nothing on the remote, meaning a lane held at a gate or a session that died mid-run; or pushed with its pull request still open — and hands the human the removal command rather than running it for them. None of those states has an exact done-signal, and none of them distinguishes a live run's worktree from an abandoned one.

  Merged lanes' local branches and plan files are still reaped: those have an exact signal, and reaping them is why cleanup exists. Which signal, though, now says what it actually does. A repository that merges by **squash** or by **rebase** replays the work under new shas, so the branch's own commits are never ancestors of the default branch: `git branch --merged origin/<DEFAULT>` never lists it, and that arm of the done-check silently never fires. The merged-PR check is the load-bearing one and the git arm is the fallback, which is the opposite of how it read.

  Branch deletion states git's real rule rather than assuming one. `git branch -d` succeeds whenever the branch is merged into the default branch **or** still matches its upstream, so a pushed branch reaps cleanly under either merge style. It refuses one combination, which squash and rebase both produce: a merge that rewrote the commits, whose remote branch was then deleted — GitHub's default on merge. Only when `-d` refuses _and_ the merged check passed does cleanup re-run it as `git branch -D`; that check is the proof git can no longer see for itself, and without the fallback cleanup would reap nothing at all in either of the two commonest GitHub configurations. A branch a surviving worktree still holds cannot be deleted at all, and is listed alongside it.

  The report keeps **reaped** and **needs attention** apart, so the difference between what was cleaned up and what a human has to look at is visible rather than merged into one table. An empty second table is the good outcome.

- [#69](https://github.com/ieuanign/skills/pull/69) [`5ef38c1`](https://github.com/ieuanign/skills/commit/5ef38c1a0f7a7def6643ac117e32e4af77b5903a) Thanks [@ieuanign](https://github.com/ieuanign)! - `dev-loop`: a sub-lane's ending decides whether its pull request opens ready, draft, or not at all.

  Under supervision a human at Gate 2 decides what a sub-lane's ending means: they read the commit list, the findings ledger and the criterion verdicts, and arbitrate anything contested. Remove that human and nothing decided it — a sub-lane with open findings, a red suite or an unmet acceptance criterion would open exactly the pull request a clean one opens. One table in `contracts.md`'s **Lane conclusion** decides it instead, read under `unattended` only: under `gated` every one of these outcomes still goes in front of the human.

  **The ready predicate is one expression**: the sub-lane concluded clean, and its findings are resolved, and the suite passed or did not run, and every acceptance criterion is met. Anything else drafts. It is written as that four-way conjunction and deliberately not reduced to the shortest expression equivalent to it today — an ending already implies the middle two, so the reduction would be correct now and silently wrong after any change that let a red suite through without ending the sub-lane, with no line to have got wrong.

  A **partial** criterion drafts alongside a **not-met** one. Nobody watched the run, so "not demonstrably done" defaults to draft, exactly as the findings ledger and the suite gate already behave; a half-implemented criterion presenting as a ready pull request would reduce the signal to one line of ledger prose the merger may skim. An **ended** sub-lane is never ready whatever its ledger says, because the pipeline stopped before it could finish judging it.

  Work that exists stays reviewable: open findings, a red suite, or an ending mid-pipeline all open a **draft** rather than stranding the branch, and the body carries a **Why this is a draft** line naming which of the four triggers fired. Work that does not exist opens nothing — a narrow case now that the give-up path commits abandoned work as a `wip:` commit, leaving only the sub-lane whose writer stopped before changing a file.

  Every row is decided **per sub-lane**, from that sub-lane's own inputs: each is its own branch and its own pull request, so one sub-lane's draft never drafts another's. Mode W's per-sub-lane result carries a `terminal` of `{pr, push, reasons}`, and Gate 2 opens what it names rather than deciding again. **Git is the authority on the push column** — the row is a proposal, and the host's ahead-of-base read settles it, which is what lets a resumed sub-lane whose commits were already in the log still be owed a real pull request. The pipeline sets draft state only on pull requests it created and never converts one a human opened, per the append-only invariant.

  Two collection bugs fell out of building it, both in `phase-execute.js`. A writer that committed and _then_ returned `BLOCKED` dropped its commits from the sub-lane record, which the table's last two rows would have read as "nothing landed"; the commits a fix cycle or a suite fix landed before stopping were lost the same way. Absorption now happens before the result is read, on every path.

### Patch Changes

- [#69](https://github.com/ieuanign/skills/pull/69) [`8617f2c`](https://github.com/ieuanign/skills/commit/8617f2c9bc8ac76d664467c9a9c4b6dd5d72844c) Thanks [@ieuanign](https://github.com/ieuanign)! - Repo tooling: pin `human-id` so the `changeset` CLI runs again.

  `human-id@4.2.0` shipped `"type": "module"` in a **minor** bump, so every CommonJS consumer broke on install. `@changesets/write@0.4.0` `require()`s it and floats into it through `^4.1.1`, which made every `changeset` command — `status`, `version`, and the `changeset` command this repo's own contribution checklist tells maintainers to run — die with `ERR_REQUIRE_ESM` before reading a single changeset file.

  An npm `overrides` entry pins it to `4.1.3`, the last CommonJS release, with the reason recorded beside it in `package.json` and a note on when to drop it. Nothing about the package's own contents changes.

## 0.5.0

### Minor Changes

- [#64](https://github.com/ieuanign/skills/pull/64) [`892e889`](https://github.com/ieuanign/skills/commit/892e889da7235f537072f1d3153ee582ecc5a26a) Thanks [@ieuanign](https://github.com/ieuanign)! - `dev-loop`: a terminal category decides nothing. Every ending carries a label, ends only its own sub-lane, and is disposed of by mode.

  `contracts.md` justified its two terminal categories two incompatible ways — _does reviewable code exist_ where it defined them, _who ended the lane_ everywhere it assigned them — and the category then decided whether a pull request existed. The same agent stalemate was `UNRESOLVED` in the review loop and `HALT` in the implement loop, and the suite gate needed a section arguing why every one of its endings was the exception. The distinction could not carry the weight: a dead reviewer and an exhausted fix-cycle bound leave exactly the same branch behind.

  The category is now a **label in the ending's explanation**, and one question selects it: did something deliberately stop, or did something break? `HALT` covers a bound reached, a debugger routing to `replan` or `user`, and a writer's reasoned `BLOCKED`; `FAILED` covers a dead agent and a return the loop cannot use. `UNRESOLVED` is deleted. Nothing branches on the label — no conditional in the contract, the phase script, the host skill or `notifications.md` reads it — and it is the distinction `notifications.md` already selects its own label roles by: a failure is always a break and never a verdict.

  What an ending _produces_ is decided by the conclusion mode alone, in a disposition table that lives in `contracts.md`'s **Lane conclusion** and nowhere else: push, pull request, worktree, and where the explanation is written. Under gated, an ended sub-lane is now _offered_ at Gate 2 on the same terms as a clean one — pushed on the human's approval, no PR by default with "open a draft PR anyway?" as the option, worktree kept. One exception, and only one: a sub-lane where nothing landed has no branch ahead of its base, so there is nothing to push and no PR to open. Whether it is ahead is read from git, never inferred from the commit list the writers reported.

  **An ending ends its sub-lane, not its lane.** Sub-lanes are separate branches, worktrees and pull requests, so one that already finished keeps its result and its disposition whatever a later one does, and a sub-lane runs no stage after the one that ended it: an incomplete commit list dispatches no reviewer and no suite gate, because the stages that certify work exist to certify complete work. The lane keeps a roll-up of its sub-lanes' labels for reporting only.

  Two things now survive an ending that used to be lost with it. Abandoned work is **committed as evidence**: the writer call of the final permitted debug+fix attempt — the only call after which the pipeline is certain to give up — instructs the writer to commit what exists as `wip(<scope>): #<n> - commit <k> FAILED - <reason>` and return `FAILED` anyway. It is evidence, not work: listed among the sub-lane's commits so the human sees it, excluded from the made count, which would otherwise read `1 planned, 2 made` for a sub-lane that made one. And every sub-lane carries an **attempt log** — a seventh findings-ledger category recording everything the pipeline did after things first went wrong, in order, with what triggered each attempt, what the debugger said and how it ended — reaching the human at Gate 2 and in the pull request body of a sub-lane that ended.

  `OWNER`'s four values are finally written down beside the key that carries them: `code-writer` and `retry` route, each naming the stage that runs next, while `replan` and `user` end the sub-lane identically and differ only in where they send the reader — which is why both are kept.

- [#63](https://github.com/ieuanign/skills/pull/63) [`360171d`](https://github.com/ieuanign/skills/commit/360171d5e238599056b8e2381c7f65ddf88cc171) Thanks [@ieuanign](https://github.com/ieuanign)! - `dev-loop`: `/dev-loop auto <issues>` — an unattended run, guarded to the workflow runner, over a stated rule for where configuration lives.

  Both human gates fired on every run, and a developer who wanted an issue taken from filed to pushed PR without supervising the middle had no way to ask for it. One argument token now buys it. Modes lead and dials trail — the shape `cleanup` already had — so the word deciding whether the developer will ever be asked for approval is the second one they type. Act 0 parses it once and carries it as a single value; no later stage re-derives it.

  Gate suppression is one constant in one place, with a table giving every gate question its unattended answer. **Suppression removes the questions, not the work**: Gate 1 still intersects touchpoints, splits sub-lanes and applies the profile's constraints, and Gate 2 still pushes and opens the PR. The profile's one-time ask-then-persist questions are not gates and fire under both modes. `contracts.md`'s Lane conclusion branch — still the only branch point in that file — now names the token a developer actually types, and Mode A still implements the gated half only.

  **Unattended mode runs only under the workflow runner**, and intake refuses it rather than degrading into direct orchestration, which would cost what the supervised run it replaces costs. `contracts.md` records all three reasons, each independently sufficient: per-stage effort is impossible without the runner and the effort dials are the cost thesis; the notifier fires from inside the phase script because the host is blind while one runs; and bound enforcement is mechanical in a script but merely remembered by a model otherwise. The refusal names the settings key, says a restart is required — tool availability is fixed at session start — and asks once, with the per-machine settings file as its own persistence, so a declined answer is a real answer that never returns as a question.

  Where configuration lives is now a rule rather than a list that rots: **varies per run → argument, varies per repository → profile, does not vary → constant**, with the homes table it produces and the refusals that keep it honest — no per-repository effort tiers, no per-run overrides of gates, stages or cost behaviour. One value moves under it. The fix-cycle count was an argument with a single hardcoded call site, a dial nobody had turned; a repository with a flaky suite genuinely wants more cycles, so it becomes a repository-profile key with a default of 2. `0` is now a real answer that spends no fix cycle, where the old falsy fallback silently turned it back into two.

- [#64](https://github.com/ieuanign/skills/pull/64) [`892e889`](https://github.com/ieuanign/skills/commit/892e889da7235f537072f1d3153ee582ecc5a26a) Thanks [@ieuanign](https://github.com/ieuanign)! - `dev-loop`: a suite gate runs the repository's own full test suite once per sub-lane, in both modes.

  Nothing in the pipeline ran it. The writer runs lint and tests **scoped to the module it touched**, before each commit, and that was the entire test surface — a commit that reddened a sibling module's suite was invisible to every stage, the reviewer being explicitly told not to run suites. A developer could get a green-looking PR on a red tree with nobody having looked.

  A sixth stage now sits between the review loop and the lane's conclusion, in gated and unattended modes alike, so the human at the approval point sees a green suite rather than assuming one. It runs **once per sub-lane** — sub-lanes are separate branches, worktrees and pull requests and can span waves, so every PR carries its own result — and the result reaches the human in both places it is due: the lane's conclusion and the PR body.

  The gate is a plain subagent with no persona and deliberately no agent type, at the cheapest model and lowest effort: loading a role definition — merge-base rules, blocking bars, dispute handling — to run one command is waste. It reads nothing, fixes nothing, commits nothing, is named in the progress display, and returns `passed` / `failed` / `not-run` with the failing identifiers and the command's output.

  **The command is configuration, never discovery.** A new repo-profile key, read under the profile's existing ask-then-persist rule, where a persisted `none` is a real answer: a repository whose suite needs infrastructure this pipeline does not stand up would otherwise get a red result that means nothing. With no command the gate reports **not run** and dispatches nothing to say so — never shown as passed, per the convention that a check which never ran must say so rather than show an empty result.

  **A red suite is diagnosed, not handed straight to the writer.** The gate observed only that the suite is red and the breakage is usually outside the writer's commit scope, so a blind fix would flail. It routes to the debugger and the debugger's own routing decides — a retry, a writer fix against the diagnosis, or an ending — reusing the per-commit failure path verbatim. Ordinary review findings still go straight to the writer: they already carry a failure scenario and a suggested fix.

  The round bound is **progress-sensitive rather than a flat cap**: it advances by one unless a previously unseen failing identifier appears, and a new identifier resets it, because a shrinking set of the same failures is not progress. At 2 the loop stops. A hard ceiling of 8 rounds applies regardless, since a mis-parsed identifier list would look like new failures every round and reset forever.

  Every ending the gate can produce leaves the plan's commits and the review's fixes on the branch — it runs only after both exist — so the sub-lane finishes with the suite red and says so, carrying its failing identifiers and any diagnosis. What each ending is _called_ explains it and decides nothing: `HALT` for a bound reached or a routing decision, `FAILED` for a break, and the conclusion mode decides what any of them produces.

## 0.4.0

### Minor Changes

- [#44](https://github.com/ieuanign/skills/pull/44) [`7e6e8d7`](https://github.com/ieuanign/skills/commit/7e6e8d72338aa579e9708393846fb657b6575968) Thanks [@ieuanign](https://github.com/ieuanign)! - `dev-loop`: `notifications.md` — one normative specification for everything an unattended run writes to the outside world, implemented by both writers that emit it.

  An unattended run has two of them: the host, at its own boundaries, and a notifier subagent, from inside a running phase script — and nothing kept the two in step. `contracts.md` had left the space open ("Both are specified separately; this is the section they fill"). It is now filled by a document rather than a copy: the event table with the writer owning each event, the label roles and the one question that selects one, the message and comment formats, the channel contract, the ordering guarantees, and the hazards recorded rather than solved. Nothing in it fires in gated mode, stated once and nowhere repeated.

  The scoping rule behind the writer column is recorded so nobody re-derives it — the notifier owns only what the host cannot see. A workflow script has no shell, so the host is blind while one runs and a mid-lane event has no other writer; everything at a host boundary is a host command. Routing every event through the notifier was rejected: it spends an agent to run one command.

  Label roles only, never label strings — each resolves through the consuming repository's triage-label documentation, so a repository keeps its own vocabulary. Two properties fall out of the selecting question rather than being designed in: failed is always a crash and never a verdict, which is what makes it answer _is this worth retrying?_, and every draft-PR case is host-applied while every halt case is notifier-applied.

  `contracts.md`'s unattended paragraph now points at the new file and states which of the two documents governs what, and its append-only invariant records why writing labels to an issue a human filed is inside it: a label add or remove is additive and reversible, and human intent is what the invariant guards. No behaviour ships — every event in the table is implemented by a later change.

- [#44](https://github.com/ieuanign/skills/pull/44) [`7e6e8d7`](https://github.com/ieuanign/skills/commit/7e6e8d72338aa579e9708393846fb657b6575968) Thanks [@ieuanign](https://github.com/ieuanign)! - `dev-loop`: the reviewer now checks the work against the issue, not just against the plan.

  Nothing in the pipeline had ever compared the diff to the request. The reviewer saw only the plan — a faithful distillation is still a proxy — and its own text justified skipping a spec check on the grounds that a later conformance sign-off covered it. That sign-off never read the issue either, and it no longer runs.

  The reviewer now receives the originating issue's body in its arguments, fenced, and returns a `met` / `partial` / `not-met` verdict per acceptance criterion with the evidence for each. It is passed the body rather than an issue number, so its Bash stays read-only and git-only. The spec report brief is inlined in the agent definition, the same way the standards one is.

  A review's range is one sub-lane while the criteria belong to the whole issue, so the reviewer is told which sub-lane it is judging: a criterion the plan delivers in a different sub-lane is `partial`, naming that sub-lane, never `not-met`. Otherwise every early PR of a multi-PR plan would read as failing work that was not yet due.

  **Spec verdicts never block, by construction.** They stay out of `FINDINGS`, never change the `VERDICT`, never trigger a fix cycle and never end a lane — a review with zero blocking findings and a not-met criterion is `APPROVED`. The writer is plan-bound and returns BLOCKED rather than improvise, and the architect, the only agent that could re-decide a plan, does not run again in the lane; a blocking spec finding would demand a fix nobody available could make. The verdicts route to the findings ledger, then to the per-lane report at Gate 2 and an **Acceptance criteria** section in the PR body, in front of the human who merges.

  `contracts.md` gains the per-stage context contract — what each stage receives, what it is permitted to read, and what it returns — with the reviewer's row stating the issue body in and the criterion verdicts out.

### Patch Changes

- [#44](https://github.com/ieuanign/skills/pull/44) [`7e6e8d7`](https://github.com/ieuanign/skills/commit/7e6e8d72338aa579e9708393846fb657b6575968) Thanks [@ieuanign](https://github.com/ieuanign)! - `dev-loop`: the plan's summary bullets reach the PR body's Context section, and the run is explicitly append-only.

  The architect's summary bullets had exactly one consumer — the plan-approval gate. Suppress that gate and the orientation it produced was thrown away. Phase A is now told to keep them for the rest of the run, and Gate 2 places them in the PR body's **Context** section beside the planned-versus-made commit counts already there.

  The second half fixes what the run is allowed to write, now that per-criterion verdicts exist to tempt it. Stated in `SKILL.md` and in `contracts.md` where it governs both execution modes: the run appends to issues and pull requests, adds and removes only its own workflow labels, and sets state only on artifacts it created. It never edits an issue body, never ticks an acceptance-criteria checkbox, and never converts a pull request a human opened. Verdicts are reported — at the lane's conclusion and in the PR body — and never written back to the issue's checklist: the closing keyword closes the issue on merge regardless, and the aggregate verdict belongs to the pull request's own state.

- [#44](https://github.com/ieuanign/skills/pull/44) [`7e6e8d7`](https://github.com/ieuanign/skills/commit/7e6e8d72338aa579e9708393846fb657b6575968) Thanks [@ieuanign](https://github.com/ieuanign)! - `dev-loop` roster: the `code-writer` no longer looks for stack gotchas or lint/test commands in `docs/agents/*`, and the architect is told its Hard constraints section is the writer's only channel to project rules.

  `docs/agents/` holds the issue-tracker workflow, triage labels, domain docs, the dev-loop repo profile, and the coding-standards rubric — none of which is a stack gotcha or a module's test command. The writer was told otherwise in three places: its repo-facts rule, its verification-command resolution order, and its Stack notes section. All three now name the real sources — the repo's CLAUDE.md layer, the plan's Test expectations and Hard constraints, and the touched module's own manifests.

  That leaves the plan as the writer's only channel to project rules, with no fallback: context documents and decision records are swept by the architect alone, and neither the writer nor the reviewer ever opens them. The plan template's Hard constraints section now says so, so the architect states a rule rather than citing a document the writer cannot read.

## 0.3.0

### Minor Changes

- [#40](https://github.com/ieuanign/skills/pull/40) [`37fa2e0`](https://github.com/ieuanign/skills/commit/37fa2e0e095ed243c820f27b40b73e35d7a44392) Thanks [@ieuanign](https://github.com/ieuanign)! - The `dev-loop` roster ships as plugin agents, and its skill preloads now resolve.

  `skills:` in a subagent's frontmatter is a **preload** — it injects the skill body at agent startup, and a name that doesn't resolve is skipped with only a debug-log warning. All three roster preloads were silently dead: `code-writer`'s `tdd` and `debugger`'s `diagnosing-bugs` exist bare only on the npx path, and `reviewer`'s `code-review` pointed at the bundled skill, which sets `disable-model-invocation` and is unpreloadable by rule. None of the three has the `Skill` tool, so preload was their only channel.

  What changed:

  - The roster moved from `skills/dev-loop/agents/` to `agents/` at the plugin root, where it installs with the plugin. `/dev-loop`'s Act 0 no longer checks for or copies roster members into your repo.
  - `code-writer` and `debugger` preload `mattpocock-skills:tdd` and `mattpocock-skills:diagnosing-bugs` — namespaced, so they resolve on the plugin path.
  - `reviewer` carries no preload at all. Its Standards axis is now self-contained (standards-source discovery plus the twelve-smell baseline), and it runs on a more capable model at high reasoning effort.
  - The marketplace declares `mattpocock-skills` as a cross-marketplace dependency, so installing this plugin pulls Matt's in automatically. The prerequisite is enforced rather than documented.
  - `npx skills add` is now best-effort: it installs the skills but not the roster agents, and the namespaced preloads don't resolve on that path. Use the plugin install.

  **Migration.** If you ran `/dev-loop` before this release, it copied the roster into your repo. Those copies are now stale and shadow nothing useful — delete them:

  ```bash
  rm .claude/agents/{architecture-engineer,code-writer,debugger,reviewer}.md
  ```

### Patch Changes

- [#40](https://github.com/ieuanign/skills/pull/40) [`37fa2e0`](https://github.com/ieuanign/skills/commit/37fa2e0e095ed243c820f27b40b73e35d7a44392) Thanks [@ieuanign](https://github.com/ieuanign)! - `dev-loop`: Act 2's `.worktreeinclude` copy step now says to strip the trailing slash off directory entries before copying.

  `git ls-files --directory` collapses a fully-ignored directory to a single entry ending in `/`, and `cp -R dir/ dest/` copies that directory's _contents_ rather than the directory itself — so anything provisioned this way landed one level too high, scattered directly into the worktree's `.claude/` instead of `.claude/agents/` and `.claude/skills/`. Silent: the copy reports success and the files exist, just at the wrong path.

## 0.2.2

### Patch Changes

- [#37](https://github.com/ieuanign/skills/pull/37) [`413a820`](https://github.com/ieuanign/skills/commit/413a820aa08ff482b02112d87e2815a62a302b8e) Thanks [@ieuanign](https://github.com/ieuanign)! - `/dev-loop`: worktrees move to `.claude/worktrees/`, and provisioning stops copying `.claude` into them.

  Act 2 copied `<MAIN>/.claude` into every lane worktree, justified as "the CLAUDE.md layer must exist in the worktree". That justification was wrong twice over: `CLAUDE.md` is a tracked root file the checkout already delivers, and `.claude/` is a different thing entirely. Nothing needed the copy — the agents are Agent-tool subagents of a session rooted in MAIN, so their definitions, skills, settings, and permissions resolve from MAIN's config regardless of which directory they `cd` into, and no bundled agent or phase script references `.claude/` at all.

  What the copy did do was inject files that are untracked in the worktree. In a repo that neither tracks nor gitignores `.claude/` — the default state after a first run, since Act 0 creates the roster there — Gate 2's `git worktree remove`, forbidden from using `--force`, then refused on every lane. Worktrees accumulated and the closing guarantee that a fully approved run leaves only the main worktree was false. Deleting the copy removes the cause: a worktree now holds the checkout plus declared `.worktreeinclude` files, nothing else.

  Worktrees also move from `.scratch/worktrees/` to `.claude/worktrees/`, matching where Claude Code's own worktrees live, with a precondition that the path is gitignored so a live worktree never pollutes MAIN's `git status`. `.scratch/` stays for plans. The `.worktreeinclude` guard line follows to `!.claude/worktrees/**`.

  `.worktreeinclude` guidance tightens to match what it is for: env files and local config a cold checkout cannot run without. Dependencies leave it — a copied `node_modules/` carries platform-specific native builds and drifts from the lockfile — and become a new **Setup command** profile key that Act 2 runs once per worktree. That keeps worktree lifecycle whole inside the orchestrator's acts, per the skill's own rule that provisioning is never agent work; the bundled agents are untouched.

  Verified across all three repo classes (gitignores `.claude/`, tracks `.claude/agents/`, neither): removal succeeds without `--force`, `.env` reaches the worktree, `node_modules` does not, and MAIN's `git status` stays clean with a live worktree.

## 0.2.1

### Patch Changes

- [#34](https://github.com/ieuanign/skills/pull/34) [`bac71bc`](https://github.com/ieuanign/skills/commit/bac71bc6b20c42ca95ec432dc87953b1fe20229a) Thanks [@ieuanign](https://github.com/ieuanign)! - Maintainer tooling: `.claude-plugin/plugin.json` now tracks `package.json`'s version automatically. `changeset version` bumps only `package.json` and has no knowledge of the plugin manifest, so every release PR arrived with the two out of sync and had to be corrected by hand — and `claude plugin validate --strict` passes that state, so nothing caught it but a human remembering. The `version` script now chains `scripts/sync-plugin-version.sh`, which rewrites the version string in place (leaving the rest of the file byte-identical) and is a no-op when the two already agree. The release workflow calls `npm run version` so CI and a local run take the same path. The README's maintainer list gains it, plus `npm run check`, which was added without being documented there.

## 0.2.0

### Minor Changes

- [#20](https://github.com/ieuanign/skills/pull/20) [`cdc80d6`](https://github.com/ieuanign/skills/commit/cdc80d61f078458bbfab90a264323dc32e06bc37) Thanks [@ieuanign](https://github.com/ieuanign)! - dev-loop: the conformance sign-off stage is cut from both execution modes — a lane now runs plan → implement → review and ends there, three agent stages per sub-lane instead of four. All four of the stage's checks already happen elsewhere: approach-followed and hard constraints in the reviewer's own priorities, scope in its scope priority, and the commit breakdown in the host's plain-code comparison. What the stage uniquely added was the reviewer's deference to it, which was deference to a check that had already run, so the reviewer no longer defers to a later verdict and the writer no longer tells itself an architect reads its deviation lines.

  Gate 2 and the PR body lose only the sign-off verdict line: the commit list, deviation counts, and all four findings-ledger categories survive. Resume loses its sign-off marker — a lane whose commits are all present now resumes by re-running the review, which is safe and idempotent. The architect's Mode 2 conformance section stays in its agent definition for the separate orchestration system that still dispatches it; `/dev-loop` simply never calls it.

- [#20](https://github.com/ieuanign/skills/pull/20) [`cdc80d6`](https://github.com/ieuanign/skills/commit/cdc80d61f078458bbfab90a264323dc32e06bc37) Thanks [@ieuanign](https://github.com/ieuanign)! - dev-loop: the `architecture-engineer-lite` and `code-writer-lite` agent definitions are deleted, and the `lite` flag goes with them — out of the invocation grammar, the flag documentation, the hard rule forbidding its inference, the roster check, and both phase scripts' arguments. Each phase script now selects its agent type as a plain constant. The two files were byte-identical to their full counterparts below the frontmatter, differing only in a single effort value, and the flag fired zero times across three weeks of transcripts and every measured lane.

  Recorded as a consequence rather than left to be discovered: the direct-orchestration mode is now permanently tier-locked. Effort is settable only in agent frontmatter or in the workflow runner's per-call options, and the direct Agent tool has no effort parameter — so any future cost dial is workflow-mode-only by construction.

  A repo that already ran `/dev-loop` has inert copies of the two deleted files in its own `.claude/agents/`. Nothing dispatches them once this lands, and the roster check no longer requires or recreates them; delete them at your leisure.

- [#20](https://github.com/ieuanign/skills/pull/20) [`cdc80d6`](https://github.com/ieuanign/skills/commit/cdc80d61f078458bbfab90a264323dc32e06bc37) Thanks [@ieuanign](https://github.com/ieuanign)! - dev-loop: the single overloaded `HALT` splits into two terminal categories, named for what each does to the lane. **HALT** means the lane is dead — nothing reviewable exists, so no PR is created — and covers six endings: the debugger routing to `replan` or `user`, the per-commit debug+fix bound exhausted, the writer returning `BLOCKED`, any writer return other than `COMMITTED` after debug routing, the reviewer returning `ERROR` or dying, and a fix-cycle writer returning anything other than `COMMITTED`. **UNRESOLVED** means the code exists and is simply not clean, and covers the two endings where it does: contested findings the reviewer still confirms after re-verifying the writer's evidence, and the fix-cycle bound exhausted while the reviewer still requests changes. The distinction is whether reviewable code exists at the end, not severity.

  The reasons the pipeline reports now use the same two words, so a reported reason maps to a contract line without translation, and the orchestrator surfaces "the lane died" and "the lane finished with unresolved findings" as visibly different outcomes. Phase B's per-lane return carries `ending: {category, reason}` in place of the old `halted` string. No behaviour change — the same conditions end a lane, and both `UNRESOLVED` endings still land at Gate 2 exactly as they did.

- [#20](https://github.com/ieuanign/skills/pull/20) [`cdc80d6`](https://github.com/ieuanign/skills/commit/cdc80d61f078458bbfab90a264323dc32e06bc37) Thanks [@ieuanign](https://github.com/ieuanign)! - dev-loop: the host now compares the plan's commit ordinals against the commits the writers actually made, and reports the result as `<n> planned, <m> made`. It is a list diff in plain code over two lists the host already holds — the ordinals it passed in as arguments and the shas every writer return carried back — so no agent is dispatched to notice a plan that said three commits and produced seven. The counts surface at Gate 2 alongside the commit list and the findings ledger, and in the PR body's Context section. A mismatch never blocks: it does not halt the lane, does not trigger a fix cycle, and does not change the terminal state, because fix cycles legitimately append commits and a writer may legitimately split one.

- [#20](https://github.com/ieuanign/skills/pull/20) [`cdc80d6`](https://github.com/ieuanign/skills/commit/cdc80d61f078458bbfab90a264323dc32e06bc37) Thanks [@ieuanign](https://github.com/ieuanign)! - dev-loop: `contracts.md` is restructured so the two execution modes diverge in exactly one place. The review loop becomes mode-neutral — it now states only that contested findings and an exhausted fix-cycle bound each yield `UNRESOLVED`, and no longer names Gate 2, human arbitration, or what happens afterwards. A new **Lane conclusion** section takes over that ground as the file's single branch point: the gated half describes human arbitration of contested findings and push/PR approval, and the unattended half names the terminal-state table and notifications as its governing rules, so the work that fills it adds to one section instead of restructuring around it.

  Everything else stays single-version — roles, return contracts, the per-commit loop and its bound, the review loop and its bound, terminal categories, the findings ledger, sequencing, and the mode implementations. The ledger keeps its four categories, with **arbitrated** documented as always empty under unattended mode rather than made conditional. The direct-orchestration mode implements the gated half only and never the unattended half, so that block has exactly one implementation and the "edit the contract first, then both implementations in the same change" rule stays cheap to honour. No behaviour change — the gated mode behaves exactly as before.

- [#20](https://github.com/ieuanign/skills/pull/20) [`cdc80d6`](https://github.com/ieuanign/skills/commit/cdc80d61f078458bbfab90a264323dc32e06bc37) Thanks [@ieuanign](https://github.com/ieuanign)! - dev-loop: the `reviewer` now reads the plan's Approach and File touchpoints alongside the Hard constraints and Test expectations it already read, and reports approach drift as a named review priority — an implementation that reached the plan's outcome by a different design is visible instead of passing silently. Drift always routes to NOTES and never blocks: the architect is the only agent that could re-decide an approach and it does not run again in a lane, so a blocking drift finding would burn fix cycles on working, in-scope, tested code. Behaviour with no plan is unchanged, and the reviewer stays read-only.

- [`be38841`](https://github.com/ieuanign/skills/commit/be38841fda3cfddef43f54d4d58911bdd2f1bcb9) Thanks [@ieuanign](https://github.com/ieuanign)! - dev-loop: worktrees now live in `<MAIN>/.scratch/worktrees/`, and provisioning copy rules move from the repo profile into a root `.worktreeinclude` file (gitignore syntax — the same file Claude Code's native worktrees read). Act 0 creates it ask-then-persist, guards `.scratch/` in `.gitignore`, and keeps `!.scratch/**` as its last line so no copy mechanism — dev-loop's or Claude Code's native worktrees — clones `.scratch` contents into new worktrees; Act 2 fast-copies every match, retiring the node_modules special case and the disk warning. Migration is manual and one-time: finish or `git worktree remove` any trees under the old path, and fold any profile "Provisioning copy rules" into `.worktreeinclude`.

### Patch Changes

- [#29](https://github.com/ieuanign/skills/pull/29) [`8e48c52`](https://github.com/ieuanign/skills/commit/8e48c52ad735ef81d391fe441c722c79cc272687) Thanks [@ieuanign](https://github.com/ieuanign)! - Maintainer tooling: `npm run check` (`scripts/check.sh`) is now the repo's verification entry point, so the checks that catch breakage here no longer have to be remembered and typed by hand. Three checks, one readable line each, all of them run even when an earlier one fails: `claude plugin validate . --strict` (skipped with a notice, not a failure, when `claude` is not on PATH); a syntax check over every discovered `skills/**/phase-*.js`; and a `package.json` / `.claude-plugin/plugin.json` version-sync check. The phase-script check compiles each file as an async function over the Workflow globals rather than using `node --check` — the phase scripts are valid as neither CommonJS nor ESM, and `node --check` passes them even when they are broken.

## 0.1.0

### Minor Changes

- Initial release. Three add-on skills for [mattpocock/skills](https://github.com/mattpocock/skills):
  - **`dev-loop`** — an issue-to-PR pipeline that plans, implements, reviews, and signs off GitHub issues over a bundled custom agent roster (architecture-engineer, code-writer, reviewer, debugger + lite variants), each issue in its own git worktree.
  - **`code-review-mp`** — a two-axis (Standards + Spec) diff review in parallel sub-agents; the Standards-aware variant of Matt's `/code-review` that reads `docs/agents/coding-standards.md`. Coexists with Matt's `/code-review`.
  - **`setup-ieuanign-skills`** — scaffolds `docs/agents/coding-standards.md`, the repo-tailored review rubric the reviewer agent and code-review Standards axis read.
