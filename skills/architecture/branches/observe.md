# observe

Draft the project's Architecture from its code and return it with the Architecture question set. Read-only.

1. **Take the inventory**, as `SKILL.md`'s [The inventory](../SKILL.md#the-inventory) lists it. Done when every top-level directory, package, service, store, table group, integration, deployable, environment and decision record is listed with what it does and where it was found.
2. **Read the docs.** The root `README.md`, `CONTEXT.md` or `CONTEXT-MAP.md`, `docs/` and the decision records, for what each part is for and why it is shaped so. Use the glossary's terms for the parts. Done when every why the docs state is matched to its part.
3. **Read the Architecture already there**, where `docs/architecture/` exists. Keep each line the inventory still bears out. For each `Planned:` marker: an open Spec keeps the marker and its change; a closed Spec whose change the code now holds keeps the change, unmarked; a closed Spec whose change the code lacks loses the change. Done when every line of every file is kept, unmarked or dropped.
4. **Place every part** in one layer — presentation, application, data access or database — with its home. Done when every part has one layer and one home, or is a question of kind `layer`.
5. **Draft the five files**, each from its file in `<this-skill-dir>/template/`, under `SKILL.md`'s Rules. Each part, store, table group, integration, deployable and environment from step 1 goes in the section and layer it belongs to; where a question below decides a line, the draft holds the question's recommendation. Done when every item of the inventory sits in the draft and every template heading is filled.
6. **Build the question set** in the shape below, asking only what the code cannot show, one question per:
   - `why` — a major choice that has no decision record, its recommendation the likeliest why from the code and docs, and whether it passes the three-part test for a record;
   - `quality goal` — availability, expected scale and data retention, one each;
   - `two ways` — a thing the code does two ways, its recommendation the way to name as meant;
   - `layer` — a part step 4 could not place.

   Done when every recommendation in the draft that the code does not show is a question, each with its recommendation, `Rests on:` and `Applies to:`.
7. **Return** the question set. Done when it holds every question from step 6 and the whole draft.

## The Architecture question set

`write` reads this document back with the answers filled in.

`````markdown
# Architecture questions

Decision records: <the location, or "none kept">

## 1. Why does the job queue run inside the API service? — why

Found: the queue's workers start with the API process, in `api/`
Recommendation: one deployable keeps the first release simple; a record, since splitting it later moves every job
Rests on: none
Applies to: blueprint.md, Application
Answer:
```text
```

## 2. What availability is meant? — quality goal

Found: one environment, no replicas in the deployment files
Recommendation: business hours; a short outage is tolerated
Rests on: none
Applies to: README.md, Quality goals
Answer:
```text
```

## Draft

### docs/architecture/README.md

````markdown
<the file, whole>
````

<one `###` and fenced block per file, all five>
`````
