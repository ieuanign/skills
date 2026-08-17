# Gate 2 — push & PR (per layer; asks under `gated` only; PushNotification first)

**Push, pull requests and stack linking are the host's**, so every step below is yours: a phase script never pushes, never opens a pull request and never links a stack, having no shell.

**Under `unattended` this gate asks nothing** — gate suppression, decided once in the spine's Run mode. Every step below still runs; each question resolves to its unattended answer:

| Question | Its unattended answer |
|---|---|
| Is the push/PR approved? | the sub-lane pushes and opens the PR its `terminal` names — ready, draft, or none |
| Open a draft PR for a sub-lane that ended? | yes, `--draft` |
| Arbitrate a contested finding | the ledger's **arbitrated** category stays empty and the finding rides out to the PR body |

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

Gate 2 fires at the end of EVERY layer, for every sub-lane that layer finished — clean or ended, both offered here on the same terms, and never held back until the whole batch ends. A batch with no stacking has one layer, and therefore exactly one Gate 2.

Per sub-lane, show: the commit list (a `wip:` commit is abandoned work the writer committed as evidence — listed, never counted), the planned-versus-made commit counts (`<n> planned, <m> made`), deviation counts, the **acceptance criteria** — the reviewer's `met | partial | not-met` verdict per criterion that sub-lane OWNS, with its evidence — the **findings ledger** as its table above lists it, including the **review trajectory** where a bound ended the review loop and the **attempt log** where the sub-lane ended, and the **suite** result. The counts and the criteria are informational at this gate — neither blocks.

For sub-lanes that ended on contested findings, present both sides of each contested finding and ask the user to arbitrate: uphold the finding (send it back through the writer as a targeted fix and resume the sub-lane) or accept the dispute (record it as won't-fix, documented). AskUserQuestion: approve / hold. On approve, run steps 1–3 per sub-lane in order, then step 4 once per lane, then step 5 once for the whole batch:

1. `git -C <worktree> rev-list --count <base>..<branch>` (`<base>` as Act 2 provisioned it), then `git -C <worktree> push -u origin <branch>` when the count is non-zero — **never `--force`, never `--force-with-lease`**, in either mode. Zero means nothing landed — not even a `wip:` commit — so there is nothing to push and no PR to open: report it and move to the next, and under `unattended` `gh issue comment <n>` the ending's explanation first, this being the one ending with no pull request to carry it. Ask git, never the reported commit list: the count settles the push AND overrides the sub-lane's proposed PR state in step 2. This is each sub-lane's ONE push. A rejected push stops this sub-lane's conclusion here — report git's message verbatim as a **FAILED** ending for that sub-lane, open no PR, keep that worktree, and move to the next.
2. `gh pr create --head <branch> --base <base-branch> --title "<per the profile's title format>" --body ...` — `<base-branch>` is `<DEFAULT>` for default-based lanes (NEVER `origin/<DEFAULT>` — gh rejects remote-tracking refs) or the stack base's branch name. Under `unattended`, **whether that command carries `--draft` is the sub-lane's `terminal.pr`**, which the phase script's terminal-state table already decided: `ready` opens a normal PR, `draft` adds `--draft`, and `none` opens nothing — except that step 1's count is the authority, so a `none` whose count came back non-zero is a branch that is ahead after all and opens `--draft`, never ready. Put `terminal.reasons` in the body. Under `gated` **nothing here changes and the table is not read**: a sub-lane that **ended** gets no PR by default and you offer "open a draft PR anyway?", running the same command with `--draft` if the user takes it, while a sub-lane that concluded clean gets its normal PR whatever its verdicts say. You set draft state ONLY on a PR you are creating, and leave an existing one as its opener made it. Body: **the profile's PR body template** (`docs/agents/dev-loop.md`), asked once at the first Gate 2 under the ask-then-persist rule and persisted into that file like every other key it holds. Whatever shape a repository gives it, these core elements must survive:

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
   | **Local-only artifacts** | every File touchpoint the plan named that this repo gitignores and this sub-lane's worktree has, per step 3's check — saying they are in no commit and so exist on no machine once that worktree goes. Omitted when the plan named none, which is the ordinary case. The pull request is the ONLY durable place this reaches anyone |
   | **Defaults taken** | on an `unattended` run that took any — Act 0's **Missing, default taken** block, verbatim, so whoever merges sees which repository answers this pull request was built without. Omitted under `gated`, where every answer is the repository's own, and on a run whose block was empty |
   | **Why this is a draft** | one line per entry in `terminal.reasons`, at the TOP where the merger sees it first — which trigger fired, without making them hunt. Omitted on a ready PR, which has none |

   **A repository with no profile still opens a pull request carrying every element above**, in that order. Then the footer:

   🤖 Generated with [Claude Code](https://claude.com/claude-code)

3. **The worktree invariant.** A sub-lane's worktree is removed when, and only when, its work has reached the remote **and no human is expected to resume in it**.

   | Sub-lane state | Remote | Worktree |
   |---|---|---|
   | Concluded clean | pushed, pull request opened | removed |
   | Ended, `unattended` | pushed, draft pull request | removed |
   | Ended, `gated` | pushed, no pull request by default | **kept** |
   | Held at Gate 2 | nothing pushed | kept |
   | Removal refused | pushed | kept, reported |

   Removal is `git worktree remove <WORKTREES>/<slug>`. **Worktree removal never passes --force.** Two rules make that safe:

   - **Push succeeds first, remove second.** A push that failed or never ran keeps its worktree.
   - **A dirty worktree keeps itself.** `git worktree remove` without `--force` refuses on tracked modifications or on untracked non-ignored files — **that refusal IS the guard**. Report `git -C <wt> status --porcelain` verbatim and keep that worktree. Ignored files, such as the configuration and dependency directories provisioning copies in, do not trip it.

   **The main worktree is never a removal candidate.** Before any removal, confirm the path is NOT the first entry of `git worktree list`. The local branch, the plan file and any worktree the table above kept all stay: `/dev-loop-cleanup` proposes each of them once the pull request merges, and reaps only what a human picks.

   **Name what the removal destroys, then remove.** **Ignored** files go with the worktree — the intent, not an oversight. Before removing, read the plan's **File touchpoints** and report every one that `git -C <wt> check-ignore -q <path>` calls ignored and that exists in the worktree, as paths going with the removal. That same list is step 2's **Local-only artifacts** section. Then remove: nothing is copied out and nothing is kept. Report nothing when the plan named no such path, which is the ordinary case. The list comes from the plan's touchpoints, never from `--ignored=matching`.

4. **⟨notify⟩ Lane conclusion.** Once every sub-lane of a lane has been through steps 1–3, close that lane. Per lane, not per sub-lane — the label is per issue — and at the lane's LAST layer, so a lane whose sub-lanes span layers closes once rather than once a layer; carry its `notified` forward into the next layer's args.

   **Remove the in-progress label, without exception**: finished, ended or thrown, the lane is no longer in progress. What replaces it — if anything — is decided by one question: **did the run reach a reasoned conclusion, or did a stage break?** A conclusion needing a human takes **awaiting-human**; a break takes **failed**; a ready pull request takes neither. Where both read true **failed wins**. Roles, never strings: resolve them through the repo's own `docs/agents/triage-labels.md`, and **a role that documentation names no string for is skipped silently**. Which case this lane is in, the phase-script result already says:

   | The result says | Which case you are in |
   |---|---|
   | `notified: true` | the notifier already applied this lane's label at its ending. **Write nothing else.** It is true only when a label actually landed, so `false` on an ended lane means the write did not happen and the case below applies. |
   | `crashed: true` | the lane's closure threw. Its attributed ending names the issue and carries the error. **You also owe this lane its ending comment** — no notifier ran for a throw. Post the attributed ending and the **RUN HANDLE**. |
   | neither, and any sub-lane's `terminal.pr` was `draft` | a draft with no ending behind it, so no notifier ever ran and this one is yours. Apply **awaiting-human**. |
   | neither, and every PR opened ready | the no-label case. Apply nothing. |

   Then **send exactly one closing message**, in the shape the spine's ⟨notify⟩ section states — `draft` or `ready`, its reason, and the pull request link. Unconditional, including for a lane with no PR at all: paired with Act 0's started message it is the run's dead-session signal.

5. **Stack linking.** Once per BATCH, at its LAST Gate 2, never per layer: there, read `<this-skill-dir>/acts/gate-2-linking.md` — its whole contract — and perform it; at every earlier Gate 2 this step is only step 2's PR number, kept — the number, not the URL — for that last boundary to consume.

Stacked lanes: a lane in the bottom layer bases its PR on the trunk (`<DEFAULT>`); every layer above bases its PR on the branch of the layer below. Note the stack in the body ("Stacked on #<A>'s PR — rebase onto <DEFAULT> after it merges"). Removing a lower layer's worktree does not affect the layer above it — that layer branches from the base's _branch_, which survives worktree removal. Step 5 above then records the chain on GitHub itself; the note stays regardless.

Ended sub-lanes: report the label (**HALT** — something deliberately stopped; **FAILED** — something broke), the stage, the reason (verbatim contract lines), the diagnosis if a debugger produced one, the attempt log in order, and the exact resume command — `/dev-loop <n>` re-derives everything. The label explains the ending and decides nothing: under `gated` the two are offered the same push, the same draft-PR question and the same kept worktree, and under `unattended` both reach the terminal-state table as the same row.
