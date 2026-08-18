# Gate 2 — push & PR (per layer; asks under `gated` only; PushNotification first)

**Push, pull requests and stack linking are the host's**, so every step below is yours: a phase script never pushes, never opens a pull request and never links a stack.

**Read `<this-skill-dir>/acts/gate-2-reference.md`** — Gate 2's layer-invariant material — **at the run's FIRST Gate 2**, and again at any later Gate 2 where you no longer hold it.

Gate 2 fires at the end of EVERY layer, for every sub-lane that layer finished — clean or ended, both offered here on the same terms, and never held back until the whole batch ends.

Per sub-lane, show: the commit list (a `wip:` commit is listed, never counted), `<n> planned, <m> made`, deviation counts, and the **findings ledger** — every category `acts/gate-2-reference.md` lists, on the conditions it states. The counts and the criteria are informational at this gate — neither blocks.

For sub-lanes that ended on contested findings, present both sides of each and ask the user to arbitrate: uphold the finding (send it back through the writer as a targeted fix and resume the sub-lane) or accept the dispute (record it as won't-fix, documented). AskUserQuestion: approve / hold. On approve, run steps 1–3 per sub-lane in order, then step 4 once per lane, then step 5 once for the whole batch:

1. `git -C <worktree> rev-list --count <base>..<branch>` (`<base>` as Act 2 provisioned it), then `git -C <worktree> push -u origin <branch>` when the count is non-zero — **never `--force`, never `--force-with-lease`**, in either mode. Zero means nothing landed, so there is nothing to push and no PR to open: report it and move to the next, and under `unattended` `gh issue comment <n>` the ending's explanation first, this being the one ending with no pull request to carry it. Ask git, never the reported commit list: the count settles the push AND overrides step 2's proposed PR state. This is each sub-lane's ONE push. A rejected push stops this sub-lane's conclusion here — report git's message verbatim as a **FAILED** ending for that sub-lane, open no PR, keep that worktree, and move to the next.
2. `gh pr create --head <branch> --base <base-branch> --title "<per the profile's title format>" --body ...` — `<base-branch>` is `<DEFAULT>` for default-based lanes (NEVER `origin/<DEFAULT>` — gh rejects remote-tracking refs) or the stack base's branch name. Under `unattended`, **whether that command carries `--draft` is the sub-lane's `terminal.pr`**, per the phase script's terminal-state table: `ready` opens a normal PR, `draft` adds `--draft`, `none` opens nothing — except that step 1's count is the authority, so a `none` whose count came back non-zero opens `--draft`, never ready. Under `gated` **nothing here changes and the table is not read**: a sub-lane that **ended** gets no PR by default and you offer "open a draft PR anyway?", running the same command with `--draft` if the user takes it, while a sub-lane that concluded clean gets its normal PR whatever its verdicts say. You set draft state ONLY on a PR you are creating, and leave an existing one as its opener made it. Body: `acts/gate-2-reference.md`'s **The pull request body**.
3. **The worktree invariant.** A sub-lane's worktree is removed when, and only when, its work has reached the remote **and no human is expected to resume in it**.

   | Sub-lane state | Remote | Worktree |
   |---|---|---|
   | Concluded clean | pushed, pull request opened | removed |
   | Ended, `unattended` | pushed, draft pull request | removed |
   | Ended, `gated` | pushed, no pull request by default | **kept** |
   | Held at Gate 2 | nothing pushed | kept |
   | Removal refused | pushed | kept, reported |

   Removal is `git worktree remove <WORKTREES>/<slug>`. **Worktree removal never passes --force.** Every rule that makes a removal safe — the refusal on a dirty worktree, push before remove, the main worktree's exclusion — is stated in the spine's **Hard rules** and not here, because this file is read afresh at each layer's Gate 2 and those rules bind between layers too.

   The local branch, the plan file and any worktree the table above kept all stay: `/dev-loop-cleanup` proposes each of them once the pull request merges, and reaps only what a human picks.

   **Name what the removal destroys, then remove.** **Ignored** files go with the worktree — the intent, not an oversight. Before removing, read the plan's **File touchpoints** and report every one that `git -C <wt> check-ignore -q <path>` calls ignored and that exists in the worktree, as paths going with the removal. That same list is step 2's **Local-only artifacts** section (`acts/gate-2-reference.md`). Then remove: nothing is copied out and nothing is kept. Report nothing when the plan named no such path, which is the ordinary case. The list comes from the plan's touchpoints, never from `--ignored=matching`.

4. **⟨notify⟩ Lane conclusion.** Once every sub-lane of a lane has been through steps 1–3, close that lane. Per lane, not per sub-lane, and at the lane's LAST layer; carry its `notified` forward into the next layer's args.

   **Remove the in-progress label, without exception**: finished, ended or thrown, the lane is no longer in progress. What replaces it — if anything — is `acts/gate-2-reference.md`'s **Step 4's label policy**, which also says where this lane still owes an ending comment.

   Then **send exactly one closing message**, in the shape the spine's ⟨notify⟩ section states — `draft` or `ready`, its reason, and the pull request link. Unconditional, including for a lane with no PR at all.

5. **Stack linking.** Once per BATCH, at its LAST Gate 2, never per layer: there, read `<this-skill-dir>/acts/gate-2-linking.md` — its whole contract — and perform it; at every earlier Gate 2 this step is only step 2's PR number, kept — the number, not the URL — for that last boundary to consume.
