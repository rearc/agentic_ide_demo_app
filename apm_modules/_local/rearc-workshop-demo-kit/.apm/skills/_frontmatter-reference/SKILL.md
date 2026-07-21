---
name: _frontmatter-reference
description: Teaching catalog of every SKILL.md frontmatter field and dynamic-injection token, with what each controls and why. Reference only — does not perform a task.
disable-model-invocation: true
user-invocable: true
argument-hint: "(reference only — no args)"
---

# SKILL.md frontmatter reference

A guided tour of every documented `SKILL.md` frontmatter field. This skill is **reference only** — it sets `disable-model-invocation: true` so Claude never auto-runs it (open it, or `/_frontmatter-reference`, to read). Field set verified against the official docs (code.claude.com/docs/en/skills). "All fields are optional; only `description` is recommended."

## Fields

| Field | What it controls | Why / when | Live example in this repo |
|---|---|---|---|
| `name` | Display label in skill listings. The command you type comes from the **directory name**, not this (except a plugin-root SKILL.md). | Keep it equal to the folder name to avoid confusion. | every skill |
| `description` | What the skill does + when to use it; Claude auto-invokes off this. Combined with `when_to_use`, truncated at 1,536 chars in the listing. | Be specific — vague descriptions miss or mis-fire. | every skill |
| `when_to_use` | Extra trigger phrases / example requests, appended to `description`. Counts toward the 1,536-char cap. | Sharpen auto-invocation without bloating `description`. | `add-dashboard-card`, `flask-api-conventions` |
| `argument-hint` | Autocomplete hint for expected args, e.g. `[slug] [source]`. | UX for `/skill` invocation. | `commit-message`, `add-dashboard-card` |
| `arguments` | Named-arg list. `arguments: [slug, source]` maps positionally to `$slug`, `$source`. | Cleaner than parsing `$ARGUMENTS` by hand. | `add-dashboard-card` |
| `disable-model-invocation` | `true` = only the user can invoke (Claude won't auto-load it); also blocks preload into subagents + scheduled-task firing. Default `false`. | Side-effect / timing-sensitive workflows: `/commit`, `/deploy`. | `commit-message`, this skill |
| `user-invocable` | `false` = hide from the `/` menu (Claude-only background knowledge). Default `true`. | Knowledge that isn't a user action, e.g. domain conventions. | `flask-api-conventions` |
| `allowed-tools` | Tools Claude may use **without a permission prompt** while the skill is active. Does not restrict — permission settings still govern everything else. Space/comma string or YAML list. | Frictionless runs for a skill's known tool calls. | `coin-flip-code` (`Bash(python3 *)`), `commit-message` (`Bash(git ...)`) |
| `disallowed-tools` | Tools **removed** from the pool while active; clears on your next message. | Autonomous loops that must never call a tool (e.g. `AskUserQuestion`). | `flip-until-heads` |
| `model` | Model to use while the skill is active. Overrides for the rest of the current turn (not saved; session model resumes next prompt). Accepts `/model` values or `inherit`. | Pin a heavy skill to a stronger model, or a cheap one to a smaller model, without changing your session. | `coin-flip` (`sonnet` — trivial task doesn't need Opus) |
| `effort` | Effort level while active (`low`/`medium`/`high`/`xhigh`/`max`); overrides session effort. | Pin a heavy workflow high, a trivial one low. | `add-dashboard-card` (`high`) |
| `context` | `fork` = run the skill in a forked subagent; SKILL.md content becomes that subagent's prompt (no conversation history). | Isolate verbose work; only a summary returns. | `flip-until-heads` |
| `agent` | Which subagent type to use when `context: fork` is set (e.g. `Explore`, `general-purpose`). | Match the fork to the job. | `flip-until-heads` |
| `hooks` | Hooks scoped to this skill's lifecycle. | Enforce/observe around one skill only. | (none — reference-only) |
| `paths` | Glob(s) that limit auto-activation to matching files. Comma string or YAML list. | Load knowledge only for relevant file types. | `flask-api-conventions` (`backend/**`) |
| `shell` | Shell for `` !`command` `` injection blocks: `bash` (default) or `powershell`. | Cross-platform skills that inject live command output. | (none yet) |

> Open-standard metadata (`license`, `metadata`, `version`) also appears on installed skills (Agent Skills spec) — see `react-best-practices` and `frontend-design`. Not Claude-Code-specific behavior.
>
> **`model` vs `effort`:** `model` switches *which* Claude model runs the skill; `effort` tunes reasoning depth within the current model. Both are temporary per-invocation overrides. `hooks` and `shell` are documented but kept reference-only here (no live repo example).

## Dynamic injection (in the body, runs before the skill loads)

| Token | Expands to |
|---|---|
| `$ARGUMENTS` | All argument text passed after `/skill`. |
| `$name` | A named argument from the `arguments` list (positional). |
| `` !`command` `` | The command's stdout, inlined before Claude sees the skill. e.g. `` !`git diff --staged` `` in `commit-message`. |
| `${CLAUDE_EFFORT}` | Current effort level (`low`…`max`). |
| `${CLAUDE_PROJECT_DIR}` | Project root — for referencing project-local scripts regardless of install location. |

## Where to see them live

- **Invocation control:** `commit-message` (`disable-model-invocation`), `flask-api-conventions` (`user-invocable: false`).
- **Tool control:** `coin-flip-code` / `commit-message` (`allowed-tools`), `flip-until-heads` (`disallowed-tools`).
- **Arguments + injection:** `add-dashboard-card` (`arguments`/`$slug`), `commit-message` (`` !`git diff --staged` ``).
- **Subagent + effort + paths:** `flip-until-heads` (`context: fork` + `agent`), `add-dashboard-card` (`effort`), `flask-api-conventions` (`paths`).
