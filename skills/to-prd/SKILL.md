---
name: to-prd
description: Writes, revises or checks a PRD — a non-technical product requirements document with stable REQ ids — on the issue tracker, synthesised from what the conversation already settled about a brief. Use to write a PRD, to revise an existing PRD, or to check a PRD against its checklist; also files the epic when a too-big brief was narrowed.
---

# to-prd — publish a PRD from a settled brief

Synthesis only: you write from what the conversation settled, with no interview and no stop for a person. Whatever the conversation left undecided goes under **Assumptions** as what you decided, or under **Left for the spec** when it is technical. A caller with no person present gets a finished PRD or a refusal that says why.

The issue tracker should be in your context, from the consuming repo's `docs/agents/issue-tracker.md`. If it is not, write nothing and return a refusal naming `/mattpocock-skills:setup-matt-pocock-skills`. The commands below are GitHub's, through `gh`; on another tracker, take the equivalent action its doc names.

## Pick the branch

- **Check** — you were asked to check a PRD. Go to [Check](#check).
- **Revise** — the conversation changes an open PRD, or you were asked to revise one. Go to [Revise](#revise). A change to a closed PRD goes to Write.
- **Write** — anything else. Go to [Write](#write).

Done when one branch is chosen and the brief's issue number (where the brief is an issue) and any PRD or epic number named are known.

## The writes this skill makes

These, and only these:

- create or edit the PRD issue — title `PRD: <name>`, label `prd`;
- create or edit the epic issue — title `Epic: <name>`, label `epic`;
- sub-issue links: the PRD under the brief's issue; each topic's brief under the epic, the original brief first;
- `gh label create prd` / `gh label create epic`, only when `gh label list` lacks it;
- closing an epic whose every topic is filed or dropped.

The brief's issue stays as it was, and the PRD carries `prd` alone — nothing is built from a PRD directly, so it is never `ready-for-agent`. The check branch writes nothing.

## Write

1. **Labels.** Run `gh label list`; create `prd` when it is missing, and `epic` too when this run files an epic. Done when every label this run applies exists, and you have noted any you created for the return.
2. **Create the issue first.** `gh issue create --title "PRD: <name>" --label prd` with a one-line placeholder body, then read its number `N`. Every id embeds `N`, so the number has to exist before the body can be written. Done when `N` is known.
3. **Epic.** When the conversation narrowed a too-big brief, or the brief names an epic, read [EPIC.md](EPIC.md) and follow it. Done when the epic exists, its topics are current, and you know its number for the PRD's `Epic:` line.
4. **Compose the body** in the [PRD format](#prd-format), ids `REQ-N.1`, `REQ-N.2`, … in the order you write them. A requirement this brief changes in an earlier, shipped PRD gets a new id here with the old one under `Replaces:`, or goes under **Withdrawn**. Revisions reads `None`. Done when every section is present and every part of the brief has a home: a requirement, a constraint, a topic in the epic, an "Out of scope" line or a "Left for the spec" line.
5. **Checklist.** Run every line of the [checklist](#checklist) against the body and fix each fail. Done when every line passes.
6. **Publish.** `gh issue edit N --body-file -` with the body on stdin. Then link the PRD under the brief's issue through the sub-issues endpoint (`gh api repos/{owner}/{repo}/issues/<brief>/sub_issues -F sub_issue_id=<PRD's id>`, where the id is the issue's `id`, not its number). When the link fails, the body's `Brief:` line carries the relationship; note the failure for the return. Done when the body is published and the link exists or its failure is noted.
7. **Return** the PRD's number and URL, the epic's when there is one, any label created, any link that failed, and the checklist result.

## Revise

1. **Fetch** the PRD with `gh issue view <N> --json state,title,body`. A closed PRD's work has shipped and its text stays as it is: write nothing, and return a refusal saying the change belongs in a new PRD (the write branch) whose requirements name the old ids under `Replaces:` or list them under **Withdrawn**. Done when the PRD is open and its body is in hand.
2. **Edit in place**, keeping every id. A reworded requirement keeps its id while a test written against the old words would still hold; otherwise list it under **Withdrawn** with why, and add the new one. A new requirement takes the next `n` after the highest `REQ-N.n` anywhere in the body, Withdrawn included — ids are never renumbered or reused, because tests key on them. Add one line under **Revisions**: the date, the reason with a link, and the ids added, changed and withdrawn. Done when every change the conversation settled is in the body and the Revisions line names each id it touched.
3. **Epic.** When the PRD names an epic, read [EPIC.md](EPIC.md) and update it. Done as in Write step 3.
4. **Checklist** as in Write step 5, then **publish** with `gh issue edit <N> --body-file -`. Done when every line passes and the body is published.
5. **Return** the PRD's URL, the Revisions line, and the checklist result.

## Check

1. **Fetch** the PRD, the brief it names, the epic where it names one, and every earlier PRD whose number appears in an id under `Replaces:` or **Withdrawn**, with `gh issue view`. Done when each of those bodies is in hand.
2. **Report** every line of the [checklist](#checklist) as pass or fail, each fail with the line or id that fails it. Done when all seven lines carry a verdict. The result is the return; the tracker is left as it was.

## Requirements and ids

- A **requirement** is one behaviour a person can observe, stated so that it passes or fails: "A visitor who enters a wrong password three times cannot try again for 15 minutes". A user story groups requirements, gives who and why, and carries no id.
- A quality such as speed, languages or accessibility is a requirement when a person can observe it and a number or a named standard makes it pass or fail. Otherwise it is a constraint.
- The id is `REQ-<PRD issue number>.<n>`, such as `REQ-57.3`. It is numbered in order of creation, never renumbered and never reused.
- A reworded requirement keeps its id while a test written against the old words would still hold. Otherwise it is withdrawn and a new one added.
- Each requirement is marked `Visible: yes` or `Visible: no`: whether it changes anything the software renders for a person to look at, such as a screen, an email, a PDF or a notification. A wording-only change is yes.

## PRD format

Four rules make it easy for an agent to read:

- Every section is always present, in this order, with "None" when empty.
- Each header line is on a line of its own.
- Each requirement is one block, id first, with fixed labels, and reads on its own, naming who does it.
- Plain Markdown only: no tables, HTML or front matter.

```markdown
# PRD: <name>

Brief: #<number>
Epic: #<number> | none
Changes what a person sees: yes | no

## Assumptions
## Problem
## Solution
## Requirements

### As a <actor>, I want <…>, so that <…>

- **REQ-57.1** <one behaviour a person can observe>
  - Visible: yes | no
  - Replaces: REQ-12.4

## Withdrawn
- REQ-12.6: <why>

## Constraints
- "<the words of whoever fixed it>", said by <who>

## Terms
**<Term>**: <definition>

## Out of scope
## Left for the spec
## Revisions
- <date>: <reason, with a link>. Added REQ-57.9. Changed REQ-57.2. Withdrew REQ-57.5.
```

- **Changes what a person sees** is yes when any requirement is Visible.
- **Assumptions** holds what was decided without the person's answer.
- **Constraints** holds what whoever asked fixed that is not a behaviour, such as named technology, dates and law. Each is quoted and not elaborated.
- **Terms** holds the glossary terms this PRD adds or changes, so it reads correctly from the issue alone.
- **Left for the spec** holds the technical questions that came up, listed and not answered.

## Checklist

The write and revise branches end on this list, and the check branch reports on it.

- Every requirement passes or fails as written, and has an id and a Visible mark.
- "Changes what a person sees" agrees with the marks.
- Every id under Replaces or Withdrawn exists.
- Every part of the brief has a home in the PRD or the epic.
- Nothing outside Constraints names a file, symbol, table, endpoint, library or framework.
- Every term is plain language, in the glossary or under Terms.
- Where there is an epic, the PRD names it and its own topic is marked with its brief.
