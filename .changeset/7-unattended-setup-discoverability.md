---
"ieuanign-skills": patch
---

`dev-loop`: the README says what an unattended run needs before it can report anything.

Both of the reporting channels an unattended run uses are optional and **silent when absent** — which is what makes them cost nothing to skip, and also what made them impossible to discover. A developer who installed the plugin and ran `/dev-loop auto` got no labels and no messages, with nothing anywhere naming what to set up: the three workflow labels were mapped only in this repo's own `docs/agents/triage-labels.md`, which never installs into a consumer, and the two environment variables were named only in a comment inside `notify.sh`, a file nobody has reason to open.

The README now carries both, with the commands: `gh label create` lines for the three labels, where to map roles to strings and that the names are yours to choose, and the two variables with what happens when each is missing. It also says plainly that neither applies to a supervised run.

`notifications.md` gains the durability clause the rest of the file implied but never stated: **no notification failure changes the lane it is reporting.** A failed `gh` command, a role with no label string, a label string naming a label the tracker does not have, an unreachable channel — each is reported and let go, and the lane's ending, push, pull request and worktree are what they would have been anyway. A run whose reporting is broken still does the work.
