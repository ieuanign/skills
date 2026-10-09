---
name: infra-report
description: Posts one infrastructure report — cost per environment, usage per host, pipeline minutes, the last restore and right-sizing suggestions, every figure naming its source — as a comment on the pinned "Infrastructure reports" issue, changing nothing. Use when an infrastructure report is needed, or to check the latest one.
---

# infra-report — one report comment, every figure sourced, nothing changed

You read what the infrastructure costs and uses and post it as one comment. Nobody is asked anything: a caller with no person present gets a posted comment or a refusal that says why. A suggestion is a proposal only; it becomes a change solely when the caller hands it to `infrastructure`'s Change branch by its number.

The issue tracker should be in your context, from the consuming repo's `docs/agents/issue-tracker.md`. If it is not, write nothing and return a refusal naming `/mattpocock-skills:setup-matt-pocock-skills`. Every `gh` command runs inside the checkout with no `--repo`; `gh api` paths use `{owner}/{repo}`.

**Sensitive.** Money arithmetic: costs, forecasts and savings people act on. External integrations: a GitHub issue write, and reads from the provider's billing API, Grafana and the Actions API.

## The writes this skill makes

These, and only these:

- the issue titled `Infrastructure reports`, created and pinned when no open one exists;
- one new comment on it per run, beginning `## Report`, by `gh issue comment <n> --body-file - <<'EOF'`.

Every provider, Grafana and Actions call is a read. Check writes nothing; every refusal writes nothing.

## Sources

A **figure** is any number the report states. Each carries its source beside it: the command or query that produced it, or the file and line it came from. The rules:

- **Unreadable** — the figure is `not available: <reason>`, the reason naming what was missing or what failed.
- **Caller-passed** — quoted as given, with the source the caller named, and excluded from every total.
- **List price** — a cost taken from the infrastructure code, labelled `list price`.
- **Your own arithmetic** — a linear forecast, a saving, a total: labelled `computed`, with its unit and currency and the figures it was computed from.

## Credentials

Paths only, never contents. Keys, from the caller's arguments, else `.infra.local.env` at the repository root:

```text
INFRA_CREDENTIAL_PROVIDER_<ENVIRONMENT>=<path>
INFRA_CREDENTIAL_GRAFANA_<ENVIRONMENT>=<path>
```

`<ENVIRONMENT>` is the policy's environment name, upper-cased. Hand the path to the tool in the form it reads a credential from a file — `curl`'s config or header-from-file form, the provider CLI's own flag or variable — looked up with `--help`. A credential is never opened, printed or quoted, in the report or the return. An absent one makes its figures `not available: no credential for <key>`.

## Read

1. **The policy.** `docs/delivery-policy.md`. Invoke `delivery-policy` through the Skill tool for its Check branch; a policy that is absent or fails it is a refusal naming each failing rule. Each rule holds its value under `value`. Read:
   - `environments.<name>.runtime`, `environments.<name>.provider`, `environments.<name>.monitoring` for every environment;
   - `infrastructure_as_code.path`;
   - `right_sizing.down_below_percent` and `right_sizing.up_above_percent`.

   Done when every environment has its runtime, provider and monitoring, and both thresholds are known.
2. **Credentials**, by [Credentials](#credentials). Done when every environment's provider key and Grafana key is a path or absent.
3. **Monitoring addresses.** The Grafana base URL per environment from the caller's arguments. None passed makes that environment's usage `not available: no monitoring address`. Done when every environment has an address or that line.
4. **Caller figures.** Each figure the caller passed, with its source. Done when each is listed or there are none.

## Pick the branch

- **Check** — you were asked to check a report. Go to [Check](#check).
- **Report** — anything else. Go to [Report](#report).

## Report

Five sections, in this order.

1. **Cost.** Per environment: look up the policy's provider's billing API now and read month-to-date and forecast through it. Its own forecast where it gives one; otherwise month-to-date divided by days elapsed, times days in the month, labelled `computed`. A provider with no billing API: each resource's price recorded under `infrastructure_as_code.path`, labelled `list price`, file and line as source. Done when every environment has a cost line or a `not available` line.
2. **Usage.** Per host declared under `infrastructure_as_code.path`: CPU, memory, disk and bandwidth, each a PromQL query through Grafana's datasource proxy API, the Grafana credential's path handed to the request. Runtime `paas` has no hosts: its usage is `not available: PaaS runtime`. Done when every host has four figures or `not available` lines, and every environment with no hosts says why.
3. **Pipeline minutes.** The current month's workflow run minutes, from the Actions API through `gh api repos/{owner}/{repo}/actions/...`, looking up the endpoints with `gh api --help` and the API reference. Done when the month's minutes are stated per workflow and in total, or `not available`.
4. **Last restore.** The date and result from the latest comment on the `Infrastructure reports` issue beginning `## Restore`, that comment's URL as source. None found: `not available: no restore recorded`. Done when the line is written.
5. **Suggestions.** Two kinds:
   - **Right-sizing**: the 30-day p95 of CPU and of memory per host, by PromQL as in Usage. Below `right_sizing.down_below_percent` proposes the next size down; above `right_sizing.up_above_percent`, the next size up. Sizes and prices from the provider's own listing, read now.
   - **Idle resources**: unattached IPs, empty load balancers, stopped instances and snapshots past retention, each listed through the provider's read calls, looked up now. Retention is the one the infrastructure code states, else state the one you assumed.

   Each suggestion is its own numbered block in the [shape](#the-comment), every field filled. Done when every host and every idle resource found has a block or appears under "Nothing to suggest".

Then post:

6. **The issue.** `gh issue list --state open --search 'in:title "Infrastructure reports"' --json number,title`, keeping the one whose title is exactly `Infrastructure reports`. None: create it with `gh issue create --title 'Infrastructure reports' --body-file - <<'EOF'` (a one-line body saying what the issue collects), then `gh issue pin <n>`. A pin that fails still lets the comment post; name the failure in the return. Done when the issue number is known.
7. **The comment**, in the shape below, then run [Check](#check) on it and say its verdict in the return. Done when the comment is posted and Check's verdict is in hand.

**Return** the comment's URL, the Check verdict, and the number of suggestions with their total `computed` monthly saving.

## The comment

````markdown
## Report

Period: <month to date, first day – today> · Policy at: <short sha>

### Cost
- staging: <amount> <currency> month to date, <amount> <currency> forecast — <source>
- production: not available: no credential for INFRA_CREDENTIAL_PROVIDER_PRODUCTION
- Caller-passed, excluded from totals: <figure> — <the caller's source>

### Usage
- staging / <host>: CPU <n>%, memory <n>%, disk <n>%, bandwidth <n> <unit> — PromQL `<query>` via <datasource>

### Pipeline minutes
- <workflow>: <n> min — `gh api <path>`

### Last restore
- <date>, <result> — <comment URL>

### Suggestions

#### Suggestion 1 — <host or resource>: <down | up | remove>
- Query: `<PromQL or provider read call>`
- Window: 30 days, p95
- Current size: <size>
- Proposed size: <size, or none>
- Monthly saving: <amount> <currency>, computed from <figures>
- Source: <where each figure came from>

Nothing to suggest: <each host inside both thresholds>
````

Suggestion numbers run from 1 within each report; `infrastructure` takes one as `Report <comment URL>, suggestion <n>`.

## Check

1. **Find the report.** The latest comment beginning `## Report` on the `Infrastructure reports` issue, or the comment the caller named. None: a refusal saying so. Done when its body is in hand.
2. **Judge** every line of the [checklist](#checklist) as pass or fail, each fail naming the figure and its section. Done when every figure has been read and every line carries a verdict.
3. **Return** pass only when every line passes, with the list of fails otherwise.

## Checklist

The Report branch ends on this list, and the Check branch reports on it.

- Every figure names its source, or is `not available: <reason>` with a reason.
- Every caller-passed figure is marked as excluded from totals and is in none.
- Every cost not from a billing API is labelled `list price`.
- Every forecast, saving and total you computed is labelled `computed`, with unit and currency.
- The five sections are present, in order.
- Every suggestion block carries query, window, current size, proposed size, monthly saving and source.
