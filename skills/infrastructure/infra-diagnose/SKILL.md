---
name: infra-diagnose
description: Diagnoses one Grafana alert through Prometheus and Loki, writes the diagnosis on the alert's issue, and ends in a remediation through an allowed tool script, a change handed to `infrastructure`, a bug with redacted log evidence, or not actionable. Use when an alert has fired and needs diagnosing. Use to check an alert issue's diagnosis and remediation.
---

# infra-diagnose — one alert, one diagnosis, one ending

You diagnose one alert from its monitoring data and end it one way, on its own issue. Nobody is asked anything: a caller with no person present gets a written ending or a refusal that says why.

The issue tracker should be in your context, from the consuming repo's `docs/agents/issue-tracker.md`. If it is not, write nothing and return a refusal naming `/mattpocock-skills:setup-matt-pocock-skills`. Every `gh` command runs inside the checkout with no `--repo`; `gh api` paths use `{owner}/{repo}`; every body goes on stdin from a quoted heredoc (`--body-file - <<'EOF'`).

**Sensitive.** Live hosts, acted on only through an allowed tool script; credentials, never opened; Grafana reads and GitHub writes, including an `infrastructure` invocation that opens a pull request; log lines on a public issue, redacted; a long wait before the re-check.

## The writes this skill makes

These, and only these:

- `gh label create alert` / `gh label create bug`, only when `gh label list` lacks one this run applies;
- the alert issue, opened when no open one exists;
- new comments on the alert issue: `## Diagnosis`, `## Remediation`, each ending's record, and a resolved alert's notice;
- a new bug labelled `bug`, or a new comment on the open one that links the alert issue;
- one `infrastructure` invocation in its change mode, which opens a pull request;
- one real run of one allowed tool script, after its dry run;
- `gh issue close` on the alert issue, only after your own remediation's re-check shows it cleared.

Nothing else: no body edited, no thread resolved, no label removed. Check and every refusal write nothing.

## Terms

- **Alert** — one firing alert: its rule name, labels, `startsAt`, link, and environment. A webhook payload holding several is handled one alert at a time, each with its own issue and ending.
- **Alert issue** — the open issue labelled `alert` titled `Alert: <rule> (<environment>)`. A repeat while it is open is one more comment on it.
- **Ending** — exactly one per run, named by one of four words: `remediation`, `change`, `bug`, `not actionable: <reason>`. Every ending is written on the alert issue.
- **Allowed** — an action is allowed in an environment when `environments.<environment>.remediation.enabled` is `true`, `environments.<environment>.remediation.allowlist` names it, and `<tools path>/<action>.sh` exists.
- **Record line** — the one line an allowed tool script prints on stdout; its shape is in the script's header, quoted verbatim, never restated.
- **Cleared** — the alert rule is no longer firing and its query no longer meets the rule's condition.

## Host actions

The only process you start against infrastructure is `<tools path>/<action>.sh`, run from the checkout's root, for an allowed action. Never `ssh`, `kubectl`, `docker`, `helm`, a provider CLI, `gh workflow run` or a Grafana write yourself. The scripts carry their own refusals; you add none.

## Credentials

Paths only, never contents. The viewer token's path is the caller's argument, else the output of `grep -m1 '^INFRA_CREDENTIAL_GRAFANA_<ENVIRONMENT>=' .infra.local.env | cut -d= -f2-` at the repository root, `<ENVIRONMENT>` the policy's name upper-cased. Hand the path to `curl` in its header-from-file or config-file form, looked up with `curl --help`; test it with `test -s` alone. It is never opened, printed, or quoted on an issue or in the return. A tool script's own tools find their credential files through the variable each tool reads.

## Read

1. **The policy.** Invoke `delivery-policy` through the Skill tool for its Check branch on `docs/delivery-policy.md`. A missing file, a failing Check or a missing skill is a refusal naming each. Each rule holds its value under `value`. Read `environments.<environment>.runtime`, `.monitoring`, `.remediation.enabled`, `.remediation.allowlist`, `.scale.min`, `.scale.max`; `services`; `paths.tools`. Done when each is known or absent.
2. **The alert.** From a webhook payload: each firing alert's rule name (`alertname`), labels, `startsAt` and link, the Grafana base address taken from the payload's own URLs. From text: the same facts as written. The environment is the one policy environment a label value or the text names. On [Check](#check), both come from the alert issue's title `Alert: <rule> (<environment>)` instead. Done when rule and environment are known; an alert with no rule, or naming no policy environment, is a refusal naming what is missing.
3. **The Grafana address**: the alert's own link, else the caller's argument. With `monitoring` `own` it
   is the owner's own Grafana, read with its token exactly as an `added` stack is; an owner's monitoring
   that is not Grafana leaves it absent. Done when known or absent.
4. **The token path**, by [Credentials](#credentials). Done when it is a path or absent.

## Pick the branch

- **Check** — you were asked to check an alert issue. Go to [Check](#check).
- **Diagnose** — anything else. Go to [Diagnose](#diagnose).

## Diagnose

1. **Labels.** Create `alert` where `gh label list` lacks it; `bug` likewise, before step 7 applies it. Done when each label this run applies exists.
2. **The alert issue.** `gh issue list --state open --label alert --search 'in:title "Alert: <rule> (<environment>)"'`, keeping the one titled exactly that. An alert whose status is resolved gets a comment saying so on its open issue, or nothing where none is open, and the run ends there. None open: `gh issue create --title 'Alert: <rule> (<environment>)' --label alert --body-file - <<'EOF'` with the alert's facts. Done when its number `<n>` is known.
3. **Access.** A token path unset or failing `test -s`, no Grafana address, or Grafana refusing the token ends the run: write [the diagnosis](#the-diagnosis) with no queries and the ending `not actionable: no monitoring access`, then return. Done when Grafana answers with the token.
4. **Read.** The alert rule's own query and state from Grafana, then the PromQL and LogQL the diagnosis needs through Grafana's datasource proxy; look the API routes up in Grafana's documentation now. Keep each query verbatim with an Explore link into the Grafana the alert came from. Done when every query the finding rests on is kept with its Explore link.
5. **Decide** the cause and the ending — the first that fits:
   1. **remediation** — the action the cause calls for is allowed, the alert's labels map its target to a `services` entry (for `prune`, which frees a host, to the
   environment), and `gh issue view <n> --comments` shows neither a `## Remediation` comment nor one beginning `Handed on:` (else `not actionable: already remediated, with a person`);
   2. **change** — the cause is in the infrastructure;
   3. **bug** — the cause is in the code;
   4. **not actionable: \<reason>** — otherwise.

   Done when one ending is chosen.
6. **The diagnosis.** `gh issue comment <n> --body-file - <<'EOF'` in [the shape below](#the-diagnosis). Done when every query named carries an Explore link and the ending is named.
7. **Perform the ending.**
   - **remediation** — read `remediation.md` beside this file and follow it.
   - **change** — invoke `infrastructure` through the Skill tool in its change mode; the request is the alert issue's URL and the infrastructure cause. Comment the pull request it opened, or its refusal, on the alert issue. Not installed: comment the request text and name the missing skill in the return.
   - **bug** — `gh issue list --state open --label bug --search '"Alert: #<n>" in:body'`. Found: comment the alert issue's link on it. None: `gh issue create --label bug --title '<the cause, in one line>'` with [the bug body](#the-bug). Comment its number on the alert issue.
   - **not actionable** — the diagnosis already names it.

   Done when the ending's record is on the alert issue.
8. **Return** the alert issue's URL, the ending, and anything the run could not establish.

## The diagnosis

```markdown
## Diagnosis

Alert: <rule> · Environment: <environment> · Labels: <labels> · Since: <startsAt> · Link: <link>

Queries:
- `<the rule's own query>` — [Explore](<link>)
- `<PromQL or LogQL>` — [Explore](<link>)

Finding: <the cause, and what each query showed>

Ending: remediation | change | bug | not actionable: <reason>
```

## The bug

Quote only the log lines that show the cause. Redact first: every token, password, key, email address and client IP becomes a placeholder (`<token>`, `<email>`, `<ip>`).

````markdown
Alert: #<n>

LogQL: `<query>` — [Explore](<link>)

```text
<the minimal redacted log lines>
```

Cause: <what the lines show in the code>
````

## Check

Input: the alert issue. Read its `## Diagnosis` and `## Remediation` comments and the policy.

1. **Judge** every line of the [checklist](#checklist), each fail naming the comment's URL and the line. Done when every comment has been read and every line carries a verdict.
2. **Return** pass only when every line passes, with the list of fails otherwise.

## Checklist

- Every `## Diagnosis` comment names each query it rests on with an Explore link, or states `not actionable: no monitoring access` as why it rests on none.
- Every `## Diagnosis` comment names its ending with one of the four words.
- Every `## Remediation` comment names an action allowed in the alert's environment.
- Every `## Remediation` comment quotes a record line.
