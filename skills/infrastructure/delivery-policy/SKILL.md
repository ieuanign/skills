---
name: delivery-policy
description: Observes, writes and checks a repository's delivery policy — `docs/delivery-policy.md`, whose schema-validated front matter says how the code is branched, merged, deployed and released, each rule marked `client`, `suggested` or `required`. Use to observe a repository and return the policy's question set, to write the policy from an answered question set, or to check a policy against its schema.
---

# delivery-policy — observe, write and check a repository's delivery policy

The policy is `docs/delivery-policy.md` in the consuming repository: YAML front matter that tools and
other skills read, then a body that says the same for people. Beside this file:

- `delivery-policy.schema.json` — the contract: every rule, its type, which are required, and the shape
  that holds a rule's value beside its mark.
- `example-policy.md` — a complete valid policy, in the form Write emits.
- `suggestion.md` — the recommendation for every rule.
- `check-policy.mjs` — the schema check, run by path: `node <this-skill-dir>/check-policy.mjs <policy>`.

A rule is named by its path, as `check-policy.mjs` prints it: `branching.merge_method`,
`environments.staging.runtime`. Nobody is asked anything here: a caller that wants a person's answers
puts the question set to that person and passes the answers to Write.

Every `gh` command runs inside the checkout with no `--repo`; `gh api` paths use `{owner}/{repo}`.

## Marks

- `client` — a rule observed and kept; a caller's fixed rule the repository meets; the owner's own
  answer.
- `suggested` — a gap filled from its recommendation in `suggestion.md`.
- `required` — a caller's fixed rule the repository breaks. It carries `change`, naming the change
  needed.

## Pick the branch

- **Check** — you were asked to check a policy. Go to [Check](#check).
- **Write** — you were given an answered question set. Go to [Write](#write).
- **Observe** — anything else. Go to [Observe](#observe).

Done when one branch is chosen and, for Observe, the caller's **fixed rules** are listed: the
`<rule>: <value>` lines in the call, such as `branching.merge_method: "rebase"`, or none.

## The writes this skill makes

Write creates or replaces `docs/delivery-policy.md` in the working tree, creating `docs/` when absent.
That is the only write. Observe and Check write nothing. The caller stages and commits the file; this
skill leaves git as it found it.

## Observe

Each source below is read once. A source that cannot be read (an HTTP 403, `gh` not signed in, a file
absent) is **not observed** with its reason, and its rules become gaps.

1. **Trunk and merges.** `gh repo view --json defaultBranchRef,mergeCommitAllowed,squashMergeAllowed,rebaseMergeAllowed`,
   then `git log --first-parent -n 50 --format='%H %P %s' <trunk>`: commits with two parents are merge
   commits, `(#<n>)` subjects on single-parent commits are squash or rebase merges. Done when
   `branching.trunk` and `branching.merge_method` each have a value or a reason.
2. **Rules on the trunk.** `gh api repos/{owner}/{repo}/rulesets`,
   `gh api repos/{owner}/{repo}/branches/<trunk>/protection`, and `CODEOWNERS` (at the root, in `.github/`
   or in `docs/`). These settle no rule of their own: they are the source shown beside `branching.trunk`
   (a pull request required, direct pushes blocked) and `branching.check_command` (the required checks).
   Done when each of the three is read or not observed.
3. **Workflows.** Every file in `.github/workflows/`: the command a `pull_request` workflow runs, deploy
   jobs with their triggers (a trunk push, a `workflow_dispatch` taking a commit), end-to-end steps, tag
   and release steps, and variables passed through by a shared prefix. Done when every workflow file is
   read.
4. **Environments.** `gh api repos/{owner}/{repo}/environments`, then
   `gh api repos/{owner}/{repo}/environments/<name>/variables` for each. Done when each environment's
   name and variable names are known or not observed.
5. **Deployment files.** Dockerfiles, Compose files, Helm charts and Kubernetes manifests, Terraform or
   OpenTofu (`*.tf`, `*.tofu`), `fly.toml` and other platform files, a `Fastfile`: the services and the
   paths each builds from, each environment's runtime and provider, the infrastructure-as-code tool and
   its path, and the proxy, ingress, certificates, monitoring, deployment and mobile build tools in use.
   Done when every such file is read.
6. **Tags and releases.** `git tag --sort=-creatordate | head -n 20` and `gh release list --limit 20`.
   Done when the tag format in use, or its absence, is known.
7. **Derived files.** Lock files, generated changelogs and `.gitattributes` `linguist-generated` entries.
   Done when `branching.derived_files` has a value or is a gap.
8. **Sort every rule.** Take every rule the schema requires, for each service and environment observed;
   with none observed, the service and environment names are themselves gaps. A rule under an opt-in
   (`previews.domain`) counts only when that opt-in is observed on or fixed on. Put each in exactly one
   place:
   - observed → question 1, mark `client`;
   - a fixed rule the repository meets, or one nothing in the repository bears on → question 1, mark
     `client`, source "fixed by the caller";
   - a fixed rule the repository breaks → a question of its own, mark `required`;
   - anything else → a gap: a question of its own, carrying its recommendation from `suggestion.md`.

   Done when every rule sits in exactly one place.
9. **Return** the question set in the shape below. Done when it holds question 1 and one question per
   gap and per broken fixed rule, each with its recommendation.

## The question set

Observe returns it and Write reads it back with the answers filled in — one document for both.

````markdown
# Delivery policy questions

Fixed rules: <each `<rule>: <value>` the caller passed, or none>

## 1. Keep all of it?

Observed:
- `branching.trunk`: "main" — `gh repo view` — client
- `environments.production.deployed_by`: "named-commit" — fixed by the caller, met in `.github/workflows/deploy.yml` — client

Not observed:
- `gh api repos/{owner}/{repo}/rulesets` — HTTP 403

Answer: keep all of it | keep it with the changes below
Changes, one `<rule>: <value>` per line:
```text
```

## 2. `branching.merge_method` — gap

Observed: nothing
Recommendation: "rebase" — <its reason from suggestion.md>
Mark: suggested when the recommendation is kept, client otherwise
Answer:
```text
```

## 3. `environments.production.deployed_by` — breaks a fixed rule

Observed: "trunk-push" — `.github/workflows/deploy.yml`
Fixed: "named-commit"
Recommendation: <the change that makes the repository meet it>
Mark: required
Answer, the change needed:
```text
```
````

## Write

1. **Read the answers.** Done when every question in the set has its answer: an empty box keeps the
   recommendation, or keeps all of question 1.
2. **Resolve each rule.** Question 1: each observed rule keeps its value as `client`; each line under
   Changes replaces that rule's value, as `client`. A gap: the recommendation kept is `suggested`, any
   other value is `client`. A broken fixed rule: the fixed value, `required`, with `change` set to the
   answer, or to the recommendation when the box is empty. Done when every rule has a value and a mark,
   and every `required` rule a change.
3. **Front matter.** Follow `example-policy.md` for the shape and `delivery-policy.schema.json` for the
   rules. Emit this YAML subset only: block mappings and block sequences, two-space indentation, every
   string double-quoted, integers, `true`, `false`, `null`, `#` comments. An opt-in left off carries only
   its `enabled` rule. Done when every rule the schema requires is present with its value and mark.
4. **Body.** After the front matter, a `# Delivery policy` heading, then one `##` section per top-level
   front matter section other than `schema_version`, in the same order. Each rule is one bullet: its name, its path, its value, its
   mark, and for a `required` rule "Change needed:" and the change. Done when every rule in the front
   matter has exactly one bullet saying the same value and mark.
5. **Write the file** to `docs/delivery-policy.md`, creating `docs/` when absent. Done when the file
   exists.
6. **Check** it as in [Check](#check) and fix each fail. Done when every checklist line passes.
7. **Return** the path, the checklist result, the count of rules per mark, and each `required` rule with
   its change.

## Check

1. **Run the schema check.** `node <this-skill-dir>/check-policy.mjs <policy>`, the policy being the path
   the caller named, else `docs/delivery-policy.md`. It prints `pass <rule>` or `fail <rule>: <reason>`
   per rule and exits 0 only when every line passes. Done when its output and exit status are in hand.
2. **Read the body** against the front matter. Done when each front matter rule is matched to its bullet
   or found missing.
3. **Report** every line of the [checklist](#checklist) as pass or fail, each fail with the rule that
   fails it, and the script's output beneath. Done when every line carries a verdict. The policy is
   left as it was.

## Checklist

The Write branch ends on this list, and the Check branch reports on it.

- `check-policy.mjs` exits 0: every rule the schema requires is present and marked, every `required` rule
  names its change, and `schema_version` is the one the schema pins.
- No opt-in's `enabled` is `true` with mark `suggested` — the suggestion turns none on.
- The body has one section per top-level front matter section other than `schema_version`, in the same
  order.
- The body states each front matter rule with the same value and mark, and each `required` rule's change.
