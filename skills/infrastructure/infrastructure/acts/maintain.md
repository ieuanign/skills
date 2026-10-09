# maintain — the monthly run: pins, tool scripts, retention, backups, certificates and DNS

Every change this act makes to the repository goes through `acts/change.md`, read when step 4 or 5
first performs it; each performance derives its own `<mode>`, `<BRANCH>` and `<WORKTREE>`.

**A pin** is a version the repository names for something it runs or builds with: a workflow action
under `.github/workflows/`, a base image, a language runtime, and each image and chart of
`tools.monitoring`. Its **latest** is the newest stable release its own release source lists, looked up
at run time. A bump from a pin to its latest is **major** when it changes the version's first numeric
component; every other bump is **minor**.

**A tool script** is `<TOOLS>/<name>` on `origin/<TRUNK>` for each `<name>` in `<this-skill-dir>/tools/`.
It is **current** when it equals `<this-skill-dir>/tools/<name>` byte for byte; **shipped** when the
last commit touching it on `origin/<TRUNK>` (`git log -1 --format=%H origin/<TRUNK> -- <path>`) belongs
to a pull request whose head branch starts `infrastructure/`
(`gh api repos/{owner}/{repo}/commits/<sha>/pulls --jq '.[0].head.ref'`); **edited** otherwise.

**The reports issue** is the open issue titled exactly `Infrastructure reports`:
`gh issue list --state open --search 'in:title "Infrastructure reports"' --json number,title`, keeping
the exact title. None: `gh issue create --title 'Infrastructure reports' --body-file -` with a one-line
body saying what it collects, then `gh issue pin <n>`.

## Steps

1. **Credentials.** `git fetch origin`. Each environment's provider credential is the caller's
   `INFRA_CREDENTIAL_PROVIDER_<ENVIRONMENT>=<path>` argument, else that line of
   `<CHECKOUT>/.infra.local.env`, read as `<GITHUB_CREDENTIAL>` is. One absent: return a refusal naming
   its key, with nothing changed. Done when every environment has its credential.
2. **Pins.** Read every pin from `origin/<TRUNK>` with `git show origin/<TRUNK>:<path>`, and its latest.
   Done when each pin is classified unchanged, minor or major, with its current and latest version.
3. **Tool scripts.** Classify each tool script. An edited one is left as it is; its
   `git diff --no-index <this-skill-dir>/tools/<name> <its trunk content>` goes into the report. Done
   when each is current, shipped or edited, with each edited one's diff in hand.
4. **The monthly change.** A major bump is held out of this change. The request is every minor bump
   and, for each shipped tool script, its content replaced by `<this-skill-dir>/tools/<name>`, mode
   `100755`; its origin is "the monthly maintain run", its slug `maintain-<YYYY-MM>`. Nothing in the
   request: no pull request. Otherwise perform `acts/change.md` with it. Done when its result — a link,
   "nothing differs", or a refusal — is in hand, or the request is empty.
5. **Major upgrades.** Per major bump, read the release notes of every version between the pin and its
   latest, and list each breaking change they state. Perform `acts/change.md` with that one bump as the
   request, the breaking changes listed in its pull request body, slug `upgrade-<pin>-<major>`. Done
   when every major bump has its change's result in hand.
6. **Retention against disk.** Per environment, each retention its infrastructure code states — the
   backups and `tools.monitoring`'s data — with the used and total size of the storage holding it, read
   through the provider's own query. A finding is data older than its retention still held, or
   storage whose free space is under the size of the data held within that retention, one period's
   growth. Done when every retention has its sizes and verdict.
7. **Prune.** Per backup bucket: a store whose retention the infrastructure code leaves unstated is not
   pruned and becomes a finding. Otherwise delete each backup object older than that retention, never
   the newest backup of any store. Done when every deleted object is listed, or none was due.
8. **Certificates.** Per hostname the infrastructure code or a `health_check_url` names,
   `curl -sSv -o /dev/null https://<hostname> 2>&1`. A finding is a failed verification or an expiry
   under 14 days away. Done when every hostname has its expiry and verdict.
9. **DNS.** Per DNS record the infrastructure code declares, resolve its name and type. A finding is a
   name that does not resolve or resolves to a value other than the declared one. Done when every record
   has its verdict.
10. **Report.** Find or create the reports issue, then post on it with
    `gh issue comment <n> --body-file -` from a quoted heredoc a comment beginning `## Maintain`: the
    date, each pull request link or "nothing differs", each major held out with its link, each edited
    tool script's diff, retention against disk, the pruned objects, certificates, DNS, and every
    finding. A failed pin still posts the comment. Done when the comment's URL is in hand.
11. **Return** the comment's URL, each pull request link, each refusal from the change act, and every
    finding. Done when all of it is returned.
