# Classify dev-loop prose: check-pinned, script-enforced, or free (#235)

Section-by-section classification of `skills/dev-loop/SKILL.md` (397 lines) by compression fate.
Read against `scripts/check.sh`, `skills/dev-loop/phase-plan.js`, `phase-execute.js`,
`preconditions.mjs`, `scripts/state-machine.mjs`, `docs/dev-loop-internals.md`, and
`skills/dev-loop/notifications.md`.

Classes:

- **check-pinned** — a `check.sh` stage greps this prose or pins a script-and-prose pair; the prose
  moves only with its stage.
- **script-enforced** — restates behaviour `phase-plan.js` / `phase-execute.js` /
  `preconditions.mjs` already enforce mechanically (SKILL.md:8 itself: "The phase scripts enforce
  the pipeline's state machine … and you re-enforce none of it"). Shrinkable to one approach line.
- **contract** — only the orchestrator carries it at runtime (gates, ⟨notify⟩ boundaries, Workflow
  args, intake, push/PR/worktree bash). Must survive in some home.
- **free** — rationale, defensive repetition, or restatement of another section or of an existing
  home (`docs/dev-loop-internals.md`, `notifications.md`). Cuttable outright once the home is
  pointed at.

## Check stages that touch dev-loop SKILL.md prose

| Stage | check.sh | What it binds |
|---|---|---|
| **worktree removal guardrail** | check.sh:336-362 | The ONLY stage that greps dev-loop `SKILL.md` prose. Carrier detection `worktree remove +[^-\` ]` (check.sh:346) matches SKILL.md:309 (`git worktree remove <WORKTREES>/<slug>`) and SKILL.md:314; the required verbatim sentence `Worktree removal never passes --force.` (guard_phrase, check.sh:339) lives at SKILL.md:388. Pinned pair: carrier mention + that exact sentence. |
| **review-loop ceiling** | check.sh:252-287 | Pins a script-and-prose pair, but the prose page is `docs/dev-loop-internals.md`, NOT SKILL.md: CEILING_PAIRS (check.sh:284-287) binds `phase-execute.js` `const REVIEW_CEILING = 5` (phase-execute.js:63) to `hard ceiling of 5 fix cycles` (internals.md:197, :249). SKILL.md deliberately carries no number — "a hard ceiling the phase script holds" (SKILL.md:122, :171, :243) — so SKILL.md compression cannot break this stage, and must NOT introduce a number. |
| **roster skill preloads** | check.sh:27-95 | Declares itself the twin of Act 0's preload sub-step: "Its twin is the Act 0 intake sub-step of skills/dev-loop/SKILL.md … the two move together" (check.sh:38-40) → SKILL.md:137-139. A comment-level pin only — the stage reads `agents/*.md`, never SKILL.md text. The sub-step must survive, but its wording is free to change. |
| **dispatch argument keys** | check.sh:289-313 | Pins `skills/pr-comments/SKILL.md` only (`dispatch_skill`, check.sh:293). Dev-loop's own dispatch args (SKILL.md:179, :235) are NOT check-pinned — they are pure orchestrator contract with no mechanical guard. |
| **profile split** | check.sh:315-334 | Pins headings in `docs/agents/worktree.md` / `docs/agents/dev-loop.md` — the files SKILL.md:109-123 describes — never SKILL.md itself. |
| **dev-loop state machine** | check.sh:116-124 | Runs `scripts/state-machine.mjs` (832 lines) over `phase-execute.js`: the behavioural pin for everything SKILL.md:243 restates. Pins the script, not the prose — which is what licenses shrinking the prose. |

## Section-by-section classification

| Section | Lines | Class(es) | Evidence | Compression fate |
|---|---|---|---|---|
| frontmatter + `# /dev-loop` intro | 1-8 | contract | SKILL.md:8 states the division of labour and the enforcement claim ("you re-enforce none of it") — the approach line every script-enforced cut compresses TO | keep; this is the target shape |
| `## Arguments` | 10-17 | contract | intake parsing only the host does | keep |
| `### Run mode — gated or unattended` | 19-45 | contract, minor free | the four mode decisions (:23-29) and the unattended-answers table (:37-44) are gate behaviour only the host runs; defensive lines :31 ("the only place any of it is decided") and :33 repeat within the section | keep ~20 lines; trim ~7 defensive |
| `### How you write a ⟨notify⟩ event` | 47-77 | contract + free (duplicated home) | message shape + example block (:51-65) and "the reason stays" (:67) duplicate `notifications.md:73-90`, whose own text claims sole authority: "The shape is fixed here and nowhere else" (notifications.md:60) and "each implements this file rather than restating it" (notifications.md:3). Failure rule :69 = notifications.md:125. Commands :71-75 (label/comment/notify.sh mechanics) are host-only contract. :77 restates the preconditions rule (:29) and terminal-state consumption (script's, phase-execute.js:263-285) | contract must survive (~14 lines: the four events exist, the commands); the ~17 duplicated shape/format lines can collapse to a pointer at notifications.md — CAVEAT: SKILL.md:49 says the host "never load[s]" the notifier's spec, so pointing the host at notifications.md is a small design change, else the shape stays here |
| `## Derived facts` | 79-87 | contract | MAIN/REPO/DEFAULT/WORKTREES/RUN HANDLE/fast-copy — computed by the host, consumed by the host; runHandle passthrough is phase-execute.js:82 but derivation is host-only | keep |
| `## Where configuration lives` | 89-107 | free (policy/rationale) | nothing at runtime branches on it; the effort-tier half is already in internals.md:687-695 ("Where each stage's effort tier lives", "No per-repository effort tiers"); the homes rule is a maintainer's design rule | biggest pure cut: ~19 lines; move the homes rule to internals.md if kept at all |
| `## Repo profile` | 109-123 | contract + script-enforced | ask-then-persist + which-file-owns-which-key (:111-113) is host contract; the per-key default/refusal split is enforced by `preconditions.mjs:36-57` (CALLERS blocking/defaults: Setup command, Full-suite command, `.worktreeinclude` blocking; Branch template/PR title/PR body/Fix cycles defaulting) and rendered by preconditions.mjs:110-122; the Fix cycles arithmetic (:122) is enforced at phase-execute.js:58 + :452 and documented at internals.md:219-246 | keep ~8 lines of contract; shrink ~7 (per-key default values + counter arithmetic) to a pointer at preconditions.mjs / internals.md |
| `## Act 0 — Intake` | 125-175 | contract, some script-enforced + free | steps 1-8, 10 are host-only work (parse, Workflow-tool check :130-135, roster preloads :137-139 — check.sh:38-40's declared twin, gitignore probes :141-147, resume :160-163, asks :164-173, lane start :175). Script-enforced slice: the refusal's block semantics and exit codes (:149-155) are preconditions.mjs:110-139 (render blocks, exit 2 usage / 1 blocking / 0). Free: repeated "not a gate" (:168 repeats :29, :77, :385), instruction to restate the Fix cycles arithmetic (:171) whose substance lives at internals.md:224-246 | keep ~40; trim ~7 defensive repetition; ~4 lines about preconditions.mjs output shrink to "run it, report its blocks verbatim" |
| `## Act 1 — Phase A: plans` | 177-185 | contract + script-enforced | dispatch args `{issues, agentNamespace}` (:179) mirror phase-plan.js:8-11 — NOT check-pinned (dispatch-keys stage covers pr-comments only, check.sh:293); DIED wording (:179) restates phase-plan.js:43, :73, :81 verbatim; transcript-keep (:181) and summary-keep (:183) host contract; plan comment (:185) = notifications.md:56 event row | keep dispatch + keeps (~6); the DIED wording sentence (~2) is script-enforced restatement |
| `## Gate 1 — plan approval` | 187-221 | contract + free (internals overlap) | touchpoint intersection is the host's own work, no agent holds the inputs (SKILL.md:192, internals.md:639-642); the three-outcome table (:194-199), declaration table (:209-214), blocker comment (:204), multi-PR splitting (:219) — host contract; rationale lines (:201-202 "physically identical … differ only in what they claim", :215 "never declarable", defer rationale in :39) duplicate internals.md:637-682 (three outcomes, defer-absent reasoning, accepted costs) | keep ~24 operational; ~11 rationale lines already live in internals.md:637-682 |
| `## Act 2 — Provisioning` | 223-231 | contract | layer/stack definitions, `git worktree add` forms, `.worktreeinclude` copy mechanics, setup command — host bash only | keep |
| `## Act 3 — Phase B: execute` | 233-253 | contract + script-enforced | contract: dispatch args (:235, mirrors phase-execute.js:13-24 — unpinned by any check), lane/commit/ownedCriteria building (:237-241; "absent key = whole checklist" restates phase-execute.js:26-28, :192-201), transcripts (:245), reading `crashed`/`notified`/`terminal` (:247-249; produced at phase-execute.js:30-42, :263-285, :605-634), between-layers authorization (:253). Script-enforced: the full pipeline sentence (:243 — writer→debugger→reviewer→fix cycles→suite gate→endings, "the phase script holds every bound, route and ending") restates phase-execute.js:352-606 wholesale, behaviour-pinned by state-machine.mjs (check.sh:116-124) and documented at internals.md:144-439; commit-breakdown counts (:251) are computed in-script (phase-execute.js:229, :571, :579) | keep ~13 (args + input building + flag consumption); :243's ~7 lines are the canonical shrink-to-one-approach-line candidate — SKILL.md:8 already carries the line |
| `## Gate 2 — push & PR` | 255-358 | contract (dominant) + free (internals/notifications overlap) + check-pinned carrier | contract: push mechanics (:278), PR create + body-elements table (:279-297), worktree-removal procedure (:299-316), lane-conclusion labels/message (:318-329), stack-link procedure (:348-356), ended-sub-lane reporting (:358). Check-pinned: carrier mention `git worktree remove <WORKTREES>/<slug>` (:309, :314) pairs with the guard phrase at :388 (check.sh:339, :346). Script-enforced slices: ledger category CONTENT is rec fields (phase-execute.js:575-591); `terminal.pr` semantics (:279) re-derive phase-execute.js:263-285. Free overlap: ledger table framing (:259-271) ≈ internals.md:612-628; worktree-invariant rationale (:299-316 rationale halves) ≈ internals.md:510-551; label-role rule + crash/clean-draft cases (:320-327) duplicate notifications.md:28-51 (role table, "failed wins", host-labels-two-drafts); stack-link "Why" column (:331-346) ≈ internals.md:487-508 | keep ~70 operational lines; ~30 rationale/duplicate lines have existing homes; the two carrier lines move only with the guardrail stage |
| `## Act 4 — the cost log` | 360-381 | contract | host-only bash + cost-report.mjs invocation; `\|\| rm` rationale (:368-369), best-effort rule (:379) | keep ~18; ~4 lines trimmable |
| `## Hard rules` | 383-397 | contract + check-pinned + free | :388 IS the check-pinned sentence (`Worktree removal never passes --force.`, check.sh:339 — and :388 itself explains the deliberate triplication across the three worktree-removing skills); :387 append-only invariant is normative here (notifications.md:3 defers to SKILL.md for it); :389-391 push/removal rules = contract (rationale duplicated at internals.md:462-485); :385 re-litigates the gates/preconditions of :19-45 — defensive repetition; :393 no-token-ceiling ≈ internals.md:262-263; :397 portability restates the repo's own CLAUDE.md rule | keep ~10; :388 immovable verbatim; ~4 free |

## Counts per class (approximate lines of the 397)

- **check-pinned: ~5** — SKILL.md:388 (verbatim sentence), :309/:314 (carrier mentions), plus :137-139 as check.sh:38-40's comment-declared twin (must exist; wording free).
- **script-enforced: ~30** — :122 (fix-cycle counter), :149-155 slice (preconditions block semantics/exit codes), :179 slice (DIED wording), :239-241 slice (absent-key fallback), :243 (pipeline restatement), :249/:251 (terminal table, counts), :279 slice (terminal.pr re-derivation), preconditions defaults in :117-122.
- **orchestrator contract: ~250** — intake, gates, provisioning, dispatch args, push/PR/body elements, worktree procedure, notify boundaries, cost log.
- **free: ~95** — `## Where configuration lives` (~19), notify shape duplication (~17, home notifications.md:60-96), Gate 2 rationale overlap (~30, homes internals.md:487-551 + notifications.md:28-51), Gate 1 rationale (~11, home internals.md:637-682), defensive repetitions (~14: :31, :33, :45, :77, :168, :385, :393).
- **structure (frontmatter/blanks between sections): ~17.**

## Three biggest purely-free sections

1. **`## Where configuration lives` (SKILL.md:89-107, ~19 lines)** — design policy no runtime step
   branches on; the effort-tier half already lives at internals.md:687-695. Cuttable outright.
2. **⟨notify⟩ message shape + example block (SKILL.md:51-69, ~19 lines)** — duplicated at
   notifications.md:73-96, which states "The shape is fixed here and nowhere else"
   (notifications.md:60). Caveat: cutting requires the host to load notifications.md, which
   SKILL.md:49 currently forbids for the notifier's spec — a one-line design change either way.
3. **Gate 2 step 5 stack-linking "Why" column + rationale rows (SKILL.md:331-346, ~16 lines of
   rationale)** — every "why" is written out at internals.md:487-508; the operational rules
   (numbers-not-branches, no ready-for-review, no local state, the script call at :348-354)
   are the contract remainder.

Runner-up: the worktree-invariant and label-role rationale inside Gate 2 steps 3-4
(SKILL.md:299-329) — operational tables are contract, but their why-paragraphs duplicate
internals.md:510-551 and notifications.md:28-51 nearly clause for clause.
