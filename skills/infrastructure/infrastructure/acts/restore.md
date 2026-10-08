# restore — one restore test, recorded on the pinned reports issue

**The inputs** are `<environment>` and `<store>`, a data store of that environment. `<mode>` is
`restore-<environment>-<store>`; `<WORKTREE>` here is a detached checkout, so `<BRANCH>` is unused.

**The reports issue** is the open issue titled exactly `Infrastructure reports`:
`gh issue list --state open --search 'in:title "Infrastructure reports"' --json number,title`, keeping
the exact title. None: `gh issue create --title 'Infrastructure reports' --body-file -` with a one-line
body saying what it collects, then `gh issue pin <n>`.

## Steps

1. **The inputs.** `<environment>` absent from the policy's `environments`, or `<store>` absent from
   its infrastructure code under `<IAC_PATH>`: return a refusal naming it, with nothing run. Done when
   both are found.
2. **Checkout.** `git fetch origin`. `<WORKTREE>` left by an earlier run: return its path and stop.
   Otherwise `git worktree prune`; `git worktree add --detach <WORKTREE> origin/<TRUNK>`. No
   `<WORKTREE>/<TOOLS>/restore-test.sh`: remove `<WORKTREE>`, then return a refusal naming that path.
   Done when the script is present.
3. **Run.** In `<WORKTREE>`, `<TOOLS>/restore-test.sh <environment> <store>`. Its **record line** is
   the last line of its stdout, else its last line of stderr; its **result** is that line's first word
   when stdout held it, else `failed`. Done when the record line and result are in hand.
4. **Record.** Find or create the reports issue, then post on it with
   `gh issue comment <n> --body-file -` from a quoted heredoc a comment beginning `## Restore`: the
   date (`date -u +%F`), `<environment>`, `<store>`, the result and the record line. Done when the
   comment's URL is in hand.
5. **Return.** `git worktree remove <WORKTREE>`, then return the result, the record line and the
   comment's URL. Done when `<WORKTREE>` is gone and all of it is returned.
   Worktree removal never passes --force.
