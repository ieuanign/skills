---
"ieuanign-skills": minor
---

Under `auto`, every precondition now resolves — to a documented default or to a refusal — in
`/dev-loop` and `/pr-comments` alike. Before this, both skills exempted their ask-then-persist
preconditions from gate suppression, so an unattended run in a repository whose profile was incomplete
raised a question with nobody there to answer it.

**Preconditions are the fourth thing the run mode decides**, stated once in `/dev-loop`'s Run mode
section and binding pipeline-wide, beside gate suppression, notifications and the cost log. Under
`gated` nothing changes: same questions, same persistence, same one-question-ever guarantee. Under
`unattended` nothing is asked. Each precondition site says which of the two answers is its own, and
never whether it fires.

**An unattended default is used, reported and written into no profile.** Persisting one would spend the
repository's single question, and the human who would have chosen the value would never be asked — so
the branch template, PR title format, PR body template and fix cycles apply to that run alone, and the
pull request body carries a **Defaults taken** element naming which.

**A refusal names every missing prerequisite at once**, each with the key or file, where it belongs, and
the run that supplies it — a report naming only the first turns one fix into three failed runs. The
wording lives in one new bundled module, `skills/dev-loop/preconditions.mjs`, invoked
`node <path> <repo-root> dev-loop|pr-comments`: it reads the profile, stats `.worktreeinclude`, prints
a **Missing, cannot run** and a **Missing, default taken** block, and exits non-zero when the first is
non-empty. It writes nothing, reaches nothing, and neither `SKILL.md` restates a line of it. The caller
selects the remediation as well as the key set, because naming a run that cannot supply the thing is
worse than naming nothing.

`/dev-loop` refuses in Act 0 **above the step that claims a lane** — no label of any role, no `start`
message, nothing a later run has to clear — and reports it as one comment on every issue the arguments
named plus one `failed` message for the run. `/pr-comments` runs the same check as Step 1's
precondition 6, before its own `start`, and comments the report on the pull request; its Step 6 ask is
now `gated`-only with its timing untouched, and an unattended run takes fix cycles `2`, reported in the
conclusion comment.

Because a refusal can close a run that never opened one, the pairing property in
`skills/dev-loop/notifications.md` is now one-directional: a `start` is never left unpaired, and a close
with no `start` reads as a run that never began.

`CONTEXT.md` gains **Precondition**, whose _Avoid_ names **gate** — a gate is a human approval point
inside the run's flow and is suppressed wholesale, where a precondition is what the run needs in order
to have a flow at all and resolves instead. `docs/dev-loop.md`, `docs/pr-comments.md` and `README.md`
say which prerequisites refuse an unattended run and which default, so an operator can read what to fix
without opening a transcript.
