# change — one requested change, planned, in one undoable pull request

**The request** is taken as given, in one of three forms; its **origin** is what the pull request links:

- a person's words — origin "requested by the caller";
- an `infra-diagnose` request: an alert issue link and the infrastructure cause — origin that issue;
- `Report <comment URL>, suggestion <n>` from `infra-report` — origin that comment; the change is
  block `#### Suggestion <n>` of `gh api <comment URL's API path> --jq .body`.

`<mode>` is `change-<slug>`. `<slug>` is the caller's when given, `alert-<issue number>` for an
`infra-diagnose` request, `report-<comment id>-<n>` for an `infra-report` one, else a few words naming
the change; lower-cased, each run of characters outside `a-z0-9` becomes `-`.

**Data-holding**, **destroys data**, **Targets** and a target's **credentials** are as
`<this-skill-dir>/terms.md` defines them; read it with this act.

## Steps

1. **Resume.** `gh pr list --state open --limit 1000 --json url,headRefName --jq '.[] | select(.headRefName | startswith("<BRANCH_PREFIX>")) | .url'`.
   Done when none is open, or its link is returned as the result with nothing else written.
2. **The request.** A suggestion block that is absent: return a refusal naming the comment and `<n>`.
   Done when the change to make and its origin are in hand.
3. **Branch.** `git fetch origin`. `<WORKTREE>` left by an earlier run: when
   `git -C <WORKTREE> status --porcelain` prints nothing, `git -C <WORKTREE> switch -C <BRANCH>
   origin/<TRUNK>`; otherwise return its path and stop. No `<WORKTREE>`: `git worktree prune`, then
   `git worktree add -B <BRANCH> <WORKTREE> origin/<TRUNK>`.
   Write the change into `<WORKTREE>`: infrastructure code under `<IAC_PATH>`, the pipeline, or both.
   Done when every file the change needs is written. From here, every refusal and "nothing differs"
   first discards this run's unpushed writes — `git -C <WORKTREE> reset --hard`;
   `git -C <WORKTREE> clean -fdx`; `git worktree remove <WORKTREE>`; `rm -rf <PLANS>` — so a rerun of
   `<slug>` starts clean. Worktree removal never passes --force.
4. **A policy change** edits `docs/delivery-policy.md` in `<WORKTREE>` together with the pipeline it
   governs. Invoke `delivery-policy` through the Skill tool for its Check branch on that edited file. A
   failing line: return a refusal naming each one, with nothing pushed. Done when every Check line
   passes, or the change leaves the policy as it is.
5. **Plan.** For each target whose code differs from `origin/<TRUNK>`, one of its credentials absent:
   return a refusal naming its key. Otherwise, in `<WORKTREE>`, save `<IAC_TOOL>`'s plan for that target
   and render it machine-readable, both into `<PLANS>` — a `mktemp -d` outside `<WORKTREE>`, as a saved
   plan can hold secrets in plain text. Done when every such target has its saved plan, its text output
   and its machine-readable output in hand.
6. **The data-holding refusal.** Read every resource change from the machine-readable output. A plan
   that destroys data: return a refusal holding each plan's text output and, per data-holding resource,
   its address and action, for a person — no push, no pull request, no apply. Done when every resource
   change of every plan is classified and none destroys data.
7. **Nothing differs.** `git -C <WORKTREE> add --` each file steps 3 and 4 wrote; then
   `git -C <WORKTREE> diff --cached --quiet` succeeding: return "nothing differs",
   with no pull request. Done when that is returned, or a file differs.
8. **Push and open.** Commit the staged files in the repository's own commit convention, read from
   `git log`; `git -C <WORKTREE> clean -fdx`, so a later run of `<slug>` can reuse `<WORKTREE>`;
   `git -C <WORKTREE> push -u origin <BRANCH>`, once. Then `gh pr create --base <TRUNK> --head <BRANCH>
   --title "<title>" --body-file -`, the body holding the origin, the request, each target's plan
   text output in a fenced block, and last:

   ```
   ## Undo

   Revert this pull request, then apply from the trunk.
   ```

   Done when the pull request's link is in hand.
9. **Return.** `rm -rf <PLANS>`, then return the pull request's link, each target planned, and
   `<WORKTREE>`. Done when all of it is returned.
