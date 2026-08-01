---
"ieuanign-skills": minor
---

dev-loop: the host now compares the plan's commit ordinals against the commits the writers actually made, and reports the result as `<n> planned, <m> made`. It is a list diff in plain code over two lists the host already holds — the ordinals it passed in as arguments and the shas every writer return carried back — so no agent is dispatched to notice a plan that said three commits and produced seven. The counts surface at Gate 2 alongside the commit list and the findings ledger, and in the PR body's Context section. A mismatch never blocks: it does not halt the lane, does not trigger a fix cycle, and does not change the terminal state, because fix cycles legitimately append commits and a writer may legitimately split one.
