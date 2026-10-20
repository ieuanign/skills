# Gate 2 — the CI step (read at the first Gate 2 that reaches it, and again where no longer held)

Gate 2's step 3, per sub-lane step 1 pushed, under both run modes, where the profile's **CI wait** is `wait`. It waits for the GitHub Actions runs that push started, hands their result to the phase script's `ci` stage, and does what that stage returns. **Every bound, route and ending is the script's** — you count no rounds and decide no state; you run the commands below and carry the returned record back untouched.

## 1. Wait for the runs

1. The pushed sha: `git -C <wt> rev-parse HEAD`.
2. List its runs: `gh run list --branch <branch> --commit <sha> --json databaseId,status,conclusion,workflowName`. A run trails the push that starts it, so re-list for up to ~60 s before concluding there are none. Only the runs this push started count: a check or status from elsewhere could hold or redden a lane that caused nothing.
3. Wait on each: `gh run watch <id> --exit-status`. When your tool's time limit cuts it short, run it again; there is no wait ceiling.
4. Read each finished run: `gh run view <id> --json conclusion,jobs` — its conclusion, and the names of its jobs concluded `failure`, `timed_out` or `cancelled`.

Then compose `ci` as `{state, runs: [{id, workflow, conclusion, failingJobs}]}`:

| The runs | `state` |
|---|---|
| any run's conclusion is `failure`, `timed_out` or `cancelled` | `failed` |
| otherwise, at least one run and every one `success`, `skipped` or `neutral` | `passed` |
| otherwise — no run listed, or one that cannot finish without a person (`action_required`) | `not-run` — keep why, for the **CI** element |

## 2. Call the `ci` stage

Re-stage first, exactly as Act 3 does (`mkdir -p <STAGED>`, `cp -f <this-skill-dir>/phase-execute.js <STAGED>/`), then run the Workflow tool with `scriptPath: <STAGED>/phase-execute.js` and Act 3's args plus `stage: 'ci'`. Each lane carries its `notified` from its latest result, and `subLanes` holds only the sub-lanes still in this step, each as Act 3 passed it plus:

- `record` — that sub-lane's latest sub-result, **verbatim**: Phase B's on the first call, the `ci` stage's own on every later one. Its `ci` round state rides inside it; never edit it.
- `ci` — what section 1 composed for the sha just pushed.

KEEP each call's transcript directory, as Act 3 says.

## 3. Obey `next`

Each returned sub-result carries `next`:

| `next` | You |
|---|---|
| `push` | the writer committed a fix in the worktree. `git -C <wt> push origin <branch>` — a fast-forward, like every push this pipeline makes; under `gated`, a Gate 2 question first. Then section 1 again for the new sha, and section 2 again. A rejected push ends this sub-lane's CI step: report git's message verbatim as a **FAILED** ending and keep the worktree. A declined push ends it too: report the CI result and the unpushed fix commit, and keep the worktree |
| `rerun` | `gh run rerun <id> --failed` for each red run, then section 1 again for the same sha, and section 2 again |
| `done` | this sub-lane's CI step ends — below |

On `done`:

- **`unattended`, and the PR is one this run created:** compare the final `terminal.pr` with the state step 2 opened it in, treating `none` as `draft`. Opened draft and now `ready` ⇒ `gh pr ready <pr>`; opened ready and now `draft` ⇒ `gh pr ready --undo <pr>`. Re-render the body from the final result (`acts/gate-2-reference.md`'s **The pull request body**) and, when anything in it changed, `gh pr edit <pr> --body-file -` from a quoted heredoc.
- **`gated`:** report the CI result; change no pull request.

From here on the final sub-result IS that sub-lane's result: step 4 onward reads its `terminal`, ledger and attempt log; step 5 reads the lane's latest `notified`, and `crashed` as true where any call's was. An ending in the `ci` stage already dispatched its notifier, exactly as in Phase B.
