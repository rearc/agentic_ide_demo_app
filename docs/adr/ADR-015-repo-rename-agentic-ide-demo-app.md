# ADR-015: Repo Rename from cursor_workshop_demo_app to agentic_ide_demo_app

**Date:** May 2026
**Status:** Accepted

### Context

This repo was originally built as a Cursor-only workshop canvas — a multi-card dashboard used to teach Cursor's agentic primitives (rules, skills, custom commands, agents, MCP servers) to a room of engineers. The repo's name (and its GitHub slug `cursor_demo_mission_control_app`) reflected that single-IDE focus.

The scope has since broadened. The `claude-copilot-ready` branch holds a parallel version of the same demo app where the cursor-specific `.cursor/` layer has been replaced with APM-deployed primitives that fan out across Claude Code, GitHub Copilot, and Cursor. Future workshop variants will use this branch as the base for Claude Code and Copilot sessions. The repo is no longer a cursor-only artifact, and the name should not imply that it is.

### Decision

Rename:

- **GitHub repo** `rearc/cursor_demo_mission_control_app` → `rearc/agentic_ide_demo_app`. GitHub's automatic redirect preserves existing links and clones from breaking.
- **Local source directory** `~/code/cursor_workshop_demo_app/` → `~/code/agentic_ide_demo_app/`. The local dir name had already drifted from the GitHub slug; the rename brings the two back into alignment under the new name.
- **In-repo content references** on the `claude-copilot-ready` branch only: `apm.yml` package name (`cursor-workshop-demo-app` → `agentic-ide-demo-app`), the `AGENTS.md` H1 heading, `BOOTSTRAP_PROMPT.md` path references, and both ADR file H1 headings.

The `main` branch is intentionally not updated. `main` represents the cursor-only variant of the workshop, and its content (including `.cursor/` primitives and the cursor-specific language in `AGENTS.md` / `BOOTSTRAP_PROMPT.md`) is correct as-is for that purpose.

References to the old name in the sibling `ai-toolkit/` repo (`CLAUDE.md` layout section, `rearc/workshop-demo-kit`'s `README.md` and `apm.yml` description) are deliberately deferred. They will be cleaned up in a separate pass scoped to that repo, when `ai-toolkit` is the active worktree.

### Consequences

- Existing links to the GitHub repo continue working through GitHub's repo-name redirect; old clones can still `git push` / `git pull` against the redirected URL, though we update the local clone's remote URL explicitly to point at the new slug.
- Local Claude Code state (auto-memory at `~/.claude/projects/-Users-admin-code-cursor-workshop-demo-app/`) is migrated to the new encoded path so memory entries follow the rename. No `.jsonl` chat sessions exist for this project (it has only ever been used through Cursor), so the rewrite-paths-inside-transcripts problem documented in the community tooling does not apply here.
- The cursor variant remains accessible on the `main` branch under the new repo name. Workshop attendees pointed at `main` get the cursor experience; those pointed at `claude-copilot-ready` get the cross-IDE experience.
- Future ai-toolkit-scoped work will need to address the deferred references — they currently document a path (`cursor_workshop_demo_app/`) that no longer exists locally, which could confuse readers until cleaned up.
</content>
