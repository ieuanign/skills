---
name: grill-prd
description: Interviews a brief — a request for work — in plain words about what people do and see, then calls to-prd to publish its PRD. Use to grill a brief, or to take a brief to a PRD.
---

# grill-prd — interview a brief, then publish its PRD

The brief is the argument: an issue number, a link, or text. You interview; `to-prd` writes. Every question is in plain words, about what people do and see.

## Steps

1. **Tracker.** The issue tracker should be in your context, from the consuming repo's `docs/agents/issue-tracker.md`. If it is not, tell the person to run `/mattpocock-skills:setup-matt-pocock-skills` and stop there. Done when you know where briefs and PRDs live.

2. **Facts first.** Read the brief, the glossary (`CONTEXT.md`, or each one `CONTEXT-MAP.md` names), earlier PRDs (issues labelled `prd`, open and closed), and the epic where the brief names one. Take in what this conversation already settled, such as a handoff note or earlier answers, so a fresh agent carries on where the last stopped. Done when each part of the brief is marked settled or open.

3. **Load the interviewer.** Call the Skill tool twice, for `mattpocock-skills:grilling` and `mattpocock-skills:domain-modeling`, and run them as they are, with three settings for this interview:
   - **Glossary only.** Use `domain-modeling` for terms: challenge, sharpen, probe with scenarios, and write each resolved term to the glossary. The interview offers no decision records and checks nothing against the code.
   - **Plain words.** A fact about the code comes from a general-purpose sub-agent (the Agent tool), asked "what can a person do today …?" and told to answer only in what a person can do and see, naming no file, symbol, table, endpoint, library or framework. This is how `grilling`'s fact-finding runs here.
   - **Technical matters wait.** One that surfaces is noted, in the person's words, for "Left for the spec", and the round moves on.

   Done when both skills are loaded.

4. **Size, in the first round.** A brief is too big when it holds two or more topics that are each useful to a person without the others. When it is, the first round says so, names the topics, recommends which to take first, and asks. The chosen topic is the one this interview covers; every other topic goes to the epic, worded so it can be filed as a brief as it stands. A person who answers "all of it as one" gets one PRD. Past about 20 requirements mid-interview, put the same question in that round. Done when the person has chosen what this PRD covers.

5. **Interview** the open parts only, until each of these is settled for the chosen scope:
   - who it is for;
   - what each person can do;
   - what happens when something goes wrong;
   - what changes that a person sees;
   - what it replaces;
   - what is fixed by whoever asked, in their words, and who said it;
   - what is left out.

   Done when every part of the brief has a **home** — a requirement, a constraint, a topic in the epic, an "Out of scope" line or a "Left for the spec" line — and the person confirms the list of homes.

6. **Call `to-prd`** through the Skill tool. Ask for its revise branch when the brief changes an open PRD, naming that PRD; otherwise its write branch, naming any closed PRD whose requirements the brief changes. Name the brief's issue and any epic. Done when `to-prd` returns; give the person its PRD and epic links and its checklist result, or its refusal as it stands.
