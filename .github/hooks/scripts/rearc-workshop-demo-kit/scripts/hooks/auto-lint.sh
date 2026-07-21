#!/usr/bin/env bash
# =============================================================================
# auto-lint.sh — post-file-edit hook
#
# Automatically runs the appropriate linter on files after they are edited
# by the agent, keeping code style consistent without manual intervention.
# Wired to one per-target manifest per harness (todo.md item 30):
#   lint-claude-hooks.json   PostToolUse  matcher "Edit|Write|MultiEdit"  (Claude)
#   lint-copilot-hooks.json  postToolUse  (camelCase, flat)               (Copilot)
#   lint-cursor-hooks.json   afterFileEdit                                (Cursor)
#
# Reads the edited file path from whichever payload shape the harness sends:
#   Claude Code     .tool_input.file_path
#   Copilot CLI     .toolArgs (a JSON-encoded STRING) .file_path / .filePath / .path
#   Cursor          top-level .file_path (afterFileEdit payload)
#
# Fails OPEN: a missing jq or any parse miss just exits 0 (this is a passive,
# post-edit convenience — it must never block or error a tool call).
# =============================================================================

set -uo pipefail

command -v jq &>/dev/null || exit 0

INPUT=$(cat)

FILE_PATH=$(printf '%s' "$INPUT" | jq -r '
  .tool_input.file_path
  // ( .toolArgs
       | if type == "string" then (try fromjson catch {}) else . end
       | if type == "object" then (.file_path // .filePath // .path) else empty end )
  // .file_path
  // ""
' 2>/dev/null || echo "")

if [ -z "$FILE_PATH" ] || [ ! -f "$FILE_PATH" ]; then
  exit 0
fi

EXT=$(printf '%s' "${FILE_PATH##*.}" | tr '[:upper:]' '[:lower:]')

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
