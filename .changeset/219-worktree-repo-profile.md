---
"ieuanign-skills": minor
---

The three keys about the worktree live in a profile named for the worktree, not for `/dev-loop`.

`docs/agents/dev-loop.md` held two kinds of fact: how the pipeline names branches and writes pull
requests, and how any skill makes a fresh worktree runnable and proves a change good. `/pr-comments`
needs only the second kind, so it was reading **Setup command**, **Full-suite command** and **Fix
cycles** out of a file named for a pipeline it is not — and any later skill that provisions a worktree
would have had to do the same.

Those three now live in **`docs/agents/worktree.md`**, moved verbatim. **Branch template**, **PR title
format**, **PR body template** and **Constraints** stay in `docs/agents/dev-loop.md`, whose preamble
narrows to the pipeline's own artifacts. Each key resolves against exactly one file and **there is no
fallback**: one absent from the file that holds it is missing, never looked up in the other. So a
repository on the old layout is asked once and self-heals under `gated`, and under `unattended` refuses
on the same two commands it always refused on — the ask-then-persist rule is the migration, and no code
detects, copies or rewrites an old profile. Neither skill gains a key of its own and no profile is
added for `/pr-comments`; there are two profile files, not three.

`skills/dev-loop/preconditions.mjs` now names a file per key, in the blocking table and the defaults
alike, so a refusal tells an operator which file will hold the answer rather than which skill wanted
it. Both output blocks keep their headings and shape, and a missing argument still prints usage.

This repository's own profile is split accordingly, and `scripts/check.sh` gains a **profile split**
stage: for each of the three headings it fails when the heading survives in both files — naming the
heading and both paths — and when it is absent from `docs/agents/worktree.md`. A move half-done pins a
repository to the copy nothing reads, which is the one failure the no-fallback rule cannot report for
itself.
