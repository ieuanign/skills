---
"ieuanign-skills": minor
---

dev-loop: the single overloaded `HALT` splits into two terminal categories, named for what each does to the lane. **HALT** means the lane is dead — nothing reviewable exists, so no PR is created — and covers six endings: the debugger routing to `replan` or `user`, the per-commit debug+fix bound exhausted, the writer returning `BLOCKED`, any writer return other than `COMMITTED` after debug routing, the reviewer returning `ERROR` or dying, and a fix-cycle writer returning anything other than `COMMITTED`. **UNRESOLVED** means the code exists and is simply not clean, and covers the two endings where it does: contested findings the reviewer still confirms after re-verifying the writer's evidence, and the fix-cycle bound exhausted while the reviewer still requests changes. The distinction is whether reviewable code exists at the end, not severity.

The reasons the pipeline reports now use the same two words, so a reported reason maps to a contract line without translation, and the orchestrator surfaces "the lane died" and "the lane finished with unresolved findings" as visibly different outcomes. Phase B's per-lane return carries `ending: {category, reason}` in place of the old `halted` string. No behaviour change — the same conditions end a lane, and both `UNRESOLVED` endings still land at Gate 2 exactly as they did.
