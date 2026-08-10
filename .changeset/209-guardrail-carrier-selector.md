---
"ieuanign-skills": patch
---

The worktree-removal guardrail asks for the guard sentence only from skills that actually remove a
worktree.

#187 added the stage, and it selected the skills it binds with a bare substring match on
`worktree remove`. That caught `skills/setup-ieuanign-skills/SKILL.md`, whose single mention is prose
describing the fixed text of `worktree-removal-template.md` — the rule file it proposes to a consuming
repo — rather than an instruction to remove anything. The skill was required to state
`Worktree removal never passes --force.` verbatim for an operation it never performs, and `main` went
red the moment both changes sat on it: each pull request was green on its own, because the mention and
the stage arrived from different ones.

A carrier now has to **name what it removes**. The three skills that do write the target beside the
command — `git worktree remove <WORKTREES>/<slug>`, `git worktree remove <path>`,
`git -C <MAIN> worktree remove <WORKTREES>/pr-<n>` — while a mention followed only by a flag is prose
about the rule, which is what the stage's own comment meant by "every skill that removes a worktree".
It reports three carriers rather than failing on a fourth that was never one, and it still fails,
naming the file, when a skill that does remove a worktree drops the sentence.

The guard phrase is unchanged and no `SKILL.md` was edited to satisfy it — a skill made to carry a
sentence about something it does not do would have made the false positive permanent.
