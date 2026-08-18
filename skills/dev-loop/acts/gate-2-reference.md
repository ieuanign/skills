# Gate 2 — reference (read ONCE, at the run's FIRST Gate 2)

Gate 2's invariant material — the parts that cannot vary between layers. Read at the run's FIRST Gate 2 and not re-read; `acts/gate-2.md` holds what each layer performs, is read afresh at every layer, and points here.

**No worktree, push or main-worktree rule lives in this file.** Read-once material is evictable under compaction, and a destructive-action guardrail has to be resident at every boundary it binds — those stay in `acts/gate-2.md` and the spine's **Hard rules**.

## The three questions, and their unattended answers

**Under `unattended` this gate asks nothing** — gate suppression, decided once in the spine's Run mode. Every step of `acts/gate-2.md` still runs; each question resolves to its unattended answer:

| Question | Its unattended answer |
|---|---|
| Is the push/PR approved? | the sub-lane pushes and opens the PR its `terminal` names — ready, draft, or none |
| Open a draft PR for a sub-lane that ended? | yes, `--draft` |
| Arbitrate a contested finding | the ledger's **arbitrated** category stays empty and the finding rides out to the PR body |

## The findings ledger

**The findings ledger** is per lane, and is what this gate and the pull request body both surface. Its categories:

| Category | What it holds |
|---|---|
| **fixed** | reviewer findings the writer applied |
| **won't-fix** | findings the writer disputed and the reviewer retracted, each with the writer's reason |
| **arbitrated** | contested findings the human ruled on, with the ruling. Always empty under `unattended`, where nobody rules — no conditional needed |
| **acceptance criteria** | the reviewer's `met` / `partial` / `not-met` verdict per criterion **the sub-lane owns**, with its evidence, verbatim. Reported rather than inert: no review, fix cycle or ending turns on a verdict, but under `unattended` the terminal-state table drafts the pull request on any verdict that is not `met` |
| **reviewer NOTES** | non-blocking observations, verbatim |
| **review trajectory** | on a sub-lane whose review loop ended on either of its bounds: one entry per round saying whether it brought previously-unseen findings or repeated prior ones. Recorded on every sub-lane and rendered only where a bound ended one, like the attempt log. It answers what a bare count leaves open — *was this loop converging?* — before anyone opens the diff |
| **suite** | the gate's state: `passed`, `failed` with its failing test identifiers, or `not run` with why it did not. Never `passed` for a suite that did not run |
| **attempt log** | everything the pipeline did *after* something first went wrong, in order: each debug+fix attempt, retry, review fix cycle and suite round, carrying what triggered it, what the debugger said, and how it ended. Stages that worked are already in the commit list and the categories above, and repeating them buries the one entry that matters. Recorded on every sub-lane and rendered only on one that ended, so the loops append without branching |

## The pull request body — step 2's `--body`

Step 2's body is **the profile's PR body template** (`docs/agents/dev-loop.md`), asked once at the first Gate 2 under the ask-then-persist rule and persisted into that file like every other key it holds. Whatever shape a repository gives it, these core elements must survive:

| Element | Where it appears |
|---|---|
| `Closes #<n>` | the FIRST sub-lane only; later sub-lanes reference the issue without closing it |
| **Context** | the plan's summary bullets — the architect's orientation, retained from Phase A whether or not Gate 1 fired — beside `<n> planned, <m> made` |
| **Acceptance criteria** | one line per criterion THIS sub-lane owns: `met` / `partial` / `not-met`, the criterion, and its evidence, verbatim from the reviewer. Only the criteria it owns, so nobody reads a verdict about code that is not in the diff. Omitted when the reviewer returned none |
| **Whole-issue roll-up** | the LAST sub-lane of a lane and no other, directly beneath that criteria section: every acceptance criterion of the issue, its verdict, and which sub-lane produced it, so whoever merges the end of a chain sees whether the issue was delivered without opening every PR under it. Assembled from sub-lane results you already hold — no agent, no extra stage. **Reporting only**: it feeds no predicate, and a sibling's unmet criterion never drafts THIS pull request. Omitted on a single-sub-lane lane, where it would repeat the section above it verbatim, and where no reviewer returned a criterion at all |
| **Review findings** | the count of fixed findings, each won't-fix with the writer's reason, the reviewer's NOTES verbatim, and — where the review loop ended on one of its bounds — the `reviewTrajectory`, one line per round. Omitted otherwise |
| **Suite** | this sub-lane's gate state: `passed`, `failed` with its failing test identifiers, or `not run` with why. A suite that never ran says so rather than reading as green |
| **Attempt log** | on a sub-lane that ended — the ledger's, in order, so a draft PR carries what the pipeline tried. Omitted on a clean sub-lane |
| **Run handle** | on a sub-lane that ended — the **RUN HANDLE** derived fact, this body being the only copy that outlives the run. Omitted where Act 0 found no identifier, and on a clean sub-lane |
| **Local-only artifacts** | every File touchpoint the plan named that this repo gitignores and this sub-lane's worktree has, per step 3's check in `acts/gate-2.md` — saying they are in no commit and so exist on no machine once that worktree goes. Omitted when the plan named none, which is the ordinary case. The pull request is the ONLY durable place this reaches anyone |
| **Defaults taken** | on an `unattended` run that took any — Act 0's **Missing, default taken** block, verbatim, so whoever merges sees which repository answers this pull request was built without. Omitted under `gated`, where every answer is the repository's own, and on a run whose block was empty |
| **Why this is a draft** | one line per entry in `terminal.reasons`, at the TOP where the merger sees it first — which trigger fired, without making them hunt. Omitted on a ready PR, which has none |

**A repository with no profile still opens a pull request carrying every element above**, in that order. Then the footer:

🤖 Generated with [Claude Code](https://claude.com/claude-code)

## Step 4's label policy

`acts/gate-2.md`'s step 4 removes the **in-progress** label without exception. Which label replaces it — if anything — is decided by one question: **did the run reach a reasoned conclusion, or did a stage break?** A conclusion needing a human takes **awaiting-human**; a break takes **failed**; a ready pull request takes neither. Where both read true **failed wins**. Roles, never strings: resolve them through the repo's own `docs/agents/triage-labels.md`, and **a role that documentation names no string for is skipped silently**. Which case this lane is in, the phase-script result already says:

| The result says | Which case you are in |
|---|---|
| `notified: true` | the notifier already applied this lane's label at its ending. **Write nothing else.** It is true only when a label actually landed, so `false` on an ended lane means the write did not happen and the case below applies. |
| `crashed: true` | the lane's closure threw. Its attributed ending names the issue and carries the error. **You also owe this lane its ending comment** — no notifier ran for a throw. Post the attributed ending and the **RUN HANDLE**. |
| neither, and any sub-lane's `terminal.pr` was `draft` | a draft with no ending behind it, so no notifier ever ran and this one is yours. Apply **awaiting-human**. |
| neither, and every PR opened ready | the no-label case. Apply nothing. |

## Stacked lanes, and ended sub-lanes

Stacked lanes: a lane in the bottom layer bases its PR on the trunk (`<DEFAULT>`); every layer above bases its PR on the branch of the layer below. Note the stack in the body ("Stacked on #<A>'s PR — rebase onto <DEFAULT> after it merges"). Removing a lower layer's worktree does not affect the layer above it — that layer branches from the base's _branch_, which survives worktree removal. `acts/gate-2.md`'s step 5 then records the chain on GitHub itself; the note stays regardless.

Ended sub-lanes: report the label (**HALT** — something deliberately stopped; **FAILED** — something broke), the stage, the reason (verbatim contract lines), the diagnosis if a debugger produced one, the attempt log in order, and the exact resume command — `/dev-loop <n>` re-derives everything. The label explains the ending and decides nothing: under `gated` the two are offered the same push, the same draft-PR question and the same kept worktree, and under `unattended` both reach the terminal-state table as the same row.
