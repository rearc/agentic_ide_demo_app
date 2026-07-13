# CLAUDE.md examples (external snapshots)

Reference snapshots of **other projects'** `CLAUDE.md` files, used in the Section 3
"Foundation / Memory" walkthrough to show how large orgs write CLAUDE.md files and
what makes them effective.

> **These are NOT instructions for this repo.** They are third-party examples, saved
> here for the demo. They are deliberately named so Claude Code will **not** auto-load
> them as project memory (none is named `CLAUDE.md`), and this directory is additionally
> excluded via `.claude/settings.json` (`permissions.deny` on a `Read(...)` of this path).

## Files

| File | Source | Fetched | Notes |
|---|---|---|---|
| `netflix-x-test.claude-md.txt` | [Netflix/x-test `CLAUDE.md`](https://github.com/Netflix/x-test/blob/main/CLAUDE.md) | 2026-07-12 | The **comprehensive / reference-manual** style (~132 lines): overview, commands, a 7-component architecture map, file structure, testing patterns. `.txt` suffix so it is never mistaken for a real `CLAUDE.md`. |
| `netflix-metaflow-agents.md` | [Netflix/metaflow `AGENTS.md`](https://github.com/Netflix/metaflow/blob/master/AGENTS.md) | 2026-07-12 | The **minimalist / delegation** style (~29 lines). metaflow's `CLAUDE.md` is a **symlink to `AGENTS.md`** - the same "one instructions file, both tools" bridge this repo uses (we `@import`; they symlink). Note the maintainer **identity check** and the delegation to `CONTRIBUTING.md`. |

## Also referenced in the talk (not snapshotted here)

- **The Netflix iOS leak** - a `CLAUDE.md` accidentally shipped inside the app bundle
  (`Netflix/Payload/Argo.app/CLAUDE.md`), exposing A/B-test/feature-flag gates and a
  Swift/GraphQL file map. Cautionary tale: a CLAUDE.md is a file-map + intent doc; treat
  it as sensitive and **exclude AI-agent files from release builds**.
  Writeup: <https://www.nowrap.ai/news/netflix-claude-md-leak>

Snapshots are point-in-time; refresh from the source URLs before presenting if needed.
