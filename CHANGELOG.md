# ieuanign-skills

## 0.4.0

### Minor Changes

- [#44](https://github.com/ieuanign/skills/pull/44) [`7e6e8d7`](https://github.com/ieuanign/skills/commit/7e6e8d72338aa579e9708393846fb657b6575968) Thanks [@ieuanign](https://github.com/ieuanign)! - `dev-loop`: `notifications.md` — one normative specification for everything an unattended run writes to the outside world, implemented by both writers that emit it.

  An unattended run has two of them: the host, at its own boundaries, and a notifier subagent, from inside a running phase script — and nothing kept the two in step. `contracts.md` had left the space open ("Both are specified separately; this is the section they fill"). It is now filled by a document rather than a copy: the event table with the writer owning each event, the label roles and the one question that selects one, the message and comment formats, the channel contract, the ordering guarantees, and the hazards recorded rather than solved. Nothing in it fires in gated mode, stated once and nowhere repeated.

  The scoping rule behind the writer column is recorded so nobody re-derives it — the notifier owns only what the host cannot see. A workflow script has no shell, so the host is blind while one runs and a mid-lane event has no other writer; everything at a host boundary is a host command. Routing every event through the notifier was rejected: it spends an agent to run one command.

  Label roles only, never label strings — each resolves through the consuming repository's triage-label documentation, so a repository keeps its own vocabulary. Two properties fall out of the selecting question rather than being designed in: failed is always a crash and never a verdict, which is what makes it answer _is this worth retrying?_, and every draft-PR case is host-applied while every halt case is notifier-applied.

  `contracts.md`'s unattended paragraph now points at the new file and states which of the two documents governs what, and its append-only invariant records why writing labels to an issue a human filed is inside it: a label add or remove is additive and reversible, and human intent is what the invariant guards. No behaviour ships — every event in the table is implemented by a later change.

- [#44](https://github.com/ieuanign/skills/pull/44) [`7e6e8d7`](https://github.com/ieuanign/skills/commit/7e6e8d72338aa579e9708393846fb657b6575968) Thanks [@ieuanign](https://github.com/ieuanign)! - `dev-loop`: the reviewer now checks the work against the issue, not just against the plan.

  Nothing in the pipeline had ever compared the diff to the request. The reviewer saw only the plan — a faithful distillation is still a proxy — and its own text justified skipping a spec check on the grounds that a later conformance sign-off covered it. That sign-off never read the issue either, and it no longer runs.

  The reviewer now receives the originating issue's body in its arguments, fenced, and returns a `met` / `partial` / `not-met` verdict per acceptance criterion with the evidence for each. It is passed the body rather than an issue number, so its Bash stays read-only and git-only. The spec report brief is inlined in the agent definition, the same way the standards one is.

  A review's range is one sub-lane while the criteria belong to the whole issue, so the reviewer is told which sub-lane it is judging: a criterion the plan delivers in a different sub-lane is `partial`, naming that sub-lane, never `not-met`. Otherwise every early PR of a multi-PR plan would read as failing work that was not yet due.

  **Spec verdicts never block, by construction.** They stay out of `FINDINGS`, never change the `VERDICT`, never trigger a fix cycle and never end a lane — a review with zero blocking findings and a not-met criterion is `APPROVED`. The writer is plan-bound and returns BLOCKED rather than improvise, and the architect, the only agent that could re-decide a plan, does not run again in the lane; a blocking spec finding would demand a fix nobody available could make. The verdicts route to the findings ledger, then to the per-lane report at Gate 2 and an **Acceptance criteria** section in the PR body, in front of the human who merges.

  `contracts.md` gains the per-stage context contract — what each stage receives, what it is permitted to read, and what it returns — with the reviewer's row stating the issue body in and the criterion verdicts out.

### Patch Changes

- [#44](https://github.com/ieuanign/skills/pull/44) [`7e6e8d7`](https://github.com/ieuanign/skills/commit/7e6e8d72338aa579e9708393846fb657b6575968) Thanks [@ieuanign](https://github.com/ieuanign)! - `dev-loop`: the plan's summary bullets reach the PR body's Context section, and the run is explicitly append-only.

  The architect's summary bullets had exactly one consumer — the plan-approval gate. Suppress that gate and the orientation it produced was thrown away. Phase A is now told to keep them for the rest of the run, and Gate 2 places them in the PR body's **Context** section beside the planned-versus-made commit counts already there.

  The second half fixes what the run is allowed to write, now that per-criterion verdicts exist to tempt it. Stated in `SKILL.md` and in `contracts.md` where it governs both execution modes: the run appends to issues and pull requests, adds and removes only its own workflow labels, and sets state only on artifacts it created. It never edits an issue body, never ticks an acceptance-criteria checkbox, and never converts a pull request a human opened. Verdicts are reported — at the lane's conclusion and in the PR body — and never written back to the issue's checklist: the closing keyword closes the issue on merge regardless, and the aggregate verdict belongs to the pull request's own state.

- [#44](https://github.com/ieuanign/skills/pull/44) [`7e6e8d7`](https://github.com/ieuanign/skills/commit/7e6e8d72338aa579e9708393846fb657b6575968) Thanks [@ieuanign](https://github.com/ieuanign)! - `dev-loop` roster: the `code-writer` no longer looks for stack gotchas or lint/test commands in `docs/agents/*`, and the architect is told its Hard constraints section is the writer's only channel to project rules.

  `docs/agents/` holds the issue-tracker workflow, triage labels, domain docs, the dev-loop repo profile, and the coding-standards rubric — none of which is a stack gotcha or a module's test command. The writer was told otherwise in three places: its repo-facts rule, its verification-command resolution order, and its Stack notes section. All three now name the real sources — the repo's CLAUDE.md layer, the plan's Test expectations and Hard constraints, and the touched module's own manifests.

  That leaves the plan as the writer's only channel to project rules, with no fallback: context documents and decision records are swept by the architect alone, and neither the writer nor the reviewer ever opens them. The plan template's Hard constraints section now says so, so the architect states a rule rather than citing a document the writer cannot read.

## 0.3.0

### Minor Changes

- [#40](https://github.com/ieuanign/skills/pull/40) [`37fa2e0`](https://github.com/ieuanign/skills/commit/37fa2e0e095ed243c820f27b40b73e35d7a44392) Thanks [@ieuanign](https://github.com/ieuanign)! - The `dev-loop` roster ships as plugin agents, and its skill preloads now resolve.

  `skills:` in a subagent's frontmatter is a **preload** — it injects the skill body at agent startup, and a name that doesn't resolve is skipped with only a debug-log warning. All three roster preloads were silently dead: `code-writer`'s `tdd` and `debugger`'s `diagnosing-bugs` exist bare only on the npx path, and `reviewer`'s `code-review` pointed at the bundled skill, which sets `disable-model-invocation` and is unpreloadable by rule. None of the three has the `Skill` tool, so preload was their only channel.

  What changed:

  - The roster moved from `skills/dev-loop/agents/` to `agents/` at the plugin root, where it installs with the plugin. `/dev-loop`'s Act 0 no longer checks for or copies roster members into your repo.
  - `code-writer` and `debugger` preload `mattpocock-skills:tdd` and `mattpocock-skills:diagnosing-bugs` — namespaced, so they resolve on the plugin path.
  - `reviewer` carries no preload at all. Its Standards axis is now self-contained (standards-source discovery plus the twelve-smell baseline), and it runs on a more capable model at high reasoning effort.
  - The marketplace declares `mattpocock-skills` as a cross-marketplace dependency, so installing this plugin pulls Matt's in automatically. The prerequisite is enforced rather than documented.
  - `npx skills add` is now best-effort: it installs the skills but not the roster agents, and the namespaced preloads don't resolve on that path. Use the plugin install.

  **Migration.** If you ran `/dev-loop` before this release, it copied the roster into your repo. Those copies are now stale and shadow nothing useful — delete them:

  ```bash
  rm .claude/agents/{architecture-engineer,code-writer,debugger,reviewer}.md
  ```

### Patch Changes

- [#40](https://github.com/ieuanign/skills/pull/40) [`37fa2e0`](https://github.com/ieuanign/skills/commit/37fa2e0e095ed243c820f27b40b73e35d7a44392) Thanks [@ieuanign](https://github.com/ieuanign)! - `dev-loop`: Act 2's `.worktreeinclude` copy step now says to strip the trailing slash off directory entries before copying.

  `git ls-files --directory` collapses a fully-ignored directory to a single entry ending in `/`, and `cp -R dir/ dest/` copies that directory's _contents_ rather than the directory itself — so anything provisioned this way landed one level too high, scattered directly into the worktree's `.claude/` instead of `.claude/agents/` and `.claude/skills/`. Silent: the copy reports success and the files exist, just at the wrong path.

## 0.2.2

### Patch Changes

- [#37](https://github.com/ieuanign/skills/pull/37) [`413a820`](https://github.com/ieuanign/skills/commit/413a820aa08ff482b02112d87e2815a62a302b8e) Thanks [@ieuanign](https://github.com/ieuanign)! - `/dev-loop`: worktrees move to `.claude/worktrees/`, and provisioning stops copying `.claude` into them.

  Act 2 copied `<MAIN>/.claude` into every lane worktree, justified as "the CLAUDE.md layer must exist in the worktree". That justification was wrong twice over: `CLAUDE.md` is a tracked root file the checkout already delivers, and `.claude/` is a different thing entirely. Nothing needed the copy — the agents are Agent-tool subagents of a session rooted in MAIN, so their definitions, skills, settings, and permissions resolve from MAIN's config regardless of which directory they `cd` into, and no bundled agent or phase script references `.claude/` at all.

  What the copy did do was inject files that are untracked in the worktree. In a repo that neither tracks nor gitignores `.claude/` — the default state after a first run, since Act 0 creates the roster there — Gate 2's `git worktree remove`, forbidden from using `--force`, then refused on every lane. Worktrees accumulated and the closing guarantee that a fully approved run leaves only the main worktree was false. Deleting the copy removes the cause: a worktree now holds the checkout plus declared `.worktreeinclude` files, nothing else.

  Worktrees also move from `.scratch/worktrees/` to `.claude/worktrees/`, matching where Claude Code's own worktrees live, with a precondition that the path is gitignored so a live worktree never pollutes MAIN's `git status`. `.scratch/` stays for plans. The `.worktreeinclude` guard line follows to `!.claude/worktrees/**`.

  `.worktreeinclude` guidance tightens to match what it is for: env files and local config a cold checkout cannot run without. Dependencies leave it — a copied `node_modules/` carries platform-specific native builds and drifts from the lockfile — and become a new **Setup command** profile key that Act 2 runs once per worktree. That keeps worktree lifecycle whole inside the orchestrator's acts, per the skill's own rule that provisioning is never agent work; the bundled agents are untouched.

  Verified across all three repo classes (gitignores `.claude/`, tracks `.claude/agents/`, neither): removal succeeds without `--force`, `.env` reaches the worktree, `node_modules` does not, and MAIN's `git status` stays clean with a live worktree.

## 0.2.1

### Patch Changes

- [#34](https://github.com/ieuanign/skills/pull/34) [`bac71bc`](https://github.com/ieuanign/skills/commit/bac71bc6b20c42ca95ec432dc87953b1fe20229a) Thanks [@ieuanign](https://github.com/ieuanign)! - Maintainer tooling: `.claude-plugin/plugin.json` now tracks `package.json`'s version automatically. `changeset version` bumps only `package.json` and has no knowledge of the plugin manifest, so every release PR arrived with the two out of sync and had to be corrected by hand — and `claude plugin validate --strict` passes that state, so nothing caught it but a human remembering. The `version` script now chains `scripts/sync-plugin-version.sh`, which rewrites the version string in place (leaving the rest of the file byte-identical) and is a no-op when the two already agree. The release workflow calls `npm run version` so CI and a local run take the same path. The README's maintainer list gains it, plus `npm run check`, which was added without being documented there.

## 0.2.0

### Minor Changes

- [#20](https://github.com/ieuanign/skills/pull/20) [`cdc80d6`](https://github.com/ieuanign/skills/commit/cdc80d61f078458bbfab90a264323dc32e06bc37) Thanks [@ieuanign](https://github.com/ieuanign)! - dev-loop: the conformance sign-off stage is cut from both execution modes — a lane now runs plan → implement → review and ends there, three agent stages per sub-lane instead of four. All four of the stage's checks already happen elsewhere: approach-followed and hard constraints in the reviewer's own priorities, scope in its scope priority, and the commit breakdown in the host's plain-code comparison. What the stage uniquely added was the reviewer's deference to it, which was deference to a check that had already run, so the reviewer no longer defers to a later verdict and the writer no longer tells itself an architect reads its deviation lines.

  Gate 2 and the PR body lose only the sign-off verdict line: the commit list, deviation counts, and all four findings-ledger categories survive. Resume loses its sign-off marker — a lane whose commits are all present now resumes by re-running the review, which is safe and idempotent. The architect's Mode 2 conformance section stays in its agent definition for the separate orchestration system that still dispatches it; `/dev-loop` simply never calls it.

- [#20](https://github.com/ieuanign/skills/pull/20) [`cdc80d6`](https://github.com/ieuanign/skills/commit/cdc80d61f078458bbfab90a264323dc32e06bc37) Thanks [@ieuanign](https://github.com/ieuanign)! - dev-loop: the `architecture-engineer-lite` and `code-writer-lite` agent definitions are deleted, and the `lite` flag goes with them — out of the invocation grammar, the flag documentation, the hard rule forbidding its inference, the roster check, and both phase scripts' arguments. Each phase script now selects its agent type as a plain constant. The two files were byte-identical to their full counterparts below the frontmatter, differing only in a single effort value, and the flag fired zero times across three weeks of transcripts and every measured lane.

  Recorded as a consequence rather than left to be discovered: the direct-orchestration mode is now permanently tier-locked. Effort is settable only in agent frontmatter or in the workflow runner's per-call options, and the direct Agent tool has no effort parameter — so any future cost dial is workflow-mode-only by construction.

  A repo that already ran `/dev-loop` has inert copies of the two deleted files in its own `.claude/agents/`. Nothing dispatches them once this lands, and the roster check no longer requires or recreates them; delete them at your leisure.

- [#20](https://github.com/ieuanign/skills/pull/20) [`cdc80d6`](https://github.com/ieuanign/skills/commit/cdc80d61f078458bbfab90a264323dc32e06bc37) Thanks [@ieuanign](https://github.com/ieuanign)! - dev-loop: the single overloaded `HALT` splits into two terminal categories, named for what each does to the lane. **HALT** means the lane is dead — nothing reviewable exists, so no PR is created — and covers six endings: the debugger routing to `replan` or `user`, the per-commit debug+fix bound exhausted, the writer returning `BLOCKED`, any writer return other than `COMMITTED` after debug routing, the reviewer returning `ERROR` or dying, and a fix-cycle writer returning anything other than `COMMITTED`. **UNRESOLVED** means the code exists and is simply not clean, and covers the two endings where it does: contested findings the reviewer still confirms after re-verifying the writer's evidence, and the fix-cycle bound exhausted while the reviewer still requests changes. The distinction is whether reviewable code exists at the end, not severity.

  The reasons the pipeline reports now use the same two words, so a reported reason maps to a contract line without translation, and the orchestrator surfaces "the lane died" and "the lane finished with unresolved findings" as visibly different outcomes. Phase B's per-lane return carries `ending: {category, reason}` in place of the old `halted` string. No behaviour change — the same conditions end a lane, and both `UNRESOLVED` endings still land at Gate 2 exactly as they did.

- [#20](https://github.com/ieuanign/skills/pull/20) [`cdc80d6`](https://github.com/ieuanign/skills/commit/cdc80d61f078458bbfab90a264323dc32e06bc37) Thanks [@ieuanign](https://github.com/ieuanign)! - dev-loop: the host now compares the plan's commit ordinals against the commits the writers actually made, and reports the result as `<n> planned, <m> made`. It is a list diff in plain code over two lists the host already holds — the ordinals it passed in as arguments and the shas every writer return carried back — so no agent is dispatched to notice a plan that said three commits and produced seven. The counts surface at Gate 2 alongside the commit list and the findings ledger, and in the PR body's Context section. A mismatch never blocks: it does not halt the lane, does not trigger a fix cycle, and does not change the terminal state, because fix cycles legitimately append commits and a writer may legitimately split one.

- [#20](https://github.com/ieuanign/skills/pull/20) [`cdc80d6`](https://github.com/ieuanign/skills/commit/cdc80d61f078458bbfab90a264323dc32e06bc37) Thanks [@ieuanign](https://github.com/ieuanign)! - dev-loop: `contracts.md` is restructured so the two execution modes diverge in exactly one place. The review loop becomes mode-neutral — it now states only that contested findings and an exhausted fix-cycle bound each yield `UNRESOLVED`, and no longer names Gate 2, human arbitration, or what happens afterwards. A new **Lane conclusion** section takes over that ground as the file's single branch point: the gated half describes human arbitration of contested findings and push/PR approval, and the unattended half names the terminal-state table and notifications as its governing rules, so the work that fills it adds to one section instead of restructuring around it.

  Everything else stays single-version — roles, return contracts, the per-commit loop and its bound, the review loop and its bound, terminal categories, the findings ledger, sequencing, and the mode implementations. The ledger keeps its four categories, with **arbitrated** documented as always empty under unattended mode rather than made conditional. The direct-orchestration mode implements the gated half only and never the unattended half, so that block has exactly one implementation and the "edit the contract first, then both implementations in the same change" rule stays cheap to honour. No behaviour change — the gated mode behaves exactly as before.

- [#20](https://github.com/ieuanign/skills/pull/20) [`cdc80d6`](https://github.com/ieuanign/skills/commit/cdc80d61f078458bbfab90a264323dc32e06bc37) Thanks [@ieuanign](https://github.com/ieuanign)! - dev-loop: the `reviewer` now reads the plan's Approach and File touchpoints alongside the Hard constraints and Test expectations it already read, and reports approach drift as a named review priority — an implementation that reached the plan's outcome by a different design is visible instead of passing silently. Drift always routes to NOTES and never blocks: the architect is the only agent that could re-decide an approach and it does not run again in a lane, so a blocking drift finding would burn fix cycles on working, in-scope, tested code. Behaviour with no plan is unchanged, and the reviewer stays read-only.

- [`be38841`](https://github.com/ieuanign/skills/commit/be38841fda3cfddef43f54d4d58911bdd2f1bcb9) Thanks [@ieuanign](https://github.com/ieuanign)! - dev-loop: worktrees now live in `<MAIN>/.scratch/worktrees/`, and provisioning copy rules move from the repo profile into a root `.worktreeinclude` file (gitignore syntax — the same file Claude Code's native worktrees read). Act 0 creates it ask-then-persist, guards `.scratch/` in `.gitignore`, and keeps `!.scratch/**` as its last line so no copy mechanism — dev-loop's or Claude Code's native worktrees — clones `.scratch` contents into new worktrees; Act 2 fast-copies every match, retiring the node_modules special case and the disk warning. Migration is manual and one-time: finish or `git worktree remove` any trees under the old path, and fold any profile "Provisioning copy rules" into `.worktreeinclude`.

### Patch Changes

- [#29](https://github.com/ieuanign/skills/pull/29) [`8e48c52`](https://github.com/ieuanign/skills/commit/8e48c52ad735ef81d391fe441c722c79cc272687) Thanks [@ieuanign](https://github.com/ieuanign)! - Maintainer tooling: `npm run check` (`scripts/check.sh`) is now the repo's verification entry point, so the checks that catch breakage here no longer have to be remembered and typed by hand. Three checks, one readable line each, all of them run even when an earlier one fails: `claude plugin validate . --strict` (skipped with a notice, not a failure, when `claude` is not on PATH); a syntax check over every discovered `skills/**/phase-*.js`; and a `package.json` / `.claude-plugin/plugin.json` version-sync check. The phase-script check compiles each file as an async function over the Workflow globals rather than using `node --check` — the phase scripts are valid as neither CommonJS nor ESM, and `node --check` passes them even when they are broken.

## 0.1.0

### Minor Changes

- Initial release. Three add-on skills for [mattpocock/skills](https://github.com/mattpocock/skills):
  - **`dev-loop`** — an issue-to-PR pipeline that plans, implements, reviews, and signs off GitHub issues over a bundled custom agent roster (architecture-engineer, code-writer, reviewer, debugger + lite variants), each issue in its own git worktree.
  - **`code-review-mp`** — a two-axis (Standards + Spec) diff review in parallel sub-agents; the Standards-aware variant of Matt's `/code-review` that reads `docs/agents/coding-standards.md`. Coexists with Matt's `/code-review`.
  - **`setup-ieuanign-skills`** — scaffolds `docs/agents/coding-standards.md`, the repo-tailored review rubric the reviewer agent and code-review Standards axis read.
