---
name: architecture
description: Keeps a project's Architecture in docs/architecture/ — the what and why of its parts, data, behavior and deployment — and plans each PRD against it as a Spec issue. Use to observe a project's Architecture from its code, to spec a PRD against it, to write either from an answered question set, or to check it against the code.
---

# architecture — keep a project's Architecture, and plan each PRD against it as a Spec

The **Architecture** is five files under `docs/architecture/` in the consuming repository:

- `README.md` — the index: what the project is, its parts at a glance, its quality goals, and links to the four sections and the decision records.
- `blueprint.md` — the parts and how they connect.
- `data.md` — the stores, the entities and which part owns each.
- `behavior.md` — the main flows across the parts.
- `deployment.md` — what runs where, and why: each deployable, the environments and how they connect.

A **Spec** is one PRD's changes to the Architecture: an issue under the PRD, which `/to-tickets` then cuts into tickets.

[`template/`](template/), at `<this-skill-dir>/template/`, holds each file's shape — its headings in order, the "None — <reason>" line, its diagrams with the `planned` class defined — and `template/spec.md` holds the Spec's body. Every file this skill writes starts from its template. [`example/`](example/) is a worked project root with one planned change, and passes [Check](#pick-the-branch).

Every branch runs unattended: `observe` and `spec` return a draft and a question set; a caller that wants a person's answers puts the set to that person and passes the answers to `write`.

## Rules

- **Layers.** Each section file has one `##` per layer, in this order: presentation, application, data access, database. A layer with nothing to say holds one line, "None — <reason>".
- **Anchors.** Each part names its home as a top-level directory, a package or a service, such as `web/` or a Compose service. A home is never a file.
- **What and why only.** The Architecture holds no exact values — versions, sizes, ports, counts or provider SKUs; those live in `docs/delivery-policy.md` and the infrastructure code. Where they disagree with the Architecture, the Architecture says what is meant.
- **Decision records.** A choice passing all three parts of the test — hard to reverse, surprising without context, the result of a real trade-off — gets a record, linked from the prose that states the choice and from the index. Records go where the consuming repo's `docs/agents/domain.md` says; where that file is absent or names no location, in `docs/adr/`. Where that file says the repo keeps none, the why stays in the prose and no record or link is written. Take the record's format from `/mattpocock-skills:domain-modeling`'s `ADR-FORMAT.md`, by invoking `mattpocock-skills:domain-modeling` through the Skill tool, for its records only: `CONTEXT.md`, `GLOSSARY.md` and every other glossary stay as they are.
- **Diagrams** are fenced `mermaid` blocks.
- **Planned changes.** A Spec's changes reach the default branch before the code that builds them, so each stays marked until built. In prose, the line ends `Planned: <Spec link>`. In a diagram, the planned element carries a `%% Planned: <Spec link>` comment and is drawn dashed: a flowchart node or a state takes the `planned` class; an edge takes its type's dotted form — `-.->` in a flowchart, `-->>` in a sequence, `..` in an ER diagram. A state transition has no dotted form, so its comment alone marks it. A planned removal keeps its line, ending `Planned: <Spec link> — removed`, and its diagram element, under a `%% Planned: <Spec link> — removed` comment. The pull request that builds a change removes its marker, with the code; for a removal, the marked line or element goes with it. A Spec link is the Spec issue's URL, or a relative path to a file holding a Spec body — a first heading `# Spec: <name>` and a `PRD:` line — the form `example/` uses.
- **The pointer.** The consuming repo's `docs/agents/domain.md` carries this line, so that every agent reads the Architecture before planning:

  > Read `docs/architecture/` before you plan: it is this project's Architecture, and each `Planned:` marker in it names the Spec of a change not yet built.

- **The tracker.** The issue tracker should be in your context, from the consuming repo's `docs/agents/issue-tracker.md`. Every `gh` command runs inside the checkout with no `--repo`; `gh api` paths use `{owner}/{repo}`; a body goes in with `--body-file -` from a quoted heredoc.

## The Spec

- Titled `Spec: <PRD's name>`, labelled `spec` and given no triage label.
- A sub-issue of its PRD. Where the link fails, the body's `PRD:` line carries the relationship.
- Its body is `template/spec.md`'s sections, in that order, **Assumptions** first.
- The tickets `/to-tickets` cuts from it become its sub-issues. The caller commits the marked changes and opens the pull request, which names the Spec.

## The inventory

What the code shows, read the same way by `observe` and `check`:

- **Parts.** Each top-level directory holding code, each package a workspace manifest lists, and each service a Compose file or other deployment file names.
- **Stores and table groups.** Each database, cache, queue and object store a service or its configuration names, and the table groups of each schema or migration folder.
- **Third-party integrations.** Each outside system the code calls: its client libraries in the manifests, its keys and URLs among the environment variable names, its hosts in outbound calls.
- **Deployables and environments.** Dockerfiles, Compose files, Helm charts and Kubernetes manifests, Terraform or OpenTofu, platform files, the deploy jobs in `.github/workflows/`, and `docs/delivery-policy.md` where there is one, read as a file.
- **Decision records**, at the location the Decision records rule gives.

## The question sets

Every question carries a recommendation, and an empty answer keeps it. Each recommendation names, under `Rests on:`, the questions whose recommendations it assumes, so `write` can tell when an answer knocks it out. A caller that asks in rounds asks the whole set first; later rounds ask only the follow-ups `write` returns. `observe` defines the Architecture set's shape and `spec` the Spec set's; each set carries its draft, so the answered set is all `write` needs.

## The writes this skill makes

These, and only these, all by `write`:

- `docs/architecture/*`, created or replaced in the working tree.
- A decision record, at the location the Decision records rule gives.
- The pointer line in `docs/agents/domain.md`, only where that file does not already name `docs/architecture/`; where the file is absent, it is created holding the line.
- For a Spec: the Spec issue, created or edited; `gh label create spec`, only when `gh label list` lacks it; and the Spec's sub-issue link under its PRD. The PRD's body and labels stay as they are.

`write` leaves every file uncommitted, for the caller to stage and commit. `observe`, `spec` and `check` are read-only.

## Pick the branch

- **`check [<Spec>]`** — you were asked to check the Architecture, or a Spec.
- **`write <answered set>`** — you were given an answered question set.
- **`spec <PRD>`** — you were asked to plan a PRD against the Architecture.
- **`observe`** — anything else.

`spec` and `check` need `docs/architecture/`: where it is missing, write nothing and return a refusal naming `observe`. `spec`, a `write` of a Spec set, and a `check` given a Spec issue need the tracker: where it is not in your context, write nothing and return a refusal naming `/mattpocock-skills:setup-matt-pocock-skills`.

Done when one branch is chosen and its inputs are in hand: the PRD's number for `spec`, the answered set for `write`, the Spec's link or path where `check` was given one.

Then read the branch's file, `<this-skill-dir>/branches/<branch>.md`, before performing it: the freshly read file is that branch's whole procedure.

## Checklist

`write` ends on this list, and `check` reports on it.

The Architecture:

- Every part's home exists, and every app, package or service in the code is some part's home.
- Each part sits in one layer.
- Every store, and every table group in the schema, is in `data.md`, and nothing else is.
- Every third-party integration found in the code is named.
- Every deployable and every environment agrees with the deployment files, and with `docs/delivery-policy.md` where there is one. A disagreement reads "infrastructure change owed".
- There are no exact values.
- Every decision-record link resolves.
- Every `Planned:` marker names an open Spec.
- Every diagram is a fenced `mermaid` block.
- The `docs/agents/domain.md` pointer is there.

The Spec, when `check` is given one:

- Every requirement id of the PRD is covered by a change or listed as needing none.
- Every "Left for the spec" line is answered.
- Every change in the diff is marked with this Spec, and every marker for this Spec is in the diff.
- The Deployment view line matches whether `deployment.md` changed.
- The Assumptions come first.
