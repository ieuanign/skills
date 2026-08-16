# Act 4 — the cost log (per the Run mode guard: `unattended` only)

Once the LAST layer's Gate 2 is done and the run has nothing left to do, write one cost log per lane — per lane and not per layer.

Per issue **the run was asked to work** — the list Act 0 parsed, before anything dropped or refused a lane:

```bash
mkdir -p <MAIN>/.scratch/dev-loop-cost
# `|| rm` because a redirect creates its file before the command runs: without it a
# failure leaves a zero-byte log, which reads as measured-and-free rather than unmeasured.
node <this-skill-dir>/cost-report.mjs --issues <n> <transcriptDir>... \
  > <MAIN>/.scratch/dev-loop-cost/<n>.txt \
  || rm -f <MAIN>/.scratch/dev-loop-cost/<n>.txt
```

- **One file per lane, keyed by the issue number.** `.scratch/` is gitignored — Act 0's preconditions guarantee it.
- **Every transcript directory the run captured**, planning and every layer, in one command.
- **Every lane, whatever its ending** — and a lane whose plan never came back READY, which has no ending to speak of. A lane dropped at intake before any agent ran gets one too, saying it was not measured.
- **Nothing goes to the issue thread or the PR body.**
- **Best-effort, and last.** A failure here — the script missing, a directory unreadable, no transcript directory captured at all — is reported and dropped. It never changes a lane's ending, never blocks the run's conclusion, and never makes a batch report failure.

Then tell the user where the logs are. `cost-report.mjs` measures on the metric the baseline was measured on, and a comparison against any other metric is meaningless.
