---
name: infrastructure
description: Builds and changes a repository's pipeline and infrastructure code from its delivery policy, only through a pull request. Use to set a repository's pipeline up on a first run, or to set one environment up.
---

# infrastructure — the pipeline and its infrastructure code, from the policy, through a pull request

You change a repository's pipeline and infrastructure code, only by opening a pull request. Every tool
comes from the delivery policy. Nobody is asked anything: a step only a person can do becomes an issue,
and you stop.

## Hard rules

- **The policy first.** Invoke `delivery-policy` through the Skill tool for its Check branch on
  `<POLICY>`, before any other step. Proceed only when the file exists, every Check line passes, and
  both `delivery-policy` and `mattpocock-skills:wizard` are among your available skills. Otherwise write
  nothing and return a refusal naming each missing file, failing rule and missing skill.
- **The policy names every tool.** Each tool is a policy value. Look its documentation up at run time
  (its `--help`, its official documentation) and write what that documentation says.
- **Credentials are logged in with, never read.** A credential reaches a tool only through that tool's
  own login mechanism — shell redirection, or an environment variable set in the same command. Test a
  credential file with `test -s` alone. Its content stays out of your context, the terminal, every file
  you write and every log; `.infra.local.env` holds paths only.
- **A person's part is one issue.** A step the credentials given cannot do becomes two scripts authored
  with `/mattpocock-skills:wizard`, committed under `<WIZARD>` in the delivering pull request: the
  **Machine part** (the credential files, run on the machine that runs this skill) and the
  **Repository part** (what needs a repository admin, run by one). Open one issue naming both, then
  stop and return its link; the mode is run again once that issue is closed.
- **A pull request, or nothing.** Every change reaches the repository in one pull request from
  `<BRANCH>`, written in `<WORKTREE>` so the invoking checkout stays as it is. Where nothing differs
  from `<TRUNK>`, open none.
- **Apply from the trunk.** Infrastructure code is applied only from `<TRUNK>` after its pull request
  merges, never from a branch.
- **GitHub is append-only.** Create issues, comments and pull requests; leave every human-written body
  and label as it is.
- Every `gh` command runs inside the checkout with no `--repo`; `gh api` paths use `{owner}/{repo}`;
  every body goes in with `--body-file -` from a quoted heredoc.

## The modes

Run the mode the caller names. Read its act file before performing it: the freshly read file is that
mode's whole contract.

1. **first-run** (`acts/first-run.md`): the pull request check, the two tool scripts and the branch
   rules, delivered in one pull request; no environment is built.
2. **environment** (`acts/environment.md`): one environment the caller names, `<environment>`, built
   from the policy and delivered in one pull request; `<mode>` is `environment-<environment>`.
3. **change** (`acts/change.md`): one requested change, planned and delivered in one pull request that
   says how to undo it; a plan that destroys data is refused.
4. **apply** (`acts/apply.md`): one merged change applied from `<TRUNK>`'s current head; any other ref
   is refused by name.
5. **maintain** (`acts/maintain.md`): the monthly run — pins bumped and tool scripts refreshed in one
   pull request, each major upgrade in its own, backups pruned past retention, certificates and DNS
   checked, all reported on the pinned reports issue.

An act that builds or changes `<environment>` is read with the runtime act its `runtime` names:
`acts/compose.md` or `acts/kubernetes.md`.

## Derived facts

`<POLICY>` first, for Check; the rest once, after Check passes and before reading an act. A policy rule's fact is its `value`.

- **this-skill-dir** — the directory this file lives in; bundled assets are `<this-skill-dir>/<name>`.
- **CHECKOUT** — `git rev-parse --show-toplevel` in the invoking directory.
- **POLICY** — `<CHECKOUT>/docs/delivery-policy.md`.
- **TRUNK** — `branching.trunk`.
- **MERGE_METHOD** — `branching.merge_method`.
- **CHECK_COMMAND** — `branching.check_command`.
- **TOOLS** — `paths.tools`, a directory relative to the repository root.
- **WIZARD** — `paths.wizard`, a directory relative to the repository root.
- **IAC_TOOL** — `infrastructure_as_code.tool`.
- **IAC_PATH** — `infrastructure_as_code.path`.
- **GITHUB_CREDENTIAL** — the GitHub admin credential's path: the caller's `INFRA_CREDENTIAL_GITHUB=<path>`
  argument, else the output of `grep -m1 '^INFRA_CREDENTIAL_GITHUB=' <CHECKOUT>/.infra.local.env | cut -d= -f2-`;
  absent when neither gives a path that passes `test -s`.
- **CHECK_WORKFLOW** — `.github/workflows/pull-request-check.yml`, whose one job is `check`: the name
  the branch rules require.
- **BRANCH_PREFIX** — `infrastructure/<mode>`.
- **BRANCH** — the first of `<BRANCH_PREFIX>`, `<BRANCH_PREFIX>-2`, `<BRANCH_PREFIX>-3`, … for which
  `git ls-remote --exit-code --heads origin <name>` exits 2: a name no earlier pull request left behind.
- **WORKTREE** — `<CHECKOUT>-infrastructure-<mode>`, a sibling of the checkout. It stays while its pull
  request is open.
