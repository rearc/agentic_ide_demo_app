# Dashboard

A widget dashboard with a React frontend and Flask API backend. Displays data cards pulling from various APIs, with an architecture that supports both data-fetching widgets and standalone interactive widgets.

## Prerequisites

- **Python 3.11+** — required (the backend uses `datetime.UTC`, added in 3.11). A bare `python3` on macOS is often the system 3.9 or a conda `base` 3.10, which will fail only later at `db upgrade`. Build the venv with an explicit 3.11+ interpreter (see Backend below).
- **Node.js 22** (Active LTS) — pinned in `frontend/.nvmrc`. Node 20 is end-of-life; use [nvm](https://github.com/nvm-sh/nvm) to match.
- **npm 9+**
- **[uv](https://github.com/astral-sh/uv)** — only needed for the random-tools MCP server, not for running the app.

## Environment Variables

Copy `.env.example` to `.env` in the project root:

```bash
cp .env.example .env
```

- **FLASK_SECRET_KEY** — Optional. `backend/config.py` falls back to a dev default if unset, so the app boots without it. Set it for anything beyond local dev.
- **NASA_API_KEY** — Optional. Free at [api.nasa.gov](https://api.nasa.gov/) (works without a key using DEMO_KEY, but with stricter rate limits).

Weather data uses Open-Meteo (no key required). All cards render with graceful fallbacks when APIs are unreachable.

## Setup

### Backend

Create the venv with an explicit 3.11+ interpreter (do **not** rely on a bare `python3` — see Prerequisites):

```bash
cd backend
python3.11 -m venv venv        # or python3.13 / any 3.11+
source venv/bin/activate
python --version               # sanity check: should be 3.11+
pip install -r requirements.txt
```

Initialize the database:

```bash
flask --app run.py db upgrade
python seed.py                 # WARNING: destructive — wipes and re-seeds the cards
                               # and todos tables. Any card added at runtime is lost.
```

Start the dev server:

```bash
python run.py
```

The API runs at `http://127.0.0.1:5001`.

### Frontend

```bash
cd frontend
nvm use                        # switches to the Node version in .nvmrc (22); `nvm install` first time
npm install
npm run dev
```

If a fresh `npm install` reports advisories, run `npm audit fix` (never `--force`, which bumps majors and can break the build).

The app runs at `http://localhost:5173` and proxies API requests to the Flask backend.

## MCP Servers

### Random Tools

A minimal [FastMCP](https://github.com/modelcontextprotocol/python-sdk) server exposing two random-number tools: `coin_flip` (returns heads/tails) and `roll_die` (rolls an N-sided die — takes a `sides` parameter, default 6). Its source lives in `mcp-servers/random-tools-mcp/server.py`.

The server is configured in `.mcp.json` (read by Claude Code) and `.vscode/mcp.json` (read by VS Code / Copilot), kept in sync, and launched automatically via stdio with `uv`:

```json
"random-tools": {
  "type": "stdio",
  "command": "uv",
  "args": ["run", "--with", "mcp[cli]", "mcp-servers/random-tools-mcp/server.py"]
}
```

`uv` must be on your PATH; it resolves dependencies (`mcp[cli]`) on first run, so no manual venv/pip step is needed.

## Project Structure

```
backend/
  app/
    models/card.py       # Card model (SQLAlchemy)
    routes/cards.py      # CRUD API (/api/cards)
    routes/data.py       # Data proxy (/api/data/<source>)
    services/            # Weather, quotes, space data fetchers
  migrations/            # Alembic migrations
  config.py              # App configuration
  seed.py                # Database seed script
  run.py                 # Flask entry point

frontend/
  src/
    components/
      Dashboard.jsx      # Card grid layout
      Card.jsx           # Generic card wrapper
      cards/             # Widget-specific components
    api.js               # Backend API client
    App.jsx              # Root component
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/cards` | List active cards |
| GET | `/api/cards/:id` | Get single card |
| POST | `/api/cards` | Create card |
| PUT | `/api/cards/:id` | Update card |
| DELETE | `/api/cards/:id` | Delete card |
| GET | `/api/data/:source` | Fetch live data for a source |
