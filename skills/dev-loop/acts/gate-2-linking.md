# Gate 2 — stack linking (once per BATCH, at its LAST Gate 2)

Gate 2's step 5. It fires ONCE per batch — at the batch's LAST Gate 2, and this file is read there, never at an earlier layer's. A batch whose sub-lanes stack finishes by telling GitHub they form a stack. Linking is **additive** — the base chaining, the bodies and the stacked note are unchanged — and six rules keep it that way:

- **Fires at the very end of the batch**, once every sub-lane of every lane has pushed and opened its pull request — never per layer.
- **One call per chain, not one per batch.** Walk the base relation and link each **maximal chain**; a chain of **fewer than two** pull requests is not a stack and is skipped.
- **A gap in a chain is shown, never closed up.** The walk stops at a sub-lane that opened no pull request; the runs either side are separate chains, each linked on its own, and the gap is reported naming that sub-lane.
- **Pull requests are identified by number, bottom to top.** Never by branch name.
- **Ready-for-review is never requested.**
- **No local state, in either direction.**

**A machine without the tool needs nothing.** The linking sits behind one bundled script which detects the tool's absence and exits having called nothing: no gate checks for it, no precondition asks about it, and no run fails or prompts for want of it.

**A failed link is reported and costs nothing else.** It leaves every pull request exactly as the run created it — title, body, draft state and base. No sub-lane's ending changes, no worktree decision changes, and nothing is retried.

**This step is identical under both run modes and asks nothing**, so gate suppression does not touch it.

Take each sub-lane's PR number as Gate 2's step 2 kept it — the number, not the URL, and `gh pr create` prints the URL, so read a missed one back with `gh pr view <branch> --json number -q .number`. Then walk the base relation you provisioned in Act 2: a sub-lane whose base is the trunk starts a chain, and a sub-lane based on another sub-lane's branch extends it. Per chain, bottom to top:

```
<this-skill-dir>/stack-link.sh <pr-number> <pr-number> [...]
```

A batch with no stacking is every chain of length one, and the script makes no call for any of them — so the ordinary run calls nothing and says nothing. Report the script's one `STACK:` line per chain as it comes: `linked` records the stack, `skipped` is the machine having no extension and is not a problem to raise, and `failed` is reported with its message and then left alone. **A `failed` is never fatal and never retried.** Pass pull request numbers only; the script refuses a branch name and never sends the ready-for-review flag, either of which would let this step overwrite what Gate 2's steps 1–4 decided.
