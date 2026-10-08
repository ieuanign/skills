---
"ieuanign-skills": minor
---

setup-infra: a new skill under `skills/infrastructure/` that a person runs first and again whenever the setup changes. It puts `delivery-policy` Observe's question set to the person by rounds, each question with its recommendation, and writes the answers through `delivery-policy` Write; checks that the tools on `PATH`, credential files (by existence only) and `gh` scopes the policy needs are in place, reporting every missing item; writes this machine's credential paths to a gitignored `.infra.local.env`; opens a first policy as its own pull request, or hands a later change to `infrastructure` change; and ends by naming the `infrastructure` call to make next. It builds nothing, and writes only on an explicit yes. User-invoked.
