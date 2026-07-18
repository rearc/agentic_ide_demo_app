# ADR-010: No Automated Tests

**Date:** March 2026
**Status:** Accepted (with acknowledged debt)

### Context

The application has no automated tests — no pytest for the backend, no Jest for the frontend, no test files of any kind. No testing framework is included in the project's dependencies.

### Decision

Tests were purposely left out of the codebase. Originally, this was a simplicity decision consistent with the project's overall philosophy of minimizing complexity. Additionally, during early planning, adding tests to this application was considered as a potential live demo during the workshop — showing attendees how to use an agentic IDE to implement test-driven development.

That plan changed: a different codebase was chosen to demonstrate TDD instead. As a result, the absence of tests in this codebase is now acknowledged as a gap rather than a deliberate ongoing architectural choice. The tests were never added back because the decision to use a different codebase for the TDD demo happened after this app's development was largely complete.

### Consequences

- No automated verification that the API routes, services, or frontend components behave correctly.
- Refactoring carries more risk without a test safety net.
- The absence of tests is a known gap, not a statement that tests are unnecessary.
- Adding a test suite (pytest for backend, Jest/Vitest for frontend) would be a valuable future contribution.
</content>
