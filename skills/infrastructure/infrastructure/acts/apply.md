# apply — a merged change, applied from the trunk's current head

**The inputs** are the merged pull request `<pr>` and the ref `<ref>` to apply from, `<TRUNK>` when
none is named. `<mode>` is `apply-<pr's number>`; `<WORKTREE>` here is a detached checkout, so
`<BRANCH>` is unused.

**Data-holding** — a database, a volume, a bucket, or any managed data store. A plan **destroys data**
when its machine-readable output gives a data-holding resource the action delete or replace; that
output's format and fields are `<IAC_TOOL>`'s own, looked up in its documentation.

**Targets** — each environment under `<IAC_PATH>`, and `<IAC_PATH>/github/` (first-run's branch rules).
A target's **credentials**, each the caller's `<key>=<path>` argument, else that line of
`<CHECKOUT>/.infra.local.env`, read as `<GITHUB_CREDENTIAL>` is: `INFRA_CREDENTIAL_PROVIDER_<ENVIRONMENT>`;
`INFRA_CREDENTIAL_DNS_<ENVIRONMENT>` when its code declares DNS records; `<GITHUB_CREDENTIAL>` when its
code uses `<IAC_TOOL>`'s GitHub provider — `<IAC_PATH>/github/`'s only one.

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
   runs `git -C <WORKTREE> clean -fdx`; `git worktree remove <WORKTREE>`, so the next run of `<pr>`
   starts clean — the clean takes the plans and init files `<IAC_TOOL>` leaves untracked.
4. **Targets.** The targets whose code a file of `gh pr diff <pr> --name-only` touches. None:
   `git -C <WORKTREE> clean -fdx`; `git worktree remove <WORKTREE>`, then return "nothing to apply".
   Done when each touched target is listed.
5. **Credentials.** One of a target's credentials absent: return a refusal naming its key, with nothing
   applied. Done when every target has all of its credentials.
6. **Plan and refuse.** In `<WORKTREE>`, per target, save `<IAC_TOOL>`'s plan and render it
   machine-readable. A plan that destroys data: return a refusal holding its text output and, per
   data-holding resource, its address and action, for a person — nothing applied. Done when every
   resource change of every plan is classified and none destroys data.
7. **Apply.** Before each target, `git ls-remote origin refs/heads/<TRUNK>` must name `<head>`;
   another commit means the trunk moved: return a refusal naming `<head>` as stale, with the
   targets already applied. Otherwise apply that target's saved plan. A failed apply, or a fresh
   plan of it still showing a change: return a refusal holding its output, with the targets already
   applied. Done when a fresh plan of every target shows no change.
8. **Return.** `git -C <WORKTREE> clean -fdx`; `git worktree remove <WORKTREE>`, then return `<head>`
   and each target applied.
   Done when `<WORKTREE>` is gone and all of it is returned. Worktree removal never passes --force.
