---
name: mockup
description: Mocks up every screen a PRD changes, each in all its states, as one local HTML page built from docs/design-system/skeleton.html. Use to build a PRD's mockup, to revise a mockup from a person's reasons or a revised PRD, or to check a mockup against its checklist.
---

# mockup — one local HTML page per PRD

A **mockup** is one self-contained `.html` page at `docs/design/<PRD number>-<slug>.html` showing every screen a PRD changes, each in all its states. You build it from `docs/design-system/skeleton.html` with file tools; the page is the deliverable, opened in a browser. Variants inside the running app are `/mattpocock-skills:prototype`'s UI branch, and the app's token file follows the skeleton separately.

**The skeleton's leading comment is the markup contract** — how a screen, its states, its surface, an open choice, a placeholder and the footer are marked up. Read it from the skeleton and follow it for every piece of markup; it is kept there, and only there, so that the page and anything reading the page take it from the one file. Carry it into the mockup verbatim.

The issue tracker should be in your context, from the consuming repo's `docs/agents/issue-tracker.md`. If it is not, write nothing and return a refusal naming `/mattpocock-skills:setup-matt-pocock-skills`. If `docs/design-system/skeleton.html` is not on the default branch, write nothing and return a refusal naming `/design-system`. Git host commands below are GitHub's, through `gh`; on another host, take the equivalent action.

## The PRD

Fetch the PRD as the issue tracker doc fetches the relevant ticket; its issue number is the PRD number `N`, its title `PRD: <name>`. Read it by its anchors:

- `Changes what a person sees: yes | no` — with `no`, there is nothing to mock up: write nothing and return that.
- Under `## Requirements`, each block `- **REQ-N.n** <behaviour>` with `  - Visible: yes | no`. The requirements marked `Visible: yes` are what the mockup shows; the user-story `###` heading above a block says who sees it.
- `## Withdrawn` — ids no screen carries.
- `## Revisions` — its last line, `- <date>: <reason>. Added REQ-N.9. Changed REQ-N.2. Withdrew REQ-N.5.`, names what a revised PRD touched.

The slug is the PRD's `<name>` in lowercase kebab-case. The branch is `mockup/<N>-<slug>`.

## Pick the branch

- **Check** — you were asked to check a mockup. Go to [Check](#check).
- **Revise** — an open pull request holds `docs/design/<N>-<slug>.html` and you have a person's reasons or a revised PRD. Go to [Revise](#revise).
- **Build** — anything else. Go to [Build](#build).

Done when one branch is chosen and `N` is known.

## Build

1. **Path.** Fetch the default branch (`git fetch origin`) and add a worktree on a new branch from it, outside the checkout you were invoked in: `git worktree add -b mockup/<N>-<slug> ../<checkout dir>-mockup-<N> origin/<default branch>`. Every write below goes into that worktree, so the invoking checkout stays on its branch with its files as they were. Done when the worktree exists and holds `docs/design-system/skeleton.html`.
2. **Inventory.** List each screen the `Visible: yes` requirements change, with its surface and the ids it covers. Then, per screen, list every state that changes what it shows: each error the PRD names, plus empty, loading, success, dialog and first-run where they apply. Done when every `Visible: yes` id is on a screen, and every screen and every error in the PRD has a state.
3. **Build** `docs/design/<N>-<slug>.html` from the skeleton, replacing its example section with one section per screen from step 2:
   - **Behaviour.** Beside each screen, at most six of the PRD's rules for it, in the PRD's words.
   - **Copy and controls.** Real copy, from the PRD where it gives any; a fact the PRD lacks is a placeholder. Controls are real elements, and any behaviour the PRD specifies works on the page.
   - **Open choices.** Where a new screen's structure is open, up to three options for a person to name one of when they review it.
   - **Footer.** Every choice the PRD did not make, every placeholder, every addition.
   - **Missing pieces.** A token or component the skeleton lacks is added to `docs/design-system/skeleton.html` and `docs/design-system/reference.html` in both themes, then used.

   Done when every screen and state from step 2 is a section, and every line of the [checklist](#checklist) passes.
4. **Show.** Where a person invoked you in an interactive session, open the file with the OS opener (`open`, `xdg-open` or `start`). Otherwise, carry its path to the return.
5. **Lock in.** In the worktree, stage the mockup and any changes under `docs/design-system/`, and nothing else. Commit, in the repo's commit message convention, naming `#<N>`; `git push -u origin mockup/<N>-<slug>`, and open one pull request titled `Mockup: <name>` whose body names `#<N>` and lists the footer's open choices for the reviewer. The worktree stays while the pull request is open: it holds the file the person reviews, and Revise works in it. Done when the pull request exists.
6. **Return** the pull request's URL, the worktree's path to the mockup, and the checklist result.

## Revise

1. **Find the branch** through the open pull request whose files include `docs/design/<N>-<slug>.html`. Use the worktree `git worktree list` shows on its head branch, or add one: `git fetch origin`, then `git worktree add ../<checkout dir>-mockup-<N> <head branch>`. Done when a worktree on the pull request's head branch is up to date with its remote.
2. **Edit** the same file, by whichever input you have:
   - **A person's reasons** — change what each reason asks for, and nothing else.
   - **A revised PRD** — fetch it and read its last Revisions line. Redo only the sections whose `data-req` names a Changed or Withdrew id; place each Added id on its screen, adding a section or state where step 2 of Build would. A Withdrew id leaves every section.

   Done when each reason, or each id on the Revisions line, is reflected on the page, and the [checklist](#checklist) passes.
3. **Show** as in Build step 4. Then **lock in**: stage as in Build step 5, commit as in Build step 5, and `git push`. The branch moves forward only — one new commit on top of the pull request. Done when the commit is on the remote.
4. **Return** the pull request's URL, what changed per reason or id, and the checklist result.

## Check

**Read** the mockup — from the path given, or `git show <head branch>:docs/design/<N>-<slug>.html` from its pull request — its `skeleton.html` and `reference.html` from the same branch, and the PRD. **Report** every line of the [checklist](#checklist) as pass or fail, each fail naming the id, error, token, component, placeholder or URL that fails it. Done when all five lines carry a verdict. The result is the return; every file, branch and pull request is left as it was, so any caller can run Check with no side effects.

## Checklist

The Build and Revise branches end on this list, and the Check branch reports on it.

- Every requirement marked `Visible: yes` is on a screen, and every id on a screen is in the PRD's Requirements.
- Every error the PRD names has a state.
- Only the skeleton's tokens and components are used, or additions the footer lists.
- Every `[Placeholder]` is in the footer.
- The page opens with nothing loaded from the network but fonts: CSS and JS inline, `brand/` assets by relative path.
