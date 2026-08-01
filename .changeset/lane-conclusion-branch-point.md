---
"ieuanign-skills": minor
---

dev-loop: `contracts.md` is restructured so the two execution modes diverge in exactly one place. The review loop becomes mode-neutral — it now states only that contested findings and an exhausted fix-cycle bound each yield `UNRESOLVED`, and no longer names Gate 2, human arbitration, or what happens afterwards. A new **Lane conclusion** section takes over that ground as the file's single branch point: the gated half describes human arbitration of contested findings and push/PR approval, and the unattended half names the terminal-state table and notifications as its governing rules, so the work that fills it adds to one section instead of restructuring around it.

Everything else stays single-version — roles, return contracts, the per-commit loop and its bound, the review loop and its bound, terminal categories, the findings ledger, sequencing, and the mode implementations. The ledger keeps its four categories, with **arbitrated** documented as always empty under unattended mode rather than made conditional. The direct-orchestration mode implements the gated half only and never the unattended half, so that block has exactly one implementation and the "edit the contract first, then both implementations in the same change" rule stays cheap to honour. No behaviour change — the gated mode behaves exactly as before.
