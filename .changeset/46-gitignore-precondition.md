---
"ieuanign-skills": patch
---

`/dev-loop`: Act 0's two gitignore preconditions no longer report a correctly-configured repo as unconfigured, and no longer append a `.gitignore` line the file already carries.

Both checks probed the directory itself — `git check-ignore -q .claude/worktrees`. A gitignore pattern with a trailing slash matches directories only, and `git check-ignore` cannot classify a bare path as a directory unless that directory exists on disk. `.claude/worktrees/` does not exist before the first lane is provisioned, which is exactly when Act 0 runs. So the check reported "not ignored" for a path that is ignored, and the remedy fired on a repo that needed nothing: every fresh clone that had not yet run a lane gained another `.claude/worktrees/` line, and the run reported a fix the user did not need. The `.scratch` check had the same shape and misfired in any repo whose entry is written `.scratch/` rather than `.scratch`.

**Both now probe a path underneath the directory** — `git check-ignore -q .claude/worktrees/probe`. Everything under an ignored directory is ignored, so the child answers the same question without needing the classification that was failing, and the probe path need not exist. Verified against every form the entry can take: `.scratch`, `.scratch/` and `/.scratch/` all report ignored with the directory absent from disk, and a repo that ignores neither still reports "not ignored" for the child, so a genuinely unignored path is still detected and still remedied.

**Neither remedy appends a line `.gitignore` already carries.** Appending is idempotent in effect and not on disk, so this is the guard against a check that misfires for some reason nobody has thought of yet growing the file by one line per run — belt and braces behind the probe rather than a second fix for the same bug.
