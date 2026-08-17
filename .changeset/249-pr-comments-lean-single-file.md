---
"ieuanign-skills": minor
---

`/pr-comments` is one lean file, and its fix work happens in the session you invoked it from.

The skill was 52,814 chars — roughly 13.2k tokens, all of it resident from the moment it was invoked —
and it drove its fixes through a bundled phase script: a writer, a review loop bounded by a fix-cycle
count, and a suite gate, each dispatched as an agent. That script is deleted and the pipeline with it.
`SKILL.md` is now 20,944 chars — about 5.2k tokens, 185 lines — and states the whole of a run: read,
classify into a three-column table, one gate, the threads answered where they were raised, a worktree
on the pull request's own head branch, the fixes, one push, the conclusion comment, disposal last.

**The review over those fixes is one `/mattpocock-skills:code-review` pass**, applied once, then stop.
A bounded loop needs its number written in the prose, held as a constant in the script, and a check
comparing the two so they cannot disagree; one pass needs none of that, and a second pass would be the
same session re-reading its own work. What it declines to fix is reported in the conclusion comment
instead.

**A run loads no file outside the skill's own folder** — no preconditions script, no notification
channel, no repo profile. `docs/agents/worktree.md`'s **Setup command**, **Full-suite command** and
**Fix cycles** are `/dev-loop`'s keys alone again: this skill makes the worktree runnable and finds
the suite the way any session in that repository works them out.

**`read-comments.mjs` now excludes what a previous run already answered** — a comment carrying the
reply marker, the whole thread holding one, and any comment a previous conclusion named by id in
`<!-- replied from /pr-comments: <id> <id> -->`, the longer marker form that conclusion writes for the
comments with no thread to reply in. Re-running on the same pull request classifies what is new.

The classify vocabulary is two statuses, `fix` and `skip`. The closed four-reason skip list and
`unclassified` are gone: a skip carries its own evidence, and a comment the run cannot decide is a skip
whose Action leaves it for a human. `scripts/check.sh` loses the dispatch-argument-keys stage and the
ceiling pair that named the deleted script, and `scripts/state-machine.mjs` keeps only its
phase-execute half.
