#!/usr/bin/env bash
# rearc/base — optional Claude Code status line meter.
#
# Renders, on one line: context-window usage, subscription rate-limit usage
# (5-hour + weekly rolling windows), and session cost. Reads the status line
# JSON that Claude Code pipes on stdin.
#
# Opt-in. rearc/base does NOT enable this on `apm install` (the package stays
# setup-script-free). It is wired by scripts/setup-statusline.sh, which copies
# this file to <project>/.claude/statusline.sh and sets the statusLine key in
# .claude/settings.local.json. See ADR-0032.
#
# Project-scoped on purpose: the workspace .claude/ rides the sbx bind-mount
# into the microVM, so the meter works inside the sandbox too — handy for
# watching subscription burn during autonomous runs.
#
# Requires: jq (present in the default sbx agent images).

set -uo pipefail

input="$(cat)"

# Degrade quietly rather than erroring — a broken status line is worse noise.
if ! command -v jq >/dev/null 2>&1; then
  printf 'rearc/base | jq missing\n'
  exit 0
fi

field() { printf '%s' "$input" | jq -r "$1" 2>/dev/null; }

model="$(field '.model.display_name // "claude"')"
ctx="$(field '.context_window.used_percentage // empty' | cut -d. -f1)"
h5="$(field '.rate_limits.five_hour.used_percentage // empty' | cut -d. -f1)"
wk="$(field '.rate_limits.seven_day.used_percentage // empty' | cut -d. -f1)"
cost="$(field '.cost.total_cost_usd // 0')"

out="[$model]"
[ -n "${ctx:-}" ] && out="$out | ctx ${ctx}%"
[ -n "${h5:-}" ]  && out="$out | 5h ${h5}%"   # populated after first API response (Pro/Max)
[ -n "${wk:-}" ]  && out="$out | wk ${wk}%"
out="$(printf '%s | $%.2f' "$out" "$cost")"
printf '%s\n' "$out"
