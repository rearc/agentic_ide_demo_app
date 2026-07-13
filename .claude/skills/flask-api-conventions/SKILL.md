---
name: flask-api-conventions
description: Backend conventions for this Flask API — service-layer shape, data-route wiring, config/secrets access, and error handling. Background knowledge Claude applies when working in the backend.
when_to_use: "Applied automatically when reading or editing Python files under backend/ (services, routes, config, models)."
user-invocable: false
paths: backend/**
---

# Flask API conventions

Reference knowledge for the backend. This is **not** a command — it loads automatically when work touches `backend/**` so generated code matches the existing patterns.

## Service layer (`backend/app/services/<name>.py`)

- Export a function named `fetch` that accepts config params as keyword args plus `**_kwargs`.
- Return a **flat dict** (no nested objects) with the card's data fields.
- Wrap every external call in `try/except`; on failure return a fallback dict with `'fallback': True` and the **same keys** as the success response.
- Use `requests` with `timeout=5` for HTTP.
- Log with `logging.getLogger(__name__)` and `logger.exception()` on error.

## Data-route wiring (`backend/app/routes/data.py`)

- Register a service by importing it and adding an entry to the `SERVICES` dict.
- The `SERVICES` key must exactly match the `source` value on the card record.

## Config & secrets (`backend/config.py`)

- Read secrets via `os.environ.get('KEY', '<sensible-default>')` in the `Config` class — the app must still boot when a key is unset.
- In a service, reach config with `from flask import current_app` then `current_app.config.get('KEY')`.
- Never hardcode a key or read one outside `config.py`.

## Migrations

- Only a **stateful** card (its own model + table) needs an Alembic migration; data/static cards do not.
- Migrations live in `backend/migrations/`; the `todo` feature is the reference implementation.

## Python baseline

- Target **3.11+** (the app uses `datetime.UTC`).
