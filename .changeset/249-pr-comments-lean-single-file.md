---
"ieuanign-skills": minor
---

`/pr-comments` becomes one lean file whose fixes are written in the run's own context, with no
pipeline behind it.

The skill dispatched its approved fix rows through a bundled phase script — `phase-fix.js`, writer,
review loop and suite gate over the same roster `/dev-loop` uses. That bought a second pipeline's worth
of contract for work that is a handful of commits against comments a human already wrote out, and the
contract had to be carried in `SKILL.md` whether or not a run ever reached the fix rows.

**`skills/pr-comments/phase-fix.js` is deleted and `skills/pr-comments/SKILL.md` is rewritten** as one
pass with eight steps: read the pull request and its unresolved comments, classify them into the table,
the one gate, a worktree on the pull request's own head branch, the fixes written there, one push, the
threads answered and the conclusion commented back, the worktree removed last. The fixes are the
orchestrator's own work — `/mattpocock-skills:tdd` at the seams the comments name, the Full-suite
command once at the end, then a single `/mattpocock-skills:code-review` pass whose findings are applied
once. **One review pass is the bound**, in place of a review loop counted against a profile key: nothing
dispatches an agent, nothing runs a workflow, and no numeral is written into the file. `SKILL.md` lands
at ~10.5k tokens against ~13.2k.

The run reads **Setup command** and **Full-suite command** from `docs/agents/worktree.md`; **Fix
cycles** is no longer this skill's key and `/dev-loop` keeps it. `<DEV-LOOP>/notify.sh` is the only
dev-loop file an unattended run resolves, for its one `start` and one closing message.

Unchanged: `read-comments.mjs`, the append-only rules, the write budget, and both write shapes — every
payload on standard input from a quoted heredoc, and the `<!-- replied from /pr-comments -->` footer
marker. `scripts/check.sh` loses the dispatch-argument-keys stage and the pr-comments ceiling pair,
both of which named the deleted script.
