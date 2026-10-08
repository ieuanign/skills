# check — a merged change: pipeline passed, every environment answers, the change can be undone

**The input** is the merged pull request `<pr>`. `<mode>` is `check-<pr's number>`; `<WORKTREE>` here
is a detached checkout, so `<BRANCH>` is unused.

**Data-holding** — a database, a volume, a bucket, or any managed data store. A plan **destroys data**
when its machine-readable output gives a data-holding resource the action delete or replace; that
output's format and fields are `<IAC_TOOL>`'s own, looked up in its documentation.

**Pass** is all three conditions met: the pipeline, the environments, the undo. Any other outcome is
**fail**, naming each condition unmet.

## Steps

1. **The merge.** `gh pr view <pr> --json state,mergeCommit,body`; `git fetch origin`. A state other
   than `MERGED`, or a merge commit `<oid>` for which `git merge-base --is-ancestor <oid> origin/<TRUNK>`
   fails: return fail naming `<pr>`, with nothing run. Done when `<oid>` is on `origin/<TRUNK>`.
2. **The pipeline.** `gh run list --commit <oid> --json name,status,conclusion,url`. Met when at least
   one run is listed and every run's conclusion is `success`; a run still in progress is waited on with
   `gh run watch <id>`. Done when every run has a conclusion and the condition is met or unmet, each
   failing run's name and link in hand.
3. **The environments.** Per entry of the policy's `environments`, after step 2's runs finished, an HTTP
   GET of its `health_check_url`. Met when every one answers with a 2xx status. Done when each
   environment's status is in hand.
4. **The undo.** Met when all three hold:
   1. `<pr>`'s body has a line exactly `## Undo`. Done when found or absent.
   2. `<WORKTREE>` left by an earlier run: return its path and stop. Otherwise `git worktree prune`;
      `git worktree add --detach <WORKTREE> origin/<TRUNK>`; in it, `git revert --no-edit <oid>`, adding
      `-m 1` when `git rev-list --parents -n 1 <oid>` lists two parents. A conflict:
      `git -C <WORKTREE> revert --abort`, unmet. Done when the revert commits or conflicts.
   3. Per environment whose infrastructure code under `<IAC_PATH>` the revert changes, its provider
      credential is the caller's `INFRA_CREDENTIAL_PROVIDER_<ENVIRONMENT>=<path>` argument, else that
      line of `<CHECKOUT>/.infra.local.env`, read as `<GITHUB_CREDENTIAL>` is; one absent is unmet,
      naming its key. Otherwise, in `<WORKTREE>`, save `<IAC_TOOL>`'s plan and render it
      machine-readable. A plan that destroys data is unmet, naming each data-holding resource's address
      and action. Done when every resource change of every plan is classified.
5. **Return.** `git -C <WORKTREE> clean -fdx`, taking the plans and init files `<IAC_TOOL>` left
   untracked; `git worktree remove <WORKTREE>`, then return pass or fail, `<oid>`, and per condition its
   evidence: the runs' conclusions and links, each environment's status, and the undo's findings.
   Done when `<WORKTREE>` is gone and all of it is returned. Worktree removal never passes --force.
