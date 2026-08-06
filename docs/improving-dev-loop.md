# How to improve your `/dev-loop`

The pipeline is fixed and deliberately repo-agnostic — it hardcodes no repository name, path, or
project fact. Everything that makes it fit *your* repo is something your repo tells it.

So the way `/dev-loop` gets better is not by configuring the pipeline. It is by writing down what you
keep having to correct. Five things are worth writing down, in the order they pay off. Each is a rule
`/setup-ieuanign-skills` will propose and write for you — this page is why they matter, not their
text, which lives in that skill.

---

## 1. Teach the reviewer what not to flag

The highest-leverage loop, and the only one that compounds.

When the `reviewer` files a finding you disagree with, you pay for it twice: once reading it, and once
in a **fix cycle** — the pipeline's bounded budget for review-and-fix rounds, which defaults to two per
sub-lane. A finding you reject is a cycle that bought nothing, and a lane that runs out of cycles ends
carrying its findings open.

`/dev-loop`'s Gate 2 shows you the ledger of these directly: findings the writer **disputed** and the
reviewer retracted, and findings you accepted at arbitration. That ledger is your candidate list.

**Reject the same finding class twice, then record it.** Run `/setup-ieuanign-skills`, bring it the
finding, and it writes the exception into `docs/agents/smell-overrides.md`. From then on the reviewer
knows that pattern is deliberate here and stops filing it.

Twice, not once, and the skill will hold you to it. One rejection is a one-off; a file full of
one-off exceptions blinds the reviewer to a whole smell class, which is worse than the false positives
it was meant to stop. And the file is written *only* this way — never distilled from your `CLAUDE.md`
in advance, because an override guessed before the fact is a suppression nobody has justified.

**An absent `smell-overrides.md` is correct**, not a setup step you skipped. It means nothing has
recurred yet. Nothing will ever ask you to create it.

## 2. Size and split your PRs before they exist

`.claude/rules/pr-separation.md`, three sections, each solving a different failure.

**Order** — which areas become which pull requests, and in what sequence. The architect reads this
when it writes a plan's commit and PR breakdown, so a chain you declare once is a chain every plan
follows.

**Size** — a changed-file limit. `/setup-ieuanign-skills` offers **~45** as a starting number; tune
it. It is a review-attention limit rather than a correctness rule, and past it a human reviewer skims.

The important part is *when* it binds: **the plan, never the diff.** This is not a style choice. By
review time the code exists, and the only agent that could split a pull request — the architect — does
not run again in that lane. A size rule phrased against the diff produces a finding no available agent
can fix, which burns both fix cycles and ends the sub-lane over code that is working, in scope and
tested. Phrased against the plan, it binds at the one moment splitting is still cheap.

This is also why the limit cannot live in `/to-tickets`. A ticket deliberately names no file paths —
they go stale — so it has nothing to count. File count only becomes knowable once the architect has
explored the code.

**Overlapping changes** — the one genuinely open choice, and the one most likely to be costing you
wall-clock right now. When two lanes touch the same file, `/dev-loop` sequences the later one into the
next layer, and it does this without asking. That is the safe answer, and in a repo with a busy
registry or barrel file it can serialise a whole batch that had no dependencies in it at all.

Three values, and you declare which:

- **`additive`** — the default and today's behaviour: same file at different places runs in parallel,
  same region gets stacked.
- **`strict`** — any shared file gets stacked. More serialisation, fewer conflicts.
- **`parallel`** — never stack for overlap alone; both run, and whoever merges second resolves it.

Work that genuinely *consumes* another change's output is stacked regardless — that one is a fact
about the issues, not a preference, and no declaration overrides it.

## 3. Standardise your git config

`.claude/rules/stacked-prs.md`.

Rebase-versus-merge stops being a free preference the moment your pull requests stack. A plain
`git rebase` plus a force-push on a branch that has other branches based on it strands every one of
them on commits that no longer exist, and takes the recorded stack with it. The chain then has to be
rebuilt by hand.

The rule names the stack-aware commands to use instead. Worth being explicit that this is about *you*:
`/dev-loop` never rebases and never force-pushes — it pushes each branch exactly once and opens the
pull requests already chained. Everything this rule governs happens after the run is over.

`/setup-ieuanign-skills` proposes it only where the `gh-stack` extension is actually installed. If it
is not, the run still stacks — bases chained by branch name, with the relationship noted in each body
— it just doesn't record the stack on GitHub. Nothing fails, nothing prompts, and a teammate without
the extension is unaffected.

## 4. Keep working material out of the repo

`.claude/rules/scratch-files.md`.

A gitignored scratch file exists on one machine in one checkout, and `/dev-loop` removes lane
worktrees the moment their work reaches the remote — so a lane's scratch output is destroyed by
design, as soon as its branch is pushed. That is intended: it is working material, and cleaning it up
is a reason to remove the worktree rather than a cost of doing so.

The rule closes the gap that makes it hurt: **if the content matters, move the content before the file
goes.** Commit it, or paste it onto the issue or pull request and then delete it. Never leave one
behind expecting someone to find it.

Half of this is already mechanical — every pull request body lists the gitignored paths that lane's
plan named, under **Local-only artifacts**, before the worktree goes. The rule covers what no plan
named, and the habit of clearing your own.

## 5. Make comments earn their space

`.claude/rules/code-comments.md`, scoped by path so it costs nothing in a docs-only session.

Two lines maximum, saying *why* rather than *what*, and never a pointer to an ADR, an issue, a plan or
a scratch file. Those get renumbered, merged and deleted, and a comment promising context that no
longer exists is worse than no comment — a reader trusts it, then cannot find what it named.

---

## Where your next rule goes

You will want a sixth convention. Placing it is one question — **the uninstall test**:

> **Would this still bind if this plugin were uninstalled?**

**Yes** → `CLAUDE.md` or `.claude/rules/`. Project rules load at launch with the same priority as
`.claude/CLAUDE.md` and reach every custom subagent, so choosing between the two files is organisation
and path-scoping, never how binding the rule is. Prefer `.claude/rules/` once `CLAUDE.md` gets long.

**No** → `docs/agents/`, if it is per-repo config only these skills read. **Same in every repo** → it
belongs in the skill and you should not be writing it. **Varies by machine** → nowhere; it gets probed
at runtime, because a committed file naming one machine's setup breaks the next person's checkout.

Two corollaries do the enforcing, and both are load-bearing: **no derived copies** — nothing under
`docs/agents/` restates a fact the repo states elsewhere, which is the mistake that produced and then
retired the old `coding-standards.md` — and **no machine facts in git**.

## Running it

```bash
/setup-ieuanign-skills
```

Three parts, each independent, and nothing is written without an explicit yes:

1. **Smell overrides** — writes nothing on a first run. Come back to it with a rejected finding.
2. **Workflow labels** — the three label strings an unattended `/dev-loop auto` reports through. A
   supervised run writes no labels, so skip it if you never use `auto`.
3. **The rules** — proposes the four files above, reading your repo's structure for the ones that
   depend on it. Decline any of them; a declined rule is a real answer.

Re-run it any time. It reports what already exists and leaves it alone unless you ask otherwise.
