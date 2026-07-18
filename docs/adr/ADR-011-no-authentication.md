# ADR-011: No Authentication or User Management

**Date:** March 2026
**Status:** Accepted

### Context

The application is a personal dashboard designed to run locally on a single person's machine. There is no deployment target, no multi-user scenario, and no shared access. Additionally, the workshop focuses on agentic IDE workflows, and adding authentication end-to-end (backend middleware, user model, login UI, session management) is exactly the kind of ambitious, cross-cutting task that would make a compelling live demo of AI-assisted development.

### Decision

Authentication was intentionally omitted for two reasons:

1. **It solves a problem that doesn't exist here.** This is a locally-running, single-user application. There is no scenario where multiple people need to log in to the same instance. Implementing auth would add complexity with zero functional benefit for the intended use case.
2. **It is preserved as a workshop exercise.** Adding authentication end-to-end — from a user model and session middleware in Flask, to a login page and protected routes in React — is a complex, multi-file task that touches every layer of the stack. This makes it an ideal candidate for demonstrating what an agentic IDE can accomplish. Leaving it out means attendees (or future contributors) have a meaningful, well-scoped feature to implement with AI assistance.

### Consequences

- The app has no concept of users, sessions, or permissions.
- Any card or todo can be created, modified, or deleted by anyone with access to the API.
- This is a non-issue for local-only usage but would be a blocker for any shared deployment.
- The absence of auth serves as a ready-made workshop exercise for demonstrating AI-assisted full-stack feature development.
</content>
