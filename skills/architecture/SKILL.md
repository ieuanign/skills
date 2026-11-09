---
name: architecture
description: Keeps a project's Architecture in docs/architecture/ — the what and why of its parts, data, behavior and deployment. Use to observe it from the code, to plan a PRD against it as a Spec issue, to write either from an answered question set, or to check the Architecture against the code or a Spec against its PRD.
---

# architecture — keep a project's Architecture, and plan each PRD against it as a Spec

The **Architecture** is five files under `docs/architecture/` in the consuming repository:

- `README.md` — the index: what the project is, its quality goals, and links to the rest.
- `blueprint.md` — the parts and how they connect.
- `data.md` — the stores, the entities and which part owns each.
- `behavior.md` — the main flows across the parts.
- `deployment.md` — what runs where, and why.

A **Spec** is one PRD's changes to the Architecture: an issue under the PRD, which `/to-tickets` then cuts into tickets.

Every file this skill writes starts from its template in `<this-skill-dir>/template/`, and a Spec's body from `template/spec.md`. `<this-skill-dir>/example/` is a worked project root with one planned change, and passes `check`.

Every branch runs unattended: a person's answers reach it only through a [question set](#the-question-sets).

## Rules

- **Layers.** Each section file has one `##` per layer, in this order: presentation, application, data access, database. A layer with nothing to say holds one line, "None — <reason>".
- **Anchors.** Each part names its home: a top-level directory, a package or a service, such as `web/` or a Compose service — never a file.
- **What and why only.** The Architecture holds no exact values: the versions, sizes, ports, replica or instance counts and provider SKUs that `docs/delivery-policy.md` and the infrastructure code hold. Where they disagree with the Architecture, the Architecture says what is meant.
- **Decision records.** A choice passing all three parts of the test — hard to reverse, surprising without context, the result of a real trade-off — gets a record, linked from the prose that states it and from the index. Records go where the consuming repo's `docs/agents/domain.md` says; where that file is absent or names no location, in `docs/adr/`; where it says the repo keeps none, the why stays in the prose, with no record or link.
- **Diagrams** are fenced `mermaid` blocks.
- **Planned changes.** A Spec's changes reach the default branch before the code that builds them, so each stays marked until built:
  - In prose, the line ends `Planned: <Spec link>`, the link bare or as a Markdown link.
  - In a diagram, the element carries a `%% Planned: <Spec link>` comment and is drawn dashed: a flowchart node or a state takes the `planned` class; an edge takes its type's dotted form — `-.->` in a flowchart, `-->>` in a sequence, `..` in an ER diagram. A state transition has no dotted form, so its comment alone marks it.
  - A planned removal keeps its line or element, its marker reading `Planned: <Spec link> — removed`, or `%% Planned: <Spec link> — removed` in a diagram.
  - The pull request that builds a change removes its marker with the code, and for a removal the marked line or element too.
  - A **Spec link** is the Spec issue's URL, or a relative path to a file holding a Spec body — a first heading `# Spec: <name>` and a `PRD:` line — the form `example/` uses.
- **The pointer.** The consuming repo's `docs/agents/domain.md` carries this line, so that every agent reads the Architecture before planning:

  > Read `docs/architecture/` before you plan: it is this project's Architecture, and each `Planned:` marker in it names the Spec of a change not yet built.

- **The tracker** is the one the consuming repo's `docs/agents/issue-tracker.md` describes, driven with `gh` from inside the checkout, without `--repo`: `gh api` paths use `{owner}/{repo}`, and a body goes in with `--body-file -` from a quoted heredoc.

## The Spec

- Titled `Spec: <PRD's name>`, labelled `spec` and given no triage label.
- A sub-issue of its PRD. Where the link fails, the body's `PRD:` line carries the relationship.
- Its body is `template/spec.md`'s sections, in that order, **Assumptions** first.

## The inventory

What the code shows, read the same way by `observe` and `check`:

- **Parts.** Each top-level directory holding code, each package a workspace manifest lists, and each service a Compose file or other deployment file names.
- **Stores and table groups.** Each database, cache, queue and object store a service or its configuration names, and the table groups of each schema or migration folder.
- **Third-party integrations.** Each outside system the code calls: its client libraries in the manifests, its keys and URLs among the environment variable names, its hosts in outbound calls.
- **Deployables and environments.** Dockerfiles, Compose files, Helm charts and Kubernetes manifests, Terraform or OpenTofu, platform files, the deploy jobs in `.github/workflows/`, and `docs/delivery-policy.md` where there is one, read as a file.
- **Decision records**, at the location the Decision records rule gives.

## The question sets

`observe` and `spec` return a draft and a question set. A caller that wants a person's answers puts the set to that person — the whole set first, then only the follow-ups `write` returns — and passes the answers to `write`. Each set carries its draft, so the answered set is all `write` needs; `observe` defines the Architecture set's shape, and `spec` the Spec set's.

Every question carries a recommendation, and an empty answer keeps it. Each recommendation names, under `Rests on:`, the questions whose recommendations it assumes, so `write` can tell when an answer knocks it out.

## The writes this skill makes

These, and only these, all by `write`:

- `docs/architecture/*`, created or replaced in the working tree.
- A decision record, at the location the Decision records rule gives.
- The pointer line, where `docs/agents/domain.md` does not already name `docs/architecture/`: appended to that file, or in a new one where it is absent.
- For a Spec: the Spec issue, created or edited; the `spec` label, created only where `gh label list` lacks it; and the Spec's sub-issue link under its PRD. The PRD's body and labels stay as they are.

`write` leaves every file uncommitted, for the caller to stage and commit. `observe`, `spec` and `check` are read-only.

## Pick the branch

- **`check [<Spec>]`** — you were asked to check the Architecture, or a Spec.
- **`write <answered set>`** — you were given an answered question set.
- **`spec <PRD>`** — you were asked to plan a PRD against the Architecture.
- **`observe`** — anything else.

Where a branch's need is missing, write nothing and return a refusal. `spec` and `check` need `docs/architecture/`; the refusal names `observe`. `spec`, a `write` of a Spec set and a `check` given a Spec issue need the tracker in your context; the refusal names `/mattpocock-skills:setup-matt-pocock-skills`.

Done when one branch is chosen and its inputs are in hand: the PRD's number for `spec`, the answered set for `write`, the Spec's link or path where `check` was given one.

Then read the branch's file, `<this-skill-dir>/branches/<branch>.md`, before performing it: the freshly read file is that branch's whole procedure.

## Checklist

`write` ends on this list, and `check` reports on it, each line by its name.

The Architecture:

- **homes** — Every part's home exists, and every part the inventory finds is some part's home.
- **layers** — Each part sits in one layer, the same in the index's Parts at a glance and in `blueprint.md`.
- **stores** — Every store and table group the inventory finds is in `data.md`, and nothing else is.
- **integrations** — Every third-party integration the inventory finds is named.
- **deployment** — `deployment.md` and the deployment files, with `docs/delivery-policy.md` where there is one, name the same deployables and environments, run the same way. A disagreement reads "infrastructure change owed".
- **exact values** — None, as What and why only defines them, in prose or diagram.
- **decision records** — Every decision-record link resolves.
- **markers** — Every `Planned:` marker resolves to an open Spec issue or a Spec file.
- **diagrams** — Every diagram is a fenced `mermaid` block.
- **pointer** — `docs/agents/domain.md` names `docs/architecture/`.

The Spec, when `check` is given one:

- **requirements** — Every requirement id of the PRD is under the Spec's Requirements, with a change or "none needed".
- **left for the spec** — Every "Left for the spec" line is answered.
- **Spec markers** — Every change in the diff is marked with this Spec, and every marker for this Spec is in the diff.
- **deployment view** — The Deployment view line matches whether `deployment.md` changed.
- **Assumptions** — The Assumptions come first.
