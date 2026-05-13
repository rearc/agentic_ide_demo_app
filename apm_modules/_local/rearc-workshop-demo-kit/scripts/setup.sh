#!/usr/bin/env bash
# Project-scope setup for rearc/workshop-demo-kit.
#
# This kit is APM-native (per ADR-0016); `apm install` deploys the agents,
# instructions, skills, hooks, and MCP server registrations on its own. This
# sidecar exists only to copy the bundled local coin-flip-mcp server source
# into the consumer's project at mcp-servers/coin-flip-mcp/, so the MCP
# server registered via apm.yml resolves project-relative.
#
# Consumer-invoked (per ADR-0013):
#   bash apm_modules/_local/rearc-workshop-demo-kit/scripts/setup.sh
#
# Idempotent — re-run is safe; existing server files are left in place unless
# --update is passed.
#
# Per ADR-0020, this kit makes no companion-substrate recommendation; the
# kit's own hooks (audit + safety + lint) cover the workshop's safety needs.

set -uo pipefail

# --- Colors / logging --------------------------------------------------------

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info()    { echo -e "  ${CYAN}[*]${NC} $*"; }
log_success() { echo -e "  ${GREEN}[+]${NC} $*"; }
log_warn()    { echo -e "  ${YELLOW}[!]${NC} $*"; }
log_error()   { echo -e "  ${RED}[x]${NC} $*" >&2; }

# --- Args --------------------------------------------------------------------

UPDATE=0
for arg in "$@"; do
  case "$arg" in
    --update) UPDATE=1 ;;
    -h|--help)
      cat <<EOF
Usage: bash scripts/setup.sh [--update]

  --update   Overwrite existing files in mcp-servers/coin-flip-mcp/.
             Without this flag, existing files are left untouched.
EOF
      exit 0
      ;;
    *)
      log_error "unknown arg: $arg"
      exit 1
      ;;
  esac
done

# --- Paths -------------------------------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KIT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT_ROOT="$(pwd)"

SRC_DIR="$KIT_ROOT/mcp-servers/coin-flip-mcp"
DEST_DIR="$PROJECT_ROOT/mcp-servers/coin-flip-mcp"

log_info "rearc/workshop-demo-kit setup — target: $PROJECT_ROOT"

if [[ ! -d "$SRC_DIR" ]]; then
  log_error "kit's coin-flip-mcp source not found at: $SRC_DIR"
  log_error "  this is a packaging bug; report to the kit maintainer"
  exit 1
fi

# --- Dependency check --------------------------------------------------------

if ! command -v uv >/dev/null 2>&1; then
  log_warn "'uv' not found on PATH"
  log_warn "  the coin-flip-mcp MCP server runs via 'uv run mcp-servers/coin-flip-mcp/server.py'"
  log_warn "  install uv (https://docs.astral.sh/uv/) before invoking the MCP"
fi

# --- Deploy server source ----------------------------------------------------

mkdir -p "$DEST_DIR"

deploy_file() {
  local src="$1"
  local dest="$2"
  local name
  name="$(basename "$src")"

  if [[ -f "$dest" && $UPDATE -eq 0 ]]; then
    log_info "skipping $name (exists; pass --update to overwrite)"
    return
  fi
  cp "$src" "$dest"
  log_success "deployed mcp-servers/coin-flip-mcp/$name"
}

deploy_file "$SRC_DIR/server.py"        "$DEST_DIR/server.py"
deploy_file "$SRC_DIR/requirements.txt" "$DEST_DIR/requirements.txt"

log_success "rearc/workshop-demo-kit setup complete"
log_info "MCP server registered via apm.yml; restart your IDE to pick it up."
