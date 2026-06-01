# Agent instructions — agentic_ide_demo_app

**Default guidance for any contributor** using an agent in this repo: how things are structured, how to run them, and where to make changes. Prefer the **source of truth in code** over narrative docs when they disagree (see [Known inconsistencies](#known-inconsistencies)).

`BOOTSTRAP_PROMPT.md` is listed in **`.cursorignore`**—the agent workspace typically **cannot read it**; do not assume its contents. Ignore it for policy and architecture decisions unless a human pastes relevant excerpts.

## What this project is

A **multi-card dashboard**: a React SPA lists **cards** from the backend; each card loads **live JSON** from `/api/data/<source>`. The UI uses **react-grid-layout**; when the user unlocks the layout, **position and size** are persisted on each card’s `layout` field via `PUT /api/cards/:id`.

## Repository layout

| Area | Role |
|------|------|
| `backend/` | Flask app factory, SQLAlchemy models, REST blueprints, external API “services” |
| `backend/migrations/` | Alembic revisions |
| `backend/run.py` | App entry; runs the dev server when executed |
| `backend/seed.py` | Wipes and re-seeds the `cards` table |
| `frontend/` | Vite + React; `src/` holds UI |
| `frontend/src/api.js` | Fetch helpers for `/api/cards` and `/api/data/...` |
| `frontend/src/components/Card.jsx` | Maps `card.source` → widget component + fetches data |
| `frontend/src/components/Dashboard.jsx` | Grid layout, lock/unlock, debounced layout saves |
| `frontend/src/index.css` | Tailwind v4 `@theme` tokens and a few global/keyframe/grid overrides |
| `.env` (repo root, gitignored) | Loaded by `backend/config.py` via `python-dotenv` |
| `.env.example` | Documents `NASA_API_KEY` and `FLASK_SECRET_KEY` |

## Tech stack (verified)

- **Backend:** Python 3.11+, Flask 3.x, Flask-SQLAlchemy, Flask-Migrate, Flask-CORS, `requests`, SQLite (`sqlite:///app.db` in `config.Config`).
- **Frontend:** React 18, Vite 6, **Tailwind CSS v4** via `@tailwindcss/vite`, **react-grid-layout** v2.

## Local development

Run **two processes** (from separate terminals).

**Backend** (working directory `backend/`):

```bash
python3.13 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
flask --app run.py db upgrade
python seed.py
python run.py
```

**Frontend** (working directory `frontend/`):

```bash
npm install
npm run dev
```

**Ports and proxy (source of truth):**

- Flask dev server listens on **port 5001** (`backend/run.py`).
- Vite dev server uses **port 5173** and proxies **`/api`** to `http://127.0.0.1:5001` (`frontend/vite.config.js`).
- The browser should load the UI at `http://localhost:5173`; API calls use relative `/api/...` (`frontend/src/api.js`).

## Environment variables

`backend/config.py` loads **repo-root** `.env` and reads:

- **`NASA_API_KEY`** — optional; NASA APOD uses `DEMO_KEY` when unset (`backend/app/services/space.py`).
- **`FLASK_SECRET_KEY`** — Flask secret; defaults to a dev value in config if unset.

**Do not** commit real secrets. `.gitignore` and `.cursorignore` both exclude `.env`.

## Backend architecture

- **App factory:** `backend/app/__init__.py` — registers blueprints under `/api`.
- **Models:** `backend/app/models/card.py` — `Card` with `config` and `layout` JSON, ordering by `position`, `is_active` filter on list.
- **Routes:**
  - `backend/app/routes/cards.py` — CRUD under `/api/cards` (list filters `is_active=True`; `PUT` accepts `layout` among other fields).
  - `backend/app/routes/data.py` — `/api/data/<source>` dispatches to service callables in `SERVICES`; query string args are passed as kwargs to the handler (e.g. weather `city`).

## Frontend architecture

- **Card types:** `Card.jsx` uses `CARD_REGISTRY` keyed by `card.source`. Unknown sources fall back to the placeholder entry.
- **Data loading:** For `needsData: true`, `fetchCardData(source, card.config)` builds query params from `config` and GETs `/api/data/<source>?...`.
- **Styling:** Prefer **Tailwind utilities** in JSX. Design tokens live in `frontend/src/index.css` under `@theme` (e.g. `--color-card-weather`). Some **custom CSS** is intentional for animations and **react-grid-layout** overrides—do not assume “Tailwind only” with zero CSS file changes.
- **Layout UX:** Dashboard starts **locked**; unlocking enables drag/resize; `onLayoutChange` debounces and `PUT`s `layout: { x, y, w, h }` per card.

## How to add a new dashboard “card type”

1. **Backend service:** Add `backend/app/services/<name>.py` with a `fetch(**kwargs)` (or compatible) function; handle failures with **graceful fallbacks** (pattern: `weather.py`, `quotes.py`, `space.py`).
2. **Register source:** Add the source string to `SERVICES` in `backend/app/routes/data.py`.
3. **Frontend widget:** Add `frontend/src/components/cards/<Name>Card.jsx` and wire it in `CARD_REGISTRY` in `Card.jsx` (set `needsData` and `accent` token to match a `--color-card-*` or extend `@theme`).
4. **Data in DB:** Add a row via `POST /api/cards` or extend `backend/seed.py` and re-seed (seed **deletes all cards** first).
5. **Schema changes:** If the model changes, add an Alembic migration under `backend/migrations/versions/` and run `flask --app run.py db upgrade`.

## External APIs (current implementations)

- **Weather:** Open-Meteo + Open-Meteo geocoding — **no API key**; `city` from query/config.
- **Quotes:** `zenquotes.io/api/random` — offline fallback quote in code.
- **Space:** NASA APOD — `NASA_API_KEY` or `DEMO_KEY`.

## Agent behavior expectations

- **Scope:** Change only what the task requires; prefer small, reviewable diffs unless the task explicitly calls for a larger refactor.
- **Verify behavior:** After backend changes, ensure `flask --app run.py db upgrade` and seeds/migrations still make sense. After frontend changes, run `npm run dev` and confirm `/api` proxy matches the Flask port.
- **Secrets:** Never paste `.env` contents into chat or commit them; use `.env.example` for documenting new keys.
- **Documentation:** If you change ports, proxy targets, or env vars, update `README.md` in the same change when practical.

## MCP servers

This repo connects to external services via the Model Context Protocol. MCP configs live in two places:

- **`.mcp.json`** (repo root) -- read by Claude Code. Contains the ClickUp MCP server.
- **`.cursor/mcp.json`** -- read by Cursor. Contains the ClickUp MCP server, Context7 (documentation lookup), and a project-local coin-flip demo server.

### ClickUp (project management)

- **Endpoint:** `https://mcp.clickup.com/mcp`
- **Auth:** OAuth 2.1 (run `/mcp` in Claude Code or authenticate via Cursor's MCP panel on first use)
- **What it provides:** Read and write access to the ClickUp workspace -- tasks, lists, comments, statuses, custom fields. The agent can read tickets, create stories, post comments, and update task status.
- **When to use:** When a task references a ClickUp ticket, when decomposing Epics into stories, when checking tickets against `docs/standards/definition_of_ready.md`, or when pushing dev-side refinements back to ClickUp.

### Team standards documents

The `docs/standards/` directory contains team policy documents that AI agents reference during workflows:

- **`docs/standards/definition_of_ready.md`** -- The team's Definition of Ready checklist. Agents read this file when evaluating whether a ClickUp ticket is ready for development. See the file's "How this document is used" section for details.

## Known inconsistencies

- **`README.md`** says the API runs on port **5000**, but **`backend/run.py`** and **`frontend/vite.config.js`** use **5001**. Trust those files and the [Ports and proxy](#local-development) section here.
