---
"ieuanign-skills": minor
---

`docs/agents/coding-standards.md` is retired. What replaces it is a rule for where a consuming repo's configuration lives at all, recorded as this repo's first ADR — and three consequences that follow from applying it.

**The rule, in one question: would this still bind if the plugin were uninstalled?** Yes → `CLAUDE.md` and `.claude/rules/`. No, because it is meaningless without the plugin → `docs/agents/`. It is the same in every repo → the skill. It varies by machine → nowhere, and it gets probed at runtime. Two corollaries do the actual work: nothing under `docs/agents/` may restate a fact the repo states elsewhere, and no machine fact may enter a committed file. [ADR-0001](docs/adr/0001-config-boundary.md) carries the reasoning and the rejected alternatives.

**The standards rubric was half a copy, and the copy is gone.** Its Hard rules section quoted `CLAUDE.md` verbatim with nothing to re-sync it, so the `reviewer` met the same rule twice at two bindingness levels — binding at priority 4 from `CLAUDE.md`, "always a judgement call" at priority 5 from the derived copy — and a drifted copy could silently contradict its own source. What survives is the half that exists nowhere else: which baseline smells this repo's patterns deliberately trip. That file is now `docs/agents/smell-overrides.md`, named for what it holds rather than what it was distilled from.

**It is written from real rejections, never distilled in advance.** `/setup-ieuanign-skills` Part 1 no longer drafts anything at setup time; it records a finding the user brings back, and grills whether it has recurred and whether the deliberate thing is the pattern or the hunk. An override guessed from a `CLAUDE.md` is a suppression nobody justified — the old skill already told its own drafter to cut its guesses. **An absent file is now the correct state** of a repo where nothing has recurred, so `/code-review-mp`'s "run setup if this is missing" prompt is removed and the `reviewer` is told never to report it missing.

**The stack convention became a binding rule rather than a profile key.** `gh stack rebase`, never `git rebase` plus a force-push: the stack exists on GitHub whether or not the plugin does, so by the uninstall test it belongs in `.claude/rules/`. The pipeline never needed a key for it either — `stack-link.sh` probes for the extension and `/dev-loop` never rebases anything.

**`/setup-ieuanign-skills` gains Part 3**, which proposes the `.claude/rules/` set — PR separation, stacked-PR handling, comment and scratch conventions — and writes only what the user accepts. The rule bodies live in templates beside the skill, so nothing restates them. Where `gh-stack` is absent it prints one line and persists nothing, per the second corollary.

**Overlapping changes are now the repository's call.** `.claude/rules/pr-separation.md` declares `additive` (the default, and today's behaviour), `strict`, or `parallel`, and Gate 1's classification defers to it — moving only the line between additive and same-region co-touch. A real dependency still stacks whatever the repo says, or the upper pull request does not build against its base. `contracts.md` is normative and was edited first; the classification stays single-version across both execution modes.

**Two hooks, one file.** `pr-separation.md` also carries the order a change splits in and a changed-file limit, read through the architect's existing "per the repo's PR separation policy" deferral. The limit binds the plan and never the diff: by review time the only agent that could split a pull request no longer runs in that lane, so a diff-phrased limit would burn fix cycles and end a sub-lane over working, tested code.

`README.md` gains [How to improve your `/dev-loop`](docs/improving-dev-loop.md), which is why each of these pays off rather than what each says — the text stays in the templates.

**Out of scope, so it is not re-derived:** whether stacked-versus-flat is a developer choice. It is not. A real dependency and a multi-PR plan are facts about the work, and `/dev-loop` always stacks them.
