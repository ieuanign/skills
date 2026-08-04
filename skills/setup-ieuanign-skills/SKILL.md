---
name: setup-ieuanign-skills
description: Configure a repo for these skills — distil its CLAUDE.md files into docs/agents/coding-standards.md, and seed the workflow label vocabulary an unattended /dev-loop run reports through. Run once before first use of /code-review's Standards axis (and the reviewer agent that links it) or of /dev-loop auto.
disable-model-invocation: true
---

# Setup Ieuan's Skills

Two independent deliverables. Do both, or either alone if that is what the user asks for — neither
part depends on the other, and neither depends on `/mattpocock-skills:setup-matt-pocock-skills`
having run.

- **`docs/agents/coding-standards.md`** — the repo-tailored review rubric `/code-review`'s Standards
  axis reads instead of rediscovering conventions from scratch each run, and the `reviewer` agent
  `/dev-loop` dispatches reads as its own first standards source.
- **the Workflow roles section of `docs/agents/triage-labels.md`** — the label strings an unattended
  `/dev-loop auto` run resolves its three self-reporting roles through. Without them the run works
  and reports nothing, because a role with no string is skipped silently by design.

This is a prompt-driven skill, not a deterministic script. Explore, draft, stress-test with the user,
then write.

## Part 1 — the coding-standards rubric

### 1. Explore

Find every `CLAUDE.md` in the repo — the root, and any nested ones a multi-context repo splits by area (`backend/CLAUDE.md`, `frontend/CLAUDE.md`, etc.). Read all of them. Also check for `CODING_STANDARDS.md` / `CONTRIBUTING.md`.

Check whether `docs/agents/coding-standards.md` already exists. If it does, tell the user and ask whether to regenerate (CLAUDE.md may have changed since) or leave it alone — don't overwrite silently.

If `docs/agents/issue-tracker.md` is absent, mention once that `/mattpocock-skills:setup-matt-pocock-skills` sets up the rest of the `docs/agents` layout, then carry on. This skill doesn't depend on it and runs correctly either way.

### 2. Draft

Distil the CLAUDE.md content into a review rubric, one section per area (one section total for a single-context repo; one per context for a multi-context repo — mirror however the repo already splits its CLAUDE.md files). Per area:

- **Hard rules** — binding conventions the area's CLAUDE.md states as non-negotiable (e.g. "sqlmock is banned", "every form page MUST use react-hook-form"). Quote or closely paraphrase; a reviewer must be able to trace each rule back to its source file.
- **Smell-baseline overrides** — anywhere this repo's own pattern would otherwise trip one of `/code-review`'s twelve baseline smells (Mysterious Name, Duplicated Code, Feature Envy, Data Clumps, Primitive Obsession, Repeated Switches, Shotgun Surgery, Divergent Change, Speculative Generality, Message Chains, Middle Man, Refused Bequest). Name the smell and the repo pattern that suppresses it.

Use [coding-standards-template.md](./coding-standards-template.md) as the skeleton.

### 3. Stress-test

Before writing anything, run a `/grilling` session on the draft with the user — walk through each area's hard rules and smell overrides one at a time, resolve ambiguity, and cut anything that reads as a guess rather than something a CLAUDE.md actually says.

### 4. Write

Write `docs/agents/coding-standards.md`. If the repo already has a `## Agent skills` block in its `CLAUDE.md`/`AGENTS.md` (the convention `setup-matt-pocock-skills` established), add a one-line "Coding standards" entry pointing at it — otherwise leave that block alone; this skill doesn't create it on its own.

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

## Done

Tell the user what was written and which skills read it:

- `docs/agents/coding-standards.md` — `/code-review`'s Standards axis, and the `reviewer` agent
  `/dev-loop` dispatches. `CLAUDE.md` stays the binding source; this is a derived rubric that does
  not re-sync, so re-run this skill by hand if `CLAUDE.md` changes materially.
- `docs/agents/triage-labels.md`'s Workflow roles section — `/dev-loop auto`, and nothing else. A
  supervised `/dev-loop` writes no label, so a repo that never runs unattended needs none of it.

If Part 2 ran and the user declined the label creation, say plainly that the roles are mapped but the
labels do not exist yet, so an unattended run will report each failed write and carry on regardless.
