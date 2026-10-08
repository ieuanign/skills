---
name: setup-infra
description: Set a repository up for its infrastructure — the delivery policy by rounds, the tools and credentials it needs, and this machine's credential paths.
disable-model-invocation: true
---

# setup-infra — a person's front door to the infrastructure

Run first, and again whenever the setup changes. It asks, checks and writes; it builds nothing — the
building is `infrastructure`'s, and this skill ends by naming that call.

**Every write happens only on an explicit yes.** There are four: the policy (through `delivery-policy`
Write), the `.gitignore` line, `.infra.local.env`, and the first policy's commit, push and pull request.
Each mutates the person's repository or machine, so each is shown first and made only once accepted.
Git host commands are GitHub's, through `gh`; on another host, take the equivalent action.

## Pick the branch

- **First run** — `docs/delivery-policy.md` is absent.
- **Later run** — `docs/delivery-policy.md` is present.

Steps 2, 3 and 5 are the same on both. Done when one branch is chosen.

## 1. The policy

Call `delivery-policy` through the Skill tool for its Observe branch, passing no fixed rules.

- **First run.** Put the question set it returns to the person in rounds, in its order: question 1
  (keep all of it?) first, then each gap and broken fixed rule, each shown with its recommendation.
  Ask only the questions Observe returned.
- **Later run.** Read `docs/delivery-policy.md` and show it to the person first, then put the question
  set and ask only what should change; every other answer keeps the policy as it stands.

Fill the answers into the question set and call `delivery-policy` through the Skill tool for its Write
branch with it. Write is the only writer of `docs/delivery-policy.md`. Done when Write returns its
checklist result, and every fail on it is shown to the person.

## 2. The preconditions

Derive from the written policy's front matter what the run needs, check each, and report every missing
item in one list. This step installs nothing and fixes nothing.

- **Tools on `PATH`**: `gh`, the infrastructure-as-code tool, each runtime's tools, and each
  environment's provider CLI — the binary for each named from the policy's value, confirmed with the
  person where the name is unclear.
- **Credential files**: a presence test on each path only. Never open, print or copy a credential.
- **`gh` scopes**: `gh auth status`, against what the policy asks of GitHub. Each missing scope is reported with the rule that needs it.

Done when every tool, credential path and scope is reported present or missing.

## 3. The machine's paths

`.infra.local.env`, at the repository root, holds this machine's credential paths for `infrastructure`
to read — paths only, never a file's contents. Keys:

```text
INFRA_CREDENTIAL_<PROVIDER>_<ENVIRONMENT>=<path>
INFRA_TEST_ACCOUNTS_ENV=<path>
```

`<PROVIDER>` and `<ENVIRONMENT>` are the policy's provider and environment names, upper-cased. Where no
environment in the policy needs a credential, skip this step.

1. **Ask once** for every path the policy's environments need. Where the file exists, show it and ask
   only what should change.
2. **Show** the proposed file.
3. **Run `git check-ignore -q .infra.local.env`.** On a non-zero exit, offer the `.infra.local.env`
   line for `.gitignore`.

Done when the file and any `.gitignore` line are written as accepted, or declined.

## 4. Committing

- **First run.** Offer a branch holding one commit — `docs/delivery-policy.md`, and the `.gitignore` line
  when step 3 added one — pushed, with a pull request opened through `gh`, all in the repository's own
  branch and commit conventions. Done when the pull request's link is shown, or the offer is declined.
- **Later run.** Commit nothing. Write's change stays in the working tree, with any new `.gitignore`
  line, for `infrastructure`'s change mode to carry into the same pull request as the pipeline. Done
  when the changed files are named.

## 5. The next step

Name the `infrastructure` call to make next; invoke none.

- **First run** — `infrastructure` set up, first run; then set up, one environment, once for each
  environment in the policy.
- **Later run** — `infrastructure` change, with the policy's working-tree change as its input.

Done when the call is named, with every item step 2 reported missing listed beside it.
