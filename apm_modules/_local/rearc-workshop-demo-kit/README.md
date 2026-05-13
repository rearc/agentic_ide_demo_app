# rearc/workshop-demo-kit

The agentic-primitive layer backing the **Rearc workshop demo app** — a multi-card React + Flask dashboard used in workshops to demonstrate how Claude Code, GitHub Copilot, and Cursor all pick up project-scoped skills, agents, instructions, hooks, and MCP servers via [APM](https://microsoft.github.io/apm/).

This is an **APM-native kit** ([ADR-0016](../../ADR.md#adr-0016-external-installer-wrapper-kits-as-a-second-supported-kit-shape)). Rearc-authored content (2 agents, 4 instruction files, 6 skills, 3 hooks, 3 MCP server registrations + 1 bundled local MCP) lives under `.apm/`. Four upstream skills are pulled in at per-skill subpath granularity (per [ADR-0015](../../ADR.md#adr-0015-upstream-skills-are-declared-at-per-skill-subpath-granularity-not-whole-collection)).

## What it ships

### Rearc-authored

**Agents** (cross-tool subagent / chatmode):

| Agent | What it does |
|---|---|
| `code-reviewer` | Reads code and returns structured findings against the project's security checklist, conventions, and quality rules. Does not modify files. |
| `research-assistant` | Investigates topics (API docs, library comparisons, architecture options) and returns concise summaries. Does not write code. |

**Instructions** (cross-tool always-applied / on-demand context):

| Instruction file | What it covers |
|---|---|
| `api-conventions` | Flask API response shape + HTTP status code conventions |
| `migrations` | SQLAlchemy model changes + Alembic migration best practices |
| `security-review` | Security review checklist (input validation, SQL injection, XSS, auth, secrets, CORS) |
| `tailwind` | Tailwind-only styling rule for React components |

**Skills**:

| Skill | What it does |
|---|---|
| `add-dashboard-card` | Step-by-step workflow for adding a new card type (backend service, route, frontend component, registry, accent color, seed) |
| `coin-flip` | Random heads/tails via LLM's own choice |
| `coin-flip-code` | Heads/tails via Python script (pseudorandom) |
| `coin-flip-true-random` | Heads/tails via random.org atmospheric noise |
| `flip-until-heads` | Repeatedly invokes `coin-flip-true-random` until heads, with per-flip visibility |
| `commit-message` | Drafts a `Verb: Description` subject + body from staged diff, asks intent questions, never auto-commits |

**Hooks** (Claude Code-style format, deployed via APM's hooks primitive):

| Hook | Event | What it does |
|---|---|---|
| `audit` | PreToolUse `.*` | Logs every tool call to `/tmp/agent-audit.log` |
| `safety` | PreToolUse `Bash` | Blocks `rm -rf`, `DROP TABLE`, `git push --force`, `.env` references, etc. Emits harness-appropriate block responses (Cursor `permission: deny` / Claude Code `decision: block`). |
| `lint` | PostToolUse `Edit\|Write\|MultiEdit` | Routes edited files to ESLint or Ruff with `--fix` |

The hook scripts handle both Cursor's and Claude Code's hook JSON payloads — `tool_input.file_path` / `tool_input.command` for Claude Code, top-level `.file_path` / `.command` for Cursor.

**MCP server registrations** (deployed via APM's `mcp:` primitive):

| Name | Transport | What it provides |
|---|---|---|
| `clickup` | HTTP (`https://mcp.clickup.com/mcp`) | ClickUp tasks, lists, comments — OAuth 2.1 on first use |
| `context7` | HTTP (`https://mcp.context7.com/mcp`) | Documentation lookup — free tier, no auth |
| `coin-flip-mcp` | stdio (`uv run mcp-servers/coin-flip-mcp/server.py`) | Local demo MCP server — bundled in this kit; sidecar `setup.sh` copies it into the consumer project so the path resolves project-relative |

### Upstream skills (via APM per-skill subpath refs)

Four skills replacing the demo app's legacy `skills-lock.json` installer:

| Skill | Source |
|---|---|
| `frontend-design` | `anthropics/skills/skills/frontend-design` |
| `grill-me` | `mattpocock/skills/skills/productivity/grill-me` |
| `to-prd` | `mattpocock/skills/skills/engineering/to-prd` (was `write-a-prd` in the legacy lockfile — Pocock renamed upstream) |
| `react-best-practices` | `vercel-labs/agent-skills/skills/react-best-practices` (was `vercel-react-best-practices` in the legacy lockfile — Vercel renamed upstream) |

Two of the four legacy names have drifted since `skills-lock.json` was last refreshed. This kit follows current upstream naming (per ADR-0015's per-skill addressing model).

## Prerequisites

- `apm` — https://microsoft.github.io/apm/getting-started/installation/
- `uv` — https://docs.astral.sh/uv/ (required at runtime for the bundled `coin-flip-mcp` server)
- `python3` — required by the hook scripts and the coin-flip-code skills
- `npx` (optional) — used by `auto-lint.sh` for ESLint on JS/TS edits
- `ruff` (optional) — used by `auto-lint.sh` for Python edits

## Install

From any project:

```bash
apm install rearc/workshop-demo-kit
bash apm_modules/rearc/workshop-demo-kit/scripts/setup.sh
```

During in-repo dev (against this monorepo's local-path dep form):

```bash
bash apm_modules/_local/rearc-workshop-demo-kit/scripts/setup.sh
```

`apm install` deploys the agents, instructions, skills, hooks, and MCP server registrations to every IDE config dir APM auto-detects (`.claude/`, `.github/`, `.cursor/`, `.codex/`, `.gemini/`, `.opencode/`). `setup.sh` then copies the bundled `coin-flip-mcp` server source into `mcp-servers/coin-flip-mcp/` in the consumer project so the stdio MCP command resolves to a stable project-relative path.

You'll see APM print `[i] N dependencies have no pinned version` on install. That's expected — the 4 upstream subpath refs are intentionally unpinned per [ADR-0024](../../ADR.md#adr-0024-rearcresearch-kit-upstream-deps-stay-unpinned-in-010-apm-0110-transitive-cleanup-on-uninstall-is-broken-under-pinning) until APM 0.11.0's resolver bug is fixed.

## Substrate posture

**No companion-substrate recommendation.** This kit ships its own audit, safety, and lint hooks tuned for the workshop demo app's workflows; layering `rearc/base` on top would duplicate the audit logging. Consumers who want the broader `rearc/base` posture can install it separately — the two layer cleanly modulo redundant audit calls.

`rearc/base-readonly` is a category mismatch: the demo app's workflow requires `npm`, `flask`, `python` execution, which the readonly substrate would block.

## Uninstall

```bash
apm uninstall rearc/workshop-demo-kit
```

APM consults `apm.lock.yaml`'s `deployed_files` and removes only what was deployed by `apm install`. The bundled MCP server files at `mcp-servers/coin-flip-mcp/` are project content (placed there by `setup.sh`) and are not tracked in `apm.lock.yaml` — remove them manually if desired:

```bash
rm -r mcp-servers/coin-flip-mcp
```

The `/tmp/agent-audit.log` file is also not removed — it's host-level state, not project state.

## Layout

```
packages/rearc-workshop-demo-kit/
├── apm.yml                 # 4 upstream skill subpaths, 3 MCP servers, 1 dev setup script
├── README.md               # this file
├── .apm/                   # Rearc-authored APM primitives — deployed by `apm install`
│   ├── agents/             # code-reviewer, research-assistant
│   ├── instructions/       # api-conventions, migrations, security-review, tailwind
│   ├── skills/             # add-dashboard-card, coin-flip(-code|-true-random), flip-until-heads, commit-message
│   └── hooks/              # audit.json, safety.json, lint.json
├── scripts/                # bash sidecars (invoked via direct `bash` per ADR-0013)
│   ├── setup.sh            # deploys mcp-servers/coin-flip-mcp/ into the consumer
│   └── hooks/              # audit.sh, guard-shell.sh, auto-lint.sh — referenced by .apm/hooks/ via ${CLAUDE_PLUGIN_ROOT}
└── mcp-servers/
    └── coin-flip-mcp/      # FastMCP-based demo server (server.py + requirements.txt)
```

Nothing under `mcp-servers/` or `scripts/` is deployed by `apm install`; both directories are package-source content per [ADR-0017](../../ADR.md#adr-0017-sidecar-content-lives-at-package-root-not-under-dev). The hook scripts are referenced from `.apm/hooks/*.json` via `${CLAUDE_PLUGIN_ROOT}/scripts/hooks/...` so they resolve at install time.

## Maintainer notes

### Workshop-temporary status

This kit's primary purpose is backing the `cursor_workshop_demo_app` (and future Claude Code / Copilot workshop variants of it). It's not currently planned for publish. The four upstream skill subpaths are unpinned per ADR-0024; pre-publish (if that becomes a goal), pin every entry to a single SHA and rerun the harness.

### Drift watch on upstream skill names

Two of the four upstream skill paths reflect renames since the original `skills-lock.json` was authored:

- `vercel-react-best-practices` → `react-best-practices` (Vercel dropped the `vercel-` prefix)
- `write-a-prd` → `to-prd` (Pocock renamed)

If the workshop materials reference the old names, update them. The current upstream names are what `apm install` will deploy.
