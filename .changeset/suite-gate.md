---
"ieuanign-skills": minor
---

`dev-loop`: a suite gate runs the repository's own full test suite once per sub-lane, in both modes.

Nothing in the pipeline ran it. The writer runs lint and tests **scoped to the module it touched**, before each commit, and that was the entire test surface — a commit that reddened a sibling module's suite was invisible to every stage, the reviewer being explicitly told not to run suites. A developer could get a green-looking PR on a red tree with nobody having looked.

A sixth stage now sits between the review loop and the lane's conclusion, in gated and unattended modes alike, so the human at the approval point sees a green suite rather than assuming one. It runs **once per sub-lane** — sub-lanes are separate branches, worktrees and pull requests and can span waves, so every PR carries its own result — and the result reaches the human in both places it is due: the lane's conclusion and the PR body.

The gate is a plain subagent with no persona and deliberately no agent type, at the cheapest model and lowest effort: loading a role definition — merge-base rules, blocking bars, dispute handling — to run one command is waste. It reads nothing, fixes nothing, commits nothing, is named in the progress display, and returns `passed` / `failed` / `not-run` with the failing identifiers and the command's output.

**The command is configuration, never discovery.** A new repo-profile key, read under the profile's existing ask-then-persist rule, where a persisted `none` is a real answer: a repository whose suite needs infrastructure this pipeline does not stand up would otherwise get a red result that means nothing. With no command the gate reports **not run** and dispatches nothing to say so — never shown as passed, per the convention that a check which never ran must say so rather than show an empty result.

**A red suite is diagnosed, not handed straight to the writer.** The gate observed only that the suite is red and the breakage is usually outside the writer's commit scope, so a blind fix would flail. It routes to the debugger and the debugger's own routing decides — a retry, a writer fix against the diagnosis, or an ending — reusing the per-commit failure path verbatim. Ordinary review findings still go straight to the writer: they already carry a failure scenario and a suggested fix.

The round bound is **progress-sensitive rather than a flat cap**: it advances by one unless a previously unseen failing identifier appears, and a new identifier resets it, because a shrinking set of the same failures is not progress. At 2 the loop stops. A hard ceiling of 8 rounds applies regardless, since a mis-parsed identifier list would look like new failures every round and reset forever.

Every ending the gate can produce leaves the plan's commits and the review's fixes on the branch — it runs only after both exist — so the sub-lane finishes with the suite red and says so, carrying its failing identifiers and any diagnosis. What each ending is *called* explains it and decides nothing: `HALT` for a bound reached or a routing decision, `FAILED` for a break, and the conclusion mode decides what any of them produces.
