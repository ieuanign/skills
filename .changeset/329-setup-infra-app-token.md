---
"ieuanign-skills": patch
---

setup-infra: the `gh` scope check no longer reports `repo` and `workflow` missing on a token that carries no scopes. Where `gh auth status` prints a `Token scopes` line — a `gh auth login` or classic personal access token — each of the two scopes absent from it is still reported missing, and a line reading `none` reports both. Where it prints none — a GitHub App installation token or a fine-grained personal access token, whose access is repository permissions — the skill reports one note instead: scopes do not apply to this token, and its permissions to push to the repository, `.github/workflows/` included, and to call the repository API were not checked. The next step lists that note after the missing items, as a note and never as one of them.
