---
"ieuanign-skills": minor
---

`/pr-comments` refuses at intake when an agent it dispatches names a preloaded skill that does not
resolve.

A roster agent preloads a skill of the declared dependency through its `skills:` frontmatter, and an
entry that does not resolve is dropped **silently** — the agent launches without the method it was
written around and returns less, which is indistinguishable from clean code. `/dev-loop` already
refuses at intake on that and `scripts/check.sh` already catches a stale entry statically, but
`/pr-comments` dispatches the same agents through its own fix phase and had no such guard. It lands
worse here: there is no second gate, the reviewer's verdict is what drives the fix cycles and the
conclusion comment, and under `unattended` nobody reads it at all.

**Step 1 of `skills/pr-comments/SKILL.md` gains a second precondition**, above the first `gh pr view`,
so a refusal has read nothing from the pull request. It reads the `skills:` lines off the roster for
the three roles the fix phase dispatches — `code-writer`, `reviewer` and `debugger` — and looks for
every entry among the session's own available skills, the introspection the run already performs for
agent types. An entry it cannot find stops the run under both modes, asking nothing and writing
nothing, and names the agent, the entry and the remedy the entry's own namespace decides: nothing of
that namespace visible ⇒ install or enable the plugin that ships it, restart required; other skills of
it visible ⇒ the entry is stale against the installed version, a defect to report against this plugin.
Finding nothing at all — no roster file read, or no `skills:` line among the three — refuses too,
because a check that resolved nothing has told you nothing. Only those three are checked: a preload
dropped from an agent this skill never dispatches cannot reach the fixes it pushes.

The preconditions renumber accordingly — the sibling-folder and shared-check one is now the sixth, and
the first five fire under both modes — and `docs/pr-comments.md`'s prerequisites describe the new
refusal. No agent definition changes, no sixth roster agent and no new check stage: only a live session
can see which preloads actually resolved, which is why this half of the guard is prose and the roster
stage in `scripts/check.sh` remains the static half.
