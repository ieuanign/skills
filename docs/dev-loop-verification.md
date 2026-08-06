# /dev-loop verification — what #121's refactor was actually proven to preserve

The record for [#131](https://github.com/ieuanign/skills/issues/131). Written to be read by whoever
picks the suite up, so it says what was **not** verified as plainly as what was.

## Host load, measured

`wc -c` over every file the orchestrator loads. Before the effort that was three files; after
[#129](https://github.com/ieuanign/skills/issues/129) it is one.

| | Bytes | Tokens |
|---|---|---|
| `SKILL.md` + `contracts.md` + `notifications.md` (at the effort's base commit) | 146,547 | ~36,700 |
| `SKILL.md` alone | **53,796** | **~13,500** |
| Reduction | **63.3%** | **~23,200 per run** |

The token column uses the bytes-per-token ratio the ~36,700 baseline itself implies (3.99), so both
rows are on one metric. **Short of #121's ~5,000-token target.** Closing that gap would mean cutting
rules rather than prose: what remains is the Acts, the Gates, the four host tables and the ten-element
pull request body floor.

## Rule survival — the check that mattered

All 389 inventory entries are ticked. The 223 destined for `SKILL.md` were checked against the
pre-rewrite blob rather than the inventory's summary of it, and every deletion traced to a surviving
binding site. **220 present as written, 3 weakened, 0 missing.** The three weakened — `S-236`, `C-137`,
`C-128` — were restored before ticking; the inventory records each and why it mattered.

Two defects predating the effort were found while verifying and fixed: `SKILL.md` contradicted itself
on the shape of `terminal`, and the discovered-blocker comment used `--body` where the same file's own
comment mechanism forbids it.

## Scenarios

One dummy issue was worked end to end, twice — the first run on a host where `node` was unreachable,
the second after that was fixed. Between them they evidence four of the ten criteria.

| # | Criterion | Verdict |
|---|---|---|
| 1 | a clean lane opens a **ready** pull request | **pass** — `isDraft: false`, labels `[]`, 3/3 criteria `met`, suite green |
| 2 | a red suite opens a **draft** | **pass** — proven by a real failure, not a contrived one: `terminal.pr = draft`, reasons at the top of the body, `awaiting-human` applied by the notifier |
| 4 | worktrees removed only after work reached the remote | **pass** — both runs; 0 worktrees remaining |
| 6 | one concise issue comment and one cost log per lane | **pass** — plan comment + ending comment, `.scratch/dev-loop-cost/154.txt` |
| 3 | an implement-stage halt pushes and opens **no** pull request | **not run** |
| 5 | a lane that throws leaves an attributed label and comment | **not run** |
| 7 | gated mode still works | **not run** — needs a human at both gates |
| 8 | a stacked batch links its pull requests as a stack | **not run** |
| 9 | an unattended run classifies a touchpoint overlap like gated | **not run** |
| 10 | a session with no Workflow tool refuses the run | **not runnable from a session that has it** — see below |

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

## A host finding, not a pipeline finding

The first run halted because `node` was unreachable: `~/.nix-profile` pointed at an empty profile
directory. The debugger diagnosed it precisely and routed it to **`user`** rather than the writer —
correct, since no code change fixes a broken host — and the lane took `HALT` rather than `FAILED`,
because nothing in the pipeline broke.

That is the red-suite path working as designed, and it is the reason scenario 2 is marked pass.
