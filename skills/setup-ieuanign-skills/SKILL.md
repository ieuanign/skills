---
name: setup-ieuanign-skills
description: Configure a repo for these skills — smell overrides, the workflow label vocabulary, the .claude/rules/ conventions, and the worktree profile an unattended run needs.
disable-model-invocation: true
---

# Setup Ieuan's Skills

Four independent parts. Run any one alone — no part depends on another, and none depends on
`/mattpocock-skills:setup-matt-pocock-skills` having run.

1. **Smell overrides** — the exceptions the `reviewer` agent and `/mattpocock-skills:code-review`'s
   Standards axis carry, so a finding the user rejected stops being filed.
2. **Workflow labels** — the strings an unattended `/dev-loop auto` run reports itself through.
3. **The `.claude/rules/` conventions** — how pull requests are separated, how stacked branches are
   rebased, how a worktree is removed, where a review finds the repo's standards, and the comment and
   scratch habits every session in the repo obeys.
4. **The worktree profile** — the `docs/agents/worktree.md` keys and the `.worktreeinclude` file an
   unattended `/dev-loop` or `/pr-comments` run refuses without.

**Every part explores, proposes, and writes only on an explicit yes.** All four mutate files the user
owns, so this holds without restatement below: a step that says "write" means write what was accepted.

## Where each thing goes — the uninstall test

One question places all four, and places anything added later: **would this still bind if the plugin
were uninstalled?** Yes → `CLAUDE.md`, `.claude/rules/`, or the repo root where the tool that reads it
looks for it. No, because it is meaningless without the plugin → `docs/agents/`. The same in every
repo → the skill itself. Varies by machine → nowhere; probe for it. Two corollaries follow, cited
below where they bite:

- **No derived copies** — nothing under `docs/agents/` restates a fact the repo states elsewhere.
- **No machine facts in git** — nothing that varies by machine enters a committed file.

## Part 1 — recording a smell override

**This part writes nothing on a first run, and that is not a gap.** There is nothing to record until a
review has actually filed a finding the user rejected. Say so in one line and move to Part 2.

Its real firing is later, when the user brings one back. `/dev-loop`'s Gate 2 ledger is where they
come from: findings the writer **disputed** and the reviewer retracted, and findings a human accepted
at arbitration. `/mattpocock-skills:code-review` produces them directly.

### 1. Get the finding

Ask for it verbatim — the smell it was filed as, the `file:line`, and what the code was actually
doing. A paraphrase is not enough: an override written against a misremembered finding suppresses
something nobody meant to suppress.

### 2. Grill it before writing it

Two questions, and both must survive:

- **Has this recurred?** One rejection is a one-off; the pattern is what earns a permanent
  suppression. If it has been rejected once, say so plainly and offer to wait for the second — a
  file of one-off exceptions blinds the reviewer to a whole smell class.
- **Is the deliberate thing the *pattern* or this *hunk*?** "Our phase scripts each restate the stage
  vocabulary because a phase script imports nothing, and a check compares the copies" is a pattern.
  "This particular function is fine" is not, and is not recordable.

Then check it belongs here at all. A rule the repo wants to *state* is a rule and goes to `CLAUDE.md`
or `.claude/rules/`; only an exception to the baseline belongs in this file. **No derived copies**
binds it: an entry that restates something the repo already says elsewhere is a copy, whatever it is
filed as.

### 3. Write

Use [smell-overrides-template.md](./smell-overrides-template.md) as the skeleton. Create
`docs/agents/smell-overrides.md` if absent, with the template's preamble; otherwise append the bullet
under the right area heading and touch nothing else. Add the area heading only when an entry needs it.

If the repo has a `## Agent skills` block in its `CLAUDE.md`/`AGENTS.md` (the convention
`setup-matt-pocock-skills` established) and the file was just created, add a one-line "Smell
overrides" entry pointing at it — otherwise leave that block alone; this skill doesn't create it.

If `docs/agents/issue-tracker.md` is absent, mention once that
`/mattpocock-skills:setup-matt-pocock-skills` sets up the rest of the `docs/agents` layout, then carry
on. This skill doesn't depend on it and runs correctly either way.

## Part 2 — the workflow label vocabulary

`/dev-loop auto` reports on itself through three label **roles** — `in-progress`, `awaiting-human`,
`failed` — resolving each to a string through the repo's `docs/agents/triage-labels.md`. A role that
file gives no string for is skipped silently, so in a repo nobody has set up an unattended run writes
no labels at all. This part is the shortcut for setting them up, and is only that: **when** each role
is applied, and why, belongs to `/dev-loop`'s `notifications.md`, which is cited as the source and
neither restated here nor copied into the file this writes.

### 1. Check what is there

- **`docs/agents/triage-labels.md`** — present or absent. Absent is the ordinary case, not an edge
  one: `setup-matt-pocock-skills` writes that file, and per that skill only when Matt's `triage` skill
  is installed. Never assume either ran.
- **An existing Workflow roles section**, if the file is there. If it has one, report it and leave it
  alone unless the user asks to regenerate.
- **The issue tracker** — from `docs/agents/issue-tracker.md` if it exists, else `git remote -v`.
  This decides step 4 and nothing else.

### 2. Agree the strings

The three roles are fixed; the pipeline names them and they are not the user's to rename. The strings
are entirely theirs. Offer the role names as the defaults, show them the table before anything is
written, and let them change any of them. A role they want no label for is a real answer — leave its
cell empty, and that role is skipped silently, which is a supported way to opt out of one.

### 3. Write

Substitute the agreed strings into [workflow-labels-template.md](./workflow-labels-template.md), then:

- **Append it as its own section, and never touch an existing triage table.** The two families are
  different kinds of label and the separation is the point: a triage label is a human classifying an
  issue before anyone works it, a workflow label is a run reporting where it got to, written and
  removed by the pipeline and never by hand. Folding them into one table invites someone to
  hand-apply `in-progress`, which is a live claim marker a separate orchestration system reads.
- **Create the file when it is absent**, with a `# Triage Labels` heading and a one-line preamble
  saying it maps role names to this tracker's label strings, then the Workflow roles section. Write
  no triage table — that one is `setup-matt-pocock-skills`'s, and a guess at it here is what that
  skill would later collide with. Match its shape so it can add its own table above this section.
- **Add a `### Triage labels` entry to the `## Agent skills` block** in whichever of
  `CLAUDE.md` / `AGENTS.md` carries it, in the shape `setup-matt-pocock-skills` establishes — the
  heading, a one-line summary of the label vocabulary, then `See docs/agents/triage-labels.md.` An
  entry that already exists is updated in place, never duplicated. If there is no `## Agent skills`
  block at all, leave it alone and say once that `setup-matt-pocock-skills` creates it — same posture
  as Part 1, and nothing breaks meanwhile, since every reader of this file opens it by path.

### 4. Offer to create the labels — and only offer

A mapping to a label the tracker does not have is a `gh` error on every write. The run survives it —
`notifications.md` makes every notification failure non-fatal — but it reports nothing, which is the
state this part exists to fix. So check, and offer.

**A GitHub tracker.** `gh label list --json name -q '.[].name'` says which of the agreed strings
already exist. Show the exact commands for the ones that do not, and run them **only on an explicit
yes** — creating a label mutates the user's repository, which is not something to do unprompted:

```bash
gh label create <in-progress string>    --color 1D76DB --description "An unattended /dev-loop run is working this issue"
gh label create <awaiting-human string> --color D93F0B --description "The run reached a conclusion someone must act on"
gh label create <failed string>         --color B60205 --description "A stage broke — a crash, not a verdict; a retry may work"
```

Skip any role the user left unmapped. Declining is a fine answer and the mapping still stands — the
file is written either way, and the labels can be created by hand at any time.

**Any other tracker.** Never run `gh`. Name the three roles with their agreed strings and say to
create the equivalents in whatever tracker it is; the mapping file is already written and correct.

## Part 3 — the `.claude/rules/` conventions

Six rules, each with a template in this folder. Propose them one at a time, in the order below. A
declined rule is a real answer: say nothing more about it.

Show each rule's full text before writing it. `.claude/rules/*.md` loads at launch with the same
priority as `.claude/CLAUDE.md` and reaches every custom subagent, so a rule written here binds
exactly as one written in `CLAUDE.md` — which is the point, and why the user reads it first.

An existing file with the same name is reported and left alone unless the user asks to regenerate.

### `pr-separation.md` — always propose

[pr-separation-template.md](./pr-separation-template.md). Three sections, and each needs an answer:

- **Order** — read the repo's own structure and propose the split you actually see (a migrations
  directory, a backend and a frontend package, a shared schema module). Never offer a generic chain
  the repo has no areas for.
- **Size** — offer **~45 changed files** as the starting number and say what it is: a review-attention
  limit to tune, not a law. Phrase it against the plan, never the diff — the template already does.
- **Overlapping changes** — the one genuinely open choice, so put it to the user with all three
  values and their costs. `additive` is the default and is what `/dev-loop` does today; `strict`
  serialises more and conflicts less; `parallel` keeps every lane in flight and hands the conflict to
  whoever merges second. Keep exactly one in the written file.

This file is read through two hooks the pipeline already has: the architect's, when it writes a plan's
commit and PR breakdown, and Gate 1's, when it decides which lanes run in parallel. Neither needs
configuring — both find it in context.

### `stacked-prs.md` — only where the extension is present

[stacked-prs-template.md](./stacked-prs-template.md). Probe with `gh stack --help`, which exits 0 when
installed and 1 when not, needs no authentication and makes no network call.

- **Present** → propose the rule.
- **Absent** → **print one line, persist nothing, move to the next rule**: that stacked batches chain
  their pull request bases by branch name and note it in the body regardless, and that
  `gh extension install <the gh-stack extension>` adds the recorded stack on top. That line is the
  whole response — **no machine facts in git** covers this exactly, so a teammate on a bare machine
  gets the silent no-op `/dev-loop` already gives them, and a committed answer would take it away.

### `code-comments.md` and `scratch-files.md` — always propose

[code-comments-template.md](./code-comments-template.md) and
[scratch-files-template.md](./scratch-files-template.md). Fixed text, two substitutions:

- the comment rule's `paths` globs, from the languages actually in the repo — this is the one rule
  worth scoping, so a docs-only session does not carry it;
- the scratch rule's directory, if the repo's is not `.scratch/`.

### `worktree-removal.md` — always propose

[worktree-removal-template.md](./worktree-removal-template.md). Fixed text, no substitutions: never
`git worktree remove --force`, because the refusal is the guard and what it guards exists in one copy.

`/dev-loop`, `/pr-comments` and `/dev-loop-cleanup` already hold this for the worktrees they create,
and it is still worth writing: none of them binds a human typing the command themselves, and in a repo
where setup ran but no plugin is installed this file is the only copy of the rule.

### `code-review.md` — always propose

[code-review-template.md](./code-review-template.md). Fixed text, no substitutions: the repo's
recorded smell overrides are a standards source that only subtracts, and a near-empty root `CLAUDE.md`
is not a repo without conventions. It goes in `.claude/rules/` rather than beside the file it names
because that is the only place a review session loads without a bespoke lookup.

Propose it whether or not Part 1 found anything to record. An absent overrides file is the ordinary
case, and this pointer is what makes one discoverable whenever it does appear.

## Part 4 — the worktree profile and `.worktreeinclude`

Three preconditions an unattended run cannot supply for itself sit outside everything Parts 1–3
write: the **Setup command** and **Full-suite command** keys of `docs/agents/worktree.md`, and
`.worktreeinclude` at the repo root. Missing any one of them, `/dev-loop auto` and `/pr-comments auto`
refuse at intake however well the other three parts ran. This part is the shortcut for supplying
them, and **Fix cycles** with them — that key defaults, so it blocks nothing, but skipping it writes
two of the file's three headings and hands the third back to a gated run. **When** a run reads each key, and what
it does with the value, belongs to `/dev-loop`'s `acts/act-0.md`, which is cited as the source and
neither restated here nor copied into the files this writes.

Placement is the uninstall test twice: the profile is meaningless without the plugin →
`docs/agents/`; `.worktreeinclude` binds Claude Code's native worktrees with no plugin installed →
the repo root.

### 1. Check what is there

- **`docs/agents/worktree.md`** — which of `## Setup command`, `## Full-suite command` and
  `## Fix cycles` already carry a non-blank line. Each key resolves against its own heading with no
  fallback, so report them one at a time: an answered key is left byte-for-byte alone and never
  re-asked, and the file is never regenerated.
- **`.worktreeinclude`** — present or absent. An existing one is reported as it stands and not
  rewritten, its last line included: `/dev-loop`'s Act 0 guarantees that line's position on every run
  of its own accord, so nothing is lost by leaving it.

### 2. Agree the values

One ask per **missing** key, each offering candidates read from the repo, each confirmed before
anything is written. **Configuration, never discovery**: a command nobody chose is never persisted,
because a wrong Full-suite command hands every later run a green-looking batch nothing tested.

- **Setup command** — candidates from what the repo actually shows: a committed lockfile and its
  package manager's clean-install command, a `setup` or `bootstrap` script.
- **Full-suite command** — candidates from a `test` or `check` script in the manifest, a Makefile
  target, or the CI config. Offer **`none`** as a real answer and say what it costs: every sub-lane's
  suite reports **not run**.
- **Fix cycles** — offer **`2`** as the default, a higher value, and **`0`**, which spends no fix
  cycle at all.

`none` and `0` are persisted answers like any other. A key left blank is not an answer — it is the
same missing precondition the run refused on.

### 3. `.worktreeinclude` — the candidates, and the last line

`git ls-files -oi --exclude-standard --directory` lists what the repo ignores; offer only what a cold
checkout cannot run without, which is env files and local config. Dependencies belong to the Setup
command however cheap a copy looks. **"None" is a real answer**: it writes a comment-only file, which
counts as answered.

Whatever is chosen, the file's **last** line is `!.claude/worktrees/**`, with one line above it saying
why — gitignore matching is last-match-wins, so only the final position reliably stops a copy
mechanism cloning existing worktrees into a new one.

### 4. Write

Use [worktree-profile-template.md](./worktree-profile-template.md) as the skeleton.

- **No profile** → create it from the template, every `<...>` slot carrying the agreed value. The
  precondition check judges presence and not value, so a slot left as it is answers a key with
  something nobody chose.
- **A profile with sections missing** → append only those, in the template's order, and touch nothing
  else.
- **`.worktreeinclude`** → write it only when absent.

Say once that both files must be committed — being tracked is what makes them the persistence, and
an unattended run reads them from a fresh checkout that carries nothing else.

## Done

Tell the user what was written and which skills read it:

- `docs/agents/smell-overrides.md` — the `reviewer` agent and `/mattpocock-skills:code-review`'s
  Standards axis. Only mention it if Part 1 actually wrote something; an absent file is the correct
  state of a repo where no finding has recurred, and reporting it as missing is what this part exists
  to stop.
- `docs/agents/triage-labels.md`'s Workflow roles section — `/dev-loop auto`, and nothing else. A
  supervised `/dev-loop` writes no label, so a repo that never runs unattended needs none of it.
- each `.claude/rules/` file written — in every session in the repo from the next one onward, plugin
  or no plugin; `pr-separation.md` additionally at `/dev-loop`'s plan and Gate 1 steps,
  `worktree-removal.md` by a human at a terminal, which no skill covers, and `code-review.md` by the
  `reviewer` agent and the code-review Standards axis. Name the ones the user declined too, so nothing
  looks written that is not.
- `docs/agents/worktree.md` and `.worktreeinclude` — `/dev-loop` and `/pr-comments`, both of which
  provision worktrees and read all three keys. Report a key the file already answered as left alone
  rather than as written.

If Part 2 ran and the user declined the label creation, say plainly that the roles are mapped but the
labels do not exist yet, so an unattended run will report each failed write and carry on regardless.

If Part 4 was declined, or left a key unanswered, say plainly that `/dev-loop auto` and
`/pr-comments auto` still refuse at intake naming each one, until a gated run of either supplies it by
hand.
