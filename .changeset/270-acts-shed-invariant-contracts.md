---
"ieuanign-skills": patch
---

`/dev-loop`'s Act 3 splits the way its Gate 2 already has: `acts/act-3.md` keeps what a layer
performs, a new `acts/act-3-contract.md` holds the material that cannot vary between layers, and
`acts/act-2.md` sheds its vocabulary to the spine.

Both act files are re-read at EVERY layer, and both opened with material identical on the second read
and every one after. `acts/act-3.md` was 5,507 bytes, most of it restating `phase-execute.js`'s
argument contract, the script's own behaviour, the shape of its results, and a lane-building rule it
itself called "decided ONCE per run"; `acts/act-2.md` was 1,698, opening with the layer-versus-stack
vocabulary and the layer-numbering rule the spine already half-stated. The pair is now **2,448 bytes**,
down from 7,205.

**Moved to `acts/act-3-contract.md`** — 4,596 bytes, read at the run's FIRST Act 3 and re-read at any
later layer where the orchestrator no longer holds it: every argument key's contract with its
absent-key default, the ones that fail silently included — `skillDir` omitted dispatches no notifier,
`agentNamespace` omitted where the roster IS namespaced fails every dispatch in the phase, a `none` or
omitted `suiteCommand` leaves every sub-lane's suite not run — plus the lane and sub-lane shapes, the
`commits` and `ownedCriteria` build rules with the once-per-run allocation and its last-in-plan-order
fallback, the phase script's behaviour, the two ending labels, the per-lane `crashed` and `notified`
flags with `notified`'s carry-forward across layers, the per-sub-lane `terminal`, and the
commit-breakdown check.

**Kept in `acts/act-3.md`**: the invocation with its seven-key `args` list, the pointer to the contract
file, the one argument fact that does vary by layer — `subLanes` holds only THIS layer's sub-lanes —
the per-layer transcript KEEP, and the between-layers transition whole.

**Folded into the spine**: the layer/stack distinction and the layer-numbering rule are stated once, in
`SKILL.md`'s per-LAYER lead-in, where the provisioning-order sentence they qualify already sat;
`acts/act-2.md` keeps neither and is down to its three provisioning steps. `SKILL.md`'s Act 3 bullet
names the contract file and its read-once rule in the same shape as the Gate 2 bullet's, and
`notifications.md`'s two citations of the ending labels follow them to their new file.

Nothing is deleted: every key, default, shape and rule is in one file or another. No pipeline
behaviour, argument or gate changes — only which file states a rule, and when it is read.
