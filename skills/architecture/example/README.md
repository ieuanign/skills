# Example — Shelfshare

A fictitious project root, small enough to read in a minute: a neighbourhood lending library whose members borrow books through a website. It holds an Architecture in [`docs/architecture/`](docs/architecture/), one decision record, the agents' pointer in [`docs/agents/domain.md`](docs/agents/domain.md), a [`compose.yaml`](compose.yaml) naming the services, and a stub home per part.

One planned change is in flight — loan renewals — marked in prose and in diagrams in `blueprint.md` and `behavior.md`. Its Spec is the file [`docs/spec.md`](docs/spec.md), planned from the PRD [`docs/prd.md`](docs/prd.md); here both are files, because a fictitious project has no tracker.

Run `check` with this folder as the project root, and every Architecture line passes; run `check docs/spec.md`, and every Spec line passes with nothing listed as drift.
