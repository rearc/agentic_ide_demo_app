#!/usr/bin/env bash
# =============================================================================
# guard-shell.sh — pre-shell-execution hook
#                  (Cursor beforeShellExecution / Claude Code PreToolUse on Bash)
#
# Blocks dangerous shell commands before the agent executes them.
#
# Reads JSON from stdin in either harness's shape:
#   Cursor beforeShellExecution: { "command": "...", "cwd": "...", ... }
#   Claude Code PreToolUse:      { "tool_name": "Bash", "tool_input": { "command": "..." }, ... }
#
# On block: emits harness-appropriate JSON and exits 2.
#   Cursor expects:      { "permission": "deny", "user_message": "...", "agent_message": "..." }
#   Claude Code expects: { "decision": "block", "reason": "..." }
# =============================================================================

set -uo pipefail

INPUT=$(cat)

# Extract command from either harness's JSON shape, and detect which harness we're in.
# HARNESS is "cursor" if the top-level .command is set; "claude" if .tool_input.command is set.
read -r HARNESS COMMAND <<<"$(echo "$INPUT" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    tool_input = data.get('tool_input') or {}
    if tool_input.get('command'):
        print('claude', tool_input.get('command', ''))
    elif data.get('command'):
        print('cursor', data.get('command', ''))
    else:
        print('unknown', '')
except Exception:
    print('unknown', '')
" 2>/dev/null || echo 'unknown ')"

if [ -z "$COMMAND" ]; then
  # No command found — allow by default
  printf '{}'
  exit 0
fi

BLOCKED=""
REASON=""
CMD_LOWER=$(echo "$COMMAND" | tr '[:upper:]' '[:lower:]')

# Destructive filesystem
if echo "$CMD_LOWER" | grep -qE '(^|[;&|][[:space:]]*)rm[[:space:]]+(-[a-zA-Z]*r[a-zA-Z]*f|(-[a-zA-Z]*f[a-zA-Z]*r))\b'; then
  BLOCKED="true"
  REASON="Blocked: 'rm -rf' is a destructive command that recursively force-deletes files"
fi

# Destructive SQL
if echo "$CMD_LOWER" | grep -qE 'drop[[:space:]]+table\b'; then
  BLOCKED="true"
  REASON="Blocked: 'DROP TABLE' would permanently destroy database tables"
fi

if echo "$CMD_LOWER" | grep -qE 'drop[[:space:]]+database\b'; then
  BLOCKED="true"
  REASON="Blocked: 'DROP DATABASE' would permanently destroy an entire database"
fi

# Destructive git
if echo "$CMD_LOWER" | grep -qE 'git[[:space:]]+push[[:space:]]+.*--force\b'; then
  BLOCKED="true"
  REASON="Blocked: 'git push --force' can overwrite remote history and destroy others' work"
fi

if echo "$CMD_LOWER" | grep -qE 'git[[:space:]]+reset[[:space:]]+--hard\b'; then
  BLOCKED="true"
  REASON="Blocked: 'git reset --hard' discards all uncommitted changes permanently"
fi

# Sensitive files
if echo "$CMD_LOWER" | grep -qE '\.env\b'; then
  BLOCKED="true"
  REASON="Blocked: command references .env file which may contain secrets"
fi

if echo "$CMD_LOWER" | grep -qE 'credentials\b'; then
  BLOCKED="true"
  REASON="Blocked: command references credentials file which may contain secrets"
fi

if [ "$BLOCKED" = "true" ]; then
  python3 -c "
import json, sys
harness = sys.argv[1]
reason = sys.argv[2]
if harness == 'cursor':
    print(json.dumps({
        'permission': 'deny',
        'user_message': reason,
        'agent_message': 'This command was blocked by the guard-shell hook. ' + reason,
    }))
else:
    print(json.dumps({'decision': 'block', 'reason': reason}))
" "$HARNESS" "$REASON"
  exit 2
fi

# Allow — empty object is the universally-safe no-op response
printf '{}'
exit 0
