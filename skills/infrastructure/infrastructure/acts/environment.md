# environment — one environment, from the policy to running services, in one pull request

**The entry** is `environments.<environment>` in the policy. `<environment>` is **production** when the
entry's `deployed_by` is `named-commit`, and **staging** when it is `trunk-push`. The runtime act the
entry's `runtime` names supplies every part marked **runtime**. Read `acts/environment-opt-ins.md` as
well when any of `previews.enabled`, `release.soft_release.enabled`, `release.tag.enabled`,
`release.e2e_tests.enabled` or a `services.<name>.mobile_app` is `true`: it adds to the deployment
workflow.

## Inputs

Each is the caller's `<key>=<path>` argument, else the `<key>=` line of `<CHECKOUT>/.infra.local.env`,
read as `<GITHUB_CREDENTIAL>` is; `<environment>` in a key is upper-cased.

- **Provider credential** — `INFRA_CREDENTIAL_PROVIDER_<environment>`, a file for the entry's
  `provider` that passes `test -s`.
- **DNS credential** — `INFRA_CREDENTIAL_DNS_<environment>`, a file for the zone's provider; optional.
- **Test-accounts file** — `INFRA_TEST_ACCOUNTS_ENV`, a path; staging only.
- **Contact points** — the alert receivers the caller names; needed when the entry's `monitoring` is
  `added`.

## The deliverables

A deliverable whose files on `origin/<TRUNK>` already meet its contract is **kept**, byte for byte. Any
other is **changed**: only its differing files are written. Every file holds credential and secret
names only; code takes each credential from its tool's own environment variable at apply.

- **Infrastructure code** — the repository's own where it already provisions `<environment>`, extended;
  otherwise `<IAC_TOOL>` under `<IAC_PATH>/<environment>/`, its state in the provider's object storage
  with locking, from that tool's documentation. It holds:
  - the hosts or cluster (**runtime**), and each managed data store, with its address as an output;
  - a DNS record per hostname at the zone's provider, when the DNS credential is present;
  - with `<GITHUB_CREDENTIAL>`, through `<IAC_TOOL>`'s GitHub provider: GitHub environment
    `<environment>`, its rulesets and its variables;
  - for production, a backup bucket in the provider's object storage.
- **Data-store marker** — every data store the runtime runs carries the label `infrastructure.data-store`
  set to `"true"`, where **runtime** says; a restore-test unit carries none.
- **TLS** — ACME only. The repository's own proxy or ingress is kept; otherwise **runtime** terminates it.
- **Deployment workflow** — `.github/workflows/deployment.yml`, one job per environment, each bound to
  its GitHub environment:
  - triggers: a push to `<TRUNK>` deploys each staging environment; `workflow_dispatch` with inputs
    `environment`, `service` and `commit` deploys `commit` (checked out), and is production's only
    trigger;
  - services: the `service` input when given, otherwise the lines `<TOOLS>/changed-paths.sh <environment>`
    prints, run with full history; none printed ends the job green;
  - one GitHub Deployment per run, at the deployed commit, environment `<environment>`, payload
    `{"services": [<each deployed service>]}`; its status is `success` once the entry's
    `health_check_url` answers after the deploy step (**runtime**), `failure` otherwise.
- **Monitoring**, when the entry's `monitoring` is `added` — `tools.monitoring` beside the services
  (**runtime**); alert rules routed to the contact points; retention, dashboards and alert rules as code;
  production's stack on capacity of its own (**runtime**).
- **Backups**, production only — every data store dumped nightly to the backup bucket, and per store a
  restore-test unit `<store>-restore-test` (**runtime**) that restores the latest dump into a database it
  creates, then removes that database.
- **Test accounts**, staging only — the repository's seed data creates each account, reading its
  password from the seed step's environment.
- **Host patching** — security updates install unattended (**runtime**); reboots are a person's.
- **Tool scripts** — `<TOOLS>/rollback.sh`, `restart.sh`, `scale.sh`, `prune.sh` and
  `restore-test.sh`, copies of `<this-skill-dir>/tools/` byte for byte, committed `100755`.

## Steps

1. **Resume.** `gh pr list --state open --limit 1000 --json url,headRefName --jq '.[] | select(.headRefName | startswith("<BRANCH_PREFIX>")) | .url'`.
   Done when none is open, or its link is returned as the result with nothing else written.
2. **Preconditions.** The entry is absent: return a refusal naming it. Contact points are needed and
   none are named: return a refusal naming them. Done when neither refusal applies and the runtime act,
   with the opt-ins act where it applies, is read.
3. **Render.** `git fetch origin`, then decide each deliverable against `origin/<TRUNK>`, reading the
   trunk's files with `git show origin/<TRUNK>:<path>`. Done when every deliverable is kept, or changed
   with its new content in hand.
4. **Nothing differs.** Every deliverable kept:
   1. The provider credential absent: return a refusal naming its key and `<WIZARD>`'s machine script.
      Otherwise, in `<WORKTREE>` detached at `origin/<TRUNK>`, plan the infrastructure code for
      `<environment>`. A plan that destroys or replaces a data store, a volume or a bucket is returned
      for a person, with nothing applied. Any other is applied. Done when a fresh plan shows no change.
   2. Production: `<TOOLS>/restore-test.sh <environment> <store>` per data store. Done when each prints a
      `done` record line.
   3. Staging: generate each test account's password into the test-accounts file by shell redirection,
      with staging's address, then run the seed step with that file as its environment. Done when every
      account signs in.
   4. **Runtime**'s pending-reboot check, read-only. Done when each host awaiting a reboot is listed.
   5. `gh run list --workflow deployment.yml --branch <TRUNK> --limit 1 --json databaseId,conclusion,url`,
      then an HTTP GET of the entry's `health_check_url`. Done when both results are in hand.

   Return "nothing differs", each record line, the hosts awaiting a reboot, the run's conclusion and
   link, and the health check's status. Done when that is returned, or a deliverable is changed.
5. **Branch.** `<WORKTREE>` left by an earlier run: when `git -C <WORKTREE> status --porcelain` prints
   nothing, `git -C <WORKTREE> switch -C <BRANCH> origin/<TRUNK>`; otherwise return its path and stop.
   No `<WORKTREE>`: `git worktree prune`, then `git worktree add -B <BRANCH> <WORKTREE> origin/<TRUNK>`.
   Write each changed deliverable into `<WORKTREE>`, stage each script with `git add --chmod=+x`, and
   commit in the repository's own commit convention, read from `git log`. Done when
   `git -C <WORKTREE> status --porcelain` prints nothing.
6. **The person's part**, when any of these is missing: the provider credential, the DNS credential
   while records are to be set, `<GITHUB_CREDENTIAL>`, or a secret value the services or the workflow
   read. With `/mattpocock-skills:wizard`, author:
   - `<WIZARD>/environment-<environment>-machine.sh` — creates each missing credential file, writes its
     path under its key into `.infra.local.env`, and sets up what **runtime** needs to reach the hosts;
   - `<WIZARD>/environment-<environment>-repository.sh` — sets every secret value as a secret of GitHub
     environment `<environment>`, the DNS records no credential covers, and, without
     `<GITHUB_CREDENTIAL>`, the environment, its rulesets and its variables; run by a repository admin.

   Commit both `100755` on `<BRANCH>`. Done when both are committed, or nothing is missing.
7. **Push and open.** `git -C <WORKTREE> push -u origin <BRANCH>`, once. Then `gh pr create --base <TRUNK>
   --head <BRANCH> --title "<title>" --body-file -`, the body naming each changed deliverable and that
   this mode runs again after the merge to apply from `<TRUNK>`. Done when its link is in hand.
8. **The issue**, after step 6 only. `gh issue create --title "<title>" --body-file -`, the body naming
   the pull request, each script with the command that runs it and who runs it, and that this mode is
   run again once the issue is closed. Done when the issue's link is in hand.
9. **Return** the pull request's link; each deliverable, kept or changed; `<WORKTREE>`; and, with a
   person's part, "stopped until <issue link> is closed". Done when all of it is returned.
