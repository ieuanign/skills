# Directions

1. **Read.** The issue tracker should be in your context, from the consuming repo's `docs/agents/issue-tracker.md`. If it is not, write nothing and return a refusal naming `/mattpocock-skills:setup-matt-pocock-skills`. Fetch the PRD as that doc fetches the relevant ticket, and the epic its `Epic:` line names. Read every file in `docs/design-system/brand/`. Done when the PRD's requirements marked `Visible: yes`, the epic and the brand are in hand.
2. **Pick the screens.** Choose the PRD's screens that best show a direction: the main one, and one with a form or list. Done when two or three real screens are named, each with the requirement ids it covers.
3. **Draw three directions.** Copy the template's `skeleton.css`, `project.js` and `skeleton.js` into `docs/design-system/`, and write `directions.html` beside them from its `skeleton.html`: one section whose `data-option` buttons switch between the directions.
   - Each option panel sets its own token values for both themes in the page's own `<style>`, and shows the screens from step 2 with the PRD's real copy.
   - The directions differ in **structure** — layout, navigation, density, type scale — as well as colour.
   - With a brand, each direction keeps its logo, colours and fonts; with an empty `brand/`, the directions are free.

   Done when each direction holds every screen from step 2 in both themes and passes the contrast line of `SKILL.md`'s checklist.
4. **Return** the page's path, one line per direction saying what sets it apart, and the questions for the caller to put to a person: which direction to take, and what to change.
