# Architecture Decision Records — agentic_ide_demo_app

This document captures the key architectural decisions made during the development of the multi-card personal dashboard application. These decisions reflect the "why" behind the codebase — context that cannot be inferred from the code alone. This app was built as a teaching exhibit for a workshop on prompt engineering and agentic IDE workflows, and many decisions were shaped by that context.

---

## ADR-001: Not Production-Ready by Design

**Date:** March 2026
**Status:** Accepted

### Context

This application is a personal dashboard intended to run locally on a single person's machine. It was built to serve as a demo application for a workshop on prompt engineering and agentic IDE usage. The audience included backend developers, frontend developers, PMs, and other non-technical resources — many of whom had never used a Python framework before. The app needed to be easy to set up, easy to understand, and easy to extend during live demos.

At the same time, the codebase is not intended to be treated as a throwaway or toy application. The expectation is that contributors (both human and AI) write production-quality code — clean, well-structured, and maintainable. The distinction is that while the code quality should be high, the application is intentionally scoped to local execution and does not include features that would only be needed for a deployed, multi-user, internet-facing production environment.

### Decision

The following production features were intentionally omitted:

- **Docker / containerization:** Docker was left out to reduce setup friction. Many workshop attendees may not have Docker installed, and requiring it would add a dependency and a layer of complexity to the onboarding process. The goal was to minimize the number of prerequisites needed to get the app running.
- **Production WSGI server (Gunicorn, uWSGI, etc.):** The app runs on Flask's built-in development server (`app.run(debug=True)` on port 5001). A production WSGI server handles concurrent requests, manages worker processes, and is hardened for internet-facing traffic. Since this app only ever runs locally for a single user, the dev server is entirely appropriate and avoids introducing another tool attendees would need to understand.
- **Authentication and user management:** There is no login, no user model, and no auth middleware. This was a dual-purpose decision — see ADR-011 for full details.
- **CI/CD pipelines:** No GitHub Actions, deployment scripts, or build pipelines exist. The app is run from source in development mode.
- **HTTPS / TLS:** Not needed for localhost-only traffic.

### Consequences

- Setup is fast: clone, install dependencies, seed the database, run two processes.
- The app cannot be deployed to a shared environment without significant additions.
- Contributors must understand that "production-quality code" refers to code structure, clarity, and correctness — not deployment readiness.
- The absence of Docker means environment parity between contributors is not guaranteed (different Python versions, OS-level differences, etc.).

---

## ADR-002: Flask Over Django

**Date:** March 2026
**Status:** Accepted

### Context

The backend needed a Python web framework to serve a REST API for the dashboard. The two most common choices in the Python ecosystem are Flask and Django. Django provides a rich feature set out of the box — an admin panel, a built-in ORM with migration tooling, authentication middleware, form handling, and an opinionated project structure. Flask, by contrast, is a microframework that provides routing, request handling, and a plugin ecosystem, but leaves most architectural decisions to the developer.

The workshop audience spanned a wide range of technical backgrounds: backend developers, frontend developers, PMs, and other non-technical resources. Many attendees had never used a Python web framework before. The framework choice needed to optimize for readability and approachability above all else.

### Decision

Flask was chosen as the backend framework. Django's conventions — URL conf modules, settings files, middleware stacks, the admin autodiscovery system — require significant upfront learning before a newcomer can understand how a request flows through the application. Flask's simplicity means that a route handler is just a decorated function that receives a request and returns a response. Someone reading the code for the first time can follow the logic without needing to learn framework-specific patterns.

We acknowledge that Django would provide a richer feature set (particularly its admin panel and built-in auth), but those features are not needed for this application's scope, and the complexity they introduce would work against the goal of making the codebase approachable. Migration to Django is not desired at this time.

### Consequences

- Backend code is immediately readable to someone who has never used Flask or Django.
- The plugin ecosystem (Flask-SQLAlchemy, Flask-Migrate, Flask-CORS) provides what's needed without Django's overhead.
- There is no admin panel for managing data — the seed script and API endpoints serve that purpose.
- If the application's scope grew significantly (e.g., multi-user with roles and permissions), the lack of Django's built-in features would become a real cost.

---

## ADR-003: SQLite as the Database

**Date:** March 2026
**Status:** Accepted

### Context

The application needs a relational database to store cards, todos, and their relationships. The most common options for a Python/Flask application are PostgreSQL, MySQL, and SQLite. PostgreSQL and MySQL are full client-server databases that require installation, configuration, and a running daemon process. SQLite is a file-based database that requires zero installation — it ships with Python's standard library.

During the workshop, attendees needed to be able to set up and run the application with as little friction as possible. Any additional dependency that required installation, configuration, or troubleshooting was a risk to the demo flow.

### Decision

SQLite was chosen as the database (`sqlite:///app.db`). It requires no installation, no running daemon, and no configuration. The database is a single file that can be deleted and re-created in seconds by re-running the seed script. This made debugging and rebuilding the data layer extremely trivial during development and workshop demos.

SQLite's known limitations — single-writer concurrency, no network access, limited JSON querying — are irrelevant for a single-user, locally-running application.

### Consequences

- Zero database setup: `flask db upgrade` and `python seed.py` create everything from scratch.
- The database file can be blown away and re-seeded in seconds, which is valuable for workshop reproducibility.
- Attendees do not need PostgreSQL, MySQL, or any database tooling installed.
- Migration scripts use Alembic's batch mode for SQLite compatibility (SQLite doesn't support all ALTER TABLE operations natively).
- If the app were ever deployed as a multi-user service, SQLite would need to be replaced with a client-server database.

---

## ADR-004: React with Vite for the Frontend

**Date:** March 2026
**Status:** Accepted

### Context

The dashboard frontend needed to support rich interactivity: draggable and resizable card widgets, live data fetching, inline editing, optimistic UI updates, and a component-based architecture that makes adding new card types straightforward. The framework choice also needed to consider that some workshop attendees might never have seen a modern frontend framework before.

### Decision

React 18 was chosen as the frontend framework for several reasons:

1. **Rich ecosystem:** React's package ecosystem made it easy to add features like the draggable grid layout (`react-grid-layout`). The breadth of available libraries meant that "fun" and visually impressive cards could be added quickly.
2. **State management:** React's built-in hooks (`useState`, `useEffect`, `useCallback`) provide clean state management that the dashboard's interactivity demands — tracking card data, layout changes, todo editing state, loading states, and error states.
3. **Extensibility:** The card registry pattern (mapping source names to React components) means adding a new card type is as simple as creating a new component file and adding one line to the registry. This supports the long-term vision of the app as a platform people can "vibe code" new utilities into.
4. **Readability:** React's JSX syntax is relatively approachable for newcomers. A component is a function that returns markup — the mental model is straightforward.
5. **Exposure:** For attendees who hadn't seen React before, this app provides a simple, non-overwhelming introduction. A side effect might be that they realize they could use React in their own projects.

Vite was chosen as the build tool because it is the modern default for new React projects. This was a recommendation from the AI assistant during initial project setup, and there was no strong reason to choose an alternative like Create React App (which is effectively deprecated) or Next.js (which adds server-side rendering complexity that isn't needed here).

### Consequences

- The frontend is component-based and easy to extend with new card types.
- Hot module reloading via Vite provides a fast development feedback loop.
- Two processes must be running during development (Vite dev server + Flask), which adds slight setup complexity compared to a monolithic approach.
- Attendees without React experience get exposure to it in a simple context.
- The app is tied to the React ecosystem for its frontend.

---

## ADR-005: Plain JavaScript, No TypeScript

**Date:** March 2026
**Status:** Accepted

### Context

TypeScript has become the default choice for many React projects, providing static type checking, better IDE autocomplete, and compile-time error detection. However, it also adds complexity: type annotations throughout the code, generic syntax, interface definitions, and occasional type gymnastics that can obscure the underlying logic.

The workshop audience included people who had potentially never seen React before. Introducing both React's component model and TypeScript's type system simultaneously would increase the cognitive load for newcomers.

### Decision

The entire frontend is written in plain JavaScript (`.jsx` files) with no TypeScript. This was a deliberate choice to keep the codebase as readable as possible. JSX is already a new syntax for people unfamiliar with React — layering TypeScript's `.tsx` syntax, type annotations, and generics on top of that would detract from the readability of the code.

The approach is consistent with the broader philosophy of the project: introduce one concept at a time. Attendees see JSX first; if they pursue React further, they can adopt TypeScript in their own projects when they're ready.

### Consequences

- Frontend code is more readable for newcomers — there's less syntax to parse in each file.
- No compile-time type checking means certain categories of bugs (wrong prop types, missing fields) won't be caught until runtime.
- IDE autocomplete is less precise without type definitions.
- If the project grows in complexity, the lack of TypeScript could make refactoring harder. This is an acceptable tradeoff for the current scope.

---

## ADR-006: SPA + API Separation Over Monolith

**Date:** March 2026
**Status:** Accepted

### Context

There were two viable approaches for structuring the application:

1. **Monolith with server-rendered templates:** Flask serves HTML via Jinja2 templates. Everything runs as a single process. This is simpler to set up and deploy but limits frontend interactivity — each user action that needs new data requires a full page refresh (or a separate JavaScript layer bolted onto the templates).
2. **SPA + REST API:** A React single-page application communicates with a Flask API backend. The frontend and backend are separate processes connected via HTTP. This requires more setup but enables rich client-side interactivity.

The dashboard's core UX involves dragging and resizing cards in a grid layout, inline editing of todos, live data fetching with loading states, and optimistic UI updates. These interactions are fundamentally client-side-driven.

### Decision

The application uses a separated architecture: a React SPA (port 5173) communicating with a Flask REST API (port 5001), connected via Vite's development proxy. This decision was driven by two factors:

1. **Demonstrating the SPA + API pattern:** The workshop is about modern development practices, and this separation is the dominant pattern in contemporary web development. Having a clean API layer separate from the frontend is a valuable teaching exhibit.
2. **Avoiding the complexity of state management in server-rendered templates:** The dashboard's interactivity — drag-and-drop grid layout, inline todo editing, optimistic updates, per-card loading states — would be significantly harder to implement with Jinja2 templates. You'd end up writing substantial custom JavaScript anyway, but without React's state management and component model. Server-side rendering would mean fighting the framework to achieve the UX the app requires.

### Consequences

- The frontend and backend are cleanly separated, each with its own concerns.
- Rich client-side interactivity is natural to implement with React's state management.
- Development requires two terminal processes (Vite + Flask), which adds setup complexity.
- The Vite dev proxy (`/api` -> `http://127.0.0.1:5001`) bridges the two during development.
- The pattern is immediately recognizable to developers familiar with modern web architecture.

---

## ADR-007: react-grid-layout for the Dashboard Grid

**Date:** March 2026
**Status:** Accepted

### Context

The dashboard's core interaction model is a grid of cards that users can drag, reposition, and resize. This requires a layout engine that handles collision detection, responsive breakpoints, and smooth drag-and-drop animations. Building this from scratch with CSS Grid and custom drag logic would be a significant engineering effort.

### Decision

The `react-grid-layout` library (v2.2.3) was chosen to provide the draggable, resizable grid. It was the first library evaluated that worked well enough for the use case. The choice was pragmatic rather than the result of an extensive comparison of alternatives.

The grid layout serves a purpose beyond functionality — it makes the app feel like a customizable platform rather than a static webpage. The locked/unlocked toggle signals to users that this is something they can make their own. The long-term vision is that someone takes this dashboard and "vibe codes" a collection of extremely personalized utilities, adding cards over time and arranging them to suit their daily workflow. The grid layout is what makes that vision tangible.

### Consequences

- The dashboard feels interactive and customizable out of the box.
- Layout state (x, y, width, height) is persisted per card via the API, so arrangements survive page reloads.
- The library is a dependency that could be replaced if a more performant or feature-rich alternative emerges — there is no strong commitment to this specific package.
- The lock/unlock UX pattern adds a small amount of complexity to the Dashboard component but keeps the default experience clean (locked = no accidental drags).

---

## ADR-008: Service Dispatch and Card Registry Pattern

**Date:** March 2026
**Status:** Accepted

### Context

The dashboard displays multiple types of cards (weather, quotes, space imagery, todos, placeholder), each with different data sources and UI components. The architecture needed a way to add new card types without modifying core routing or layout logic.

### Decision

A dual-registry pattern was implemented:

- **Backend:** A `SERVICES` dictionary in `backend/app/routes/data.py` maps source name strings to handler functions. The `/api/data/<source>` route looks up the source in this dictionary and calls the corresponding function, passing query parameters as keyword arguments. Adding a new data source means writing a `fetch(**kwargs)` function and adding one line to the dictionary.
- **Frontend:** A `CARD_REGISTRY` object in `frontend/src/components/Card.jsx` maps source names to React components and their configuration (whether they need data, their accent color). Adding a new card UI means creating a component file and adding one entry to the registry.

This pattern was designed from the beginning of the project. It was not something that emerged organically — it was mapped out with the help of an agentic IDE based on the goal of making the application easily extensible. The fact that the extensibility pattern was itself AI-assisted is relevant context, given that this app is a teaching exhibit for agentic IDE workflows.

### Consequences

- Adding a new card type is a well-defined, repeatable process (documented in AGENTS.md as a 5-step guide).
- Unknown sources fall back gracefully — the backend returns a 404, and the frontend renders a placeholder widget.
- The pattern is easy to understand: one dictionary lookup on each side.
- There is a loose coupling between backend sources and frontend components via the source name string — if these drift out of sync, the failure mode is a placeholder card rather than a crash.

---

## ADR-009: Graceful API Fallbacks Over Exceptions

**Date:** March 2026
**Status:** Accepted

### Context

The dashboard integrates with three external APIs: Open-Meteo for weather data, Zen Quotes for inspirational quotes, and NASA APOD for space imagery. All three are free-tier APIs with rate limits. During the workshop, 30+ attendees might be running the app simultaneously, all hitting the same APIs from the same network. The risk of hitting rate limits, encountering network issues on conference wifi, or having an API go down during a live demo was significant.

If a service raised an exception on failure, the API route would return a 500 error, and the corresponding card would display an error state. One flaky API could degrade the experience for every attendee during a live demo.

### Decision

All external API service functions (`weather.py`, `quotes.py`, `space.py`) use try/catch blocks and return fallback data instead of raising exceptions. Each service:

- Catches HTTP errors and logs them via Python's `logging` module.
- Returns a dictionary with sensible fallback content (e.g., the quote service returns a hardcoded inspirational quote; the weather service returns an error message explaining the failure).
- Includes a `fallback: True` flag so the frontend can detect and style degraded states differently (e.g., marking a quote as "(offline)").

This was primarily a pragmatic decision to prevent workshop disruption. The risk of rate limiting or connectivity issues during a live demo with dozens of concurrent users was too high to leave cards in a broken error state.

### Consequences

- The dashboard remains functional even when external APIs are unavailable — cards render with fallback content rather than error messages.
- Workshop demos are resilient to network issues, rate limits, and API outages.
- Silent failures could mask bugs during development — a service could be misconfigured and still appear to "work" because it silently falls back.
- The fallback pattern adds a small amount of complexity to each service function, but the pattern is consistent and easy to follow.

---

## ADR-010: No Automated Tests

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

---

## ADR-011: No Authentication or User Management

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

---

## ADR-012: Latest Dependency Versions Across the Stack

**Date:** March 2026
**Status:** Accepted

### Context

When initializing the project, decisions had to be made about which versions of each dependency to use. Some projects pin to older, battle-tested versions for stability. Others use the latest releases to benefit from current features, performance improvements, and security patches.

### Decision

The project uses the latest stable versions of all dependencies at the time of creation: Flask 3.1.1, React 18.3.1, Vite 6.4.1, Tailwind CSS v4.2.2, SQLAlchemy (via Flask-SQLAlchemy 3.1.1), and so on. This was a general principle applied across the entire stack rather than a per-dependency evaluation.

This means the project uses Tailwind CSS v4's new CSS-native configuration approach (with `@theme` tokens in `index.css` and the `@tailwindcss/vite` plugin) rather than v3's `tailwind.config.js` + PostCSS setup. It also means using SQLAlchemy 2.0+ style with `mapped_column` and `Mapped` types rather than the older declarative syntax.

### Consequences

- The codebase reflects current best practices and modern API surfaces for each library.
- Workshop attendees see contemporary patterns they can apply to new projects.
- Documentation and Stack Overflow answers for the latest versions may be less abundant than for older, more established versions.
- Future dependency updates should be less painful since the project starts from a recent baseline.

---

## ADR-013: JSON Columns for Card Configuration and Layout

**Date:** March 2026
**Status:** Accepted

### Context

The Card model needs to store two types of flexible data:

1. **Configuration (`config`):** Each card type has different configuration needs. The weather card needs a `city` field, the space card needs nothing, and a future card type might need entirely different fields. This shape varies per card type and could change as new types are added.
2. **Layout (`layout`):** The grid position and size of each card (`x`, `y`, `w`, `h`), which is always read and written as a complete unit when the user rearranges the dashboard.

The alternatives were: (a) JSON columns on the Card table, (b) a separate normalized table for config key-value pairs, or (c) fixed columns for every possible config field.

### Decision

Both `config` and `layout` are stored as JSON columns on the Card model. This provides flexibility for `config` — new card types can define whatever configuration shape they need without requiring a database migration. For `layout`, the data is a fixed shape but is always read and written atomically, so a JSON column avoids an unnecessary join to a separate layout table.

### Consequences

- Adding a new card type with unique configuration needs requires zero schema changes.
- The config structure is implicit (defined by convention in each service) rather than explicit (defined by a schema). This trades type safety for flexibility.
- JSON columns in SQLite have limited query capabilities — you can't efficiently filter or index on fields within the JSON. This is acceptable because the app never needs to query cards by their config contents.
- Layout persistence is simple: the frontend sends the full layout object, and the backend stores it as-is.

---

## ADR-014: Destructive Seed Script

**Date:** March 2026
**Status:** Accepted (known limitation)

### Context

The application needs a way to populate the database with initial card data for development and workshop use. The seed script (`backend/seed.py`) is the mechanism for this.

### Decision

The seed script deletes all existing cards and todos before inserting fresh seed data. This "delete everything and rebuild" approach was implemented due to time constraints — it reached a minimum viable state and development moved on to other priorities. It is not a deliberate architectural choice but rather a pragmatic shortcut that has persisted.

### Consequences

- Running `python seed.py` is a destructive operation that wipes all user-created data (custom cards, todos, layout arrangements).
- This is fine for workshop use where reproducibility matters — every attendee gets the same starting state.
- It is problematic for the "personal dashboard" use case where someone has customized their cards and layout over time. Running the seed script would destroy their customizations.
- A future improvement would be an upsert-based seed that only adds missing default cards without destroying existing data.
