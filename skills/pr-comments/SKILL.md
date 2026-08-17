---
name: pr-comments
description: Reads a pull request's unresolved comments, classifies each as a fix or a skip for a human's approval, answers every review thread it read, then makes the approved fixes and pushes them to that pull request's own branch. Use for `/pr-comments <pull request>`, or `/pr-comments auto <pull request>` for an unattended run.
---

# /pr-comments — a pull request's comments, through to a pushed fix

You do this work yourself, in this session: read, classify, ask, fix, push. **Nothing here dispatches an agent**, and the only thing it runs that is not `git`, `gh` or the repository's own tooling is `read-comments.mjs`, bundled beside this file. No other specification, profile or script is loaded — what this run does is in front of you.

**Append-only against artifacts someone else owns, whichever mode it runs in.** The whole run writes one `git push` to the branch the pull request already has, comments on it — never more than one under `gated` or two under `unattended` — and replies once in each review thread its table covers. Nothing else leaves this session. Under `gated` no write happens before the gate below; under `unattended` the first comment **is** where that gate would have asked, unless the run stops before reaching it, in which case that stop's own comment is the first and only one.

## Arguments

`/pr-comments [auto] <pull request>`

- `auto` — optional leading token: run **unattended**, from comments to pushed fix, without stopping for approval.
- `<pull request>` — one pull request, as a number or a URL. One run reads one pull request; there is no batch.
- A URL contributes its **number** only. Every command here resolves the repository from this checkout's remote, so a URL pointing at a different repository is refused rather than quietly reinterpreted as this one's pull request of the same number.

**`auto` present ⇒ unattended; absent ⇒ gated.** Read it off the arguments ONCE, before anything else, and carry that single value through the run — no later stage re-derives it from the arguments, and no other argument overrides it.

**`unattended` assumes a permission mode that approves tool calls on its own, and asks nothing at all on that path.** Suppression removes the question, never the work: every comment is still classified, the table is still rendered, every thread is still answered, and the fixes are still made. Where a gated run would ask, an unattended one takes the answer stated at that stage — and where a stage below stops it before the gate, it spends its one comment saying why, a gated run's human having watched that happen instead.

## Derived facts (compute once — never hardcode, never persist)

- **MAIN** — the main worktree: first entry of `git worktree list`. Never modify or remove it.
- **DEFAULT** — the default branch: `git symbolic-ref --short refs/remotes/origin/HEAD` minus the `origin/` prefix, falling back to `main`.
- **WORKTREES** — `<MAIN>/.claude/worktrees/`, where this run's worktree goes.
- Every `gh` command runs inside a checkout of this repo and gh infers the repository from the remote, so no `gh` command carries `--repo`.

## How this run writes

Every comment this run posts and every reply it leaves is append-only, and all of them are shaped the same way. Each site below refers here rather than restating it.

**Every payload goes on standard input, from a quoted heredoc.** Comment bodies, the excerpts cut out of them, and the reasoning behind every disagreement are prose full of backticks, dollar signs and quotes — interpolated into a shell string they are executed rather than quoted, and the one place this run quotes a human's words back at them is the last place to allow that. Everything it carries travels verbatim.

**Every write ends with these two lines, in this order:**

```markdown
<!-- replied from /pr-comments -->
🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

`gh` authenticates as the human who invoked the run, so without the footer every comment and every reply reads as written by them. The marker is invisible in GitHub's renderer and is how a later run recognises what this one already answered — the read below excludes every comment carrying it. The conclusion comment writes a longer form of the same marker, named there.

**A comment on the pull request:**

```bash
gh pr comment <n> --body-file - <<'BODY'
...
BODY
```

**A reply in a review thread:**

```bash
gh api graphql -f query='mutation($t: ID!, $b: String!) { addPullRequestReviewThreadReply(input: { pullRequestReviewThreadId: $t, body: $b }) { comment { url } } }' \
  -f t=<the entry's threadId> -F b=@- <<'BODY'
...
BODY
```

`-F b=@-` reads the body from standard input, so `gh` serialises it and multi-paragraph prose survives — nothing here is hand-escaped into JSON. `gh pr comment` is not the tool for a reply: it posts at the foot of the pull request, which is the thing the replies exist to stop doing.

**A failed write is reported and changes nothing else about the run** — the push, the commits and every write that did land are what they would have been.

## Preconditions — one read, before anything is shown

`gh pr view <n> --json number,title,url,state,isCrossRepository,headRefName,baseRefName` — one read, which every stage below uses. Three things stop the run, each making its promise (the fixes, pushed to this pull request's own branch) impossible to keep, and stopping here rather than after a table wastes only the read:

- **any state but `OPEN`** — the branch of a merged or closed pull request may already be deleted, and pushing to one is not a fix anybody asked for;
- **`isCrossRepository: true`** — the head branch lives on another remote, so the push cannot be made from this checkout at all;
- **`headRefName` equal to `<DEFAULT>`** — the one push lands on that branch, and from the default branch it would take it to the trunk.

## Read the unresolved comments

`node <this-skill-dir>/read-comments.mjs <n>` — the bundled read, and the only one. It prints one JSON document, `{ pullRequest, comments: [...] }`, whose entries carry the same keys whatever each started as: `origin` (`review-thread`, `review-body` or `issue-comment`), `id`, `author`, `body`, `url`, `createdAt`, `path`, `line`, `originalLine`, `outdated`, `threadId`, `reviewState`.

- **A non-zero exit is a failed read, never an empty pull request.** It prints no JSON when it fails, so report its message and stop — that is what lets an empty `comments` array mean only what it says.
- **What it excludes is its own business**: a resolved thread, a minimised comment, an unsubmitted or bodyless review, and everything a previous run of this skill already answered — a comment carrying the footer marker, the whole thread holding one, and any comment a previous conclusion named by id. Never re-derive any of that, and issue no `gh` call of your own for comments — a second reader is a second answer.
- **An empty list ends the run.** Say the pull request has no unresolved comments, show no table, ask nothing.

## Classify, and build the table

Classification is **your own plain reading of each body**. A comment is a **fix** where it asks for a change to the code on this pull request and says enough for someone to make it; everything else is a **skip**. **Every unresolved comment gets a row**, whichever way it went — a table showing only the work is one nobody can check, and the skips are the half a human is likeliest to disagree with.

**Read a question for its answer, never for its grammar.** Answer it first, then look at the answer: one naming something the code should do differently makes the row a fix, and that answer is its Action; one that stands on its own with the code unchanged makes it a skip, and that answer is its Action and its reply. *"Why not use a hook rather than copying this three times?"* is a fix; *"What does this flag do?"* is a skip. Nothing about the wording separates them.

**A comment the run cannot decide is a skip whose Action says it is left for a human**, and what it appeared to ask. **A skip that disagrees with a reviewer says so in full** — the reasoning, in as many sentences as it takes, because that row is this skill overruling a human. **A skip resting on something already done names it** — the short sha and subject of a commit this pull request holds, from `gh pr view <n> --json commits`, or the file and line of the convention it rests on. Evidence a reader cannot open is no evidence. **Classify what the comment says, not what its metadata suggests**: an outdated comment is one whose code moved, which says nothing about whether anyone did what it asked.

```markdown
| Comment | Status | Action |
```

| Column | What it holds |
|---|---|
| **Comment** | the entry's conclusion in a clause — what it asks for or asserts — linked to the entry's `url`, and its `<path>:<line>` where it has them |
| **Status** | `fix` or `skip` |
| **Action** | how the fix will be made, or why it is skipped, with the evidence that skip rests on |

Anything wanting more room than a cell goes beneath the table, keyed by the row's Comment link — a disagreement's full reasoning always does. **Any `|` a cell carries is escaped**, since one unescaped pipe silently eats the rest of a row.

## The gate — the run's only one

Nothing on the way to this line touched the pull request; every command so far was a read. Render the table and count its `fix` rows.

- **`gated` — ask, once.** AskUserQuestion: approve this table, or stop. Say what approving does — every review thread the table covers answered where it was raised, and, where any row is a fix, a worktree on `headRefName`, the fixes committed there and one push to that same branch. A human may correct any row's status or action first; the corrected table is the one that counts and the one everything below renders. Anything short of approval ends the run with nothing written.
- **`unattended` — post the table where the question would have stood.** Nobody is going to correct a row, so the table as classified is the one that counts. It goes on the pull request per **How this run writes**, rendered identically and never re-summarised, under one line saying an unattended run of this skill classified these comments and what it will do next. This is the run's first write, and such a run posts this comment and the conclusion below and never a third.

**Every path past this line answers the threads**, whatever the fix count: the replies are what this run owes the people who wrote the comments, and a run ending for want of code to write owes them just the same.

## The threads, answered where they were raised

A comment at the foot of the pull request notifies its author about *the pull request* rather than about *their comment*, and leaves the thread they are watching silent. A disagreement delivered that way is this skill overruling a reviewer somewhere that reviewer has no reason to look, and a comment that was acted on and never answered leaves its author reading a diff to find out.

**Every review thread the table covers gets exactly one reply**, fix and skip alike, under both modes. A thread is one conversation, and two replies to it are two answers to one question; where the table covers several of its comments, the one reply names each and gives each its own line. A reply is the row's Action in a line — a skip's evidence with it, a disagreement's reasoning in full — plus, for a fix, the short sha and subject of the commit that made it, or in one clause what stopped it.

**When a thread is answered is decided by the latest thing its rows wait on.** A thread holding no fix row is answered **here**, the moment the table is the one that counts: those rows were settled at the gate, and a reply held to the end never arrives on a path that ends before it. A thread holding one waits for the conclusion, so its reply can carry that commit. Nothing else is deferred.

**A row whose entry carries no `threadId` is not replied to.** A review body and an issue comment have no reply primitive, and a fresh comment at the foot of the pull request is another comment rather than an answer. The conclusion below answers them instead, and its marker names their ids.

**No fix row at all** ⇒ there is no code to write and the table is the answer: the threads above are answered, no worktree is provisioned, nothing is pushed, and the run goes straight to its conclusion.

## The worktree, on the pull request's own branch

**Nothing here creates a branch of its own.** `headRefName` is the branch the worktree checks out and the only branch this run will ever push to. **Every stop below reports git's message verbatim, leaves the worktree wherever it got to, and goes to the conclusion** — which answers the threads it deferred and says what stopped it.

1. `git fetch origin <headRefName>` — the worktree starts at the remote's tip, which is what makes the later push a fast-forward instead of a race.
2. Attach at `<WORKTREES>/pr-<n>`, the only name this run invents: `git worktree add <WORKTREES>/pr-<n> <headRefName>` where that branch already exists locally, and `git worktree add <WORKTREES>/pr-<n> -b <headRefName> --track origin/<headRefName>` where it does not. That is the only `-b` here. A branch already checked out elsewhere makes `git worktree add` refuse.
3. The checkout must sit at `origin/<headRefName>` — **checked, not assumed**. `git -C <worktree> merge --ff-only origin/<headRefName>` catches up a stale local branch and refuses a diverged one. Then compare `git -C <worktree> rev-parse HEAD` with `git -C <worktree> rev-parse origin/<headRefName>` and **stop unless the two shas are equal**, reporting both: to a local branch *ahead* of the remote the merge says `Already up to date` and exits zero, and those unpushed commits — someone's work in progress — would ride out on this run's push, landing on the pull request unreviewed.
4. **That HEAD sha is the base**, captured now, before anything is written. The review below reads `<base>..<headRefName>`; the pull request's own base branch in its place would have it review the human's entire pull request.
5. **Make the worktree runnable and find the suite the way any session in this repository works them out** — from what the checkout itself says. This skill names no file for either and asks nothing.

## The fixes — implement, then one review pass

In the worktree, on that branch, in this session:

- **Implement the table's fix rows**, in the order the table lists them, each row's Action as the brief and the comment's body verbatim as what it is against. One commit per row, unless two rows ask for the same change; a later fix opens a file with the earlier ones already in it, which is why they run in one worktree and in order.
- **Use `/mattpocock-skills:tdd` where it applies**, at seams that already exist. A review comment is not a licence to grow the surface.
- **Run typechecking and single test files as you go, and the full suite once at the end.** A suite that did not run never reads as green.
- **Then `/mattpocock-skills:code-review` over `<base>..<headRefName>`, in your own context.** Apply its findings, and **that is the whole of the review — one pass, then stop**, whatever the second pass might have said. What it declined to fix is reported in the conclusion rather than argued with.
- **Commit to the branch the worktree has** — messages conventional, `<type>(<scope>): #<n> - <what changes>`, `#<n>` being the pull request, GitHub numbering pull requests and issues in one sequence. Never amend or rebase what the branch already held.

## The push

1. `git -C <worktree> rev-list --count <base>..<headRefName>`. **Ask git, never your own account of what you committed** — the count is what settles the push.
2. **Nothing** ⇒ nothing landed on the branch: push nothing, and say so in the conclusion.
3. Otherwise `git -C <worktree> push origin <headRefName>` — **never `--force`, never `--force-with-lease`**. This is the run's one push, and the only write to a git remote it will ever make.

The push is a fast-forward by construction, the worktree having started at `origin/<headRefName>` and stopped where it could not. **A rejection therefore means the branch moved while the fix was being written** — someone else pushed to the pull request. Report git's message verbatim, keep the worktree, and say nothing was pushed. Never retry harder, and never reach for a flag that would make it land anyway.

## The conclusion comment

Three things, in this order — git before the replies, so a reply can name its commit; the replies before the comment, so the comment can name every one of them.

1. **Ask git what reached the branch**: `git -C <worktree> log --oneline <base>..<headRefName>`, read in the worktree, after the push and before the disposal below removes it. A run with no worktree has nothing to ask.
2. **Answer the threads that were deferred**, per the reply shape above. A pushed commit's reply carries its short sha and subject from that log; a path that pushed nothing says what stopped it instead, and never cites a sha the remote does not hold.
3. **Post one comment**, per **How this run writes**, on every path that got past the gate — under `gated` the run's only one, under `unattended` a second beside the table and never an edit to it. It carries what reached the branch (that log, line for line, marked **not pushed** with why where nothing was), one line per comment a commit fixed, one line per reply left and per row that had no thread to reply in, the table as it stands rendered identically, the suite's result, what the review pass changed and what it declined, and — where a run stopped early — the stage that stopped it and its message verbatim. A section with nothing to put in it is left out. It ends by naming the worktree by path wherever one was kept, this session being the last thing that knows where the work is.

**Its footer marker names what it answered**: `<!-- replied from /pr-comments: <id> <id> -->`, listing the `id` of every row that had no thread to reply in, so a later run's read excludes them as answered. Every other write takes the bare form.

**Nothing else on the pull request changes.** Every thread stays unresolved, the answered ones included: whether an answer settles a comment is its author's call, and a run that resolved its own work marks its own homework.

## The worktree, disposed of last

| How the run got here | The branch | The worktree |
|---|---|---|
| clean, commits pushed | fast-forwarded | removed |
| clean, nothing to push | untouched | kept |
| stopped part-way | untouched | **kept** |
| push rejected | untouched | kept, reported |
| removal refused | fast-forwarded | kept, reported |

Removal is `git -C <MAIN> worktree remove <WORKTREES>/pr-<n>`, **never `--force`**, and only once the push has succeeded — after it the remote branch is the only copy of the fix, so a push that failed or never ran keeps its worktree. **Confirm the path is not the first entry of `git worktree list` first.** A refusal is the guard working: `git worktree remove` declines on tracked modifications and on untracked non-ignored files, so report `git -C <worktree> status --porcelain` verbatim and keep the worktree.

**The branch is left alone either way, local ref and remote.** The remote one is what the pull request *is*; the local one may have been the human's before this run attached to it.

## Hard rules

- **One push; one comment under `gated` or two under `unattended`; one reply in each review thread the table covers — nothing else leaves this session.** The push goes to the branch the pull request already has, and before the gate an unattended run writes only where it stops.
- **Append-only, and narrower than a pipeline working its own branch, because these artifacts belong to someone else.** No review thread resolved — replying to one is append-only and resolving it is not — no draft or ready state converted, no label added or removed, no issue body, pull request body or anyone's comment edited. No failure and no absent human relaxes this.
- **Never force-push, in any form** — no `--force`, no `--force-with-lease`. The push is a fast-forward by construction, so forcing is never the repair.
- **Worktree removal never passes --force.** The refusal on a dirty worktree IS the guard. Every skill that removes a worktree states this same guardrail, deliberately, because none of them loads the others.
- **Push before you remove**, never remove the main worktree, and remove only with `git worktree remove`, against a path under `<WORKTREES>`.
- **Nothing dispatches an agent, nothing runs a workflow, and no file outside this skill's own folder is loaded to decide what this run does.** The review is a pass you make yourself, once.
