# terms — definitions more than one act uses

An act that uses one of these says so and is read with this file.

## Data-holding

A database, a volume, a bucket, or any managed data store. A plan **destroys data** when its
machine-readable output gives a data-holding resource the action delete or replace. That output's
format is `<IAC_TOOL>`'s own: look up, in its documentation, the command that renders a saved plan
machine-readable and the fields carrying each resource's type, address and actions.

## Targets

Each environment under `<IAC_PATH>`, and `<IAC_PATH>/github/` (first-run's branch rules). A target's
**credentials**, each the caller's `<key>=<path>` argument, else that line of
`<CHECKOUT>/.infra.local.env`, read as `<GITHUB_CREDENTIAL>` is: `INFRA_CREDENTIAL_PROVIDER_<ENVIRONMENT>`;
`INFRA_CREDENTIAL_DNS_<ENVIRONMENT>` when its code declares DNS records; `<GITHUB_CREDENTIAL>` when its
code uses `<IAC_TOOL>`'s GitHub provider — `<IAC_PATH>/github/`'s only one.

## The reports issue

The open issue titled exactly `Infrastructure reports`:
`gh issue list --state open --search 'in:title "Infrastructure reports"' --json number,title`, keeping
the exact title. None: `gh issue create --title 'Infrastructure reports' --body-file -` with a one-line
body saying what it collects, then `gh issue pin <n>`. A failed `gh issue pin` still lets the act post
its comment.

## Credential files

The form each key's file holds; the person's part creates it so, and every reader hands it over unopened.

- `INFRA_CREDENTIAL_GITHUB` — one fine-grained token for the repository, alone in the file, with
  Administration write (rulesets and branch rules, creating or updating an environment, the runner
  registration token, the fork approval policy) and Environments write (an environment's secrets and
  variables, which the repository's Secrets and Variables permissions do not reach); nothing broader.
- `INFRA_CREDENTIAL_PROVIDER_<ENVIRONMENT>` and `INFRA_CREDENTIAL_DNS_<ENVIRONMENT>` — what the
  provider's tool reads. Where it takes a variable or flag (a token, a `DOCKER_HOST` endpoint): the
  value alone, one line, no key or quotes, set from the file in the tool's own command. Where it reads a
  file of its own (a key file, a kubeconfig): that file.
- `INFRA_CREDENTIAL_GRAFANA_<ENVIRONMENT>` — a `curl` config file holding the one line
  `header = "Authorization: Bearer <token>"`, handed over as `curl --config <path>`.
