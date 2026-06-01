# Architecture Decision Records — agentic_ide_demo_app

Architectural decisions for the multi-card personal dashboard. Captures the "why" behind choices that cannot be inferred from the code alone.

---

## ADR-001: Not Production-Ready by Design

**Date:** March 2026
**Status:** Accepted

### Context
This is a personal dashboard for local, single-user execution — built as a demo app for an agentic IDE workshop. The audience ranged from backend developers to PMs, many without Python framework experience. Setup friction had to be minimal. However, code quality should still be production-grade — the scoping is about deployment features, not code standards.

### Decision
Omit Docker, production WSGI server, auth, CI/CD, and HTTPS. The app runs via Flask's dev server and Vite's dev server, started from source in two terminals.

### Consequences
- Clone-to-running in minutes with no infrastructure dependencies
- Cannot be deployed to a shared environment without significant additions
- "Production-quality code, not production deployment" must be understood by contributors

---

## ADR-002: Flask Over Django

**Date:** March 2026
**Status:** Accepted

### Context
Needed a Python web framework readable by attendees who may have never used one. The audience included non-technical roles.

### Decision
Flask. A route handler is a decorated function — no URL conf, middleware stack, or admin autodiscovery to learn first. Django's richer feature set (admin panel, built-in auth) is not needed at this scope, and migration to Django is not desired.

### Consequences
- Immediately readable backend code for newcomers
- Flask-SQLAlchemy, Flask-Migrate, Flask-CORS cover the needed functionality
- No admin panel; data is managed via API and seed script

---

## ADR-003: SQLite as the Database

**Date:** March 2026
**Status:** Accepted

### Context
Workshop attendees needed zero-friction database setup. The app is single-user and local.

### Decision
SQLite (`sqlite:///app.db`). No installation, no daemon, no configuration. The database file can be deleted and re-seeded in seconds. Concurrency limitations are irrelevant for a single-user app.

### Consequences
- Zero database dependencies beyond Python's standard library
- Trivial to debug and rebuild during workshops
- Alembic migrations use batch mode for SQLite compatibility
- Would need replacement for any multi-user deployment

---

## ADR-004: React with Vite for the Frontend

**Date:** March 2026
**Status:** Accepted

### Context
The dashboard requires rich interactivity (drag-and-drop grid, inline editing, live data). Some attendees had never seen a modern frontend framework.

### Decision
React 18 for its ecosystem (easy to add interactive features), state management via hooks, and readable JSX syntax. The card registry pattern makes adding new card types trivial. Vite was chosen as the modern default build tool — an AI recommendation with no strong alternative preference.

### Consequences
- Component-based architecture with easy extensibility
- Hot module reloading via Vite for fast development
- Two processes required during development (Vite + Flask)
- Gives React-unfamiliar attendees a simple first exposure

---

## ADR-005: Plain JavaScript, No TypeScript

**Date:** March 2026
**Status:** Accepted

### Context
TypeScript adds type safety but also syntax complexity. Attendees may be seeing React/JSX for the first time.

### Decision
Plain JavaScript (`.jsx`). Introducing JSX and TypeScript simultaneously would increase cognitive load. One concept at a time — learn JSX first, adopt TypeScript later if desired.

### Consequences
- More readable files for newcomers
- No compile-time type checking; runtime errors for type mismatches
- Acceptable tradeoff for the current scope

---

## ADR-006: SPA + API Separation Over Monolith

**Date:** March 2026
**Status:** Accepted

### Context
Could have served everything from Flask with Jinja2 templates (single process, simpler setup). But the dashboard's interactivity — drag-and-drop, inline editing, optimistic updates — is fundamentally client-side-driven.

### Decision
Separated architecture: React SPA (port 5173) + Flask REST API (port 5001), connected via Vite dev proxy. Chosen to both demonstrate the modern SPA+API pattern and avoid fighting server-rendered templates for state management.

### Consequences
- Clean separation of concerns between frontend and backend
- Rich client-side interactivity is natural with React's state model
- Two terminal processes for development
- Pattern is immediately recognizable to modern web developers

---

## ADR-007: react-grid-layout for the Dashboard Grid

**Date:** March 2026
**Status:** Accepted

### Context
Needed draggable, resizable card grid. Building from scratch would be significant effort.

### Decision
`react-grid-layout` — the first library tried that worked well. The grid makes the app feel like a customizable platform, not a static page. The vision: users "vibe code" personalized utilities and arrange them to suit their workflow. The lock/unlock toggle signals the app is meant to be made your own.

### Consequences
- Interactive, customizable dashboard out of the box
- Layout state persisted per card via the API
- Library can be swapped if a better alternative emerges — no strong commitment
- Lock/unlock UX prevents accidental drags in default state

---

## ADR-008: Service Dispatch and Card Registry Pattern

**Date:** March 2026
**Status:** Accepted

### Context
Multiple card types with different data sources and UI components. Needed extensibility without modifying core routing or layout logic.

### Decision
Dual-registry pattern designed upfront with AI assistance:
- **Backend:** `SERVICES` dict in `data.py` maps source names to `fetch(**kwargs)` handlers
- **Frontend:** `CARD_REGISTRY` in `Card.jsx` maps source names to React components

### Consequences
- Adding a card type is a well-defined 5-step process (documented in AGENTS.md)
- Unknown sources degrade gracefully (404 backend, placeholder frontend)
- Loose coupling via source name string — drift causes placeholder rendering, not crashes

---

## ADR-009: Graceful API Fallbacks Over Exceptions

**Date:** March 2026
**Status:** Accepted

### Context
Three external APIs (Open-Meteo, Zen Quotes, NASA APOD), all free-tier with rate limits. 30+ workshop attendees hitting the same APIs from the same network simultaneously.

### Decision
Services return fallback data instead of raising exceptions. Each catches errors, logs them, and returns a dict with sensible defaults and a `fallback: True` flag. Primary motivation: prevent workshop disruption from rate limits or connectivity issues.

### Consequences
- Dashboard stays functional when APIs are unavailable
- Resilient to conference wifi issues and rate limiting
- Silent failures could mask bugs during development

---

## ADR-010: No Automated Tests

**Date:** March 2026
**Status:** Accepted (acknowledged debt)

### Context
Tests were originally left out for simplicity and as a potential live TDD demo. The TDD demo moved to a different codebase.

### Decision
No test suite exists. This is now a known gap, not a deliberate ongoing choice. Tests were never added back after the TDD demo scope changed.

### Consequences
- No automated verification of routes, services, or components
- Refactoring carries more risk without a safety net
- Adding pytest (backend) and Vitest (frontend) is a valuable future contribution

---

## ADR-011: No Authentication or User Management

**Date:** March 2026
**Status:** Accepted

### Context
Single-user local app with no deployment target. Workshop focuses on agentic IDE workflows.

### Decision
No auth. Two reasons: (1) it solves a problem that doesn't exist — no one logs into a locally-running personal app, and (2) adding auth end-to-end is preserved as a compelling workshop exercise for demonstrating AI-assisted full-stack development.

### Consequences
- No users, sessions, or permissions
- Non-issue for local use; blocker for shared deployment
- Serves as a ready-made exercise for agentic IDE demos

---

## ADR-012: Latest Dependency Versions Across the Stack

**Date:** March 2026
**Status:** Accepted

### Context
Needed to choose dependency versions for a new project.

### Decision
Use the latest stable versions of everything: Flask 3.1, React 18.3, Vite 6.4, Tailwind v4, SQLAlchemy 2.0+ style. General principle, not per-dependency evaluation. This means Tailwind v4's CSS-native `@theme` tokens and SQLAlchemy's `mapped_column` syntax.

### Consequences
- Modern API surfaces and current best practices throughout
- Attendees see patterns applicable to new projects
- Less community documentation for newest versions

---

## ADR-013: JSON Columns for Card Configuration and Layout

**Date:** March 2026
**Status:** Accepted

### Context
Each card type has different config needs (weather needs `city`, space needs nothing). Layout data (`x, y, w, h`) is always read/written as a unit.

### Decision
Both `config` and `layout` are JSON columns on the Card model. New card types can define arbitrary config shapes without schema migrations. Layout avoids an unnecessary join.

### Consequences
- Zero schema changes when adding new card types with unique config
- Config structure is implicit (convention) rather than explicit (schema)
- SQLite JSON query limitations are irrelevant — the app never queries by config contents

---

## ADR-014: Destructive Seed Script

**Date:** March 2026
**Status:** Accepted (known limitation)

### Context
Needed a way to populate initial card data. Built under time constraints.

### Decision
`seed.py` deletes all cards and todos before re-inserting defaults. This was a pragmatic MVP shortcut, not a deliberate design choice.

### Consequences
- Reproducible starting state for workshops — every attendee gets the same data
- Destructive to any user customizations (cards, todos, layout arrangements)
- Future improvement: upsert-based seed that preserves existing data
