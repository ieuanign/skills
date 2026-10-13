# Build

Read `<this-skill-dir>/writing.md` with this file: it says what each file holds, and the steps here say where that comes from.

1. **Inputs.** Take the chosen direction from `directions.html` and the changes the person asked for. The issue tracker should be in your context, from the consuming repo's `docs/agents/issue-tracker.md`. If it is not, write nothing and return a refusal naming `/mattpocock-skills:setup-matt-pocock-skills`. Fetch the PRD as that doc fetches the relevant ticket, and the epic its `Epic:` line names. Done when the direction's tokens, frames, components and layouts are known, with each change applied, and the PRD's user stories are in hand.
2. **Skeleton**, as `writing.md` holds it, from step 1:
   - **The frames, components and layouts** are the direction's, the layouts those its screens share. A component whose surface has no kit is named by the direction.
   - **The personas** are the PRD's user stories': one for each `###` heading that says who the stories are for, with the keys its stories grant that another's do not.
   - **A shell** for each frame the direction's signed-in screens share, its navigation items and their routes from the direction.

   Done when every token, component and layout the direction uses, every persona the PRD names and every shell the direction draws is in the files.
3. **Reference page and index**, as `writing.md` holds them, and done as it says.
4. **Clear the directions.** Delete `directions.html`. Done when the folder holds the skeleton's files, `reference.html` and `brand/`.
5. **Checklist.** Run every line of `SKILL.md`'s checklist and fix each fail. Done when every line passes.
6. **Return** the files written and the checklist result.
