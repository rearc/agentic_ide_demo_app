#!/usr/bin/env bash
# =============================================================================
# guard-shell.sh — pre-shell-execution hook
#
# Blocks dangerous shell commands before the agent executes them. Wired to one
# per-target manifest per harness (todo.md item 30, applying ADR-0026's shape
# plus ADR-0029 for the cursor dimension):
#   safety-claude-hooks.json   PreToolUse  matcher "Bash"        (Claude Code)
#   safety-copilot-hooks.json  preToolUse  (camelCase, flat)     (Copilot CLI)
#   safety-cursor-hooks.json   beforeShellExecution              (Cursor)
#
# APM 0.18.0 only renames hook events for the claude (and gemini) targets, so
# Copilot and Cursor each need their own manifest authored in their native
# casing/shape. This script then dispatches on the *payload shape* the calling
# harness sends — which differs by harness (verified against the vendor docs):
#
#   Claude Code        .tool_name=Bash + .tool_input.command
#                      deny: {"decision":"block","reason":...}            (exit 2)
#   Copilot CLI        .toolName=bash/shell + .toolArgs (a JSON-encoded
#                      STRING; must be parsed) .command
#                      deny: {"permissionDecision":"deny",
#                             "permissionDecisionReason":...}             (exit 2)
#   VS Code Copilot    .tool_name=run_in_terminal + .tool_input.command
#                      deny: {"permissionDecision":"deny",
#                             "userFacingMessage":...}                    (exit 2)
#   Cursor             top-level .command (beforeShellExecution payload)
#                      deny: {"permission":"deny","user_message":...,
#                             "agent_message":...}                        (exit 2)
#
# Mirrors rearc/base's safety.sh dispatch (jq-based), extended with the Cursor
# shape. Reading only .tool_input.command (the pre-item-30 behavior) silently
# allowed every Copilot CLI shell call, defeating the hook on that harness.
# =============================================================================

set -uo pipefail

# Safety hook fails CLOSED on a missing parser: without jq we can't inspect the
# command, so we block rather than wave it through (matches rearc/base).
if ! command -v jq &>/dev/null; then
  echo '{"decision":"block","reason":"jq is required but not found on PATH. Install jq to use this kit'"'"'s safety hook."}' >&2
  exit 2
fi

INPUT=$(cat)

# Harness fingerprint. Cursor's beforeShellExecution payload is a top-level
# .command with no tool name; Copilot CLI uses camelCase .toolName.
HAS_TOP_CMD=$(printf '%s' "$INPUT" | jq -r 'has("command") and (has("toolName") or has("tool_name") | not)' 2>/dev/null || echo false)
IS_CAMEL=$(printf '%s' "$INPUT" | jq -r 'has("toolName")' 2>/dev/null || echo false)
TOOL_NAME=$(printf '%s' "$INPUT" | jq -r '.toolName // .tool_name // "unknown"' 2>/dev/null || echo unknown)

if [[ "$HAS_TOP_CMD" == "true" ]]; then
  HARNESS="cursor"
elif [[ "$IS_CAMEL" == "true" ]]; then
  HARNESS="copilot"
else
  case "$TOOL_NAME" in
    run_in_terminal|runTerminalCommand) HARNESS="vscode" ;;
    *) HARNESS="claude" ;;
  esac
fi

# Only filter terminal/shell tools. Cursor's beforeShellExecution is inherently
# a shell event; the other harnesses dispatch on tool name.
if [[ "$HARNESS" != "cursor" ]]; then
  case "$TOOL_NAME" in
    Bash|bash|shell|run_in_terminal|runTerminalCommand) ;;
    *) printf '{}'; exit 0 ;;   # not a shell tool — allow
  esac
fi

# Pull the command from whichever payload shape this harness uses:
#   .command                              (Cursor, top-level)
#   .tool_input.command / .cmd / .input   (Claude, VS Code)
#   .toolArgs(.command/.cmd/.input)       (Copilot; .toolArgs may be a JSON string)
COMMAND=$(printf '%s' "$INPUT" | jq -r '
  .command
  // .tool_input.command // .tool_input.cmd // .tool_input.input
  // ( .toolArgs
       | if type == "string" then (try fromjson catch {}) else . end
       | if type == "object" then (.command // .cmd // .input) else empty end )
  // ""
' 2>/dev/null || echo "")

if [ -z "$COMMAND" ]; then
  printf '{}'
  exit 0
fi

# Block response helper — emits the deny JSON the calling harness expects, exit 2.
block() {
  local reason="$1"
  case "$HARNESS" in
    cursor)
      printf '%s' "$reason" | jq -Rs '{"permission":"deny","user_message":.,"agent_message":("This command was blocked by the guard-shell hook. "+.)}'
      ;;
    copilot)
      printf '%s' "$reason" | jq -Rs '{"permissionDecision":"deny","permissionDecisionReason":.,"userFacingMessage":.}'
      ;;
    vscode)
      printf '%s' "$reason" | jq -Rs '{"permissionDecision":"deny","userFacingMessage":.}'
      ;;
    *)
      printf '%s' "$reason" | jq -Rs '{"decision":"block","reason":.}'
      ;;
  esac
  exit 2
}

CMD_LOWER=$(printf '%s' "$COMMAND" | tr '[:upper:]' '[:lower:]')

# Destructive filesystem
if printf '%s' "$CMD_LOWER" | grep -qE '(^|[;&|][[:space:]]*)rm[[:space:]]+(-[a-zA-Z]*r[a-zA-Z]*f|(-[a-zA-Z]*f[a-zA-Z]*r))\b'; then
  block "Blocked: 'rm -rf' is a destructive command that recursively force-deletes files"
fi

# Destructive SQL
if printf '%s' "$CMD_LOWER" | grep -qE 'drop[[:space:]]+table\b'; then
  block "Blocked: 'DROP TABLE' would permanently destroy database tables"
fi
if printf '%s' "$CMD_LOWER" | grep -qE 'drop[[:space:]]+database\b'; then
  block "Blocked: 'DROP DATABASE' would permanently destroy an entire database"
fi

# Destructive git
if printf '%s' "$CMD_LOWER" | grep -qE 'git[[:space:]]+push[[:space:]]+.*--force\b'; then
  block "Blocked: 'git push --force' can overwrite remote history and destroy others' work"
fi
if printf '%s' "$CMD_LOWER" | grep -qE 'git[[:space:]]+reset[[:space:]]+--hard\b'; then
  block "Blocked: 'git reset --hard' discards all uncommitted changes permanently"
fi

# Sensitive files
if printf '%s' "$CMD_LOWER" | grep -qE '\.env\b'; then
  block "Blocked: command references .env file which may contain secrets"
fi
if printf '%s' "$CMD_LOWER" | grep -qE 'credentials\b'; then
  block "Blocked: command references credentials file which may contain secrets"
fi

# Passed all checks — allow.
printf '{}'
exit 0
