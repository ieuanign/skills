---
"ieuanign-skills": minor
---

dev-loop: the `architecture-engineer-lite` and `code-writer-lite` agent definitions are deleted, and the `lite` flag goes with them — out of the invocation grammar, the flag documentation, the hard rule forbidding its inference, the roster check, and both phase scripts' arguments. Each phase script now selects its agent type as a plain constant. The two files were byte-identical to their full counterparts below the frontmatter, differing only in a single effort value, and the flag fired zero times across three weeks of transcripts and every measured lane.

Recorded as a consequence rather than left to be discovered: the direct-orchestration mode is now permanently tier-locked. Effort is settable only in agent frontmatter or in the workflow runner's per-call options, and the direct Agent tool has no effort parameter — so any future cost dial is workflow-mode-only by construction.

A repo that already ran `/dev-loop` has inert copies of the two deleted files in its own `.claude/agents/`. Nothing dispatches them once this lands, and the roster check no longer requires or recreates them; delete them at your leisure.
