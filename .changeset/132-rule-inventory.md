---
"ieuanign-skills": patch
---

`docs/dev-loop-rule-inventory.md` records every normative statement in `/dev-loop`'s two large documents and assigns each exactly one destination in the structure that replaces them.

This is the prefactor for the host-load compression. `SKILL.md` and `contracts.md` between them carry 389 statements that bind behaviour — conditions the orchestrator evaluates, bounds, routes, endings, prohibitions, invariants — plus the rationale written to stop a past decision being re-litigated. Moving them is only provably lossless if something says in advance where each one goes: without it nobody can tell a rule that was deliberately deleted from one that was quietly lost, because both look identical in a diff that also relocates three hundred others.

Each entry carries enough of the original wording to stay recognisable after its source file changes, one destination drawn from the effort's own Destinations table, and the ticket that lands it. Later tickets tick entries; the final one verifies that every entry is ticked or explicitly marked dropped with a reason.

Two things fall out of writing it down. **Twenty-two entries are deleted rather than moved**, and they cluster into exactly three groups — Mode A and its vocabulary (seventeen), `contracts.md`'s claims about its own normativity (four), and the orchestrator's second read of the notifications specification (one). Nothing that binds a run's behaviour is deleted outside the first group, which is one recorded decision rather than a scatter. And **ADR numbering is reserved rather than sequential**: `0004` is spoken for by the Mode A deletion, which lands after the rationale extraction, so the rationale ADRs take `0005`–`0008` and a reader who sees `0005` land first has somewhere to read why.

No skill, agent or phase script is modified.
