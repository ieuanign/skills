---
"ieuanign-skills": minor
---

Roster: every agent's return now carries a budget that constrains its **form**, not its length.

Each roster agent ended its contract with an open-ended instruction — `code-writer` said "Then bullets:", `debugger` said "Then prose:", `reviewer` said "Then `NOTES:`". Only the architect gave a count. A model handed "then prose" with no budget writes to the length the task feels to deserve, which is always long. Unattended that prose is spent for nothing: the orchestrator routes on the machine-readable leading lines and the bullets, and no human is there to skim past the rest.

**A word or bullet cap is the wrong instrument.** It forces the model to choose which facts to sacrifice, and it reliably keeps the narrative and drops the specifics, because narrative reads as "the answer" and specifics read as "detail". The instrument used instead is the one already proven in this repo — the reviewer's finding line, whose slots leave nowhere to put filler and which nobody ever had to cap. Bullets fill slots: `<what> — <where: file:line, path, or command> — <so what: the consequence, or the next action it enables>`. A bullet missing `where` is an unevidenced claim; one missing `so what` is something nobody can act on.

**The compression direction is stated explicitly, and that clause is what keeps this from degrading into meaning loss.** Terse instructions cause models to compress by *summarising* — abstracting specifics into smooth sentences. So the budget names which way to cut: delete sentences, never facts; keep paths, line numbers, shas, exact commands, error strings, counts and names verbatim; cut the prose around them. The filler ban names concrete patterns rather than saying "be concise" — preamble, restating the input, narrating the order you worked in, what went well, and any closing summary. The test is not length: if the orchestrator's next action is identical with and without a sentence, it is not information.

Two agents take a variant. The **debugger**'s return ends in an evidence chain that is genuinely sequential and does not decompose into slots — it keeps prose and is governed by the cut test alone, with the steps that establish the mechanism named as payload so the filler ban never eats them. The **architect** keeps its existing 3–5 bullet summary and gains the compression direction and the filler ban; the count is framed as a shape rather than a limit, so it never reads as a licence to drop a fact, and open questions are exempt from compression entirely.

No machine-readable leading line changes. `contracts.md` is untouched by design: the keys are the contract, and this governs only the prose after them.
