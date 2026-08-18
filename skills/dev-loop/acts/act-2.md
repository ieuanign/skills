# Act 2 — Provisioning (you, plain Bash — no agents)

For each sub-lane in the current layer:

1. `git worktree add <WORKTREES>/<slug> -b <branch> <base>`. Base is `origin/<DEFAULT>` or the stack/sub-lane base branch. On resume: an existing worktree is reused as-is; an existing branch WITHOUT a worktree reattaches with `git worktree add <WORKTREES>/<slug> <branch>` (no `-b` — the `-b` form errors on an existing branch).
2. `.worktreeinclude` copies: `git -C <MAIN> ls-files -oi --exclude-from=.worktreeinclude --directory` lists the matches (files, plus fully-ignored dirs collapsed to one entry). Fast-copy each from MAIN into the worktree at the same relative path, creating parent directories — but STRIP the trailing slash git puts on directory entries first. Worktree contents never appear in the list — the `!.claude/worktrees/**` line Act 0 guarantees excludes them.
3. Run the worktree profile's Setup command from inside the worktree.
