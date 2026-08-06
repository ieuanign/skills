# /dev-loop verification — what #121's refactor was actually proven to preserve

The record for [#131](https://github.com/ieuanign/skills/issues/131). Written to be read by whoever
picks the suite up, so it says what was **not** verified as plainly as what was.

## Host load, measured

`wc -c` over every file the orchestrator loads. Before the effort that was three skill files; after
[#129](https://github.com/ieuanign/skills/issues/129) it is one.

### The skill files — the only part this effort could move

| | Bytes | Tokens |
|---|---|---|
| `SKILL.md` + `contracts.md` + `notifications.md` (at the effort's base commit) | 146,547 | ~36,700 |
| `SKILL.md` alone | **54,295** | **~13,600** |
| Reduction | **62.9%** | **~23,100 per run** |

The token column uses the bytes-per-token ratio the ~36,700 baseline itself implies (3.99), so every
row on this page is on one metric.

### The repo config Act 0 also reads

The table above is the skill's own load. Act 0 reads two more files, untouched by this effort and
identical on both sides of the comparison — so they move the totals without moving the saving. Both
are per-repository, so these byte counts are **this repository's** and not a property of the skill:

| File | Bytes | Read under |
|---|---|---|
| `docs/agents/dev-loop.md` — the repo profile, at Act 0 step 3 | 2,696 | both run modes |
| `docs/agents/triage-labels.md` — the three label roles | 3,219 | `unattended` only — the ⟨notify⟩ boundaries, and a gated run writes no label |

Totals with them included, for this repository:

| Run mode | Before | After | Reduction |
|---|---|---|---|
| `gated` | 149,243 (~37,400) | 56,991 (**~14,300**) | 61.8% |
| `unattended` | 152,462 (~38,200) | 60,210 (**~15,100**) | 60.5% |

**The absolute saving is ~23,100 tokens in every column**, which is the figure that matters: repo
config sits unchanged on both sides, so it can dilute the percentage but never the reduction.

**Short of #121's ~5,000-token target on every reading of it** — 2.7× on the skill-files line, 3.0× on
the unattended total. The figures above are HEAD's, so they include the ~500 bytes the review fixes
added back to `SKILL.md`: the `.claude/rules/` row in the config-homes table and its carve-out. Closing that gap would mean cutting rules rather than prose: what remains is the
Acts, the Gates, the four host tables and the ten-element pull request body floor. That is now
[#158](https://github.com/ieuanign/skills/issues/158)'s to settle — either by naming the rules that go
or by an ADR retiring the target — rather than a number left with no owner.

## Rule survival — the check that mattered

All 389 inventory entries are ticked. The 223 destined for `SKILL.md` were checked against the
pre-rewrite blob rather than the inventory's summary of it, and every deletion traced to a surviving
binding site. **220 present as written, 3 weakened, 0 missing.** The three weakened — `S-236`, `C-137`,
`C-128` — were restored before ticking; the inventory records each and why it mattered.

Two defects predating the effort were found while verifying and fixed: `SKILL.md` contradicted itself
on the shape of `terminal`, and the discovered-blocker comment used `--body` where the same file's own
comment mechanism forbids it. Both are behaviour changes, and #121's Out of Scope line permits none —
see **Decisions taken during verification** below, which records them as deliberate exceptions rather
than leaving them to read as scope creep.

## Scenarios

One dummy issue was worked end to end, twice — the first run on a host where `node` was unreachable,
the second after that was fixed. Between them they evidence four of the ten criteria.

**Six rows never ran, so the suite is not green.** #131 promised that it would be; it is not, and
[#159](https://github.com/ieuanign/skills/issues/159) carries the remainder. Two of the six cannot be
run by an agent at all — 7 needs a human at both gates, 10 needs a session started with the Workflow
tool switched off.

| # | Criterion | Verdict |
|---|---|---|
| 1 | a clean lane opens a **ready** pull request | **pass** — `isDraft: false`, labels `[]`, 3/3 criteria `met`, suite green |
| 2 | a red suite opens a **draft** | **pass** — proven by a real failure, not a contrived one: `terminal.pr = draft`, reasons at the top of the body, `awaiting-human` applied by the notifier |
| 4 | worktrees removed only after work reached the remote | **pass** — both runs; 0 worktrees remaining |
| 6 | one concise issue comment and one cost log per lane | **pass** — plan comment + ending comment, `.scratch/dev-loop-cost/154.txt` |
| 3 | an implement-stage halt pushes and opens **no** pull request | **not run** — #159 |
| 5 | a lane that throws leaves an attributed label and comment | **not run** — #159 |
| 7 | gated mode still works | **not run** — needs a human at both gates; #159 |
| 8 | a stacked batch links its pull requests as a stack | **not run** — #159 |
| 9 | an unattended run classifies a touchpoint overlap like gated | **not run** — #159 |
| 10 | a session with no Workflow tool refuses the run | **not runnable from a session that has it** — see below; #159 |

**No gated run was made anywhere in the effort**, though
[#128](https://github.com/ieuanign/skills/issues/128),
[#130](https://github.com/ieuanign/skills/issues/130) and #131 each call for one. That is scenario 7,
and it is the highest-value row outstanding: #128 rewrote **Gate 2's arbitration and draft-offer
branches**, and nothing has executed them since.

Observed incidentally, and worth recording because each is a seam the refactor touched: correct
`HALT`-vs-`FAILED` selection; the notifier's label swap with a truthful `notified: true`; the
terminal-state table obeyed rather than re-derived at Gate 2; and the resume path — the second run
found `Status: READY` on disk, skipped Phase A, and cost 126K against the first run's 230K.

### Why scenario 10 cannot be run from inside a session that has the tool

Tool availability is fixed at session start — the fact [ADR-0004](./adr/0004-mode-a-deleted.md) records
and the reason the refusal names a restart. A session holding the Workflow tool cannot simulate one
that does not: the refusal fires at Act 0 off a toolset check, and nothing inside the run can make that
check fail.

It needs a human to start a session with `"enableWorkflows": false` in `~/.claude/settings.json`, run
`/dev-loop <n>` and `/dev-loop auto <n>`, and confirm both refuse, name the setting, and say a restart
is required.

## The notifier's tier — verified, not assumed

[#130](https://github.com/ieuanign/skills/issues/130) moved the notifier's `model` and `effort` into
`agents/notifier.md`'s frontmatter and removed both from the dispatch site. That leaves the tier
resting on a claim nobody had tested: **does an agent definition's frontmatter apply when the agent is
dispatched from inside a workflow script rather than by the Agent tool?** If it does not, the change
silently promoted the cheapest role in the pipeline to the session model.

It does. The evidence is the run's own workflow transcript, which records the model per dispatched
agent:

| Dispatch | `agentType` | Frontmatter `model` | Model recorded |
|---|---|---|---|
| `write:#154:c1` | `code-writer` | `opus` | `claude-opus-5[1m]` |
| `review:#154:docs` | `reviewer` | `opus` | `claude-opus-5[1m]` |
| `suitedebug:#154:docs:r1` | `debugger` | `opus` | `claude-opus-5[1m]` |
| `notify:#154` | `notifier` | **`haiku`** | **`claude-haiku-4-5-20251001`** |
| `suite:#154:docs` | *(none — no definition by design)* | — | `claude-haiku-4-5-20251001`, set at the dispatch |

The notifier is dispatched with no `model` and no `effort` — `phase-execute.js`'s `notify` helper —
and ran at haiku, while every other roster dispatch in the same script ran at the model its own
frontmatter names. Were frontmatter ignored at a workflow dispatch, `notify:#154` would have run at
`claude-opus-5[1m]` like the rest.

**`effort` is not recorded in the transcript**, so that half is inferred rather than observed: it is
parsed from the same frontmatter block by the same loader, and no mechanism plausibly applies one key
and drops the other.

## A host finding, not a pipeline finding

The first run halted because `node` was unreachable: `~/.nix-profile` pointed at an empty profile
directory. The debugger diagnosed it precisely and routed it to **`user`** rather than the writer —
correct, since no code change fixes a broken host — and the lane took `HALT` rather than `FAILED`,
because nothing in the pipeline broke.

That is the red-suite path working as designed, and it is the reason scenario 2 is marked pass.

## Decisions taken during verification

Three places where a child ticket's acceptance criterion and its parent disagree, or where the effort
did something its scope did not cover. Recorded rather than re-litigated — #121 asks for that in terms
— so a later reader finds a decision instead of an unexplained gap.

- **#125's flat-bound ADR is [ADR-0002](./adr/0002-review-loop-progress-sensitive-bound.md), which
  already existed.** The criterion asks for an ADR covering "the implement loop keeping a flat bound
  where the review loop is progress-sensitive". That is ADR-0002's whole subject, decided before this
  effort began. Nothing was written for it and nothing needed to be. The three the criterion named that
  did *not* exist — the rejected token ceiling, `DIED` remaining `FAILED`, per-commit push — are
  `0005`, `0006` and `0007`.
- **Two behaviour changes ship outside #121's stated scope, both defect fixes.** #121's Out of Scope
  reads "any behaviour change other than deleting Mode A". The `terminal` shape contradiction and the
  discovered-blocker comment's `--body` (now `--body-file -`, the mechanism the same file states) are
  both cases of `SKILL.md` disagreeing with itself. Leaving them would carry a known self-contradiction
  through a rewrite whose whole premise is that this file is now the single normative source. Fixed
  deliberately, and named here so the exception is visible rather than buried in a diff.
- **#129's first criterion is met in substance, not as worded.** It asks that `agents/notifier.md`
  "carries the notifications specification". It points at `skills/dev-loop/notifications.md` instead,
  which is what #121's Destinations table assigns — the notifier is that file's sole reader either way,
  and inlining 11.6K into an agent definition buys nothing the pointer does not. The criterion's second
  half, that the orchestrator no longer loads `notifications.md`, is met outright and is the half that
  produced the saving. Where a child's wording and the parent's design disagree, the parent governs.
