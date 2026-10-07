---
name: qa-verify
description: Runs a project's end-to-end tests against a deployed environment, or a local stack where there is none, raises a bug per failure and sets the `qa/verify` commit status. Use for a smoke run after a deploy, or for a full run of every end-to-end test.
---

# qa-verify — one run of the end-to-end tests, one bug per failure

You run the end-to-end tests built from `test-cases`' cases against one environment, raise a bug for each failure, and post one verdict. Nobody is asked anything: a caller with no person present gets a posted verdict or a refusal that says why.

The issue tracker should be in your context, from the consuming repo's `docs/agents/issue-tracker.md`. If it is not, write nothing and return a refusal naming `/mattpocock-skills:setup-matt-pocock-skills`. Every `gh` command runs inside the checkout with no `--repo`; `gh api` paths use `{owner}/{repo}`.

**Sensitive.** The run is long-running and drives a real environment; it runs only against the deployed environment the caller names, never one chosen by guessing. Every bug, comment, label and status it writes is an external integration other people read.

## The writes this skill makes

These, and only these:

- `gh label create bug` / `gh label create flaky`, only when `gh label list` lacks it;
- one new issue per failing case with no open bug naming it, labelled `bug`, or `flaky` for a test that passed on its retry;
- a new comment on the open bug that already names a failing case;
- the `qa/verify` commit status on the commit that was run: `gh api repos/{owner}/{repo}/statuses/<sha> -f state=<success|failure> -f context=qa/verify -f description='<n> passed, <n> failed, <n> flaky, <n> not run'`;
- a new comment on each brief deployed in that commit, listing every failure.

It never edits a body, closes an issue, resolves a thread, commits or pushes. Every stop writes nothing. Each body goes on stdin from a quoted heredoc (`<<'EOF'`), because cases are full of backticks and `$`.

## The fields you consume

A case is a `### TC-<issue>.<n> <title>` block in a `## Test cases` comment (a PRD's, continued in `## Test cases (2 of 2)` and on) or a `## Test case` comment (a bug's); the issue is the one its id names (`TC-57.4` → #57). You read: its id and title; `Requirement:` (`REQ-57.3` belongs to PRD #57); `Kind:` — only `positive` cases are end-to-end tests; `Priority:`; `Surface:`; `Steps:` and `Expected:`. An end-to-end test's title starts with its case's id, and it carries `@REQ-…` and `@high`/`@normal` tags (a Maestro flow, in its `name` and `tags`). The PRD's `Brief: #<n>` line names its brief.

## Read

1. **The environment.** The deployed environment the caller named, and the commit deployed there. With an environment named but no commit, stop: the status has nowhere to go. With no environment named, run against a local stack at the ref the caller named, else the default branch; its commit is that ref's head. Done when the target and the commit `<sha>` are known.
2. **The runner.** The end-to-end runner, how to point it at an environment, the local-stack bring-up where needed, and where the trace and screenshot land: whatever the caller named, or what the project's manifests name (package.json scripts, Makefile, CI config). Found in neither, write nothing and return what is missing. Done when every command and the artifact location are known.
3. **Pick the run.** **Smoke** when asked for a smoke run; **Full** otherwise.
4. **What was just deployed.** The range runs from the previous deployed commit the caller named, else the nearest first-parent ancestor carrying a `qa/verify` status (`gh api repos/{owner}/{repo}/commits/<sha>/status`), to `<sha>`. Each pull request merged in that range names its PRD: a `test(e2e): #<PRD>` title directly, a ticket's pull request through the `REQ-<PRD>.n` ids in the issue it closes. Each PRD names its brief. With no previous commit found, nothing counts as just deployed; say so in the return. Done when the deployed PRDs and their briefs are listed.

## Run

1. **Select.**
   - **Smoke** — first the tests of each deployed PRD (title prefix `TC-<PRD>.`), then every test tagged `@high` not yet selected.
   - **Full** — every end-to-end test.

   Done when the selection is a filter the runner accepts.
2. **Run** against the target. For a local stack, a dirty working tree stops the skill; with a clean one, check out `<sha>`, bring the stack up, and afterwards bring it down and check out the ref you started on. Retry each failing test once: one that passes on the retry counts as passing and is **flaky**. A surface the machine cannot drive — no simulator, emulator or device for iOS or Android — is `not run: no device`, never a failure. Done when every selected test has passed, failed twice, passed on its retry, or is `not run: no device`.
3. **Read each failure and each flaky test** against its case: the failing step, expected against actual, the error text, and the trace and screenshot it left. Done when each has those in hand.

## Raise

1. **Labels.** Create `bug` or `flaky` where `gh label list` lacks one this run applies. Done when each exists.
2. **Find the open bug.** `gh issue list --state open --search '"TC-57.4" in:title,body'`, keeping one labelled `bug` or `flaky` that names the case. Done when each failing case has its open bug or has none.
3. **Write each one.** Where there is an open bug, `gh issue comment <n> --body-file - <<'EOF'` with [the bug body](#the-bug). Where there is none, `gh issue create --title 'TC-57.4 fails: <case title>' --label <bug|flaky> --body-file - <<'EOF'`. Done when every failing and flaky case has a bug or a comment on one.

## The bug

```markdown
Case: TC-57.4 Locked out after three wrong passwords · Requirement: REQ-57.3 · PRD: #57 · Brief: #50
Just deployed: yes | no · Run: smoke | full · Commit: <sha> · Environment: <name or local stack>

Failing step: 3. <the step>
Expected: <the case's expected result>
Actual: <what happened>

<the error text, fenced>

Trace and screenshot: <link or path where the caller keeps them>
Flaky: passed on retry | no
```

## The verdict

1. **Status.** `failure` on any test that failed twice, otherwise `success`; flaky and `not run: no device` never fail it. Done when the status is set on `<sha>`.
2. **Comment on each deployed brief** with `gh issue comment <brief> --body-file - <<'EOF'`:

   ```markdown
   ## qa-verify

   Commit: <sha> · Environment: <name or local stack> · Run: smoke | full · Status: success | failure

   - TC-57.4 — failed — #88 · this brief
   - TC-61.2 — flaky — #90
   - TC-57.9 — not run: no device

   Or: no failures.
   ```

   Done when every brief deployed in `<sha>` has its comment.
3. **Return** the status set, each bug raised or commented on, each brief comment's URL, the counts per mark, and anything the run could not establish.
