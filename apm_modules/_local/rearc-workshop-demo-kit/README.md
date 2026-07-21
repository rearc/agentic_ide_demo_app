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
| `_agent-reference` | Annotated catalog of all subagent frontmatter fields — a reference doc to read, not a working agent (the subagent analog of the `_frontmatter-reference` skill). |

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
| `flask-api-conventions` | Backend conventions (service-layer shape, data-route wiring, config/secrets) — knowledge skill, auto-available on `backend/**` paths |
| `_frontmatter-reference` | Catalog of all 16 skill frontmatter fields — the "show every control surface" reference skill |

**Hooks** (deployed via APM's hooks primitive). Each hook ships **one manifest per target** (`*-claude-hooks.json` / `*-copilot-hooks.json` / `*-cursor-hooks.json`), routed by APM's filename-stem suffix — because APM 0.18.0 renames hook events only for the `claude` (and `gemini`) targets, never for `copilot` or `cursor`, so a single Claude-shape manifest deploys unusable to those two (`hook event casing mismatch (no mapping): PreToolUse`, then ignored). See [ADR-0026](../../ADR.md#adr-0026-rearcbase-ships-per-target-hook-manifests-copilot-runs-hooks-only-on-its-interactive-path) and [ADR-0029](../../ADR.md#adr-0029-rearcworkshop-demo-kit-ships-three-way-per-target-hook-manifests-cursor-hooks-use-native-camelcase-events-and-accept-apms-spurious-casing-warning).

| Hook | Claude event | Copilot event | Cursor event(s) | What it does |
|---|---|---|---|---|
| `audit` | `PreToolUse` `.*` | `preToolUse` | `beforeShellExecution`, `beforeMCPExecution`, `afterFileEdit`, `beforeSubmitPrompt`, `stop` | Logs every tool call to `/tmp/agent-audit.log` (always exits 0 — Copilot `preToolUse` is fail-closed) |
| `safety` | `PreToolUse` `Bash` | `preToolUse` | `beforeShellExecution` | Blocks `rm -rf`, `DROP TABLE`, `git push --force`, `.env` references, etc. |
| `lint` | `PostToolUse` `Edit\|Write\|MultiEdit` | `postToolUse` | `afterFileEdit` | Routes edited files to ESLint or Ruff with `--fix` |

The hook scripts dispatch on the **payload shape** each harness sends, emitting that harness's deny response:

| Harness | Tool/command field | Deny response |
|---|---|---|
| Claude Code | `.tool_name` + `.tool_input.command` | `{"decision":"block","reason":...}` (exit 2) |
| Copilot CLI | `.toolName` + `.toolArgs` (a JSON-encoded **string**) | `{"permissionDecision":"deny","permissionDecisionReason":...}` (exit 2) |
| VS Code Copilot | `.tool_name` (`run_in_terminal`) + `.tool_input.command` | `{"permissionDecision":"deny","userFacingMessage":...}` |
| Cursor | top-level `.command` / `.file_path` | `{"permission":"deny","user_message":...,"agent_message":...}` |

**Cursor caveat (APM-0.18.0 limitation).** Cursor's native hook events are camelCase (`beforeShellExecution`, `afterFileEdit`, per [cursor.com/docs/agent/hooks](https://cursor.com/docs/agent/hooks)), so the cursor manifests are authored that way and reach `.cursor/hooks.json` intact. APM's cursor adapter wrongly assumes PascalCase and prints a cosmetic `casing mismatch (no mapping)` warning on install for each cursor event — it does **not** block deployment and the hooks still fire. Expect that warning until APM ships a cursor event mapping.

**Copilot headless caveat.** Copilot CLI runs these hooks on its **interactive** path only — headless `copilot -p` does not fire them (an unfiled upstream limitation, same finding as [ADR-0026](../../ADR.md#adr-0026-rearcbase-ships-per-target-hook-manifests-copilot-runs-hooks-only-on-its-interactive-path)). In headless Copilot flows the active control is the agent's posture/instruction layer, not these hooks. Claude Code runs them fully in both headless and interactive modes.

**MCP server registrations** (deployed via APM's `mcp:` primitive):

| Name | Transport | What it provides |
|---|---|---|
| `context7` | HTTP (`https://mcp.context7.com/mcp`) | Documentation lookup — free tier, no auth |
| `random-tools` | stdio (`uv run mcp-servers/random-tools-mcp/server.py`) | Local demo MCP server — bundled in this kit; sidecar `setup.sh` copies it into the consumer project so the path resolves project-relative |

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
- `uv` — https://docs.astral.sh/uv/ (required at runtime for the bundled `random-tools` server)
- `jq` — required by the hook scripts (payload parsing + harness-appropriate deny responses; same as `rearc/base`)
- `python3` — required by the coin-flip-code skills
- `npx` (optional) — used by `auto-lint.sh` for ESLint on JS/TS edits
- `ruff` (optional) — used by `auto-lint.sh` for Python edits

## Install

From any project:

```bash
apm install -t claude,copilot,cursor rearc/ai-toolkit-private/packages/rearc-workshop-demo-kit
bash apm_modules/rearc/ai-toolkit-private/packages/rearc-workshop-demo-kit/scripts/setup.sh
```

The package installs from this repo's subpath — no clone, no marketplace required (see [enterprise-private-host.md](../../enterprise-private-host.md)). Pin the ref for reproducibility: append `#<tag-or-sha>` to the package ref.

During in-repo dev (against this monorepo's local-path dep form):

```bash
bash apm_modules/_local/rearc-workshop-demo-kit/scripts/setup.sh
```

> **Pick your targets.** On APM 0.18.0, `apm install` no longer fans out to every detected IDE — with more than one harness present it errors and asks you to choose. Pass `-t`/`--target` (as above, with the IDEs the workshop demonstrates) or declare `targets:` in your `apm.yml`.

`apm install` deploys the agents, instructions, skills, hooks, and MCP server registrations to the config dirs for your chosen targets. Skills land in `.claude/skills/` (Claude) and `.agents/skills/` (Copilot, per APM #1103); agents, instructions, and hooks land in each target's own location. `setup.sh` then copies the bundled `random-tools` server source into `mcp-servers/random-tools-mcp/` in the consumer project so the stdio MCP command resolves to a stable project-relative path.

You'll see APM print `[!] N dependencies unpinned: <list> -- add #tag or #sha to prevent drift` on install. That's expected — the 4 upstream subpath refs are intentionally unpinned per [ADR-0024](../../ADR.md#adr-0024-rearcresearch-kit-upstream-deps-stay-unpinned-in-010-apm-0110-transitive-cleanup-on-uninstall-is-broken-under-pinning) because pinning breaks `apm uninstall` cleanup (re-validated against APM 0.18.0, todo.md item 15 — still broken; this kit ships its own content, so pinning would leak the deployed upstream skills on uninstall).

## Substrate posture

**No companion-substrate recommendation.** This kit ships its own audit, safety, and lint hooks tuned for the workshop demo app's workflows; layering `rearc/base` on top would duplicate the audit logging. Consumers who want the broader `rearc/base` posture can install it separately — the two layer cleanly modulo redundant audit calls.

`rearc/base-readonly` is a category mismatch: the demo app's workflow requires `npm`, `flask`, `python` execution, which the readonly substrate would block.

## Uninstall

```bash
apm uninstall rearc/ai-toolkit-private/packages/rearc-workshop-demo-kit
```

APM consults `apm.lock.yaml`'s `deployed_files` and removes only what was deployed by `apm install`. The bundled MCP server files at `mcp-servers/random-tools-mcp/` are project content (placed there by `setup.sh`) and are not tracked in `apm.lock.yaml` — remove them manually if desired:

```bash
rm -r mcp-servers/random-tools-mcp
```

The `/tmp/agent-audit.log` file is also not removed — it's host-level state, not project state.

## Layout

```
packages/rearc-workshop-demo-kit/
├── apm.yml                 # 4 upstream skill subpaths, 3 MCP servers, 1 dev setup script
├── README.md               # this file
├── .apm/                   # Rearc-authored APM primitives — deployed by `apm install`
│   ├── agents/             # code-reviewer, research-assistant, _agent-reference
│   ├── instructions/       # api-conventions, migrations, security-review, tailwind
│   ├── skills/             # add-dashboard-card, coin-flip(-code|-true-random), flip-until-heads, commit-message, flask-api-conventions, _frontmatter-reference
│   └── hooks/              # per-target manifests: {audit,safety,lint}-{claude,copilot,cursor}-hooks.json
├── fragments/
│   └── settings/           # Claude showcase settings (readonly, strongerreadonly, sandbox, example.jsonc, hooks-showcase) — copied to .claude/ by setup.sh
├── scripts/                # bash sidecars (invoked via direct `bash` per ADR-0013)
│   ├── setup.sh            # deploys random-tools-mcp/ + .claude/ showcase settings + statusline into the consumer
│   ├── statusline.sh       # status-line meter (copied to .claude/statusline.sh + registered in settings.json by setup.sh)
│   └── hooks/              # audit.sh, guard-shell.sh, auto-lint.sh — payload-shape dispatch across harnesses
└── mcp-servers/
    └── random-tools-mcp/      # FastMCP-based demo server (server.py + requirements.txt) — coin_flip + roll_die
```

Nothing under `mcp-servers/` or `scripts/` is deployed by `apm install`; both directories are package-source content per [ADR-0017](../../ADR.md#adr-0017-sidecar-content-lives-at-package-root-not-under-dev). The hook scripts are referenced from `.apm/hooks/*.json` via `${CLAUDE_PLUGIN_ROOT}/scripts/hooks/...` (Claude) / `${PLUGIN_ROOT}/scripts/hooks/...` (Copilot, Cursor) so they resolve at install time.

## Maintainer notes

### Workshop-temporary status

This kit's primary purpose is backing the [`agentic_ide_demo_app`](https://github.com/rearc/agentic_ide_demo_app) (originally `cursor_workshop_demo_app`, renamed when the repo broadened beyond cursor-only workshop variants). It's not currently planned for publish. The four upstream skill subpaths are unpinned per ADR-0024; pre-publish (if that becomes a goal), pin every entry to a single SHA and rerun the harness.

### Drift watch on upstream skill names

Two of the four upstream skill paths reflect renames since the original `skills-lock.json` was authored:

- `vercel-react-best-practices` → `react-best-practices` (Vercel dropped the `vercel-` prefix)
- `write-a-prd` → `to-prd` (Pocock renamed)

If the workshop materials reference the old names, update them. The current upstream names are what `apm install` will deploy.
