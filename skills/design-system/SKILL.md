---
name: design-system
description: Sets up a project's design system as local HTML under docs/design-system/ — a reference page, the skeleton.html every mockup is built from, and the client's brand/. Use to draw three directions from a PRD, to build the design system from a chosen direction, to adopt a design system already in code, or to check one against its checklist.
---

# design-system — set up a project's design system as local HTML

The design system is three things under `docs/design-system/`, plain files a person opens in a browser:

- **`reference.html`** shows every token and every component, in both themes.
- **`skeleton.html`** is what every mockup is built from: the tokens in plain CSS for a light and a dark theme, a browser frame and a phone frame, the components in HTML and CSS named as the project's component kit names them, the state buttons and the theme switch.
- **`brand/`** holds what the client already has: a logo, colours, fonts, or a site to match as a URL in a text file. A person puts it there; you read it as it is.

Your writes are those files and, in Directions, `directions.html` beside them. The app's own token file follows the skeleton separately, through a test the project writes; variants inside the running app are `/mattpocock-skills:prototype`'s UI branch. You leave every file uncommitted, for the person to review and commit.

## The skeleton template

[`skeleton-template.html`](skeleton-template.html), at `<this-skill-dir>/skeleton-template.html`, is the scaffold every page here starts from. Its leading comment is the **markup contract** every mockup follows: how a screen, its states, its surface and the footer are marked up. The contract lives in that comment, and travels inside every `skeleton.html`, so that `mockup` and anything reading a mockup take it from the one file they already hold. Carry the comment into each page verbatim; change the tokens, frames and components around it.

Every page you write inlines its CSS and JS and loads nothing from the network but fonts. `brand/` assets are linked by relative path.

## Pick the branch

- **Check** — you were asked to check the design system. Go to [Check](#check).
- **Adopt** — the project already has a design system in code, such as a token file and a component kit, and `docs/design-system/skeleton.html` does not exist. Go to [Adopt](#adopt).
- **Build** — a direction has been chosen from `docs/design-system/directions.html`. Go to [Build](#build).
- **Directions** — anything else. Go to [Directions](#directions).

Done when one branch is chosen and, for Directions, the PRD's number is known.

## Directions

1. **Read.** The issue tracker should be in your context, from the consuming repo's `docs/agents/issue-tracker.md`. If it is not, write nothing and return a refusal naming `/mattpocock-skills:setup-matt-pocock-skills`. Fetch the PRD as that doc fetches the relevant ticket, and the epic its `Epic:` line names. Read every file in `docs/design-system/brand/`. Done when the PRD's requirements marked `Visible: yes`, the epic and the brand are in hand.
2. **Pick the screens.** Choose the PRD's screens that best show a direction: the main one, and one with a form or list. Done when two or three real screens are named, each with the requirement ids it covers.
3. **Draw three directions.** Write `docs/design-system/directions.html` from the template: one section whose `data-option` buttons switch between the directions, each option panel setting its own token values for both themes and showing the screens from step 2 with the PRD's real copy. The directions differ in **structure** — layout, navigation, density, type scale — as well as colour. With a brand, each direction keeps its logo, colours and fonts; with an empty `brand/`, the directions are free. Done when each direction holds every screen from step 2 in both themes and passes the contrast line of the [checklist](#checklist).
4. **Return** the page's path, one line per direction saying what sets it apart, and the questions for the caller to put to a person: which direction to take, and what to change.

## Build

1. **Inputs.** Take the chosen direction from `directions.html` and the changes the person asked for. Done when the direction's tokens, frames and components are known, with each change applied.
2. **Skeleton.** Write `docs/design-system/skeleton.html` from the template: its tokens, frames, components and state buttons from step 1, the theme switch, and the contract comment verbatim. Name each component as the project's component kit names it, or by the direction where there is no kit. Done when every token and component the direction uses is in the file.
3. **Reference page.** Write `docs/design-system/reference.html` with the skeleton's `<style>` copied verbatim, an example of every token (a swatch per colour in both themes, each size and space) and every component in each of its variants, and a list of the text and background pairs the components use. Done when every token and component in the skeleton has an example.
4. **Clear the directions.** Delete `directions.html`. Done when the folder holds `reference.html`, `skeleton.html` and `brand/`.
5. **Checklist.** Run every line of the [checklist](#checklist) and fix each fail. Done when every line passes.
6. **Return** both paths and the checklist result.

## Adopt

1. **Review the code.** Read the token file and the component kit. List what is missing: a token without a value in one theme, a component without a state the app renders, text below 4.5:1 against a background it is used on. Done when every token and every component in the kit has been read and each gap is listed.
2. **Skeleton and reference page** as in Build steps 2 and 3, from the code as it is: its token names and values, its component names, its gaps left as they are. Done as in those steps.
3. **Checklist.** Run every line of the [checklist](#checklist). Fix a fail in the two pages; a fail that comes from the code stays, and goes in the return. Done when every line has a verdict.
4. **Return** both paths, the list of what is missing, and the checklist result.

## Check

**Read** `reference.html` and `skeleton.html`, then **report** every line of the [checklist](#checklist) as pass or fail, each fail naming the token, component or pair that fails it. Done when all four lines carry a verdict. The result is the return; the files are left as they were, so any caller can run Check with no side effects.

## Contrast

The contrast of two colours is `(L1 + 0.05) / (L2 + 0.05)`, where `L1` is the lighter colour's relative luminance and `L2` the darker's. A colour's relative luminance is `0.2126 R + 0.7152 G + 0.0722 B`, where each channel `c` is its 0–255 value divided by 255, then `c / 12.92` when `c ≤ 0.04045` and `((c + 0.055) / 1.055) ^ 2.4` otherwise. Compute it from the token values in each theme.

## Checklist

The Build and Adopt branches end on this list, and the Check branch reports on it.

- Every token and component has an example on the reference page.
- The light and dark themes hold the same keys.
- All text reaches 4.5:1 against the backgrounds it is used on, in both themes.
- The skeleton and the reference page agree: the same tokens with the same values, and the same components.
