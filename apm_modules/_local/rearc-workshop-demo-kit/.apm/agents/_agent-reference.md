---
# ─────────────────────────────────────────────────────────────────────────────
# SUBAGENT FRONTMATTER — REFERENCE CATALOG
# The analog of `_frontmatter-reference` (skills) and `settings.example.jsonc`.
# Open this file to see every field that customizes a `.claude/agents/*.md` subagent.
# NOTE: subagent frontmatter is camelCase (disallowedTools, permissionMode, maxTurns)
#       — NOT the hyphenated form skills use (allowed-tools, disable-model-invocation).
# ─────────────────────────────────────────────────────────────────────────────

# ── Active fields on THIS reference agent (kept minimal + inert) ──
name: _agent-reference                    # REQUIRED. lowercase + hyphens. Also the `agent_type` in hooks.
description: >-                            # REQUIRED. Drives auto-delegation. Written here to WAVE CLAUDE OFF —
  Reference catalog of every subagent frontmatter field. This is documentation to
  read, NOT a working agent. Never delegate tasks to this agent.
tools: Read                               # allowlist (space/comma list). Omit = inherit ALL tools. Kept to Read so it's harmless.
model: inherit                            # sonnet | opus | haiku | fable | <full id> | inherit. Default: inherit.
color: cyan                               # task-list/transcript color: red blue green yellow purple orange pink cyan.

# ── The rest of the menu (commented so they don't activate) ──
# disallowedTools: mcp__github, Bash      # denylist — remove tools from the pool. Same format as `tools`; applied before it.
# permissionMode: plan                    # default | acceptEdits | auto | dontAsk | bypassPermissions | plan | manual(=default, 2.1.200+).
# maxTurns: 15                            # integer cap on agentic turns before the subagent stops.
# effort: high                            # low | medium | high | xhigh | max. Overrides session effort. Default: inherit.
# maxTurns/effort/model tune HOW HARD it runs; tools/disallowedTools/permissionMode tune WHAT it may touch.
#
# skills: [flask-api-conventions, commit-message]   # preload skills at startup — FULL skill content injected, not just the description.
# mcpServers: [random-tools]              # MCP servers this subagent may reach (names or inline defs). (ignored for plugin subagents)
# hooks: { PreToolUse: [...] }            # lifecycle hooks (PreToolUse/PostToolUse/Stop) scoped to THIS subagent only.
# memory: project                         # user (all projects) | project (via VCS) | local (this project, un-tracked). Persists across sessions.
#
# background: true                        # always run as a background task. Unset = Claude decides (backgrounds by default, 2.1.198+).
# isolation: worktree                     # run in an isolated git worktree instead of the main checkout.
# initialPrompt: "Start by reading AGENTS.md"   # auto-submitted first turn when this agent is the MAIN session (--agent / `agent` setting).
---

# Subagent frontmatter reference

Everything above is the full control surface for a subagent definition. This file is a
**take-home cheat sheet** — the subagent counterpart to the `_frontmatter-reference` skill.
It is deliberately inert: read it, don't delegate to it.

## The one big gotcha vs skills

Subagents and skills look similar but their frontmatter differs in two ways that bite people:

1. **Casing.** Subagents are **camelCase** (`disallowedTools`, `permissionMode`, `maxTurns`,
   `mcpServers`, `initialPrompt`). Skills are **hyphenated** (`allowed-tools`,
   `disable-model-invocation`, `when_to_use`). Copy-pasting a field from a skill into an
   agent (or vice-versa) silently fails.
2. **No invocation switch.** Skills have `disable-model-invocation` / `user-invocable` to
   control *who* can call them. **Subagents have neither.** Every subagent is eligible for
   auto-delegation — the *only* lever is the `description`. That's why this file's
   `description` explicitly says "not a working agent, never delegate to this."

## The fields, grouped

**Identity & routing**
- `name` (required) — lowercase-hyphen id; also the `agent_type` seen by hooks.
- `description` (required) — *how Claude decides to auto-delegate.* Add **"use proactively"**
  to encourage it; describe what it's NOT for to discourage it. This is the whole steering
  mechanism — there is no on/off field.

**What it may touch** (mirrors the Permissions beat)
- `tools` — allowlist (space/comma list, MCP patterns allowed). Omit = inherit all tools.
- `disallowedTools` — denylist; applied before `tools`. e.g. `mcp__*` blocks all MCP tools.
- `permissionMode` — `default` / `acceptEdits` / `auto` / `dontAsk` / `bypassPermissions` /
  `plan` / `manual`. The same postures from the settings beat, scoped to one agent.

**How hard it runs**
- `model` — `sonnet`/`opus`/`haiku`/`fable`/full-id/`inherit` (default `inherit`).
- `effort` — `low`…`max`; overrides session effort.
- `maxTurns` — hard cap on agentic turns.

**What it composes with** (this is the "everything connects" part)
- `skills` — preload skills into the subagent at startup. **Full content is injected**, not
  just the description — so a subagent can start already knowing a convention.
- `mcpServers` — which MCP servers it can reach.
- `hooks` — PreToolUse/PostToolUse/Stop hooks scoped to *just this agent*.
- `memory` — `user` / `project` / `local`; persistent memory across sessions.

**Where & how it shows up**
- `background` — always run as a background task (`true` only).
- `isolation` — `worktree` runs it in an isolated git worktree.
- `color` — display color in the task list / transcript.
- `initialPrompt` — auto-submitted first turn when this agent runs as the *main* session
  (via `--agent` or the `agent` setting), not when it's delegated to.

## Built-in subagents (for contrast — you don't define these)

`Explore`, `Plan`, `general-purpose`, `statusline-setup`, `claude-code-guide` ship with
Claude Code. `general-purpose` (all tools, inherits the model) is the default when a
subagent is spawned without a named type. There is **no** built-in named `claude`.
