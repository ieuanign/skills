---
name: setup-ieuanign-skills
description: Configure a repo for these skills — record a rejected review finding as a smell override, seed the workflow label vocabulary an unattended /dev-loop run reports through, and propose the .claude/rules/ conventions the pipeline reads. Run before first use of /dev-loop auto, and again whenever a review finding is worth suppressing for good.
disable-model-invocation: true
---

# Setup Ieuan's Skills

Three independent deliverables. Do any one alone if that is what the user asks for — no part depends
on another, and none depends on `/mattpocock-skills:setup-matt-pocock-skills` having run.

- **`docs/agents/smell-overrides.md`** — the exceptions the `reviewer` agent and `/code-review-mp`'s
  Standards axis carry, so a finding the user has already rejected twice stops being filed. Written
  on demand from a real rejection, never at setup time.
- **the Workflow roles section of `docs/agents/triage-labels.md`** — the label strings an unattended
  `/dev-loop auto` run resolves its three self-reporting roles through. Without them the run works
  and reports nothing, because a role with no string is skipped silently by design.
- **the `.claude/rules/` conventions** — the binding rules `/dev-loop` reads through the hooks it
  already has: how pull requests are separated, how stacked branches are rebased, and the comment and
  scratch habits every session in the repo obeys.

One rule places all three, and places anything added later: **would this still bind if the plugin were
uninstalled?** Yes → `CLAUDE.md` and `.claude/rules/`. No, because it is meaningless without the
plugin → `docs/agents/`. The same in every repo → the skill itself. Varies by machine → nowhere; probe
for it. Two corollaries, cited below where they bite: nothing under `docs/agents/` may restate a fact
the repo states elsewhere, and no machine fact may enter a committed file.

This is a prompt-driven skill, not a deterministic script. Explore, propose, stress-test with the
user, then write. **Nothing here is written without an explicit yes** — every part of this skill
mutates files the user owns.

## Part 1 — recording a smell override

**This part writes nothing on a first run, and that is not a gap.** There is nothing to record until a
review has actually filed a finding the user rejected. Say so in one line and move to Part 2.

Its real firing is later, when the user brings one back. `/dev-loop`'s Gate 2 ledger is where they
come from: findings the writer **disputed** and the reviewer retracted, and findings a human accepted
at arbitration. `/code-review-mp` produces them directly.

### 1. Get the finding

Ask for it verbatim — the smell it was filed as, the `file:line`, and what the code was actually
doing. A paraphrase is not enough: an override written against a misremembered finding suppresses
something nobody meant to suppress.

### 2. Grill it before writing it

Two questions, and both must survive:

- **Has this recurred?** One rejection is a one-off; the pattern is what earns a permanent
  suppression. If it has been rejected once, say so plainly and offer to wait for the second — a
  file of one-off exceptions blinds the reviewer to a whole smell class.
- **Is the deliberate thing the *pattern* or this *hunk*?** "Our phase scripts restate the smell list
  in two places because one is an agent contract and one is a skill" is a pattern. "This particular
  function is fine" is not, and is not recordable.

Then check it does not belong in `CLAUDE.md` or `.claude/rules/` instead. A rule the repo wants to
*state* is a rule; only an exception to the baseline belongs here. Per the first corollary above,
nothing in this file may restate something already written elsewhere in the repo.

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
  alone unless the user asks to regenerate — the same treatment Part 1 gives an existing rubric.
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

Four rules, each with a template in this folder. Propose them one at a time, in the order below, and
write only what the user accepts. A declined rule is a real answer: say nothing more about it.

**These are binding rules in the user's own governance files, so they are proposed, never assumed.**
Show the full text before writing. `.claude/rules/*.md` loads at launch with the same priority as
`.claude/CLAUDE.md` and reaches every custom subagent, so a rule written here binds exactly as one
written in `CLAUDE.md` — which is the point, and why it is worth asking first.

Check what is already there before proposing anything: an existing file with the same name is
reported and left alone unless the user asks to regenerate, the same treatment Parts 1 and 2 give.

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
- **Absent** → **print one line and persist nothing**: that stacked batches will chain their pull
  request bases by branch name and note it in the body regardless, and that
  `gh extension install <the gh-stack extension>` adds the recorded stack. Do not ask, do not write a
  key anywhere, and do not offer to install it. Whether a machine has an extension is a per-machine
  fact, and the second corollary above keeps those out of committed files entirely — a teammate
  without it must get a silent no-op, which is already what `/dev-loop` gives them.

### `code-comments.md` and `scratch-files.md` — always propose

[code-comments-template.md](./code-comments-template.md) and
[scratch-files-template.md](./scratch-files-template.md). Fixed text, two substitutions:

- the comment rule's `paths` globs, from the languages actually in the repo — this is the one rule
  worth scoping, so a docs-only session does not carry it;
- the scratch rule's directory, if the repo's is not `.scratch/`.

## Done

Tell the user what was written and which skills read it:

- `docs/agents/smell-overrides.md` — the `reviewer` agent and `/code-review-mp`'s Standards axis. Only
  mention it if Part 1 actually wrote something; an absent file is the correct state of a repo where
  no finding has recurred, and reporting it as missing is what this part exists to stop.
- `docs/agents/triage-labels.md`'s Workflow roles section — `/dev-loop auto`, and nothing else. A
  supervised `/dev-loop` writes no label, so a repo that never runs unattended needs none of it.
- each `.claude/rules/` file written — in every session in the repo from the next one onward, plugin
  or no plugin, and `pr-separation.md` additionally at `/dev-loop`'s plan and Gate 1 steps. Name the
  ones the user declined too, so nothing looks written that is not.

If Part 2 ran and the user declined the label creation, say plainly that the roles are mapped but the
labels do not exist yet, so an unattended run will report each failed write and carry on regardless.
