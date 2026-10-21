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

- a comment-only review on the pull request, and on each pull request below it that the e2e branch re-marks: one `POST repos/{owner}/{repo}/pulls/<n>/reviews` carrying the verdict body and its [inline comments](#inline-comments) together;
- the `qa/review` commit status on each of those pull requests' head commit: `gh api repos/{owner}/{repo}/statuses/<sha> -f state=<success|failure> -f context=qa/review -f description='<n> met, <n> not-met, <n> no-test, <n> untested'`, to which the `test(e2e):` verdict under the `all` end-to-end scope adds `, <n> conflicts, <n> fails on <trunk> too`;
- resolving a review thread this skill opened, once its case is `met`: GraphQL `resolveReviewThread`.

It never approves or requests changes, resolves a thread it did not open, edits a body, changes a draft or ready state, commits or pushes. Every stop writes nothing. Each body goes on stdin from a quoted heredoc (`<<'EOF'`) or into the request as a `jq` value, never spliced into a command string, because cases are full of backticks and `$`.

## The fields you consume

A case is a `### TC-<issue>.<n> <title>` block in a `## Test cases` comment (a PRD's, continued in `## Test cases (2 of 2)` and on) or a `## Test case` comment (a bug's). You read: its id; `Requirement:`; `Kind:` — `positive` is an end-to-end test in the `test(e2e):` pull request, `negative` a unit test in the ticket's; `Priority:`; `Surface:`; `Given:`, `Steps:` and `Expected:`. A case listed under a later comment's `Retires: TC-<issue>.<n> (…)` line is retired: never judged, and its test is not to stay. A test is found by its title, which starts with the case's id; an end-to-end test also carries `@REQ-…` and `@high`/`@normal` tags (a Maestro flow, in its `name` and `tags`), which select the run under a `prd` [end-to-end scope](#the-teste2e-pull-request), never find a test. An **older test** is one titled with a case that is neither this PRD's nor one of its bugs' — Read step 4 gathers those; a bug of an earlier PRD's is older too.

## Read

1. **The pull request.** `gh pr view <n> --json number,title,body,state,baseRefName,headRefName,headRefOid,closingIssuesReferences`, then `git fetch origin <baseRefName> <headRefName>`. Done when its base, head and title are in hand.
2. **Pick the branch.** A title starting `test(e2e): #<PRD>` takes [the `test(e2e):` pull request](#the-teste2e-pull-request); every other takes [a ticket's pull request](#a-tickets-pull-request).
3. **The stack.** Below: follow `baseRefName` down through open pull requests (`gh pr list --head <base> --state open --json number,baseRefName,headRefName,headRefOid`) until the trunk. Above: `gh pr list --base <headRefName> --state open`, repeated up to the top. The trunk is the base of the bottom pull request; `git fetch origin <trunk>`, then the fork point is `git merge-base origin/<trunk> origin/<headRefName>`. Done when every pull request of the stack is listed in order.
4. **The cases.** Requirement `REQ-N.n` belongs to PRD #N: fetch `gh issue view N --json comments` and keep every case whose `Requirement:` is that id; then `gh issue list --state open --search '"Requirement: REQ-N.n" in:comments'` for a bug's `## Test case`. Done when every requirement in scope has its cases, or is reported with none.
5. **Older cases.** The PRD is the one the requirement ids in scope name. From its body (`gh issue view N --json body`), by `to-prd`'s anchors: each `Replaces:` line beneath a `- **REQ-N.n**` block under `## Requirements`, and the ids under `## Withdrawn`. From its `## Test cases` comment and every `(2 of 2)` continuation, each `Retires:` line. An older case's text is in the `## Test cases` comment of the issue its id names (`TC-12.4` → #12), fetched as in step 4; read it when a guard or a failure needs it. Done when this PRD's `Replaces:`, `## Withdrawn` and `Retires:` are in hand.

A PRD with no `## Test cases` comment stops the skill: write nothing and return its number.

## A ticket's pull request

1. **Requirements in scope.** The ticket is the issue the pull request closes, or else the one its title names. Collect every `REQ-N.n` in the ticket's body, then drop each that a ticket of a pull request **above** this one in the stack names too — that pull request answers for it. A bug's requirement is not in its body: where the ticket carries a `## Test case` comment, its own `TC-<ticket>.n` cases are in scope too, and their `Requirement:` names the PRD. No ticket, or neither a requirement nor a case of its own, stops the skill. Done when the list is final.
2. **Judge** each case in scope against the diff:
   - **negative** — `met` when a unit test titled with its id exercises its steps and asserts its expected result, and the code makes it hold; `not-met` when the test exists but the code or the test misses the case; `no-test` when no test carries its id.
   - **positive** — `untested`, with the end-to-end test's file:line where the diff already holds one. It never fails this pull request.
   - **an older case's test** — a hunk of this diff that changes or deletes any test, of any kind, whose title starts with an older case's id not under this PRD's `Retires:` is `not-met` for that case here, naming its PRD, the evidence the hunk's `file:line`. An older case with an own open thread here ([Inline comments](#inline-comments) step 1) that no hunk marks any longer is `met`, naming its PRD, so that thread resolves.

   Done when every case in scope has a line with evidence.
3. **Run the project's check** on the pull request's head. With a clean working tree, `gh pr checkout <n>`, run the check where it runs the unit tests (its manifests name it: package.json scripts, Makefile, CI config), then check out the ref you started on. A dirty working tree stops the skill. A negative case whose test fails is `not-met`. Done when the check ran, or the verdict says it could not and why.
4. Post [the verdict](#the-verdict).

## The `test(e2e):` pull request

Sensitive: this builds the whole stack locally and runs end-to-end tests, which are long-running.

1. **Runner and end-to-end scope.** The end-to-end runner and the local-stack bring-up are whatever the caller named, or what the project's manifests name. Found in neither, write nothing and return what is missing. The end-to-end scope is the value under `## End-to-end scope` in `docs/agents/qa.md`: `all`, the default where the file or the section is absent, or `prd — <job>`, naming the CI job that runs every end-to-end test on each pull request and that merges wait for (`prd — CI's e2e job (.github/workflows/ci.yml)`). Any other value, or a `prd` naming no job, stops the skill: write nothing and return the value. Done when both commands and the end-to-end scope are known.
2. **Coverage.** For every positive case of the PRD, find the test titled with its id and compare it, step by step, with the case's steps and expected result. One that follows them is a candidate; one missing or diverging is `no-test`, and the divergence is the evidence. Under `prd`, a candidate with no tag starting `@REQ-<PRD>.` is `no-test` instead, the missing tag the evidence: step 3 never runs it. Then the older tests, before anything runs: every test on the branch titled with a case under this PRD's `Retires:` is `not-met` here, passing or not, the evidence its `file:line`; and a hunk of this pull request's own diff that changes or deletes another older case's test is `not-met` here, as on [a ticket's pull request](#a-tickets-pull-request). Each names its case's PRD. An older case with an own open thread here ([Inline comments](#inline-comments) step 1) that steps 2 and 4 leave unmarked is `met`, naming its PRD, once its test passed in step 3 or, retired, is gone from the branch; under `prd`, where step 3 never runs it, its evidence is `run by <job>` in place of the pass. Done when every positive case is a candidate or has a `no-test` line, and every retired or changed older test has its `not-met` line.
3. **Build and run.** This pull request holds the whole stack beneath it. With a clean working tree, `gh pr checkout <n>`, bring the stack up, and run, timing the run:
   - **`all`** — every end-to-end test on the branch, this PRD's and every older one, no cap: running fewer lets a pull request that breaks an older test merge.
   - **`prd`** — the tests with tag prefix `@REQ-<PRD>.`, which also catches its bugs' `TC-<bug>.n` tests. `<job>` runs the older ones and holds that merge.

   Retry each failing test once: one that passes on the retry is **flaky**, listed and never failed. A surface the machine cannot drive — no simulator, emulator or device for iOS or Android — is `not run: no device`, never a fail. Afterwards bring the stack down and check out the ref you started on. A dirty working tree stops the skill. Done when every selected test has passed, failed twice, or is `not run: no device`, and the run's duration is known.
4. **Assign each failure.**
   - **This PRD's test.** Re-read the failing test against its case. A test that does not follow its case is this pull request's fault: `not-met` here. A test that follows its case and still fails means the code is wrong: `not-met` on the ticket's pull request that answers for that requirement (the highest ticket in the stack naming it).
   - **An older test** that failed twice and step 2 did not mark, in this order. Each run is that test alone, as in step 3: clean tree, `git checkout` the ref, stack up, run, stack down, check out the ref you started on.
     1. **Fork point.** Run it at the fork point (Read step 3). It fails → `fails on <trunk> too`, which fails nothing; no further run.
     2. **Bisect.** It passes there → binary-search the heads of the pull requests below this one and this head, the fork point passing and this head failing; the lowest head that fails it answers for it. Each probe first runs `git fetch origin <headRefName>` for that pull request and checks out its `headRefOid` from Read step 3. This pull request's own head → `not-met` here, the failing step the evidence.
     3. **Code or plan.** Otherwise read the older case's `Given:`, `Steps:` and `Expected:` against the requirements of this PRD that the answering pull request's ticket covers. Both can hold → `not-met` on that pull request, `not-met — assigned to #<n>` here. They cannot → a `conflicts` line here naming the older case, the requirement it collides with and what each expects, with the fault: the test cases' when the PRD names the old requirement under `Replaces:` or `## Withdrawn` but no `Retires:` line lists the case; the PRD's when it does not name it. The fix is a revised PRD or test cases: change no code, file no issue.

   Done when every failure sits on one pull request, or is `fails on <trunk> too` or `conflicts`.
5. **Re-mark below.** For each ticket's pull request below whose last `qa/review` verdict holds `untested` lines for this PRD, or that step 4 assigned a failure to, post a new verdict for it: each `untested` line `met` where its test passed, `not-met` where step 4 put a failure there, `not run: no device` where it was not run; a failure assigned with no line for its case gets a `not-met` line, naming the case's PRD where it is an older case; every other line as it stood. Done when every pull request below with an `untested` line or an assigned failure has a new verdict and status.
6. Post [the verdict](#the-verdict) for this pull request: one line per positive case, then one per older case steps 2 and 4 marked or met, each naming its case's PRD, then the run's duration. A failure step 4 assigned below is `not-met — assigned to #<n>` here, and does not fail this pull request's status: the ticket's status does. A `conflicts` line fails it; `fails on <trunk> too` does not.

## The verdict

```markdown
## qa-review

PRD: #57 · Ticket: #61 · Base: <baseRefName> · Head: <short sha>

- TC-57.4 — met — evidence (file:line)
- TC-57.5 — not-met — expected the account locked, the code allows a fourth try (src/…:42)
- TC-57.6 — no-test — no test titled TC-57.6
- TC-57.1 — untested — e2e/…:12
- TC-57.9 — not run: no device
- TC-12.4 — not-met — assigned to #61 — PRD #12, step 3 expected the list sorted, got unsorted
- TC-14.2 — fails on <trunk> too — PRD #14
- TC-15.1 — conflicts — PRD #15 expects a guest checkout, REQ-57.2 requires sign-in; the PRD's fault, it does not name REQ-15.1

**Run:** 212 end-to-end tests in 18m 40s, or None on a ticket's pull request
**Older tests:** run by <job>, not here — under `prd` only, `<job>` as the profile writes it
**Flaky:** TC-57.2 (passed on retry), or None
**Out of scope:** REQ-57.3, answered by #64 above, or None
```

Evidence is a `file:line` from the diff, the failing step with expected against actual, or the reason a line is not met. The status is `failure` on any `not-met`, `no-test` or `conflicts`, otherwise `success`; `untested`, flaky, `not run: no device`, `not-met — assigned to #<n>` and `fails on <trunk> too` never fail it.

### Inline comments

Every verdict this skill posts takes these steps — a ticket's, the `test(e2e):` pull request's own, each re-mark below it — against that pull request's own diff and own threads. They start once judging is complete; a stop reaches none of them.

1. **Own open threads.** Read the pull request's review threads:

   ```bash
   gh api graphql --paginate -F owner='{owner}' -F repo='{repo}' -F n=<n> -f query='
     query($owner: String!, $repo: String!, $n: Int!, $endCursor: String) {
       repository(owner: $owner, name: $repo) { pullRequest(number: $n) {
         reviewThreads(first: 100, after: $endCursor) {
           pageInfo { hasNextPage endCursor }
           nodes { id isResolved comments(first: 1) { nodes { body } } }
         }
       } }
     }'
   ```

   A thread is this skill's own when its first comment opens with a case id in the inline shape, `TC-<issue>.<n> — <not-met|no-test> — `; keep the own ones with `isResolved: false`. This is its own read and not `/pr-comments`' reader, which hides every thread `/pr-comments` has answered — threads this skill must still find. Done when each case in the verdict has an own open thread or is known to have none.
2. **Choose the inline comments.** A `not-met` or `no-test` line is also an inline comment when its evidence is a `file:line` on the head side of `git diff origin/<baseRefName>...origin/<headRefName>` — an added or context line of one of its hunks — and its case has no own open thread. The comment sits at that path and line; its body is the verdict line without the bullet, so the id opens it. Every other line stays in the body alone: evidence with no such `file:line`, a case with an own open thread whatever line its evidence now names, `not-met — assigned to #<n>`, `conflicts`, `fails on <trunk> too`. The body carries every line either way. Done when each anchor has been checked against the diff.
3. **Post one review**, body and inline comments together — one line per comment, none when there are none:

   ```bash
   comments=$(jq -Rn '[inputs | capture("^(?<path>.+?):(?<line>[0-9]+) (?<body>TC-.*)$") | .line |= tonumber | .side = "RIGHT"]' <<'EOF'
   <path>:<line> <the verdict line, without its bullet>
   EOF
   )
   jq -Rs --arg sha <headRefOid> --argjson comments "$comments" \
     '{commit_id: $sha, event: "COMMENT", body: ., comments: $comments}' <<'EOF' |
   <the verdict body>
   EOF
     gh api --method POST repos/{owner}/{repo}/pulls/<n>/reviews --input -
   ```

   GitHub rejects a line outside the diff, and the body with it: on a rejected post, post again with no comment lines and report each comment that could not be placed. Never a second review for the comments. A line the capture does not take posts no comment: count the comments built against the ones step 2 chose, and report each one missing as a comment that could not be placed. Done when the review is posted and the status set.
4. **Resolve what is met**, once the review is posted, so a post that failed leaves every thread as it was. For each thread step 1 kept whose case is `met` in this verdict:

   ```bash
   gh api graphql -f id=<thread id> -f query='
     mutation($id: ID!) { resolveReviewThread(input: {threadId: $id}) { thread { isResolved } } }'
   ```

   No other thread: not a person's, not one whose case is `untested`, `not run: no device`, out of scope or absent from this verdict. Done when every such thread is resolved.

**Return** each review's URL, each status set, the counts per mark, the end-to-end run's duration, and the threads opened and resolved.
