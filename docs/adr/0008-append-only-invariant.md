# 0008 — The append-only invariant, and why a verdict never reaches the checklist

**Status**: accepted, and implemented — the invariant is a Hard rule in `SKILL.md`; this record carries
the reasoning that used to sit beside it in `contracts.md`.

The pipeline writes to artifacts a human owns. It comments on issues, opens pull requests, and moves
labels, and it does all of that unattended, on issues nobody is watching. The rule that keeps it safe
is short enough to state as a Hard rule, and the reasoning behind two of its clauses is not — so the
rule stays in the skill and the reasoning comes here.

## Decision

**The run may append. It may not edit.** Concretely, it may:

- append to issues and pull requests (`gh issue comment`, `gh pr comment`);
- add and remove **its own workflow labels**, and no others;
- set state only on artifacts **it created** — its own branches, its own pull requests, its own plan
  files.

And it never edits an issue body, never ticks an acceptance-criteria checkbox, and never converts a
pull request a human opened.

**The invariant binds the host and every agent.** There is no ending, no ceiling, and no absent human
that relaxes it — which matters precisely because the unattended run is the one with nobody to catch a
violation.

## Why the label clause sits inside the invariant rather than beside it

Moving a label is, mechanically, an edit to something the run did not create: the issue. That looks
like a violation of the rule it sits inside, and the temptation is to carve it out as an exception.

It is not an exception, because of what the invariant actually guards. **A label add or remove
destroys nothing a human authored** — no sentence, no checkbox, no decision. Human intent is what the
invariant protects, and a label carries none of it; it is triage state, which is what the workflow
label family exists to be. The run also touches only labels it owns, so it cannot clobber a human's
triage either.

Stating it as a carve-out would have invited the next one. Stating it as a case the rule already covers
keeps the rule readable as a single sentence: *destroy nothing a human wrote.*

## Why per-criterion verdicts are never written back to the checklist

The reviewer returns a `met` / `partial` / `not-met` verdict per acceptance criterion. The issue body
has a `- [ ]` checklist of those same criteria. Ticking them looks like free value — the run knows the
answer, and the checklist is where a human would look for it.

Three reasons it does not, each sufficient on its own:

- **The closing keyword already does the job, at the right time.** The first sub-lane's pull request
  body carries `Closes #<n>`, so the issue closes on merge. Ticking boxes ahead of that reports
  completion the merge has not yet conferred.
- **The aggregate belongs to the pull request's state, not the issue's.** A verdict is a claim about a
  diff — which criteria *this* sub-lane's range demonstrates. It is scoped to a pull request and is
  published in one, beside the diff that justifies it. The whole-issue roll-up on the last sub-lane's
  body is where the aggregate lands, for the same reason.
- **An issue body is the one artifact a human wrote by hand.** Everything else the pipeline touches it
  either created or merely appended to. The issue body is the input, and a pipeline that rewrites its
  own input is one whose runs are no longer reproducible from what a human typed.

So verdicts are **reported and never inert**: they reach Gate 2, the pull request body, and the
terminal-state table, which drafts a pull request on any verdict that is not `met`. What they never
reach is the checklist.

## Consequences

- **A human reading the issue sees what they wrote.** The pipeline's opinion of it is one click away,
  in the pull request, next to the evidence.
- **The unattended run needs no extra guard.** Nothing in the invariant is conditioned on a human being
  present, so there is no branch that could be wrong when nobody is.
- **A verdict influencing state is fine; a verdict writing state is not.** The terminal-state table
  reads verdicts to decide draft-versus-ready, which is state on a pull request the run created. That
  is inside the rule, not an exception to it.
