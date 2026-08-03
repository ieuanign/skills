---
"ieuanign-skills": minor
---

`dev-loop`: two lanes editing the same lines are now sequenced, not declared dependent.

Gate 1's touchpoint intersection sorted every overlap into two outcomes: an additive shared file, where both lanes append to a registry and stay parallel, and a real dependency, where B consumes what A creates and gets stacked on it. A third case exists in practice and had no home — two lanes editing the same *region* of a file, which is not a dependency at all but still cannot run concurrently without a textual conflict. It lived in a footnote a human had to remember.

It is now one of three outcomes the host applies:

- **additive co-touch** → stay in the same layer, note it, accept the trivial rebase
- **same-region co-touch** → the later lane drops to the next layer, based on the branch below, with **no dependency claimed**
- **real dependency** → B is stacked on A, and the discovered-blocker comment is posted to B's issue

The last two produce the same branch shape and differ only in what they assert. That is the whole point: only a real dependency posts the comment, and only a real dependency asks the human anything. Collapsing same-region into dependency would tell a reviewer that B builds on A when it does not, and leave a permanent, wrong comment on B's issue; collapsing it into additive would send two lanes at the same lines concurrently and hand someone an avoidable conflict.

This matters more now that a stack is a real object on GitHub rather than a sentence in a body — the claim gets published.

The classification stays the host's own work in plain reading, and the contract now says why no agent can take it: one architect runs per issue, in parallel, and none can see another lane's plan, so the intersection is inherently cross-lane. It is not a cost decision that a better agent could revisit.

Sequencing is what *avoids* the conflict rather than deferring it — the later lane branches from the earlier one, so its writer opens the file with the earlier edit already in it. A next layer based on the trunk instead would hit the same conflict one layer later.
