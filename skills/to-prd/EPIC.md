# Epic — the whole a too-big brief was narrowed from

An epic is written only when the interview narrowed a too-big brief. It is an issue titled `Epic: <name>` and labelled `epic`. An epic is to its PRDs what a spec is to its tickets: the whole, and the pieces it is taken in. Each topic's brief is a sub-issue of the epic, the original brief first. Keep it concise: the bigger picture in a few lines, each topic in a few sentences.

```markdown
# Epic: <name>

Brief: #<the brief it came from>

## Bigger picture
<what the whole is for and where it is heading, non-technical>

## Topics

### 1. <title>
Brief: #<number> | not filed
<text that can be filed as a brief as it is, ending "Epic: #<number>">
```

- **Living.** For every brief under it, `grill-prd` reads the epic before asking. `to-prd` then marks that topic's brief and rewrites the remaining topics where the interview changed them.
- **Closed** when every topic is filed or dropped. Dropping a topic is a line under "Out of scope" in the PRD that dropped it.

## Steps

1. **New epic** — the conversation narrowed a too-big brief and names no epic. Create it first, as the PRD: `gh issue create --title "Epic: <name>" --label epic` with a placeholder body, and read its number `E`; each topic's text ends `Epic: #E`, so `E` has to exist first. The chosen topic is topic 1, marked `Brief: #<the original brief>`; every other topic reads `Brief: not filed`. Done when `E` is known and every topic the conversation named has a block.
2. **Existing epic** — the brief or the PRD names one. Fetch it with `gh issue view <E> --json body`, mark this brief's topic with `Brief: #<brief>`, and rewrite the remaining topics where the conversation changed them. A topic this PRD drops leaves the epic and becomes a line under the PRD's "Out of scope". Done when every topic reflects what the conversation settled.
3. **Publish** with `gh issue edit <E> --body-file -`, then link each filed topic's brief under the epic through the sub-issues endpoint, the original brief first, skipping any already linked. When a link fails, the brief's `Epic:` line carries the relationship; note the failure for the return. Done when every filed brief is linked or its failure is noted.
4. **Close** the epic with `gh issue close <E>` when every topic is filed or dropped. Done when the epic is closed, or at least one topic still reads `not filed`.
