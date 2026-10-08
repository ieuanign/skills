# first-run — the pull request check, the tool scripts and the branch rules

One pull request delivers all three; no environment is built.

## The deliverables

A deliverable whose file on `origin/<TRUNK>` already meets its contract is **kept**, byte for byte.
Any other is **changed**: written anew to meet its contract.

- **The check** — `<CHECK_WORKFLOW>`, one job named `check`, run on a pull request into `<TRUNK>` and on
  a push to `<TRUNK>`. It checks out with full history and sets up what `<CHECK_COMMAND>` needs, read
  from the repository's manifests. On a pull request it runs `<TOOLS>/derived-files.sh` with the pull
  request's base and head commits; exit 0 ends the job green there. Every other path runs
  `<CHECK_COMMAND>`.
- **The tool scripts** — `<TOOLS>/derived-files.sh` and `<TOOLS>/changed-paths.sh`, copies of
  `<this-skill-dir>/tools/` byte for byte, committed `100755`.
- **The branch rules** on `<TRUNK>` — a pull request required, the `check` job required to pass, no
  direct pushes, `<MERGE_METHOD>` the only merge method allowed.
  - `<GITHUB_CREDENTIAL>` present: code for `<IAC_TOOL>` with its GitHub provider under
    `<IAC_PATH>/github/`, from that tool's documentation. The provider takes its credential from its
    own environment variable at apply; the code holds no credential and no credential path.
  - Otherwise: kept when `gh api repos/{owner}/{repo}/rulesets` and
    `gh api repos/{owner}/{repo}/branches/<TRUNK>/protection` show every rule in force; else they are
    the person's part (step 5).

## Steps

1. **Resume.** `gh pr list --head <BRANCH> --state open --json number,url`. Done when none is open, or
   its link is returned as the result with nothing else written.
2. **Render.** `git fetch origin`, then decide each deliverable against `origin/<TRUNK>`, reading the
   trunk's files with `git show origin/<TRUNK>:<path>`. Done when every deliverable is kept, or changed
   with its new content in hand.
3. **Nothing differs.** Every deliverable kept: prove the pipeline passes, read-only —
   `gh run list --workflow pull-request-check.yml --branch <TRUNK> --event push --limit 1 --json databaseId,conclusion,url,headSha`,
   and `gh run view <databaseId>` when its conclusion is anything but `success`. Return "nothing
   differs", the run's conclusion and its link. Done when that is returned, or a deliverable is changed.
4. **Branch.** `<WORKTREE>` left by an earlier run: when `git -C <WORKTREE> status --porcelain` prints
   nothing, `git -C <WORKTREE> switch -C <BRANCH> origin/<TRUNK>`; otherwise return its path and stop.
   No `<WORKTREE>`: `git worktree prune`, then `git worktree add -B <BRANCH> <WORKTREE> origin/<TRUNK>`. Write each changed
   deliverable into `<WORKTREE>`, stage each script with `git add --chmod=+x`, and commit in the
   repository's own commit convention, read from `git log`. Done when `git -C <WORKTREE> status --porcelain`
   prints nothing.
5. **The person's part**, when the branch rules fall to it. With `/mattpocock-skills:wizard`, author:
   - `<WIZARD>/first-run-machine.sh` — creates the GitHub admin credential file and writes its path as
     `INFRA_CREDENTIAL_GITHUB=<path>` into `.infra.local.env`;
   - `<WIZARD>/first-run-repository.sh` — sets the branch rules above, run by a repository admin.

   Commit both `100755` on `<BRANCH>`. Done when both are committed, or the branch rules are code or
   kept.
6. **Push and open.** `git -C <WORKTREE> push -u origin <BRANCH>`, once. Then `gh pr create --base <TRUNK>
   --head <BRANCH> --title "<title>" --body-file -`, the body naming each changed deliverable and, for
   branch rules as code, that they take effect when they are applied from `<TRUNK>` after the merge.
   Done when the pull request's link is in hand.
7. **The issue**, after step 5 only. `gh issue create --title "<title>" --body-file -`, the body naming
   the pull request, each script with the command that runs it and who runs it, and that this mode is
   run again once the issue is closed. Done when the issue's link is in hand.
8. **Return** the pull request's link; each deliverable, kept or changed; the branch rules' route —
   code awaiting apply from `<TRUNK>`, kept, or the person's part; `<WORKTREE>`; and, with a person's
   part, "stopped until <issue link> is closed". Done when all of it is returned.
