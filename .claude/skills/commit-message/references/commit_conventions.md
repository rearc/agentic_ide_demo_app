# Commit message conventions

This repo uses a **subject-first** format so history scans quickly and intent is obvious from one line.

## Subject line: `Verb: Description`

- **Pattern:** `Verb: short description` (imperative mood after the verb; capitalize the verb only if you prefer title case on the noun phrase — be consistent within a change).
- **Length:** Aim for **~50 characters** on the subject; hard cap **~72** so tools and `git log --oneline` stay readable.
- **Scope:** One logical change per commit when possible. If you must bundle, the subject should reflect the **primary** outcome.

### Approved verbs (examples)

| Verb | Use when |
|------|----------|
| **Add** | New feature, file, endpoint, dependency, or behavior |
| **Fix** | Bug fix, regression, incorrect behavior |
| **Refactor** | Restructure without intended behavior change |
| **Update** | Bump versions, refresh copy, adjust config without a clear Add/Fix |
| **Remove** | Delete code, feature, or dependency |
| **Docs** | README, comments, AGENTS.md, inline documentation only |
| **Chore** | Tooling, CI, formatting-only sweeps, housekeeping |
| **Test** | Tests only (new or changed) |

Other verbs are fine if they fit better (**Rename**, **Revert**, **Security**, **Perf**), but stay in the same `Verb: Description` shape.

### Good examples

- `Add: new weather card`
- `Fix: broken API proxy`
- `Refactor: card registry pattern`
- `Docs: align README port with run.py`
- `Chore: pin frontend devDependencies`

### Avoid

- Vague subjects: `Update stuff`, `Fix bug`, `Changes`
- Past tense in the description: prefer **Add feature** not **Added feature** (reads like an order to the codebase)
- Trailing period on the subject line

## Body (optional but encouraged for non-trivial changes)

Separate the subject from the body with a **blank line**.

The body should explain **why** the change was made — motivation, tradeoffs, or context — not a file-by-file recap of **what** changed (that is what `git diff` is for).

Guidelines:

- Wrap at **~72 characters** per line for plain-text readability.
- Bullet lists are fine for multiple reasons or follow-up notes.
- Mention **breaking changes**, migration steps, or env var renames explicitly.
- Reference issues or tickets if the project uses them (`Fixes #123`).

## Footer (optional)

Use for metadata:

- `Co-authored-by: Name <email@example.com>`
- `BREAKING CHANGE: ...` (Conventional Commits style) if applicable

## Summary checklist

1. Subject matches `Verb: Description`.
2. Subject is concise; body explains **why**.
3. Message matches what is actually staged (`git diff --staged`).
