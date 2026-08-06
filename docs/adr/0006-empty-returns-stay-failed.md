# 0006 — An empty return is reported as an empty return, and its ending stays `FAILED`

**Status**: accepted, and implemented — `phase-execute.js` routes every empty return through one
helper, and the state-machine harness asserts that no ending produced by one claims an agent died.

A stage that comes back with nothing is the commonest non-code failure in the pipeline, and there are
two separate temptations about it. The first is to **describe** it as a death — "the reviewer died" —
which is a stronger claim than the pipeline can make. The second is to **reclassify** it, on the
grounds that a transport timeout is not really a failure of the work. Both have been proposed; both
are refused here.

## Decision

**A stage that returned nothing is reported as exactly that, and never as an agent that died.** Every
such ending says the stage returned nothing and that it was skipped or died after the runner's
retries — one wording, used by every stage and by the lane-level empty result, so one condition speaks
with one voice.

**The ending label stays `FAILED`.** There is no new label, no classification stage, and no agent
dispatched to adjudicate a transport failure it could not reproduce.

## Why not assert a death

From where the pipeline sits the two cases are **indistinguishable**. An agent skipped mid-run and an
agent dead after the runner's own retries both resolve the call to nothing, and nothing is the whole
of what the script sees. Asserting a death sends the reader looking for a crash that may never have
happened.

It is the same restraint the crash handler already shows. A genuinely dead agent frequently throws a
value carrying neither a message nor a stack, so the crash reason promises a trace only where one
exists — a reason reading `stack trace: undefined` sends a human looking for something that never
existed.

## Why the label stays `FAILED`

`HALT` and `FAILED` are selected by exactly one question: **did something deliberately stop, or did
something break?** `FAILED` answers a narrower question than "was this bad" — it answers *is this
worth retrying?*, and a transport break is that question's clearest affirmative.

Calling it a `HALT` would assert that something deliberately stopped, which is the one thing here
known **not** to have happened.

A third label was proposed and refused. It would have to be selected by a stage that could tell a
timeout from a refusal, which is the distinction the pipeline has just established it cannot make —
so the label would be decided by a guess, and the guess would then decide nothing, because
[nothing in the pipeline branches on the ending label at all](./0002-review-loop-progress-sensitive-bound.md).
A vocabulary that costs a judgement and buys no behaviour is a vocabulary to not have.

## A lane that throws is the same rule reaching the case it did not cover

A terminal error can **reject** the call rather than return nothing, which unwinds the whole lane. So
each lane's work is wrapped once, and a throw is caught and turned into a `FAILED` ending naming the
issue and carrying the error message plus its stack trace where one exists.

One catch, at one place, covers every ending site — threading it through each site individually is how
they drift apart. The lane's partial sub-results come back with it, attempt log included, which is the
record most worth keeping from a lane that crashed mid-recovery; each unfinished sub-lane takes the
same ending, so it reaches the terminal-state table like any other row rather than meeting the
conclusion as a record with no `terminal`.

Before the wrapper existed, a throw resolved the lane to nothing and the result filter dropped it —
so the issue vanished with no label, no comment and no record of which one it was. That is the failure
this decision is really about: not the wording, but a requested issue leaving the run untraceable.

## Considered options

**Say "the reviewer died".** Shorter, and true often enough. Rejected: it is a claim about a cause the
pipeline cannot observe, and it costs a reader a search for a crash that may not exist.

**A third ending label for transport failures.** Rejected above — it needs a distinction the pipeline
cannot draw, and buys no behaviour once drawn.

**Retry the stage once more inside the pipeline.** Rejected: the runner already retries, so this
retries a retry, and it does so inside a bound the retry does not consume — which turns a bounded loop
into one whose real bound is the product of two numbers nobody wrote down.

## Consequences

- The architect is the one role that runs before any sub-lane exists, so **an architect that returned
  nothing is reported at Gate 1 with a re-run offer** rather than ending a sub-lane. A requested issue
  is never silently dropped.
- Every stage's empty-return ending, the lane-level empty result, and the runner dropping a lane
  entirely all use the same sentence. A reader who learns it once reads all three.
- The wording is deliberately unexciting, and that is the point: an ending that names a cause it
  guessed at is worse than one that names only what was seen.
