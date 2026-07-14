#!/usr/bin/env bash
# =============================================================================
# auto-lint.sh — file-edit hook (Cursor afterFileEdit / Claude Code PostToolUse)
#
# Automatically runs the appropriate linter on files after they are edited
# by the agent, keeping code style consistent without manual intervention.
#
# Reads the file path from either harness's hook JSON shape:
#   Cursor afterFileEdit: { "file_path": "/abs/path", "edits": [...] }
#   Claude Code PostToolUse on Edit/Write/MultiEdit:
#     { "tool_input": { "file_path": "/abs/path", ... }, ... }
#
# Exit code: always 0. Lint failures are best-effort and don't block edits.
# =============================================================================

set -uo pipefail

INPUT=$(cat)

# Extract file_path from either harness's JSON shape
FILE_PATH=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data.get('tool_input', {}).get('file_path') or data.get('file_path', ''))
except Exception:
    print('')
" 2>/dev/null || echo "")

if [ -z "$FILE_PATH" ] || [ ! -f "$FILE_PATH" ]; then
  exit 0
fi

EXT=$(echo "${FILE_PATH##*.}" | tr '[:upper:]' '[:lower:]')

# Route to the appropriate formatter based on file extension.
# JS/JSX/TS/TSX/CSS → Prettier (via npx so it picks up the project-local version;
#   run from the file's package root so it resolves the local install + .prettierrc)
# Python (.py)      → Ruff (fast Python linter/formatter)
# If the tool isn't installed, fail open (best-effort; never blocks the edit).
case "$EXT" in
  js|jsx|ts|tsx|css)
    if command -v npx &>/dev/null; then
      ( cd "$(dirname "$FILE_PATH")" && npx --no-install prettier --write "$FILE_PATH" ) 2>/dev/null || true
    fi
    ;;
  py)
    if command -v ruff &>/dev/null; then
      ruff check --fix "$FILE_PATH" 2>/dev/null || true
    fi
    ;;
esac

exit 0
