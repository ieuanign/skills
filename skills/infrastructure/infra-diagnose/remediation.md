# remediation — one allowed action, then the re-check

Read only when Diagnose step 5 chose `remediation`. `<n>` is the alert issue, `<action>` the allowed action, `<tools path>` is `paths.tools`. Each script's argument shape is its `usage:` line and its record line's shape is its header: read both from `<tools path>/<action>.sh` now. A `scale` count lies within `environments.<environment>.scale.min` and `.scale.max`.

One action per alert. A second action for the same alert is never taken.

1. **Dry run.** `<tools path>/<action>.sh --dry-run <environment> …` from the checkout's root. A record line beginning `refused` or `failed`, or a non-zero exit: comment on `<n>`, beginning `Handed on:`, the record line and stderr verbatim and that the alert is a person's now; leave the issue open and return. Done when the dry run's record line begins `dry-run`.
2. **The action.** The same command without `--dry-run`, once. Done when its record line is in hand, whatever its status.
3. **Wait** until the alert rule's own evaluation window, read from the rule in Grafana, has passed since the action. Done when it has.
4. **Re-check.** Read the alert rule's state and its query again from Grafana. Done when the alert is known cleared or not.
5. **The comment.** `gh issue comment <n> --body-file - <<'EOF'`:

   ````markdown
   ## Remediation

   Action: <action> · Environment: <environment> · Target: <service>

   ```text
   <the record line, verbatim>
   ```

   Re-check: `<the rule's query>` — [Explore](<link>) — cleared | not cleared
   ````

   Done when it is posted.
6. **Close or hand on.**
   - **Cleared** — `gh issue close <n> --comment` with a one-line closing note naming the re-check.
   - **Not cleared** — comment, beginning `Handed on:`, that the alert is a person's now; leave the issue open.

   Done when the issue is closed or carries the hand-on comment.
