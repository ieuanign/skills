---
"ieuanign-skills": patch
---

The documents describing `/dev-loop-cleanup` describe propose-then-reap, and the rule inventory
records what that rewrite retired.

`README.md`'s row, `docs/dev-loop.md`'s **Cleanup** section and `docs/dev-loop-internals.md`'s
rejected alternative all still described a skill that left every worktree standing. The narrative
home is `docs/dev-loop.md`: both modes stop at one table —
`Lane | PR | Worktree | Branch | Scratch | Recommend | Why` — where `remove` is recommended only
where the pull request merged and the worktree is clean, your pick is what authorises a deletion, and
each picked row is reaped worktree, then branch, then scratch. The "a sub-lane ended and its worktree is still there" answer now names
`/dev-loop-cleanup` as what later proposes that worktree's removal for you to pick, rather than
leaving a maintainer to clear it by hand. `README.md` and the internals clause stay one line each.

`docs/dev-loop-rule-inventory.md` supersedes rather than rewrites. #127's ticks, destinations and
totals stand; nine A16 rows carry `superseded #187` in their ✓ cell, and one block records what each
retired entry lost, what stands in its place, and — as prose, with no IDs — the rules the rewritten
skill introduces.
