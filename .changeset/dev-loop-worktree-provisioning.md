---
"ieuanign-skills": patch
---

`/dev-loop`: worktrees move to `.claude/worktrees/`, and provisioning stops copying `.claude` into them.

Act 2 copied `<MAIN>/.claude` into every lane worktree, justified as "the CLAUDE.md layer must exist in the worktree". That justification was wrong twice over: `CLAUDE.md` is a tracked root file the checkout already delivers, and `.claude/` is a different thing entirely. Nothing needed the copy — the agents are Agent-tool subagents of a session rooted in MAIN, so their definitions, skills, settings, and permissions resolve from MAIN's config regardless of which directory they `cd` into, and no bundled agent or phase script references `.claude/` at all.

What the copy did do was inject files that are untracked in the worktree. In a repo that neither tracks nor gitignores `.claude/` — the default state after a first run, since Act 0 creates the roster there — Gate 2's `git worktree remove`, forbidden from using `--force`, then refused on every lane. Worktrees accumulated and the closing guarantee that a fully approved run leaves only the main worktree was false. Deleting the copy removes the cause: a worktree now holds the checkout plus declared `.worktreeinclude` files, nothing else.

Worktrees also move from `.scratch/worktrees/` to `.claude/worktrees/`, matching where Claude Code's own worktrees live, with a precondition that the path is gitignored so a live worktree never pollutes MAIN's `git status`. `.scratch/` stays for plans. The `.worktreeinclude` guard line follows to `!.claude/worktrees/**`.

`.worktreeinclude` guidance tightens to match what it is for: env files and local config a checkout cannot run without. Dependencies are explicitly excluded — a copied `node_modules/` carries platform-specific native builds and drifts from the lockfile — so the code-writer now installs from the module's lockfile when a cold worktree lacks them, and the debugger treats missing dependencies as a setup step rather than a code fault.

Verified across all three repo classes (gitignores `.claude/`, tracks `.claude/agents/`, neither): removal succeeds without `--force`, `.env` reaches the worktree, `node_modules` does not, and MAIN's `git status` stays clean with a live worktree.
