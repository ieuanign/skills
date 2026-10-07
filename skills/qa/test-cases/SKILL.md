---
name: test-cases
description: Writes, revises or checks a PRD's test cases — one plain-words check per requirement, posted as one `## Test cases` comment on the PRD's issue. Use to write a PRD's test cases, to revise them from a person's reasons or a revised PRD, or to check them against their checklist.
---

# test-cases — one comment of test cases per PRD

You turn a PRD written by `to-prd`, and its mockup from `mockup` where there is one, into test cases, and post them as one comment on the PRD's issue. Nobody is asked anything: whatever the PRD and the mockup left open you decide, and list under **Assumptions**. A caller with no person present gets a finished comment or a refusal that says why.

The issue tracker should be in your context, from the consuming repo's `docs/agents/issue-tracker.md`. If it is not, write nothing and return a refusal naming `/mattpocock-skills:setup-matt-pocock-skills`. The commands below are GitHub's, through `gh`, run inside the checkout and with no `--repo`; on another tracker, take the equivalent action its doc names.

## The writes this skill makes

These, and only these — each one an external integration other people read:

- one new comment on the PRD's issue, headed `## Test cases`, continued in `## Test cases (2 of 2)` and onward past GitHub's 65,536-character limit, split between cases, never inside one;
- edits to those comments of its own.

Every other body stays as it was: the PRD, the epic, the mockup, and every earlier issue's `## Test cases` comment. The check branch and every stop write nothing. Each comment body goes on stdin from a quoted heredoc (`<<'EOF'`), because cases are full of backticks and `$`.

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

## The comment

```markdown
## Test cases

PRD: #57 · Mockup: <path on the default branch, the mockup's pull request, or none>

**Assumptions**
- <each choice the PRD and the mockup left open, such as test data, and what you chose>

**Retires**
- Retires: TC-12.4 (REQ-12.4 → REQ-57.2)
- Retires: TC-12.6 (REQ-12.6 withdrawn)

### TC-57.1 …
```

Assumptions and Retires read `None` when empty. Cases follow in id order. A continuation comment carries only its heading and the cases that did not fit.

## Read

Every branch reads the same inputs. Fetch the PRD with `gh issue view <N> --json number,title,state,body,comments`; `N` is the PRD number, its title `PRD: <name>`. Read it by `to-prd`'s anchors:

- `Epic: #<number> | none` — fetch the epic where there is one, for the bigger picture the PRD sits in.
- Under `## Requirements`, each block `- **REQ-N.n** <behaviour>`, with `Visible:` and any `Replaces:` beneath it, and the user-story `###` heading above it naming who acts.
- `## Withdrawn` — ids, with why.
- `## Revisions` — its last line names the ids a revised PRD added, changed and withdrew.

**Earlier cases.** For every id under a `Replaces:` line or `## Withdrawn`, the earlier cases sit in the `## Test cases` comment of the issue whose number the id carries (`REQ-12.4` → #12). Fetch that issue's comments the same way and collect each case whose `Requirement:` is that id.

**The mockup.** The slug is the PRD's `<name>` in lowercase kebab-case. After `git fetch origin`, read `docs/design/<N>-<slug>.html` with `git show origin/<default branch>:<path>`, or, where it has not merged, from the head of the open pull request on `mockup/<N>-<slug>` (`gh pr list --head mockup/<N>-<slug> --state open`). The page's leading comment is its markup contract: each `section[data-screen]` names its requirement ids in `data-req` and its frame in `data-surface`, and each state button with `data-kind="error"` is an error state. With no mockup, take each requirement's surface from the PRD and record the choice under Assumptions.

Done when the PRD, its epic where named, the mockup or its absence, and every earlier case under Replaces or Withdrawn are in hand.

## Pick the branch

- **Check** — you were asked to check a PRD's test cases. Go to [Check](#check).
- **Revise** — the PRD already carries a `## Test cases` comment. Go to [Revise](#revise).
- **Write** — anything else. Go to [Write](#write).

## Write

1. **Pass or fail.** Read each requirement as a test would. One that cannot pass or fail as written stops the skill: write nothing, and return the PRD's number and those ids. Done when every requirement can be checked.
2. **Inventory.** A positive case for every requirement. A negative case for every error the PRD names and every error state on the mockup, each under the requirement it belongs to. Done when every requirement, every named error and every error state is on the list.
3. **Write** each case in the [shape](#a-test-case), ids `TC-N.1`, `TC-N.2`, … in the order you write them. Done when every field of every case is filled in plain words.
4. **Retires.** A line for each earlier case whose requirement is replaced or withdrawn: `Retires: TC-12.4 (REQ-12.4 → REQ-57.2)`, or `(REQ-12.6 withdrawn)`. The earlier comment is left as it is. Done when every earlier case from [Read](#read) has its line.
5. **Assumptions.** At the top, every choice the PRD and the mockup left open. Done when a reader could build the tests without asking.
6. **Checklist.** Run every line of the [checklist](#the-checklist) against the comment and fix each fail. Done when every line passes.
7. **Post.** `gh issue comment <N> --body-file - <<'EOF'`, one comment per part. Done when every part is on the issue.
8. **Return** each comment's URL, the count of positive and negative cases, and the checklist result.

## Revise

1. **Find your comments.** `gh api --paginate repos/{owner}/{repo}/issues/<N>/comments`, keeping each whose body starts with `## Test cases`; note each one's `id`. Done when every part and its id are in hand.
2. **Edit**, by whichever input you have:
   - **A person's reasons** — change what each reason asks for, and nothing else.
   - **A revised PRD** — read its last Revisions line and redo only the cases of those ids. A Changed id's cases are rewritten, keeping their ids. An Added id gets new cases. A Withdrew id's cases leave the list, each as a Retires line. A requirement that cannot pass or fail stops the skill as in Write step 1.

   A new case takes the next `n` after the highest `TC-N.n` anywhere in the comments, Retires included. Done when each reason, or each id on the Revisions line, is reflected.
3. **Checklist** as in Write step 6. Done when every line passes.
4. **Publish in place.** `gh api -X PATCH repos/{owner}/{repo}/issues/comments/<id> -F body=@- <<'EOF'` for each part that changed; a part the edit pushes past the limit continues in a new comment. Done when every changed part is published.
5. **Return** each comment's URL, what changed per reason or id, and the checklist result.

## Check

**Report** every line of [the checklist](#the-checklist) against the `## Test cases` comments and what [Read](#read) gathered, as pass or fail, each fail naming the case id, requirement id, error or field that fails it. Done when all seven lines carry a verdict. The result is the return; the tracker is left as it was.

## The checklist

- Every requirement has a positive case.
- Every error the PRD names, and every error state on the mockup, has a negative case.
- Every case names one requirement that exists in the PRD.
- Every field is filled, in plain words.
- Every positive case has a priority.
- Every requirement under Replaces or Withdrawn has its earlier cases under Retires.
- Every open choice is under Assumptions.
