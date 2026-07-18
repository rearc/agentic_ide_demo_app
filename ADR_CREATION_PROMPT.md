I need to create an Architecture Decision Record (ADR) for this demo app. The ADR will be used as a teaching exhibit in a workshop about making codebases AI-ready. It needs to capture real architectural decisions that exist in this codebase -- the kind of "why" context that an AI agent cannot infer from the code alone.

ADRs live in `docs/adr/` as **one file per decision**, named `ADR-NNN-<slug>.md` (see `docs/adr/README.md` for the index). Create a new file for each decision using this format:


# ADR-NNN: [Decision Title]

**Date:** [When it was decided]
**Status:** Accepted

### Context
[What was going on that forced a decision]

### Decision
[What we decided to do]

### Consequences
[What this makes easier, harder, and commits us to maintain]


Before writing, read through the codebase to understand the architecture. Then interview me about each decision - ask me one question at a time about the reasoning behind what you see in the code. I want this to be interactive, not a wall of text you generate alone.

Here are some decisions I know should be documented. Use these as starting points and ask me follow-up questions to flesh them out. Also identify other decisions you see in the code that I haven't listed:

Not production-ready by design. This app is intentionally missing features that would be required for true production deployment because it was never intended to be deployed in production environments. It is intended to be a personal dashboard, purely focused on local execution.

Flask over Django. Flask was intentionally chosen as the backend over Django because it is a simpler framework that is easier for people to learn who haven't used Python frameworks before. We know that Django could provide a more rich feature set, but we do not want to migrate to that at this time.

Look at the frontend, backend, data layer, API patterns, service patterns, and any other architectural choices and ask me about them.

After interviewing me, draft one `ADR-NNN-<slug>.md` file per decision in `docs/adr/`, add each to the `docs/adr/README.md` index table, and let me review before finalizing.