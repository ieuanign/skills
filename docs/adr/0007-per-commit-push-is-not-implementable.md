# 0007 — Per-commit push is not implementable, and a sub-lane pushes once

**Status**: accepted, and implemented — the push is one host command at Gate 2, guarded on the branch
being ahead of its base.

A sub-lane makes several commits and pushes at the end of its layer. The obvious improvement is to
push each commit as it lands: CI starts earlier, a dead session leaves more behind, and a human
watching sees progress. It has been proposed more than once. It cannot be built from where the commits
happen, and the thing it would buy turns out to be nothing.

## Decision

**A sub-lane's branch reaches the remote exactly once**, at its layer's Gate 2, and never before its
own work is finished. The push is guarded on the branch being ahead of its base, **read from git** —
never inferred from the commit list the writers reported, which is what they claimed rather than what
the branch holds.

**Per-commit push is not to be re-proposed.**

## Why it cannot be built

The whole commit loop runs inside a **single workflow call**, and a workflow script has no shell. The
host's first control point is that call returning — by which time every commit in the sub-lane has
already been made. There is no moment between two commits at which the host exists to push.

Reaching one would mean one of two things, and the pipeline forbids both:

- **Change the writer's contract so it pushes.** The writer never pushes. Making it push puts a
  network operation, an authentication surface and a rejected-push failure mode inside the agent that
  is also editing code, and gives the pipeline two writers to the remote instead of one.
- **Spend an agent invocation on one git command.** The skill's hard rules forbid this in terms:
  never run agents for work one Bash command does. It is also the most expensive way in the pipeline
  to run `git push`.

## Why it buys nothing

**Nothing in the pipeline consumes an intermediate push.** The reviewer diffs local refs. The suite
gate runs in the worktree. The commit-breakdown check compares two lists the host already holds. No
stage looks at the remote.

So the only consumer would be the repository's own push-triggered CI — run against a branch the
pipeline is still committing to. That is a CI run whose result is stale before it finishes, on a
branch that will move again in a minute, and whose red result the pipeline would have no stage to
route anywhere. The suite gate already runs the repository's own suite once, at the end, inside the
sub-lane's worktree, which is the same signal arriving when it can still be acted on.

## What is actually lost, and where it goes instead

A session that dies mid-lane leaves its commits only in the worktree. That is real, and it is covered
elsewhere rather than here:

- the **worktree is kept** whenever a push did not succeed, so the commits exist on the machine;
- `/dev-loop <n>` **re-derives from artifacts**, finds those commits in the branch's git log, and
  resumes from the remainder;
- the give-up clause commits abandoned work as a `wip:` commit, so an ended sub-lane almost always
  has something ahead of its base to push when it does reach Gate 2.

## Considered options

**One workflow call per commit, so the host regains control between them.** Rejected: it turns one
call per lane into one per commit, and each call carries its own startup and its own concurrency slot.
It also breaks the sub-lane's stage ordering, because the review loop and suite gate are defined over
the finished range.

**Push from the writer.** Rejected above — two writers to the remote, and a rejected push handled by
an agent that has no way to reason about whose history is the keeper.

**A background push after each writer return, from the host.** There is no host turn to run it in.
This is the same wall the first paragraph names.

## Consequences

- A batch holds the first-finished sub-lane's pull request until the slowest sub-lane of that layer
  ends. Recorded as an accepted cost rather than solved: the alternative considered was one workflow
  call per lane launched in the background, which buys per-lane immediacy at the cost of the host
  juggling several background tasks, each carrying its own concurrency cap independently.
- Because the push happens once and is guarded on git's own answer, **a sub-lane that landed nothing
  opens no pull request at all** — the one ending in the pipeline with no pull request to carry its
  explanation, which is why that explanation is commented on the issue instead.
- A rejected push is reported, never retried harder, and never forced. See
  [ADR-0005](./0005-no-token-ceiling.md) for the neighbouring case of a guard that reports rather than
  enforces; the reasoning is the same shape.
