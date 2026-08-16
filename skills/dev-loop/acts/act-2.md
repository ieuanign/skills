# Act 2 — Provisioning (you, plain Bash — no agents)

**A layer is horizontal and a stack is vertical**, and the pipeline has both: a layer is the set of sub-lanes that run concurrently, all based on branches that already hold their commits, while a stack is a chain of branches each based on the one below, sitting on the trunk with a bottom directly on it and a top nothing is based on.

Layer logic: **anything based on the trunk (`origin/<DEFAULT>`) runs in layer 1; anything based on a branch that gets its commits in layer N runs in layer N+1** — this applies to stacked _lanes_ AND to dependent _sub-lanes_ within one lane, so a frontend sub-lane based on its own backend sub-lane's branch waits for the next layer. Provision a layer only after its bases completed the previous layer. For each sub-lane in the current layer:

1. `git worktree add <WORKTREES>/<slug> -b <branch> <base>`. Base is `origin/<DEFAULT>` or the stack/sub-lane base branch. On resume: an existing worktree is reused as-is; an existing branch WITHOUT a worktree reattaches with `git worktree add <WORKTREES>/<slug> <branch>` (no `-b` — the `-b` form errors on an existing branch).
2. `.worktreeinclude` copies: `git -C <MAIN> ls-files -oi --exclude-from=.worktreeinclude --directory` lists the matches (files, plus fully-ignored dirs collapsed to one entry). Fast-copy each from MAIN into the worktree at the same relative path, creating parent directories — but STRIP the trailing slash git puts on directory entries first. Worktree contents never appear in the list — the `!.claude/worktrees/**` line Act 0 guarantees excludes them.
3. Run the worktree profile's Setup command from inside the worktree.
