#!/usr/bin/env bash
# =============================================================================
# audit.sh — passive audit-logging hook
#
# Logs every hook event to /tmp/agent-audit.log with a timestamp, creating
# a full audit trail of agent activity for the workshop demo session. Wired to
# one per-target manifest per harness (todo.md item 30):
#   audit-claude-hooks.json   PreToolUse matcher ".*"   (Claude — all tools)
#   audit-copilot-hooks.json  preToolUse                 (Copilot — all tools)
#   audit-cursor-hooks.json   beforeShellExecution / beforeMCPExecution /
#                             afterFileEdit / beforeSubmitPrompt / stop (Cursor)
#
# Best-effort tool/event label (Claude .tool_name, Copilot CLI .toolName,
# Cursor .hook_event_name) prefixes each line; the raw stdin JSON is logged
# verbatim, so every harness's payload is preserved regardless of shape.
#
# Fails OPEN and ALWAYS exits 0 — passive observer, never blocks. Load-bearing
# on Copilot CLI: preToolUse is fail-closed, so any non-zero exit (other than 2)
# would DENY the tool call. A missing jq just degrades the label to "event".
# =============================================================================

set -uo pipefail

# Read JSON input from stdin
json_input=$(cat)

# Create timestamp for the log entry
timestamp=$(date '+%Y-%m-%d %H:%M:%S')

# Best-effort harness-agnostic tool/event label (never fatal; degrades to "event").
if command -v jq &>/dev/null; then
  label=$(printf '%s' "$json_input" | jq -r '.toolName // .tool_name // .hook_event_name // "event"' 2>/dev/null || echo "event")
else
  label="event"
fi

# Write the timestamped entry to the audit log (raw JSON preserved verbatim)
echo "[$timestamp] tool=${label} ${json_input}" >> /tmp/agent-audit.log

# Always allow — this hook only observes, never blocks
exit 0
