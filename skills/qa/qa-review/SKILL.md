---
name: qa-review
description: Reviews one pull request against a PRD's test cases and posts a per-case verdict as a review comment and the `qa/review` commit status. Use on a ticket's pull request, or on a PRD's `test(e2e):` pull request to run its end-to-end tests.
---

# qa-review — one pull request, judged case by case

You judge one pull request against the test cases `test-cases` wrote for a PRD, and post one verdict. Nobody is asked anything: a caller with no person present gets a posted verdict or a refusal that says why.

The issue tracker should be in your context, from the consuming repo's `docs/agents/issue-tracker.md`. If it is not, write nothing and return a refusal naming `/mattpocock-skills:setup-matt-pocock-skills`. Every `gh` command runs inside the checkout with no `--repo`; `gh api` paths use `{owner}/{repo}`.

## The model, taken from code-review

Invoke `/mattpocock-skills:code-review` and read it; where it is not installed, write nothing and return a refusal naming it. Take its model, not its process:

- **Taken:** the Spec sub-agent's brief — what is missing or partial, and what looks implemented but wrong — with the **test cases as the spec** in place of the issue, and the **pull request's base** as the fixed point: `git diff origin/<baseRefName>...origin/<headRefName>`.
- **Not taken:** the spec search (step 2), the Standards axis and its smell baseline (step 3), the sub-agents (step 4) and every question to the user. You do the Spec review yourself, in this session.
- **Scope creep is not yours to fail.** Behaviour no case asked for goes in no line.

## The writes this skill makes

These, and only these — each one an external integration other people read:

- a comment-only review on the pull request, `gh pr review <n> --comment --body-file - <<'EOF'`, and on each pull request below it that the e2e branch re-marks;
- the `qa/review` commit status on each of those pull requests' head commit: `gh api repos/{owner}/{repo}/statuses/<sha> -f state=<success|failure> -f context=qa/review -f description='<n> met, <n> not-met, <n> no-test, <n> untested'`.

It never approves or requests changes, resolves a thread, edits a body, changes a draft or ready state, commits or pushes. Every stop writes nothing. Each body goes on stdin from a quoted heredoc (`<<'EOF'`), because cases are full of backticks and `$`.

## The fields you consume

A case is a `### TC-<issue>.<n> <title>` block in a `## Test cases` comment (a PRD's, continued in `## Test cases (2 of 2)` and on) or a `## Test case` comment (a bug's). You read: its id; `Requirement:`; `Kind:` — `positive` is an end-to-end test in the `test(e2e):` pull request, `negative` a unit test in the ticket's; `Priority:`; `Surface:`; `Given:`, `Steps:` and `Expected:`. A case listed under a later comment's `Retires:` is out of scope. A test is found by its title, which starts with the case's id; an end-to-end test also carries `@REQ-…` and `@high`/`@normal` tags (a Maestro flow, in its `name` and `tags`).

## Read

1. **The pull request.** `gh pr view <n> --json number,title,body,state,baseRefName,headRefName,headRefOid,closingIssuesReferences`, then `git fetch origin <baseRefName> <headRefName>`. Done when its base, head and title are in hand.
2. **Pick the branch.** A title starting `test(e2e): #<PRD>` takes [the `test(e2e):` pull request](#the-teste2e-pull-request); every other takes [a ticket's pull request](#a-tickets-pull-request).
3. **The stack.** Below: follow `baseRefName` down through open pull requests (`gh pr list --head <base> --state open`) until the trunk. Above: `gh pr list --base <headRefName> --state open`, repeated up to the top. Done when every pull request of the stack is listed in order.
4. **The cases.** Requirement `REQ-N.n` belongs to PRD #N: fetch `gh issue view N --json comments` and keep every case whose `Requirement:` is that id; then `gh issue list --state open --search '"Requirement: REQ-N.n" in:comments'` for a bug's `## Test case`. Done when every requirement in scope has its cases, or is reported with none.

A PRD with no `## Test cases` comment stops the skill: write nothing and return its number.

## A ticket's pull request

1. **Requirements in scope.** The ticket is the issue the pull request closes, or else the one its title names. Collect every `REQ-N.n` in the ticket's body, then drop each that a ticket of a pull request **above** this one in the stack names too — that pull request answers for it. No ticket, or no requirement, stops the skill. Done when the list is final.
2. **Judge** each case of those requirements against the diff:
   - **negative** — `met` when a unit test titled with its id exercises its steps and asserts its expected result, and the code makes it hold; `not-met` when the test exists but the code or the test misses the case; `no-test` when no test carries its id.
   - **positive** — `untested`, with the end-to-end test's file:line where the diff already holds one. It never fails this pull request.

   Done when every case in scope has a line with evidence.
3. **Run the project's check** on the pull request's head. With a clean working tree, `gh pr checkout <n>`, run the check where it runs the unit tests (its manifests name it: package.json scripts, Makefile, CI config), then check out the ref you started on. A dirty working tree stops the skill. A negative case whose test fails is `not-met`. Done when the check ran, or the verdict says it could not and why.
4. Post [the verdict](#the-verdict).

## The `test(e2e):` pull request

Sensitive: this builds the whole stack locally and runs end-to-end tests, which are long-running.

1. **Coverage.** For every positive case of the PRD, find the test titled with its id and compare it, step by step, with the case's steps and expected result. One that follows them is a candidate; one missing or diverging is `no-test`, and the divergence is the evidence. Done when every positive case has a test or a `no-test` line.
2. **Runner.** The end-to-end runner and the local-stack bring-up are whatever the caller named, or what the project's manifests name. Found in neither, write nothing and return what is missing. Done when both commands are known.
3. **Build and run.** This pull request holds the whole stack beneath it. With a clean working tree, `gh pr checkout <n>`, bring the stack up, and run the PRD's end-to-end tests (filter by the `@REQ-<PRD>.` tag prefix, which also catches the bug cases Read step 4 gathered). Retry each failing test once: one that passes on the retry is **flaky**, listed and never failed. A surface the machine cannot drive — no simulator, emulator or device for iOS or Android — is `not run: no device`, never a fail. Afterwards bring the stack down and check out the ref you started on. A dirty working tree stops the skill. Done when every candidate has passed, failed twice, or is `not run: no device`.
4. **Assign each failure.** Re-read the failing test against its case. A test that does not follow its case is this pull request's fault: `not-met` here. A test that follows its case and still fails means the code is wrong: `not-met` on the ticket's pull request that answers for that requirement (the highest ticket in the stack naming it). Done when every failure sits on one pull request.
5. **Re-mark below.** For each ticket's pull request below whose last `qa/review` verdict holds `untested` lines for this PRD, or that step 4 assigned a failure to, post a new verdict for it: each `untested` line `met` where its test passed, `not-met` where step 4 put a failure there, `not run: no device` where it was not run; a failure assigned with no line for its case gets a `not-met` line; every other line as it stood. Done when every pull request below with an `untested` line or an assigned failure has a new verdict and status.
6. Post [the verdict](#the-verdict) for this pull request: one line per positive case. A failure step 4 assigned below is `not-met — assigned to #<n>` here, and does not fail this pull request's status: the ticket's status does.

## The verdict

```markdown
## qa-review

PRD: #57 · Ticket: #61 · Base: <baseRefName> · Head: <short sha>

- TC-57.4 — met — evidence (file:line)
- TC-57.5 — not-met — expected the account locked, the code allows a fourth try (src/…:42)
- TC-57.6 — no-test — no test titled TC-57.6
- TC-57.1 — untested — e2e/…:12
- TC-57.9 — not run: no device

**Flaky:** TC-57.2 (passed on retry), or None
**Out of scope:** REQ-57.3, answered by #64 above, or None
```

Evidence is a `file:line` from the diff, the failing step with expected against actual, or the reason a line is not met. The status is `failure` on any `not-met` or `no-test`, otherwise `success`; `untested`, flaky, `not run: no device` and `not-met — assigned to #<n>` never fail it.

**Return** each review's URL, each status set, and the counts per mark.
