# apply — a merged change, applied from the trunk's current head

**The inputs** are the merged pull request `<pr>` and the ref `<ref>` to apply from, `<TRUNK>` when
none is named. `<mode>` is `apply-<pr's number>`; `<WORKTREE>` here is a detached checkout, so
`<BRANCH>` is unused.

**Data-holding** — a database, a volume, a bucket, or any managed data store. A plan **destroys data**
when its machine-readable output gives a data-holding resource the action delete or replace; that
output's format and fields are `<IAC_TOOL>`'s own, looked up in its documentation.

## Steps

1. **The ref.** `<ref>` is anything but `<TRUNK>` — a branch, a tag, a commit: return a refusal naming
   `<ref>`, with nothing applied. Done when `<ref>` is `<TRUNK>`.
2. **The merge.** `gh pr view <pr> --json state,mergeCommit --jq '.state + " " + .mergeCommit.oid'`;
   `git fetch origin`. A state other than `MERGED`, or a merge commit for which
   `git merge-base --is-ancestor <oid> origin/<TRUNK>` fails: return a refusal naming `<pr>`. Done when
   the merge commit is on `origin/<TRUNK>`.
3. **Checkout.** `<WORKTREE>` left by an earlier run: return its path and stop. Otherwise
   `git worktree prune`; `git worktree add --detach <WORKTREE> origin/<TRUNK>`; `<head>` is
   `git -C <WORKTREE> rev-parse HEAD`. Done when `<head>` is in hand. From here, every refusal first
   runs `git worktree remove <WORKTREE>`, so the next run of `<pr>` starts clean.
4. **Environments.** The environments whose infrastructure code under `<IAC_PATH>` a file of
   `gh pr diff <pr> --name-only` touches. None: `git worktree remove <WORKTREE>`, then return "nothing
   to apply". Done when each touched environment is listed.
5. **Credentials.** Each environment's provider credential is the caller's
   `INFRA_CREDENTIAL_PROVIDER_<ENVIRONMENT>=<path>` argument, else that line of
   `<CHECKOUT>/.infra.local.env`, read as `<GITHUB_CREDENTIAL>` is. One absent: return a refusal naming
   its key, with nothing applied. Done when every environment has its credential.
6. **Plan and refuse.** In `<WORKTREE>`, per environment, save `<IAC_TOOL>`'s plan and render it
   machine-readable. A plan that destroys data: return a refusal holding its text output and, per
   data-holding resource, its address and action, for a person — nothing applied. Done when every
   resource change of every plan is classified and none destroys data.
7. **Apply.** Before each environment, `git ls-remote origin refs/heads/<TRUNK>` must name `<head>`;
   another commit means the trunk moved: return a refusal naming `<head>` as stale, with the
   environments already applied. Otherwise apply that environment's saved plan. Done when a fresh plan
   of every environment shows no change.
8. **Return.** `git worktree remove <WORKTREE>`, then return `<head>` and each environment applied.
   Done when `<WORKTREE>` is gone and all of it is returned. Worktree removal never passes --force.
