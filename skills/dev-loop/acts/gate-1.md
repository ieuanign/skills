# Gate 1 — plan approval (asks under `gated` only; ONE batch interruption; PushNotification first)

**Under `unattended` this gate asks nothing** — gate suppression, decided once in the spine's Run mode. Every step below still runs; each question resolves to its unattended answer:

| Question | Its unattended answer |
|---|---|
| Which lanes are approved? | every lane whose plan is `READY` proceeds |
| A `BLOCKED` plan's open questions | that lane does not proceed and is reported carrying them |
| Stack a dependent lane, or defer it? | **stack B on A** — the option this gate already marks recommended |

Present every lane: summary, plan path (invite the user to edit the file before approving), open questions. Then:

- **BLOCKED plans**: relay the open questions via AskUserQuestion, re-run only those lanes' architects with `answers` filled in, re-present.
- **Touchpoint overlap**: intersect the plans' File touchpoints across lanes yourself. **The classification is your own work, in plain reading, and no agent is dispatched to do it.** Sort each overlap into exactly one of three outcomes:

  | Outcome | What it is | Layer | Based on | Dependency claimed |
  |---|---|---|---|---|
  | **additive co-touch** | both lanes append to the same registry, route table or barrel file, at different places in it | same layer — both stay parallel | the trunk | no |
  | **same-region co-touch** | both lanes edit the same *region* of the same file | the later lane drops to the next layer | the earlier lane's branch | **no** |
  | **real dependency** | B consumes what A creates | B drops to the next layer | A's branch | **yes** |

  **Additive co-touch stays parallel and accepts the rebase.**

  **The last two outcomes differ only in what they claim:**

  - **real dependency** — post the discovery back to the dependent GitHub issue with `gh issue comment <B> --body-file -`, per the spine's comment mechanism, the body reading `Discovered blocker: depends on #<A> — overlapping files: ...`. **Unconditionally, and before the remedy is chosen.** Then AskUserQuestion per case, with **"stack B on A's branch" as the first/recommended option** and "defer B out of this batch" as the alternative.
  - **same-region co-touch** — post nothing and ask nothing, and say plainly in this gate's presentation that it was *sequenced to avoid a textual conflict, not because one lane needs the other*.

  **The line between the first two outcomes is the repository's to move, and only that line.** It declares which in the **Overlapping changes** section of its `.claude/rules/pr-separation.md` — project rules load at launch, so read it off your own context rather than fetching the file, and no profile key mirrors it:

  | Declared | Where the line sits |
  |---|---|
  | `additive` (the default, and what an absent declaration means) | co-touch at different places in a file stays in one layer; same-region drops a layer |
  | `strict` | any co-touch at all drops a layer, without classifying the region |
  | `parallel` | no co-touch drops a layer; the conflict is left for whoever merges |

  **A real dependency is never declarable and never moves.** B consuming what A creates puts B in the next layer whatever the repository says.

  Under `unattended` the classification is unchanged. Only outcome 3's question is suppressed, resolving to its recommended answer per the table above; the comment is a machine action and is posted the same either way.
- **Profile Constraints**: apply them now — lanes a constraint forbids from running concurrently go into separate layers (or one is deferred), and say so.
- **Multi-PR plans**: the lane splits into sub-lanes, sequential, in the plan's order (e.g. migration → backend → frontend). First sub-lane branch from the branch template, later ones with the `-<area>` suffix, each based on the previous sub-lane's branch when the plan says the code depends on it, else `origin/<DEFAULT>`.

Only lanes the user approves proceed. Drop the rest with a note.
