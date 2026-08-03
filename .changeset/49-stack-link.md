---
"ieuanign-skills": minor
---

`dev-loop`: a stacked batch now ends with a real stack on GitHub, not a sentence in a pull request body.

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
