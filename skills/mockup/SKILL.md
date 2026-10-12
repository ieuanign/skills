---
name: mockup
description: Drafts the screens a PRD changes as a throwaway mockup under .scratch/, then on a person's confirmation turns each into a design prototype under docs/design/ — one interactive page per screen, shared by every PRD that touches it. Use to build a PRD's mockup, to revise it from a person's reasons or a revised PRD, to confirm it into design prototypes, or to check either against its checklist.
---

# mockup — a throwaway draft per PRD, a design prototype per screen

Two things, told apart by what lasts:

- A **mockup** is the draft of one PRD's screens, each in all its states. It is working material in the **draft folder** `.scratch/mockups/<N>-<slug>/`, opened in a browser by the person deciding the design, and deleted once they confirm it.
- A **design prototype** is one screen at `docs/design/<folder>/<screen>.html`: every state reachable from its floating panel, its controls driving those states as the requirements say. `<folder>` is the screen's surface — `web`, `mobile` for ios and android, `email`, `pdf` or `notification`. A screen has one however many PRDs touch it, so a later PRD changes the page an earlier one left.

Variants inside the running app are `/mattpocock-skills:prototype`'s UI branch.

**The leading comment of `docs/design-system/skeleton.html` is the markup contract** — how a screen, its states, its frame, an open choice, a placeholder, the footer and the panel are marked up, and which files a page links. Read it there and follow it for every piece of markup.

The issue tracker should be in your context, from the consuming repo's `docs/agents/issue-tracker.md`. If it is not, write nothing and return a refusal naming `/mattpocock-skills:setup-matt-pocock-skills`. If `docs/design-system/prototype.html` is not on the default branch, write nothing and return a refusal naming `/design-system`. Git host commands below are GitHub's, through `gh`; on another host, take the equivalent action.

## The PRD

Fetch the PRD as the issue tracker doc fetches the relevant ticket; its issue number is the PRD number `N`, its title `PRD: <name>`. Read it by its anchors:

- `Changes what a person sees: yes | no` — with `no`, there is nothing to mock up: write nothing and return that.
- Under `## Requirements`, each block `- **REQ-N.n** <behaviour>` with `  - Visible: yes | no`. The requirements marked `Visible: yes` are what the screens show; the user-story `###` heading above a block says who sees it.
- `## Withdrawn` — ids no screen carries.
- `## Revisions` — its last line, `- <date>: <reason>. Added REQ-N.9. Changed REQ-N.2. Withdrew REQ-N.5.`, names what a revised PRD touched.

The slug is the PRD's `<name>` in lowercase kebab-case. The branch is `mockup/<N>-<slug>`.

## Pick the branch

- **Check** — you were asked to check a mockup or a design prototype. Go to [Check](#check).
- **Confirm** — the person has confirmed the design the draft folder holds. Go to [Confirm](#confirm).
- **Revise** — the draft folder exists, or an open pull request is on `mockup/<N>-<slug>`, and you have a person's reasons or a revised PRD. Go to [Revise](#revise).
- **Build** — anything else. Go to [Build](#build).

Done when one branch is chosen and `N` is known.

## Build

1. **Inventory.** List each screen the `Visible: yes` requirements change, with its surface and the ids it covers. Per screen, list every state that changes what it shows: each error the PRD names, plus empty, loading, success, dialog and first-run where they apply. Per screen, name the persona it opens as — the user-story heading its requirements sit under — or none, and what on it differs by key. Per web or phone screen, name its route in the app. Per screen that opens over another — a side panel, a sheet, a dialog with its own route — name the screen behind it. Then mark each screen **existing** or **new**: after `git fetch origin`, `git ls-tree -r --name-only origin/<default branch> docs/design/` lists the design prototypes, each named for its screen. A screen one of them already draws is existing, and keeps that page's name and folder. Done when every `Visible: yes` id is on a screen, every screen and every error in the PRD has a state, every screen names its persona or none, every web or phone screen names its route, every screen that opens over another names the screen behind it, and every screen is marked.
2. **Patterns.** For each pattern the screens need — a table, a form, a dialog, navigation, an empty state — find how it is already built: first in the design prototypes, then in the code components, at the path the components comment in `docs/design-system/skeleton.css` names. Draw each as it is already built. A **conflict** is a pattern the design prototypes and the code build differently, or one the PRD needs that contradicts either, and every conflict is recorded on its screen's `conflicts` list, as the contract marks it up: an existing screen's in its copy's panel, a new screen's in the draft's footer, the item naming its screen.
   - **Raise** each with both sides and their paths. Where a person invoked you in an interactive session, run `/mattpocock-skills:grilling` over them until each has a ruling: the side that stands. Otherwise the conflict stays open on the draft, and its screen is drawn as the design prototypes have it.
   - **Fix** the side that lost. A ruling moves the item to `settled`, with the date and the ruling. The design side — a design prototype, the skeleton, the reference page — is fixed in a pull request of its own, on `design-fix/<N>-<slug>` and titled `Design fix: <pattern>`, opened as [Confirm](#confirm) steps 2 and 4 open one, with the ruling in `settled` on each design prototype it changes; return its URL and stop, because Build starts again once it merges. The code side is filed as an issue, as the issue tracker doc files one, and named in a `todo` line on that screen, and the mockup is drawn to the ruling.

   Done when every pattern on the screens names where it is already built or is new to the project, and every conflict is on its screen's list: open, or settled with a pull request or an issue.
3. **Draft** into the draft folder. `git check-ignore -q .scratch` says whether the repository ignores it; where it does not, add `.scratch/` to `.git/info/exclude`.
   - **New screens** are sections of `mockup.html`, built from `docs/design-system/skeleton.html`. Beside each, at most six of the PRD's rules for it, in the PRD's words. Where a new screen's structure is open, up to three options for the person to name one of. The footer lists every choice the PRD did not make, every placeholder and every addition.
   - **Existing screens** are copies of their design prototypes, at `<folder>/<screen>.html` (`git show origin/<default branch>:docs/design/<folder>/<screen>.html`). Change the copy: its states, its controls, and this PRD's ids added to `data-req`. It keeps its panel's lists, less each `todo` whose issue is closed, read as the issue tracker doc fetches the relevant ticket.
   - **Shell.** A signed-in screen sits in its app's shell, by `data-shell` and its `data-route` as the contract marks them up; the draft carries no copy of the frame.
   - **Page behind.** A screen that opens over another carries `data-over` as the contract marks it up, valued relative to the draft page: the draft's copy of the screen behind where the draft holds one, else that screen's design prototype under `docs/design/` on the default branch, else — a screen new in the draft — its name.
   - **Copy and controls.** Real copy, from the PRD where it gives any; a fact the PRD lacks is a placeholder. Controls are real elements.
   - **Missing pieces.** A token or component the skeleton lacks goes in that page's `<style data-additions>`, in both themes. A persona, a key, or a navigation item the PRD adds, that `docs/design-system/project.js` lacks goes in that page's `<script data-additions>`, and on the footer's additions list.

   Done when every screen from step 1 is drawn, a new one on `mockup.html` and an existing one in its copy, and every line of the [checklist](#checklist) passes.
4. **Show.** Where a person invoked you in an interactive session, open each page in the draft folder with the OS opener (`open`, `xdg-open` or `start`). Otherwise, carry their paths to the return.
5. **Return** the draft folder's path, the pages in it, the open choices for the person to name, the open conflicts for them to rule on, and the checklist result. Every tracked file is as it was: nothing is committed until the design is confirmed.

## Revise

1. **Find the pages.** The draft folder, where it exists. Otherwise the design prototypes on the pull request's branch: note the branch you are on, `git fetch origin`, then `git switch mockup/<N>-<slug>`. Done when the pages to edit are in the working tree.
2. **Edit** those pages, by whichever input you have:
   - **A person's reasons** — change what each reason asks for, and nothing else. A reason naming an option keeps that option, drops the others, and moves its line from the footer's open choices to its screen's `choices` list, placed as Build step 2 places a conflict, naming the option kept. A reason that rules on an open conflict is handled as Build step 2 handles a ruling.
   - **A revised PRD** — fetch it and read its last Revisions line. Redo only the screens whose `data-req` names a Changed or Withdrew id; place each Added id on its screen, adding a screen or state where step 1 of Build would. A Withdrew id leaves every `data-req`.

   Done when each reason, or each id on the Revisions line, is reflected on the pages, and the [checklist](#checklist) passes.
3. **Show** as in Build step 4. On the pull request's branch, then **publish**: stage and commit as in Confirm step 4, `git push` — one new commit on top of the pull request — and `git switch` back to the branch you noted. Done when the commit is on the remote, or the draft folder holds the edit.
4. **Return** what changed per reason or id, the checklist result, and the pull request's URL where there is one.

## Confirm

1. **Ready.** While the footer's open-choices list or any `conflicts` list in the draft folder holds an item, or a line of the [checklist](#checklist) fails, write nothing and return what is open. Done when those lists are empty and every line passes.
2. **Branch.** Note the branch you are on. `git fetch origin`, then `git switch --no-track -c mockup/<N>-<slug> origin/<default branch>`; where git refuses, write nothing and return its message. Done when the checkout is on the new branch.
3. **Transform** the draft folder into design prototypes:
   - Each section of `mockup.html` becomes `docs/design/<folder>/<screen>.html`, built from `docs/design-system/prototype.html`: the section's states drawn as one page, what differs between them marked `data-when`, and its states, its Behaviour list, its placeholders and its lines of the footer's `settled`, `todo` and `choices` in the panel. A choice the person named on confirming is a `choices` line on its screen.
   - Each copy of an existing design prototype is written over the page it was copied from.
   - Every control the requirements give a behaviour carries it, and a link to another screen opens that screen's design prototype. Each `data-over` is written as the path of the page behind, relative to the design prototype's own folder.
   - Each `<style data-additions>` moves into `docs/design-system/`: `tokens.css` or `skeleton.css`, with an example on `reference.html`. Each `<script data-additions>` moves into `docs/design-system/project.js`: a persona or key into its personas, a navigation item into its shell.
   - An id the PRD's `## Withdrawn` names leaves every `data-req`.

   Done when every screen in the draft folder is a design prototype, and every line of the [checklist](#checklist) passes for each.
4. **Publish.** Show the design prototypes as in Build step 4. Stage them and any changes under `docs/design-system/`, and nothing else. Commit, in the repo's commit message convention, naming `#<N>`; `git push -u origin mockup/<N>-<slug>`, and open one pull request titled `Design: <name>` whose body names `#<N>` and lists each design prototype written, each addition and each placeholder left. Then `git switch` back to the branch you noted, and delete the draft folder: the pull request holds its content now. Done when the pull request exists, the checkout is on the branch it started on, and the draft folder is gone.
5. **Return** the pull request's URL, each design prototype's path, the checklist result, and `gh pr checkout <number>` as the way to open the pages again.

## Check

**Read** the page — a mockup from its draft folder; a design prototype from the path given, or `git show <head branch>:<path>` from its pull request — with the contract in `docs/design-system/skeleton.html`, and the PRD. **Report** every line of the [checklist](#checklist) that applies to it as pass or fail, each fail naming the id, error, token, component, placeholder, state, link, conflict or `todo` that fails it. An issue's state is read as the issue tracker doc fetches the relevant ticket. Done when every such line carries a verdict. The result is the return; every file, branch and pull request is left as it was, so any caller can run Check with no side effects.

## Checklist

The Build, Revise and Confirm branches end on this list, and the Check branch reports on it.

Every page:

- Every requirement marked `Visible: yes` is on a screen, and every id of this PRD on a screen is in its Requirements.
- Every error the PRD names has a state.
- Only the skeleton's tokens and components and `docs/design-system/project.js`'s personas and keys are used, or the additions the page carries.
- Every `[Placeholder]` is listed: in a mockup's footer, in a design prototype's panel.
- The page links the files `docs/design-system/skeleton.html` links, and loads nothing else but fonts from the network.
- Every `data-over` opens a page that exists; in a mockup, a bare name is a screen of the draft.
- Every `todo` names an issue, and that issue is open.

A design prototype, also:

- Every state has its button in the panel and changes something on the page, and every `data-go` and `data-then` names a state.
- Every control the requirements give a behaviour carries it.
- Every link to another screen opens a page that exists.
- It carries no open choice, no open conflict, no `<style data-additions>` and no `<script data-additions>`.
