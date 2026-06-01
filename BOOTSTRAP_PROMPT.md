# Bootstrap Prompt for Demo App

> **Instructions:** Copy everything below the line into a fresh Claude Code session opened in this repo (`~/code/agentic_ide_demo_app/`). This prompt contains all the context needed to build the app from scratch.

---

## Context

I'm building a demo app for a Agentic IDE workshop. This app will be used as a **live demo canvas** in front of ~20 engineers to teach them how agentic IDE primitives work (rules, skills, commands, agents, MCP servers) using Cursor as the primary tool.

The app itself is NOT the point of the demo - it's the **surface area** that makes the primitive demos land. Every architectural decision should optimize for:
1. Understandable within a couple minutes of exploration - the audience needs to quickly grasp what the app does and how it's structured
2. Visually obvious when something changes (browser-visible results)
3. Natural targets for each primitive type (detailed below)
4. Small enough that an agentic IDE can reason about the entire codebase

## What to Build

A **multi-card dashboard** with a React frontend and Flask API backend. The dashboard displays data cards that pull from various free/no-auth APIs. It should feel like a lightweight "command center" or status board.

### Tech Stack

**Backend:**
- **Python 3.11+, Flask** - REST API serving JSON
- **SQLite + SQLAlchemy** - lightweight database, zero infrastructure
- **Flask-Migrate (Alembic)** - database migrations
- **Python venv** - dependency isolation

**Frontend:**
- **React 18+** via **Vite** - modern, fast dev server
- **Tailwind CSS** - utility-first styling
- **npm** - JS dependency management

**Architecture:** Monorepo with `backend/` and `frontend/` directories. Flask serves the API, React is the SPA. Two dev processes (Flask + Vite) during development.

### App Structure

```
agentic_ide_demo_app/
  backend/
    app/
      __init__.py            # Flask app factory
      models/
        __init__.py
        card.py              # Card model - stores card metadata and config
      routes/
        __init__.py
        cards.py             # CRUD API for cards (/api/cards)
        data.py              # Data-fetching proxy routes (/api/data/<source>)
      services/
        __init__.py
        weather.py           # Weather data fetcher
        quotes.py            # Quote data fetcher
        space.py             # NASA APOD data fetcher
    migrations/              # Alembic migrations directory
    config.py                # Configuration (API keys, DB URI, CORS)
    seed.py                  # Seed script to populate initial cards
    requirements.txt
  frontend/
    src/
      components/
        Dashboard.jsx        # Main card grid layout
        Card.jsx             # Generic card wrapper component
        cards/
          WeatherCard.jsx    # Weather-specific card rendering
          QuoteCard.jsx      # Quote-specific card rendering
          SpaceCard.jsx      # NASA APOD card rendering
          PlaceholderCard.jsx # Empty "Coming Soon" card
      App.jsx                # Root component, routing
      main.jsx               # Entry point
      api.js                 # API client (fetch wrapper for backend)
    index.html
    package.json
    vite.config.js           # Vite config (proxy to Flask API in dev)
    tailwind.config.js
  .env.example               # Example environment variables (API keys)
  README.md                  # Setup instructions for both backend and frontend
  .gitignore
```

### Database Design

Simple schema - just enough to make migrations and model work meaningful:

**cards table:**
- `id` (integer, primary key)
- `slug` (string, unique) - e.g., "weather", "quote", "space"
- `title` (string) - display name
- `description` (string) - short description
- `icon` (string) - emoji
- `source` (string) - which data service to use
- `config` (JSON) - card-specific config (e.g., city for weather, category for quotes)
- `position` (integer) - display order on the dashboard
- `is_active` (boolean) - whether to show on the dashboard
- `created_at` (datetime)

The seed script populates the initial 4 cards (weather, quote, space, placeholder).

### API Design

```
GET    /api/cards              # List all active cards (ordered by position)
GET    /api/cards/<id>         # Get single card
POST   /api/cards              # Create new card
PUT    /api/cards/<id>         # Update card
DELETE /api/cards/<id>         # Delete card
GET    /api/data/<source>      # Fetch live data for a card source (weather, quote, space)
```

The frontend fetches the card list from `/api/cards`, then for each card fetches its live data from `/api/data/<source>`. This separation means adding a new card type requires: a new service in `backend/app/services/`, a new React component in `frontend/src/components/cards/`, and a seed entry or API call to register it.

### Pre-built Cards

1. **Weather Card** - Current weather for a configurable city. Uses OpenWeatherMap free tier. Shows temperature, conditions, icon. Professional feel.
2. **Random Quote Card** - Pulls an inspirational/interesting quote from a free quote API. Refreshes on each load. Fun and lightweight.
3. **NASA APOD Card** - Astronomy Picture of the Day from NASA's free API. Shows the image and title. Fun, visually striking.
4. **Placeholder Card** - Intentionally empty. Shows "Coming Soon" with a subtle dashed border and a message like "What should we build here?" This is the live demo target - we'll fill this in during the workshop by asking the audience what feature to add.

### Frontend Design
- Clean, modern dashboard grid (Tailwind CSS Grid)
- Cards have subtle shadows, rounded corners, consistent padding
- Dark header bar with the app title
- Responsive-ish (doesn't need to be perfect, just not broken on a projector)
- Each card has a colored accent/header bar (different color per card)
- Loading spinner states for cards fetching data
- Error states that look friendly, not scary (if an API key is missing or an API is down)

### Key Design Decisions for Demo Compatibility

These decisions exist specifically to create good demo surface area for the primitives we'll build live:

1. **React + Flask split** - two real layers to work across, realistic architecture. Gives the agent meaningful multi-file work when adding features.
2. **SQLite + SQLAlchemy + migrations** - adding a new card type touches the model, requires a migration, and involves seed data. Real feature work, not just dropping a file in.
3. **Tailwind CSS** - a Cursor Rule about "always use Tailwind utility classes, never write custom CSS" has real teeth and is visible when violated.
4. **Consistent service/component pattern** - a Cursor Skill for "add a new dashboard card" has a clear multi-step workflow: create service, create component, seed the card, run migration if needed.
5. **API keys in .env** - so we can demo `.cursorignore` for sensitive files.
6. **The placeholder card exists** - an obvious "what should we build here?" moment for the audience at the end of the demo.
7. **Vite proxy config** - the frontend proxies API calls to Flask in dev. This is a realistic setup that can produce friction (CORS, proxy misconfiguration) which becomes a teaching moment.

### Graceful Fallbacks

Every card should handle the case where its API key is missing or the external API is unreachable:
- Weather: show "API key not configured" with a placeholder icon, not a crash
- NASA APOD: show a placeholder image or message
- Quote: fall back to a hardcoded quote with an attribution note "(offline fallback)"
- The app should always render and look presentable even with zero API keys set

## What NOT to Build

- No authentication/login
- No Docker or containerization (keep it simple: venv + npm install)
- No tests yet (we may add these during demos as a primitive exercise)
- No `.cursor/` directory or AGENTS.md - those will be created live during the demo
- No CI/CD config
- No production deployment config

## After Building

Once the app is complete:
1. Create a `.gitignore` (Python venv, node_modules, .env, __pycache__, SQLite db file, Alembic versions if they contain generated content)
2. Make sure `README.md` has clear setup instructions: clone, create venv, pip install, npm install, seed the database, run both dev servers
3. Verify all cards render with graceful fallbacks when API keys aren't set
4. Make sure the placeholder card is obviously "empty" and inviting
5. Commit everything in a clean initial state

Do NOT create any Cursor configuration files (`.cursor/` directory, `AGENTS.md`, etc.) - those are what we'll build live during the demo.

## Build Order

1. Backend: Flask app factory, config, venv, requirements.txt
2. Backend: SQLAlchemy models, Flask-Migrate setup, initial migration
3. Backend: Seed script with the 4 initial cards
4. Backend: API routes (cards CRUD + data proxy)
5. Backend: Data services (weather, quote, space) with fallbacks
6. Frontend: Vite + React + Tailwind scaffold
7. Frontend: API client, Dashboard layout, generic Card component
8. Frontend: Individual card components (Weather, Quote, Space, Placeholder)
9. Frontend: Vite dev proxy config pointing to Flask
10. Root: README, .env.example, .gitignore
11. Test both servers running together, verify the full flow works

Go ahead and build this. Ask me any clarifying questions before you start, but I think this is comprehensive enough to just go.
