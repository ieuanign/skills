---
name: reproduce
description: Turns a reported bug into a minimised red repro against a local stack at the default branch, and posts it with one test case as a `## Test case` comment on the bug. Use when a bug issue needs reproducing before anyone fixes it.
---

# reproduce — one bug, one red repro, one test case

You reproduce one reported bug against a local stack at the default branch, shrink the repro until every part of it is load-bearing, and post it on the bug with the one test case it becomes. Nobody is asked anything: a caller with no person present gets a posted comment or a refusal that says why. You fix nothing and commit nothing.

The issue tracker should be in your context, from the consuming repo's `docs/agents/issue-tracker.md`. If it is not, write nothing and return a refusal naming `/mattpocock-skills:setup-matt-pocock-skills`. Every `gh` command runs inside the checkout with no `--repo`; `gh api` paths use `{owner}/{repo}`.

**Sensitive.** Bringing a local stack up and running end-to-end tests is long-running. The comment is an external integration other people read.

## The model, taken from diagnosing-bugs

Invoke `/mattpocock-skills:diagnosing-bugs` and read it; where it is not installed, write nothing and return a refusal naming it. Take part of it:

- **Taken:** Redact; Phase 1, building a tight loop that goes red; Phase 2, reproducing and minimising, up to its completion criterion — every remaining element load-bearing.
- **Not taken:** Phase 3 and everything after it — no hypotheses, no instrumentation, no fix, no cleanup phase. Nor its questions to the user, nor its human-in-the-loop script: where it would ask, you stop and return what you need instead.
- **The loop you deliver is a test** at the seam the case's kind decides: an end-to-end test for a positive case, a unit test for a negative one. Other loops may get you there; the one you post is that test, because the fix's first commit adds it as the case's test.

## The writes this skill makes

This, and only this: one new comment on the bug, headed `## Test case`, by `gh issue comment <bug> --body-file - <<'EOF'` — a quoted heredoc, because cases are full of backticks and `$`.

It never edits a body, labels, closes an issue, commits or pushes. Every stop writes nothing. The repro's files are removed from the checkout once the comment holds them, and the checkout is left on the ref you started on.

## A test case

One check of one requirement, in plain words: no selectors, files or symbols.

```markdown
### TC-57.4 Locked out after three wrong passwords
Requirement: REQ-57.3 · Kind: positive · Priority: high · Surface: web
Given: a visitor with an account
Steps:
1. …
Expected: …
```

- **Id** `TC-<issue number>.<n>`, where the issue is the one that holds the case: the PRD, or a bug. Numbered in order of creation, never reused.
- **Requirement**: exactly one id that exists. A requirement may have several cases.
- **Kind**: `positive` when the requirement's behaviour happens, `negative` when the software refuses or reports an error as it should.
- **Priority**, on positive cases only: `high` when a person would be blocked if the case failed, otherwise `normal`.
- **Surface**: web, iOS, Android, email, PDF or notification, as the mockup frames it.

**Where each case is tested.**

- A **positive** case is an end-to-end test. All of a PRD's end-to-end tests are in one pull request titled `test(e2e): #<PRD> - …`, at the top of the PRD's stack.
- A **negative** case is a unit test in the pull request of the ticket that covers its requirement, run by the project's check.
- A test's title starts with its case's id. An end-to-end test is also tagged with its requirement and its priority: `test("TC-57.4 Locked out after three wrong passwords", { tag: ["@REQ-57.3", "@high"] }, …)`. A Maestro flow carries the same in its `name` and `tags`.

## Read

1. **The bug.** `gh issue view <bug> --json number,title,state,body,comments`. One that already carries a `## Test case` comment is reproduced: write nothing and return that comment's URL. Done when the reported symptom — what was done, what was expected, what happened — is in hand.
2. **The requirement.** Find the requirement the reported behaviour breaks: an id the bug names (`REQ-57.3`, or a case `TC-57.4` whose `Requirement:` line names one), else the PRDs' `## Requirements` (`gh issue list --state all --search 'in:title "PRD:"'`, then `gh issue view <N> --json body,comments`), their `## Test cases` comments, and their mockups under `docs/design/` on the default branch. Behaviour in no requirement, mockup or test case is a new request, not a bug: write nothing and return why. Done when one `REQ-N.n` is named, with its PRD's `## Test cases` comment where there is one.
3. **The runner.** The test runner for the case's seam, the local-stack bring-up, and the project's check: whatever the caller named, or what the project's manifests name (package.json scripts, Makefile, CI config). Found in neither, write nothing and return what is missing. Done when each command is known.

## Reproduce

1. **The stack.** A dirty working tree stops the skill. With a clean one, note the ref you are on, `git fetch origin`, check out `origin/<default branch>` detached, and bring the stack up. Done when the stack answers.
2. **Build the loop**, by Phase 1: a test, titled with the case's id, that drives the reported steps and asserts the reported symptom. Where no loop can be built, bring the stack down, return to your starting ref, write nothing, and return what you tried and what the reporter must supply — access to an environment that reproduces it, or a redacted artifact. Done when Phase 1's completion criterion holds and you have run the command and seen it red.
3. **Minimise**, by Phase 2: confirm the red is the reported symptom and not a neighbour, then cut steps, data and setup one at a time until removing any one turns it green. Done when Phase 2's completion criterion holds. Stop here: no hypothesis, no fix.
4. **Capture** the minimised test's code, the red command and its output, redacted. Then delete the files you wrote, bring the stack down, and check out your starting ref. Done when the checkout is as you found it.

## Write the case

One case in the [shape](#a-test-case), id `TC-<bug>.1`, `Requirement:` the id from Read step 2. Its `Kind` is `negative` when the software failed to refuse or report an error as it should, `positive` otherwise; a positive case's `Priority` is `high` when the bug blocks a person. `Given`, `Steps` and `Expected` are the minimised repro in plain words — what the requirement promises, not what the software did. Done when every field is filled.

## The comment

````markdown
## Test case

Bug: #88 · PRD: #57 · Default branch at: <short sha>

### TC-88.1 …
Requirement: REQ-57.3 · Kind: negative · Surface: web
Given: …
Steps:
1. …
Expected: …

**Repro** — red at <short sha>. The fix's first commit adds this as TC-88.1's test: an end-to-end test for a positive case, a unit test for a negative one.

```sh
<the red command>
```

```<language>
<the minimised test>
```

```text
<the red output, redacted>
```
````

**Return** the comment's URL, the case id and its requirement, and the red command.
