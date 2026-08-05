---
"ieuanign-skills": patch
---

A `/dev-loop` stage that returns nothing no longer produces an ending saying the agent "died".

From where the pipeline sits that was an assertion it could not support. An agent skipped mid-run and an agent dead after the runner's own retries both resolve the call to nothing, and nothing is the whole of what the script sees — so a developer triaging from a phone read "died" and went looking for a crash that may never have happened. Every such ending now says the stage **returned nothing, and that it was skipped or died after the runner's retries**, which is the wording a lane whose result came back empty already carried. One condition, one voice.

Seven sites: the writer on a plan commit, the debugger, the reviewer, a fix-cycle writer, the suite gate, the suite debugger, and a suite-fix writer — plus the architect's `DIED` summary in the planning phase, which said the same thing about the same observation.

**The ending label is unchanged, and `contracts.md` now records why so it is not re-proposed.** A transient break keeps **FAILED**, because that label answers exactly one question — *is this worth retrying?* — and a transport timeout is its clearest affirmative. No new label, no classification stage, and no agent dispatched to adjudicate a transport failure it could not reproduce. Calling it a halt would assert that something deliberately stopped, which is the one thing here known not to have happened.

The contract was edited first and both execution modes in the same change. A harness scenario drives all seven stages and asserts, for each, that the ending carries the shared sentence and that nothing in it claims a death.
