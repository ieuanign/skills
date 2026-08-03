---
"ieuanign-skills": patch
---

`npm run check` now verifies the shell scripts, including the two the pipeline executes.

The repo's whole verification surface checked the plugin manifest, the phase scripts, the cost-stage vocabulary and version sync — and no shell script at all, though there are six. Two of them the pipeline invokes **by path at runtime**: `notify.sh` for every message under an unattended run, and `stack-link.sh` for Gate 2's stack linking. A syntax error in either was discovered when a lane tried to run it, mid-run, with no shell available to diagnose it. The phase scripts have had exactly this protection all along.

Two checks, in the shape the file already uses:

- **Syntax** — `bash -n` over every tracked `*.sh`.
- **Executable bit** — every `*.sh` under `skills/` must be recorded `100755` in git's index. The skill runs these by path, so one committed `644` is unrunnable while `bash -n` still passes. The index is the authority rather than the working tree, because that is what a consumer's install checks out and a local `chmod` that was never staged is precisely the case worth catching.

`shellcheck` is deliberately **not** adopted. It is a hard dependency nobody here has, and its findings on the six existing scripts are unverified — adding a check whose result has never been seen could only turn this suite red for a contributor who happens to have the tool. This is the **Full-suite command** `/dev-loop`'s suite gate runs, and `contracts.md` is explicit that a red result meaning nothing is worse than no result. It is worth proposing separately, once the existing scripts are known clean.
