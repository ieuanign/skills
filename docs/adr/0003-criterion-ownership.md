# 0003 — Criterion ownership is stated by the plan and applied by the host

**Status**: accepted — the implementation lands separately, editing `contracts.md` first and both
execution modes in the same change, per that file's own rule.

`ready` is unreachable for a split issue. `/dev-loop`'s reviewer judges **one sub-lane's commit
range** but is handed **the whole issue's** acceptance criteria; a criterion another sub-lane delivers
is recorded `partial` rather than `not-met`, so that an early pull request does not read as a failure
of work not yet due. The terminal-state table then drafts on any criterion that is `partial` or
`not-met`. Compose the two and every pull request of a split issue drafts — including the top of the
chain, whose range is also only its own commits. Nothing can satisfy the ready predicate once
`pr-separation.md` has done what it is there to do, so an unattended run that went perfectly still
leaves a developer promoting drafts by hand.

It also degrades a signal with four jobs. A draft means open findings, or a red suite, or an ending
mid-pipeline, or an unmet criterion — and a trigger that fires on every split issue teaches the reader
to ignore all four.

Both rules are individually correct. What is wrong is that the reviewer is asked to decide ownership
at all, at review time, from an issue body larger than its range.

## Decision

- **The architect states ownership.** On a plan holding two or more pull requests, each pull request
  entry in the Commit / PR breakdown names the acceptance criteria that pull request delivers, by
  ordinal into the issue's checklist plus each criterion's first clause. A single-pull-request plan
  writes nothing.
- **The host applies it.** It reads the lists off the section it already parses for commits and hands
  each reviewer only the criteria its sub-lane owns. Criteria the plan left unlisted fall to the
  **last sub-lane in plan order** — never "the top of the chain", since a lane's sub-lanes are
  sequential but not necessarily stacked.
- **The reviewer judges only what it was given**, against its own range, and returns one verdict each.
  An owned criterion it cannot find is `not-met`. It receives the issue body verbatim and whole
  regardless, for the framing prose a checklist line does not carry.
- **The ready predicate is untouched.** It stays the four-way conjunction `contracts.md` writes it as;
  it simply now sees only the criteria the sub-lane owns, so a sub-lane that did its whole job cleanly
  opens a **ready** pull request. A sub-lane owning no criteria returns an empty list and is vacuously
  met — the path the no-issue-body case already takes.
- **The verdict vocabulary is unchanged.** `met | partial | not-met` stays. `partial` keeps both of its
  honest meanings — some of it landed in this diff, or it is not observable from a diff at all — and
  both still draft. What goes is the third, dishonest one: the `out of this range → partial` rule is
  **deleted** rather than reworded, because a reviewer never sees another sub-lane's criterion now, so
  the case cannot arise.
- **The last sub-lane's pull request body carries a whole-issue roll-up** — every criterion, its
  verdict, and which sub-lane produced it — assembled by the host from records it already holds. It is
  reporting only and feeds no predicate.
- **Single-version across execution modes.** The per-stage context contract stays one version; lane
  conclusion remains the only section that branches by mode.

## Why the host and not the reviewer

Ownership is decided **once per run** rather than re-derived by judgement on every review and every
fix cycle. The reviewer is the wrong place structurally as well as economically: it holds one range
and the whole issue, which is exactly the mismatch that produced the bug.

Falls-to-last is host-model work rather than phase-script work for a mechanical reason. The execute
phase receives sub-lanes with their commit lists already built and sees only the **current layer's**
sub-lanes, so it cannot identify the last sub-lane of a lane that spans layers. The default therefore
lives where lanes are built, alongside the roll-up, which lives where pull request bodies are composed.

## Considered options

**A fourth criterion verdict value** — something like `out-of-scope` — filtered out of the ready
predicate. Viable, and rejected: it adds a state to a vocabulary every mode, schema and ledger entry
carries, to encode a fact the plan already knows. It also leaves the reviewer deciding ownership, which
is the thing that went wrong.

**An ownership field carried alongside the verdict**, set by the reviewer. Same objection, one step
weaker: the pipeline would be storing the reviewer's guess at ownership rather than the architect's
decision, and the predicate would filter on a value the reviewer could get wrong.

**Slicing the issue body before handing it to the reviewer.** Rejected. A checklist line rarely reads
as its own specification — the prose around it is what tells the reviewer what a checkbox means — and
the pipeline does not rewrite what a human wrote. Ownership is passed as ordinals into a body that
arrives whole.

**Judging unclaimed criteria against the accumulated range of the whole stack.** Rejected on two
counts: it gives the reviewer's spec axis a second range, and it does not fix the reported problem —
the lower pull requests of a chain would still draft.

**Letting the whole-issue roll-up decide the last pull request's state.** Rejected. It breaches the
rule that every terminal-state row is decided per sub-lane from that sub-lane's own inputs, and it
double-signals a gap the owning sub-lane has already drafted for.

## Consequences

- **A single-pull-request plan gains no duty and behaves exactly as it does today**, which is the
  common case. So does an issue with no acceptance criteria at all, and so does a plan written before
  this change: falls-to-last makes an unannotated plan behave as the whole issue belonging to its last
  sub-lane, which is today's behaviour for a single-sub-lane lane.
- **A criterion the architect forgot to assign is still judged by somebody**, and one that nothing
  satisfies drafts the last pull request with a reason naming it. A plan that quietly dropped a
  requirement cannot produce a clean-looking run.
- **A criterion naming a manual check or a live run keeps drafting its pull request.** Nothing
  demonstrated it and nobody watched the run.
- **The plan format the architect writes and the format the host parses can drift**, and no automated
  check guards it — the format is prose, so any guard would be an approximate grep. The analogous
  invariant that *is* guarded is the cost-stage vocabulary, compared across three files by
  `npm run check`; that is the pattern a guard here would follow if one is ever wanted.
- **The findings ledger's claim that criterion verdicts are purely informational was already wrong**
  and is corrected by the implementation. The terminal-state table has drafted on them all along.
