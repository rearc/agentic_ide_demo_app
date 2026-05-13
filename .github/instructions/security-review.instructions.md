---
description: Security review checklist for the workshop demo app. Apply when reviewing code for security concerns.
---

# Security Review Checklist

Use this checklist when reviewing code for security concerns.

## Input Validation

- All user input is validated and sanitized before use.
- Request parameters are type-checked (int, string, enum) at the route level.
- File uploads are restricted by type, size, and stored outside the web root.

## SQL Injection

- All database queries use SQLAlchemy ORM or parameterized queries.
- No raw SQL strings with f-strings or `.format()` interpolation.
- `text()` usage always binds variables via `:param` syntax.

## XSS (Cross-Site Scripting)

- React's JSX auto-escaping is relied upon — no `dangerouslySetInnerHTML`.
- Any user-generated content rendered outside JSX is explicitly escaped.
- API responses set `Content-Type: application/json`, not `text/html`.

## Authentication & Authorization

- Protected routes check authentication before processing.
- Authorization checks verify the user owns or has access to the resource.
- Session tokens / JWTs are not logged or exposed in URLs.

## Secrets & Configuration

- No hardcoded secrets, API keys, or passwords in source code.
- Secrets come from environment variables or a secrets manager.
- `.env` files are in `.gitignore` and never committed.
- Debug mode and verbose errors are disabled in production config.

## CORS & Headers

- CORS is configured to allow only known origins, not `*` in production.
- Responses include security headers (`X-Content-Type-Options`, `X-Frame-Options`).
