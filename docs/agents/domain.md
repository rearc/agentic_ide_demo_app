# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

**Layout: single-context.** One `CONTEXT.md` at the repo root (not created yet — that's fine) plus a single `docs/adr/` directory.

## Before exploring, read these

- **`CONTEXT.md`** at the repo root — the glossary / ubiquitous language.
- **`docs/adr/`** — read ADRs that touch the area you're about to work in. Files are named `ADR-NNN-slug.md` (e.g. `ADR-008-service-dispatch-card-registry.md`); `docs/adr/README.md` is the index.

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The `/domain-modeling` skill (reached via `/grill-with-docs` and `/improve-codebase-architecture`) creates them lazily when terms or decisions actually get resolved.

## File structure

```
/
├── CONTEXT.md                ← glossary (lazily created)
├── docs/adr/
│   ├── README.md             ← index
│   ├── ADR-001-not-production-ready-by-design.md
│   └── ADR-017-additive-seed-with-explicit-reset.md
├── backend/
└── frontend/
```

New ADRs continue the existing `ADR-NNN-slug.md` numbering and are added to `docs/adr/README.md`.

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal — either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Related authorities

Domain docs are orientation, not convention enforcement. Coding conventions live in `.claude/rules/` and [`docs/coding_standards.md`](../coding_standards.md); those win on any conflict.

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-011 (no authentication) — but worth reopening because…_
