#!/bin/bash
# =============================================================================
# audit.sh — passive audit-logging hook
#
# Logs every hook event to /tmp/agent-audit.log with a timestamp, creating
# a full audit trail of agent activity for the workshop demo session.
#
# Wired to every available hook event so it captures session start/end,
# tool calls (shell + MCP), file edits, prompt submissions, and compaction.
# Format-agnostic — the raw stdin JSON is logged as-is, so Cursor and
# Claude Code payloads coexist in the same log.
#
# Always exits 0 — passive observer, never blocks.
# =============================================================================

# Read JSON input from stdin
json_input=$(cat)

# Create timestamp for the log entry
timestamp=$(date '+%Y-%m-%d %H:%M:%S')

# Write the timestamped JSON entry to the audit log
echo "[$timestamp] $json_input" >> /tmp/agent-audit.log

# Always allow — this hook only observes, never blocks
exit 0
