# Claude Code - project instructions

@AGENTS.md

## Claude Code specifics

The instructions above are imported from `AGENTS.md` - the shared, cross-tool source of truth (the same file GitHub Copilot reads). One instructions set, both harnesses. Everything below is Claude-Code-specific.

- **Guardrails are enforced, not suggested.** This repo ships hooks (`.claude/hooks/`) that run deterministically: a `PreToolUse` guard blocks destructive shell commands (`rm -rf`, `git reset --hard`, `.env`/credentials reads). If a command is blocked, surface it - do not try to work around it.
- **Rules are path-scoped.** `.claude/rules/` holds coding conventions; the Tailwind and migration rules load only when you touch `frontend/` or the backend models/migrations, so they don't add noise elsewhere.
- **Setup + run:** see the "Local development" section above (Python 3.11+ venv on port 5001; `nvm use` then Vite on 5173). `backend/seed.py` is additive - it inserts only the default cards that are missing and preserves user data. `python seed.py --reset` is the destructive path that wipes and re-seeds the `cards` and `todos` tables (ADR-017).
