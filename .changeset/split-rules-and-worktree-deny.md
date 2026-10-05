---
"ieuanign-skills": minor
---

setup-ieuanign-skills: Part 3 splits `worktree-removal` and `stacked-prs` in two — the rule under `.claude/rules/` is cut to the instruction and names `.claude/reference/<name>.md`, which holds the rule in full — so a session no longer carries either whole at launch. With `worktree-removal` it also offers four `permissions.deny` entries for `.claude/settings.json` that refuse `git worktree remove --force` outright. `scratch-files.md` now also says where throwaway files go, and setup checks the directory is ignored. `pr-separation.md` drops the sentence naming who reads it. The `reviewer` and `architecture-engineer` agents now open the path-scoped rules matching the files in play, which were never in their context at launch.
