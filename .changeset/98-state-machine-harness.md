---
"ieuanign-skills": patch
---

`/dev-loop`'s execution state machine now has a test harness, tracked in the repository and run by `npm run check`. No behaviour changed: `contracts.md`, `notifications.md` and both phase scripts are untouched, and the harness passes against the implementation as it stands.

**The seam already existed and was already used.** A phase script is not a module — the Workflow tool compiles it as the body of an async function over its own globals — so `node --check` is a silent no-op on one and only an `AsyncFunction` parses it. The check script has loaded them that way all along, construct-only, because running one dispatches agents. Handing that same constructor a **scripted fake `agent()`** runs the whole machine instead: every loop, every bound, every ending, for the price of a `node` process and no dispatches at all. It is the highest seam available, and no new one is introduced anywhere.

**The shim is now one copy rather than two that were asked to match.** It moves to `scripts/lib/phase-script.mjs`, which the check script calls as a CLI and the harness imports as a function. Previously the check script carried it inline with a comment naming a gitignored harness it "must stay in step" with — an untracked file nothing could compare it against, and one a provisioned worktree never had.

**Fifteen scenarios, two observables each**: the ordered labels the fake `agent()` was asked for, and the lane result — ending label, ending reason, terminal pull-request state, findings ledger. They cover the review loop reaching its bound with the findings open, the implement loop's two debug+fix attempts and its give-up clause landing on the final permitted one and no earlier, all four debugger routes, the suite gate's progress-sensitive rounds and its eight-round ceiling, the ending labels a bound and a reasoned refusal take against the ones a dead agent and an unusable return take, and terminal state computed per sub-lane so that one sub-lane's draft does not draft its sibling.

Nothing asserts on an internal variable, a private helper, or prompt wording beyond an input a contract requires to be present — a test that breaks when a loop is refactored but its behaviour is unchanged is a bad test, and this file has to survive refactors of the file it tests.
