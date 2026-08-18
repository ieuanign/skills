---
"ieuanign-skills": patch
---

`/dev-loop`'s Gate 2 splits: `acts/gate-2.md` keeps what a layer performs, and a new
`acts/gate-2-reference.md` holds the material that cannot vary between layers, read once.

`acts/gate-2.md` was 14,404 bytes and re-read at EVERY layer's Gate 2, yet most of it was vocabulary,
a format specification and invariant description — identical on the second read and every one after.
It is now 5,964 bytes; the reference file is 9,284 and is read at the run's FIRST Gate 2 only,
mirroring how `acts/gate-2-linking.md` is already read at exactly one boundary. `acts/gate-2.md`
carries the pointer and its recovery clause — re-read the reference at any later Gate 2 where you no
longer hold it — so a compaction between layers costs nothing.

**Moved, not changed**: the three questions with their `unattended` answers, the findings ledger's
eight categories, the pull request body's eleven elements verbatim with the no-profile fallback and
the footer, step 4's label policy and its four-row result table, and the stacked-lanes and
ended-sub-lanes tails. **Kept**: the per-layer firing rule, the per-sub-lane presentation, the
contested-findings arbitration, and steps 1–5 whole — including step 3's worktree invariant and the
removal command. Nothing is deleted; every instruction, condition, refusal and default is in one file
or the other.

**No worktree, push or main-worktree rule lives in the reference file**, and its header says why:
read-once material is evictable under compaction, and a destructive-action guardrail has to be
resident at every boundary it binds. Those stay in `acts/gate-2.md` and the spine's **Hard rules**.

`SKILL.md`'s Gate 2 bullet names the new file and its read-once rule, and `notifications.md` repoints
its findings-ledger citation at it.
