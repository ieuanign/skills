---
"ieuanign-skills": minor
---

`/setup-ieuanign-skills` Part 3 offers a fifth `.claude/rules/` convention: never force a worktree
removal.

`/dev-loop`, `/pr-comments` and `/dev-loop-cleanup` each already refuse to pass `--force` to a
removal of a worktree they made. Those copies bind a running pipeline and nothing else — they say
nothing to a person at a terminal typing the command themselves, and a repo that ran setup may have
no plugin installed at all. A convention that binds with or without the plugin is `.claude/rules/`
territory by this skill's own uninstall test, so the rule is now proposed like the other four and
named in the closing summary.

The rule forbids *forcing* a removal, never removal itself: a refusal is the guard doing its job,
what it guards exists in exactly one copy, and `git status --porcelain` says what to commit or move
before the plain removal succeeds. `rm -rf` on the directory is named as the same forcing under
another name, and the main worktree as never a removal candidate.
