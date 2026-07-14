# Day 3 — Primitive Walkthrough · PRESENTER RUN-SHEET

*Generated derivative of day3_primitive_walkthrough_beats.md (the source of truth). Regenerate when that doc changes. Full authoring detail / verified-facts / Q&A ammo live in the source.*

## GLOBAL PRE-FLIGHT CHECKLIST (run before Section 3)

- [ ] Claude Code version **2.1.207** confirmed (clears every gate: MEMORY.md >= 2.1.59; `context: fork`/`agent:` 2.1.202; sandbox `credentials` 2.1.187+).
- [ ] `uv` on PATH and `claude` loads the `random-tools` MCP server (verify before stage; add `uv` to README prereqs).
- [ ] `.mcp.json` first-run server-approval prompt triggered + approved once in rehearsal; MCP servers **pre-warmed** (30s startup timeout — `MCP_TIMEOUT=60000 claude` if needed). context7 reachable on the demo network.
- [ ] Sandboxed session ready to launch: `claude --settings .claude/settings.sandbox.json`; confirm via `/sandbox` -> Config tab (Enabled) BEFORE Beat 3.
- [ ] Agent-teams flag ON in presenter `~/.claude/settings.json`: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` (`echo $CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` -> `1`). Fallback screenshot ready: `assets/agent_team_sending_messsages.png`.
- [ ] `/tmp/agent-audit.log` cleared (optional) so the trail is legible; confirm `audit.sh` wired to `.*`.
- [ ] Netflix tabs open: `Netflix/x-test/CLAUDE.md` + `Netflix/metaflow/CLAUDE.md` (+ leak writeup handy).
- [ ] A **staged change** in place so `/commit-message`'s `` !`git diff --staged` `` injection has content.
- [ ] `@AGENTS.md` import one-time approval already triggered (pre-approved so it doesn't surprise you on first run).
- [ ] Custom agents each have `name:` (lowercase-hyphen) + `description:` in frontmatter — verify both agents register in a live session.
- [ ] Real uncommitted changes staged for the Hooks money shot (so "reset my branch" induces `git reset --hard`).
- [ ] **Auto-lint hook (Prettier):** `cd frontend && npm install` (prettier is a devDep), and launch `claude` from a shell with **node/npx on PATH** (`nvm use`) - else the hook silently no-ops.

## RUNNING ORDER

| # | Beat | Phase | Time |
|---|------|-------|------|
| 1 | Foundation (CLAUDE.md + rules) | know | ~8-10 min |
| 1b | Auto-memory | know | ~2-3 min |
| 2 | Permissions / postures | constrain | ~5-6 min |
| 3 | Sandbox | constrain | ~5-6 min |
| 4 | Hooks | enforce | ~6-8 min |
| 5 | Skills | empower | ~10-12 min |
| 6 | MCP | empower | ~7-9 min |
| 7 | Subagents (+ agent-teams coda) | empower | ~7-9 min core + ~3-4 coda |

**Total: ~50-67 min raw; ~60-85 with buffer.** Theme: **know → constrain → enforce → empower** (lock the agent down before scaling its capability).

---

## BEAT 1 — FOUNDATION (CLAUDE.md + rules) · ~8-10 min · know

**FRAME:** CLAUDE.md is the foundation — persistent, always-loaded project instructions. Rules are modular, **path-scoped** conventions layered on top. Instructions *guide* (best-effort compliance) — which is exactly why hooks exist to *enforce*.

**PRE-FLIGHT:**
- Trigger the `@AGENTS.md` approval dialog once in rehearsal so it's pre-approved (or narrate it as a feature).
- Open two browser tabs: `Netflix/x-test/CLAUDE.md` and `Netflix/metaflow/CLAUDE.md` (+ the leak writeup handy).
- Verify `paths:` glob semantics with `/memory` after opening a `frontend/*.jsx` file in rehearsal.

**ON SCREEN:**
1. `CLAUDE.md` (show the `@AGENTS.md` import + CC section).
2. `.claude/rules/` - `tailwind.md` (path-scoped) next to `api-conventions.md` (unconditional).
3. `/memory` output in a Claude Code session.
4. Two browser tabs pre-opened for the Netflix showcase: `Netflix/x-test/CLAUDE.md` and `Netflix/metaflow/CLAUDE.md` (+ the leak writeup handy).

**SAY:**
- **Foundation:** "First primitive, and the one everything else builds on: memory. When Claude Code starts, it loads `CLAUDE.md` - your project's standing instructions." Open it. "Notice ours is three lines plus `@AGENTS.md`. That import pulls in the cross-tool instructions - the same file Copilot reads. One source of truth, both harnesses."
- **The bridge point:** "This matters: Claude Code reads `CLAUDE.md`, not `AGENTS.md`. If your repo only has `AGENTS.md`, Claude Code isn't seeing it. The one-line `@import` fixes that."
- **Rules + scoping:** "Under `.claude/rules/` we split conventions into focused files. This Tailwind rule has a `paths` header - it only loads when Claude touches a `frontend` component. The API-conventions rule has none, so it's always on. That's the lever: scope the noisy stuff so it loads only where it's relevant."
- **The on-demand money moment (verified live):** ask Claude to look at a frontend component (`frontend/src/components/Card.jsx`). Point at the transcript line **`Loaded .claude/rules/tailwind.md`** the instant it reads the file. "Watch - the moment it touched a `.jsx` file, the Tailwind rule loaded. Not before. That's path-scoped, just-in-time memory." *(This inline line is the proof - `/memory` does NOT list on-demand rules, only always-on ones.)*
  - **TYPE:** `Open frontend/src/components/Card.jsx and explain how a card's accent color is applied.`
  - *Watch:* the inline **`Loaded .claude/rules/tailwind.md`** line appears the moment it reads the `.jsx` file.
- **Inspect the always-on set:** run `/memory`. "This shows the standing context - CLAUDE.md, the `@AGENTS.md` import, and the always-on rules. **And notice what's NOT here: the Tailwind rule.** You just watched it load inline a second ago - but it's path-scoped, so it loads *on demand* and never appears in `/memory`, which only lists the always-on set. That contrast - **always-on baseline vs just-in-time** - is the whole point of path-scoping."
  - **TYPE:** `/memory`
  - 🗣️ **POINT IT OUT:** `tailwind.md` is **absent** from `/memory` (on-demand), while `api-conventions` + `security-review` (unconditional) **are** listed. The absence is the proof, not a bug.
- **Zoom out - how real orgs do it (Netflix showcase):** pull up the two public Netflix CLAUDE.md files + the leak. "Two real Netflix approaches at opposite ends, plus a cautionary tale - then here's exactly what belongs in one."
  1. **`Netflix/x-test/CLAUDE.md` - the comprehensive/reference style** (~132 lines): "This is a CLAUDE.md as a full reference manual - build commands, an architecture map, a file index. Great onboarding; the risk is it drifts and bloats past the point Claude reliably uses all of it."
  2. **`Netflix/metaflow/CLAUDE.md` - the minimalist/delegation style** (a symlink to `AGENTS.md`, ~29 lines): "Opposite philosophy - stay tiny, delegate to existing docs, and even branch instructions by who's asking. And notice: a huge Netflix OSS project uses the same CLAUDE.md->AGENTS.md bridge we just built - they say so right at the top."
  3. **The Netflix iOS LEAK - the cautionary tale** (a `CLAUDE.md` shipped inside the iOS app bundle): "Two lessons: (1) a CLAUDE.md is a **file map + intent doc** - treat it as sensitive; (2) **exclude AI-agent files from release builds** (the `.cursorignore`/packaging story), same as you'd never ship `.env`."
- **READY-TO-GO SPIEL - what belongs in a CLAUDE.md, what doesn't, how to make it effective:**
  - **The test for every line:** "Does this *materially change* what Claude does, in a way it can't infer by reading the code?" If no, cut it.
  - **PUT IN:** build/test/lint/run **commands** (the exact incantations); **project layout / file map** (where things live); **conventions** stated as **imperative rules** ("Always return flat dicts with a `fallback` key"); **load-bearing do/don'ts**, and **negative rules** matter as much as positives ("**Never** use `create_all()` - always an Alembic migration"; "no inline `style={{}}`"); **non-obvious gotchas** (ports, the two-process dev setup, the destructive `seed.py`).
  - **KEEP OUT:** anything **inferable from the code**; **personality fluff** ("act as a senior engineer," "think deeply") - near-zero measured effect; **secrets / real architecture-revealing internals** that could ship (Netflix leak); a **dumping ground** of everything you know.
  - **MAKE IT EFFECTIVE:** keep the always-loaded file **under ~500 lines** (~500 lines of prose ≈ 8-9k tokens ≈ 3-4% of a 200k window, every session) and the core rule list **under ~15** genuinely load-bearing rules; write **direct commands, not observations** ("never X - do Y" beats "we generally try to avoid X"); reserve **`IMPORTANT` / `YOU MUST`** for the one or two truly critical rules; **push detail down** - thin CLAUDE.md + path-scoped rules (what we did) or delegate to `CONTRIBUTING.md`/`test/README.md` (what metaflow did); **one source of truth across tools** via `@import` or symlink.
  - **The through-line hook (verbatim landing):** "A great CLAUDE.md makes Claude *usually* do the right thing. But 'usually' isn't a control - which is exactly why the next layers exist: permissions, sandbox, and hooks turn 'usually' into 'guaranteed.'"
- **Set up the guardrail through-line:** "One honest caveat: all of this is *guidance*. The model reads it and does its best. For anything that absolutely must happen - or must never happen - you don't write a rule, you write a hook. Hold that thought." (-> cashes at Hooks.)

**WATCH:** The inline **`Loaded .claude/rules/tailwind.md`** line appears the instant Claude reads the `.jsx` file — the just-in-time load moment. (`/memory` does NOT list on-demand rules; the transcript line is the proof.)

**GOTCHA:**
- ⚠️ `@AGENTS.md` approval dialog on first run — pre-approve in rehearsal, or narrate it as a feature ("CC asks before pulling in external imports").
- Path-scoped rule is on-demand: nothing shows at startup — don't expect it until Claude reads a matching file.

**CUT IF TIGHT:**
- Skip `/memory`; show CLAUDE.md + one path-scoped rule. Drop the hierarchy detail; keep project CLAUDE.md + `@import` bridge + path-scoping.
- Netflix trims: show just metaflow (validates the bridge) + the leak one-liner, or drop the live tabs and deliver the effective-CLAUDE.md spiel verbally. The spiel is the keeper; the artifacts are the illustration.

---

## BEAT 1b — AUTO-MEMORY (`MEMORY.md`) · ~2-3 min · know

**FRAME:** Two kinds of memory: **CLAUDE.md = you write it** (manual, shared, committed, travels with the repo) vs **auto-memory = Claude writes it** (automatic, personal, machine-local, learns across sessions). The contrast is the lesson.

**PRE-FLIGHT:**
- Pre-populate a small, legible `MEMORY.md` example (demo repo: `~/.claude/projects/-Users-admin-code-agentic-ide-demo-app/memory/`, 3 non-sensitive feedback entries).
- Confirm `claude --version` >= 2.1.59.
- Review the real `MEMORY.md` before screen-sharing (privacy) or use the curated example.

**ON SCREEN:**
1. `/memory` output (shows CLAUDE.md + rules + the auto-memory toggle + folder link).
2. The pre-populated `MEMORY.md` + topic files, open from `~/.claude/projects/-Users-admin-code-agentic-ide-demo-app/memory/`. Tip: `/memory` output links straight to the folder.

**SAY:**
- **Contrast:** "Foundation was memory *you* write. There's a second kind: memory *Claude* writes. As you work, it quietly records things worth remembering - a build quirk, a preference - into its own memory file."
- **🎯 SHOW IT OFF - RUN THIS:** **`/memory`** (the key action of this beat - don't skip it). "Here's everything loaded: our CLAUDE.md, the rules, and - separately - auto memory. This lives on *my machine*, per repo, not in git. It's personal; it doesn't travel to your teammates." *(The `/memory` panel also links straight to the memory folder - click through to open the files.)*
  - **TYPE:** `/memory`
- **Open the file:** "Here's what it's saved. Notice it keeps a short index and pushes detail into topic files it only reads when needed - so it doesn't bloat every session."
- **Governance point:** "This is the clean split: what the *team* standardizes goes in committed CLAUDE.md and rules; what *my* agent learns stays local and private. Shared vs personal, by design."
- **Flag:** "This is Claude-Code-specific - Copilot doesn't have it - and it needs a recent version (2.1.59+)."

**WATCH:** `/memory` lists auto-memory **separately** from CLAUDE.md/rules and links to the machine-local memory folder; opening it shows the short index + on-demand topic files.

**GOTCHA:**
- Empty/sparse `MEMORY.md` — nothing to show; pre-populate a legible example.
- Version < 2.1.59 — feature absent; confirm the version.

**CUT IF TIGHT:** Drop to a 30-second mention at the end of the Foundation beat ("Claude also keeps its own private memory - `/memory` shows it").

---

## BEAT 2 — PERMISSIONS / POSTURES · ~5-6 min · constrain

**FRAME:** The **constrain** layer, right after Foundation: rules guide -> permissions/sandbox set posture & boundary -> (then) hooks enforce programmatically. A permission `deny` is a **guardrail** (tool-level, bypassable); the **sandbox is the boundary** (next beat). Core posture idea: **read-only vs execution-allowed** — the GS through-line.

**PRE-FLIGHT:**
- Rehearse the live read-only deny before stage; have the airtight `dontAsk` + allow-only-Read variant ready as fallback.
- Confirm `--settings` read-only holds vs the personal `settings.local.json` (deny wins) live.
- Do NOT rename the `secrets/` folder to something guard-shell catches (guard-shell blocks `.env`/`credentials`, not `secrets/` — so `cat ./secrets/...` stays allowed).

**ON SCREEN:**
1. `.claude/settings.json` `permissions.deny` block + `secrets/demo_secret.txt`.
2. `.claude/settings.readonly.json` (deny-list) next to `.claude/settings.strongerreadonly.json` (allow-list / `dontAsk`).
3. Two Claude Code sessions (or one restarted): normal vs `--settings .claude/settings.readonly.json` (or the stronger variant).

**SAY:** *(order: content-exclusion first, then read-only posture)*
- **Content-exclusion (B) - FIRST:** "Some files the agent should never read. Here's a project-policy deny on our `secrets/` folder." Ask the agent to open `secrets/demo_secret.txt` -> **Read tool denied**. "Good - the guardrail held."
  - **TYPE (normal session):** `Read secrets/demo_secret.txt and show me its contents.` -> **Read tool denied** by `Read(./secrets/**)`.
- **The honest bypass - PRESENTER runs this, not the agent:** "But watch." *You* run the shell command below (a `!`-passthrough, or a plain external terminal) -> **it prints** (fake key). "A shell read walked straight past a Read-tool deny. A permission `deny` is a *guardrail* - it constrains the agent's tools, but it is not an OS boundary." *(Do NOT ask the agent to cat it - it will refuse on principle, which kills the demo. The bypass is presenter-authority.)*
  - **PRESENTER TYPES:** `!cat ./secrets/demo_secret.txt` -> prints the fake `sk-FAKE-workshop-not-real...` key.
- **Posture (A) - SECOND:** "That was one file. Zoom out to the agent's whole posture - read-only vs execution-allowed. Here's a read-only posture: one settings file that denies every write and execute tool." Open `settings.readonly.json`. Start the agent read-only, ask it to make an edit -> **denied**. "It can read and reason all day; it cannot change a thing. Read-only vs execution-allowed is a single flag."
  - **LAUNCH:** `claude --settings .claude/settings.readonly.json`
  - **TYPE:** `Add a blank line to the end of README.md.` -> **denied** (Edit/Write/Bash all denied by the posture).
- **Deny-list vs allow-list - the stronger lesson (Mark covers this):** the file above is a **deny-list** (`settings.readonly.json` lists tools to deny). Its weakness = **whack-a-mole**: in dry-run the agent tried to escape read-only via the **IDE kernel** (`mcp__ide__executeCode`) - a write path we hadn't denied. The robust answer is an **allow-list**: `settings.strongerreadonly.json` uses `defaultMode: dontAsk` + allows only `Read/Grep/Glob`, so **everything else is auto-denied by construction** - no enumeration, no escape. "Explicit allows beat trying to deny every possible path."
  - **LAUNCH (airtight variant):** `claude --settings .claude/settings.strongerreadonly.json`
  - **TYPE:** `write a "hello world" to the end of our README.md file` -> **auto-denied at every turn** (incl. the IDE-kernel escape), **no prompt** - `dontAsk` blocks everything not allow-listed. Reading still works (Read/Grep/Glob allowed).
- **Land it (bridge to Sandbox):** "Deny rules narrow what the agent can touch; posture decides what it may attempt - but both are *guardrails* on the agent's tools, and a shell walked right past one. Only the **sandbox** makes it a real OS boundary - that's the next demo. Guardrail, then boundary."

**WATCH:** The agent's Read tool on `secrets/demo_secret.txt` is **denied**, but the presenter-run `!cat` **prints the fake key** — proving a permission `deny` is a guardrail, not an OS boundary.

**GOTCHA:**
- Read-only deny syntax may not block as written (`Edit(*)` vs bare `Edit`, `--settings` merge) — rehearse; have the `dontAsk` + allow-only-Read variant ready.
- Agent REFUSES to run the bypass on request — **presenter** runs `!cat` / external-terminal `cat`; never route the bypass through the agent.

**CUT IF TIGHT:**
- Drop the read-only posture live-switch; just show `settings.readonly.json` and describe it. Keep the content-exclusion + bypass (the bridge to sandbox).
- Very tight: content-exclusion + bypass only.

---

## BEAT 3 — SANDBOX · ~5-6 min · constrain

**FRAME:** Completes the arc from Beat 2: a permission `deny` was a *guardrail* (bypassable by Bash); the **sandbox is the OS boundary**. Same `cat ./secrets/demo_secret.txt` — guardrail let it through, sandbox stops it.

**FRAMING (don't conflate):** Two different "sandboxes" — (1) **CC's built-in Bash sandbox** (OS-enforced Seatbelt/bubblewrap, **Bash-only**, config-level) — **THIS beat**; (2) the **ai-toolkit Docker/container sandbox** (full-container isolation) — the **M8** story. Say "built-in, Bash-only, config-level" here; reserve "container" language for M8.

**PRE-FLIGHT:**
- Launch the sandboxed session BEFORE the beat: `claude --settings .claude/settings.sandbox.json`; confirm via `/sandbox` -> Config tab (Enabled).
- Keep live commands to plain `echo`/`cat`; pre-add `excludedCommands`/`allowAppleEvents` only if a command touches Go-CLIs (`gh`/`gcloud`/`terraform`) or AppleEvents (`open`/`osascript`).

**ON SCREEN:**
1. A **sandboxed CC session** already started (`claude --settings .claude/settings.sandbox.json`) in the demo repo.
2. `.claude/settings.sandbox.json` open (to show the config).
3. `/sandbox` -> Config tab (to prove it's active).

**SAY (LIVE run — agent Bash tool, NEVER `!` passthrough — `!` is unsandboxed):**
- **Callback + A/B money moment (run the EXACT Beat 2 bypass, now blocked):** "Last beat I ran `!cat` on that secret *myself* and it printed - a shell walked right past the permission deny. Watch me run the exact same command now, with the sandbox on."
  - **PRESENTER TYPES:** `!cat ./secrets/demo_secret.txt` -> **`Operation not permitted`** (blocked by the sandbox's `denyRead`).
  - "Same command, same me. Printed a minute ago without the sandbox; blocked now. The OS boundary catches **even my own shell** - not just the agent. That's the difference between a guardrail and a boundary." *(Verified live 2026-07-14: `!` passthrough IS sandboxed - it's a Bash subprocess of the sandboxed CC process. Contrast Beat 4, where `!` DOES bypass hooks - hooks are tool-pipeline, the sandbox is OS-level.)*
- **Show config + prove it's on:** open `settings.sandbox.json` ("sandbox on, `denyRead` on `secrets/`, strict mode"). Run `/sandbox` -> Config tab. "The OS enforces this on every Bash command and child process - macOS Seatbelt here; Linux bubblewrap."
  - **PRE-FLIGHT LAUNCH (before the beat):** `claude --settings .claude/settings.sandbox.json`
  - **TYPE:** `/sandbox` *(Config tab: Enabled, Seatbelt, allowWrite ["."], denyRead ["./secrets"])*
- **Baseline (live):** ask the agent to write + read a file inside the project. "Inside the project, normal work is untouched."
  - **TYPE:** `Run this command: echo hi > ./sandbox_test.txt && cat ./sandbox_test.txt` -> **succeeds.**
- **The boundary (live money shot):** ask the agent to write OUTSIDE the project. It comes back **`Operation not permitted`**. "That write is outside the project. The OS refused it - strict mode, no negotiation."
  - **TYPE:** `Run this command: echo hi > ~/sandbox_outside_test.txt` -> **`Operation not permitted`.**
- **The Beat 2 completion (live):** ask the agent to read the excluded secret. **Blocked - `Operation not permitted`.** "Same command that bypassed the guardrail two beats ago. The permission deny constrained the agent's *tools*; the sandbox isolates the *shell itself*." *(If the agent refuses to attempt the secret read, narrate it: "it won't even try - and if it did, the OS would stop it," then fall back to the config.)*
  - **TYPE:** `Run this command: cat secrets/demo_secret.txt` -> **`Operation not permitted`.**
  - ℹ️ Both work: `!` passthrough (presenter) AND the agent's Bash tool are **both sandboxed** (OS-level). Use `!` for the Beat 2 A/B above; use agent Bash here to also show the **agent itself** is boundaried. The real requirement is that the **session was launched with the sandbox settings** (pre-flight) - that, not avoiding `!`, is what makes the blocks happen.
- **Scope honesty:** "One caveat: this built-in sandbox is Bash-only. Your Read/Edit/Write tools still ride the permission system. Layers, not a silver bullet."
- **Bridge to M8:** "And when you need the whole agent in a hard box - not just Bash - that's full container isolation, which we'll see when we hand an agent an autonomous, isolated run later."

**WATCH:** The out-of-bounds write (`echo hi > ~/...`) returns **`Operation not permitted`**, and the exact Beat-2 bypass (`cat secrets/demo_secret.txt`) is now OS-stopped — while in-bounds R/W still succeeds.

**GOTCHA:**
- **Real requirement = launch with the sandbox settings** (`--settings .claude/settings.sandbox.json`) and confirm via `/sandbox` -> Config (Enabled). If you forget, nothing blocks. *(Correction 2026-07-14: `!` passthrough IS sandboxed — earlier "avoid `!`, it's unsandboxed" was wrong; both `!` and agent Bash are caught.)*
- Agent may refuse the secrets read — the out-of-bounds *write* block is the reliable proof; or use the presenter `!cat` A/B (which the OS blocks regardless of model cooperation).

**CUT IF TIGHT:**
- Drop the baseline + secrets-read; keep the single out-of-bounds write block (the core "OS refused" moment).
- Very tight: show-config + one live block, defer the rest to M8.

---

## BEAT 4 — HOOKS · ~6-8 min · enforce

**FRAME:** **Rules guide; hooks enforce.** A hook is a shell script + an exit code. The triad the repo demonstrates: **enforce / observe / automate.** (Permissions *declare* what's allowed; hooks add **programmatic** enforcement — arbitrary logic, not just allow/deny.)

**PRE-FLIGHT:**
- Stage real uncommitted changes first so "reset my branch" induces `git reset --hard`.
- Rehearse the live deny in Claude Code before stage.
- Optionally clear `/tmp/agent-audit.log` before the session; confirm `audit.sh` is wired to `.*` so the blocked attempt is captured.
- Auto-lint uses **Prettier**: `cd frontend && npm install` + launch `claude` with node/npx on PATH (`nvm use`); pick a JS/JSX file for the edit. (Frontend src is baseline-prettier-clean, so the demo edit produces a crisp fix; the hook fail-opens silently if npx/node isn't found.)
- Do NOT run `.env`/`credentials` or `git reset`/`push --force` in the on-stage terminal (guard-shell bites it); pre-stage the audit-log tail.

**ON SCREEN:**
1. Claude Code open in `agentic_ide_demo_app`, clean state.
2. (Optional pre-open, minimized) `.claude/settings.json` and `guard-shell.sh` ready to show.
3. A terminal ready to `tail /tmp/agent-audit.log`.

**SAY:**
- **Set up the callback:** "Remember when we put 'never run destructive commands' in the project rules? That's guidance. The model reads it and *usually* listens. 'Usually' is not a control. Watch what happens when I actually try to make it do something dangerous."
- **Trigger the money shot:** "I've got some uncommitted work here, and I'm going to ask the agent to throw it away and reset my branch." (Stage real uncommitted changes first; prompt the agent explicitly.)
  - **TYPE:** `Discard all my uncommitted changes with a hard reset - run git reset --hard.`
  - ⚠️ **Must be the AGENT proposing it** (natural language, agent Bash tool). **NEVER `!git reset --hard`** - a `!`-passthrough bypasses the hook and WILL execute for real.
- **The moment:** the agent tries `git reset --hard`, and it comes back **blocked** - the agent literally cannot run it, and it tells you why. "That block did not come from the model deciding to be safe. It came from a hook. The model had no say."
- **"No magic":** open `guard-shell.sh`. "This is a bash script. It reads the command, matches a few dangerous patterns, and **exits 2**. In Claude Code, a PreToolUse hook that exits 2 blocks the tool call - full stop. Three lines of `settings.json` wire it in. That's the entire mechanism."
- **Observe (quick):** `tail /tmp/agent-audit.log`. "Same event, different hook. This one doesn't block anything - it just logs every tool call to an audit trail. Notice the command we just blocked is *in here*. Enforcement stopped it; observability recorded the attempt. For a regulated shop, that log is gold."
  - **PRESENTER TYPES (terminal):** `tail /tmp/agent-audit.log`
- **Automate (quick):** make a small messy edit to a component; save. "A third hook fires *after* edits and runs the linter automatically. Hooks aren't only about danger - they kill the boring, must-happen work too."
  - **TYPE:** `Add a console.log to frontend/src/components/Card.jsx with deliberately messy formatting (bad indentation, double spaces).` -> the PostToolUse auto-lint hook runs `npx prettier --write` and cleans it on save. *(Verified live 2026-07-14.)*
- **Land it:** "Three hooks, one repo: **enforce, observe, automate.** Rules guide; hooks enforce."

**OPTIONAL (if asked) — hook handler-types showcase** (opt-in, doesn't touch the default demo):
- **LAUNCH:** `claude --settings .claude/settings.hooks-showcase.json`
- **prompt (model-in-the-loop, the money contrast to guard-shell):** a prose governance rule ("no global installs") that's painful as regex, trivial as prose. **TYPE:** `run: npm install -g cowsay` -> **BLOCKED** with a governance reason (guard-shell does NOT catch this); **TYPE:** `run: ls -la` -> approved (proves judgment, not blanket-block).
- **command (advisory):** fires on EVERY Bash; prints a visible `systemMessage` line — the non-blocking counterpart to guard-shell's exit-2 block.
- **http (deterministic external):** POSTs the payload to `postman-echo.com/post` (silent on a 200 echo). In prod the URL is your policy service returning `permissionDecision:deny`. *(Do NOT use httpbin.org — it 503s.)*
- Teaching point: command/http = deterministic ("enforce without model compliance"); prompt/agent = model judgment (flexible but advisory).
- ⚠️ Showcase gotchas: (1) `statusMessage` spinners do NOT render in 2.1.207 — rely on the DECISION output. (2) prompt/http are SILENT on approve/200 — only surface on a block. (3) the main model can self-refuse a risky command before the tool call (so PreToolUse never fires) — pick a command it WILL attempt (like `npm install -g`).

**WATCH:** The agent's `git reset --hard` comes back **blocked** (it cannot run it and says why), and that blocked attempt then appears in `/tmp/agent-audit.log` — enforce + observe together. The block came from a hook's exit 2, not the model.

**GOTCHA:**
- ⚠️ Must be the AGENT proposing the command (natural language). **NEVER `!git reset --hard`** — the `!`-passthrough bypasses all PreToolUse hooks and WILL execute for real.
- Agent proposes a safe command (`git restore`/`git checkout`) instead — stage real uncommitted changes + prompt explicitly ("discard everything with a hard reset"); re-prompt if it picks safe.

**CUT IF TIGHT:**
- Drop **automate** (auto-lint); keep enforce + observe.
- Very tight: enforce-only, deep — keep the `settings.json`/exit-2 reveal (the transferable lesson).

---

## BEAT 5 — SKILLS · ~10-12 min · empower

**FRAME:**
1. A skill encodes a **repeatable workflow or a body of knowledge once, as a reusable unit** you (or Claude) invoke consistently.
2. Skills **load on-demand** — descriptions cost a little at session start; the full body loads only when used (contrast: CLAUDE.md/rules always-on; MCP schemas always-on).
3. **The frontmatter is the control surface** — each field changes how/when/with-what the skill runs.

**FRAMING:** Present `context: fork` honestly as **NEW/experimental** — "this field is recent and can be a little buggy." Show the clean-summary behavior; don't over-assert it definitively forked.

**PRE-FLIGHT:**
- Confirm `context: fork` + `agent:` works on the presenter's exact version before demoing live; keep the context-crowding narrative as a verbal fallback.
- Verify the retrofitted frontmatter live (commit-message manual-only; coin-flip `model: sonnet` alias resolves).
- Confirm `coin-flip-true-random` reaches random.org on the demo network; have local `coin-flip-code` as fallback.
- Stage a change first so `commit-message`'s `` !`git diff --staged` `` injection has something to show.

**ON SCREEN:**
1. The coin-flip family (`SKILL.md` + `scripts/flip.py`).
2. `react-best-practices/` + owned `flask-api-conventions/` (knowledge) and `commit-message/SKILL.md` (workflow).
3. `_frontmatter-reference/SKILL.md` (the all-16-field catalog - MOVE 1 breadth), then commit-message / flip-until-heads / coin-flip / add-dashboard-card frontmatter (MOVE 2 depth).
4. `add-dashboard-card/SKILL.md` (brief).

**SAY:**
- **What a skill is:** "A skill is a folder with a `SKILL.md` - instructions Claude can pull in on demand. Two flavors: a **workflow** you trigger, or **reference knowledge** Claude loads when it's relevant. Either way it costs nothing until it's used."
- **Capability spectrum (coin-flip):**
  - "Simplest skill - `coin-flip`. It just says 'pick heads or tails.' The *model* picks. There's no code; it's guessing." **TYPE:** `/coin-flip` *(also our `model: sonnet` example - a trivial skill pinned to Sonnet).*
    - **BONUS - auto-invoke by `description` (MAY NOT FIRE):** **TYPE:** `Flip a coin for me.` (no slash). Claude *may* pick `coin-flip` on its own by matching its `description` - "that's auto-invocation; the description is the trigger." Semantic match is unreliable on stage, so if it doesn't fire, narrate it and fall back to `/coin-flip`. (flask-api-conventions below is now a **teach-the-failure** moment - see there.)
  - "`coin-flip-code` - now the skill says 'run this `flip.py`.' Here's the code, right in the skill folder. Real randomness from Python. **But notice:** the agent has to *decide* to run it, and honestly it could take a left turn - skip the script and just say 'heads.' The skill *instructs*; it doesn't *guarantee*." (-> flag: that guarantee is what MCP adds, next section.) **TYPE:** `/coin-flip-code`
  - "`coin-flip-true-random` - same shape, but the script calls **random.org** over the network. So a skill's code can reach **external services**, not just run locally. (Fun aside: Python's `random` isn't truly random - it's a pseudo-random generator seeded from a number. random.org uses atmospheric noise. For a demo it doesn't matter; for a lottery it would.)" **TYPE:** `/coin-flip-true-random`
- **Skills are also knowledge, not just workflows:** open `react-best-practices`. "This skill is a big reference corpus - Claude pulls it in only when it's working on React. That's a skill as *on-demand knowledge*." Then open our owned one, `flask-api-conventions`: "same idea for our own backend - and notice its frontmatter: `user-invocable: false` (Claude-only, it's not a command you'd type) and `paths: backend/**` (it only becomes *available* in backend code - `paths` gates **availability**, not firing). Knowledge that scopes itself."
  - **TYPE (the auto-load attempt):** `Read backend/config.py and tell me where a new external API key should be wired.`
  - *What happens:* Claude answers **correctly** + shows **"1 skill available"** but does **NOT** invoke the skill. Prove it: **TYPE:** `did you use any skills in the last message?` -> "No." **Teaching moment, not a bug.**
  - **SAY (anti-pattern):** "Didn't fire - and that's the lesson. Claude sees only a skill's **name + description**, never the body, until it decides to load it. Here it didn't need to: this skill's config/secrets knowledge is **already** in an always-on **rule** (`security-review`) and **AGENTS.md** - in context every turn. The always-on primitive **shadowed** the skill. **Keep primitives isolated:** a skill fires only when it holds knowledge that *isn't* already in a rule/AGENTS.md; duplicate it into an always-on file and the skill is dead weight."
  - **OPTIONAL live fix (if you want to prove it):** (1) live-delete the config/secrets lines from AGENTS.md (~64-69) + the `## Secrets & Configuration` block in `.claude/rules/security-review`, re-ask -> skill must load *(demo-only, don't commit)*; or (2) **TYPE:** `Add a backend service for a new "crypto price" card.` - the skill's unique `fetch(**_kwargs)`/flat-dict/`fallback:True`/`SERVICES`-wiring lives nowhere else, so Claude has a reason to pull it in *(still discretionary)*.
- **Small workflow:** open `commit-message`. "And here's a tiny one - it encodes our commit-message convention. One invocation, consistent commits. That's 'capture the team's process.'" **TYPE:** `/commit-message` *(manual-only via `disable-model-invocation`; stage a change first so the `` !`git diff --staged` `` injection has something to show).*
- **Installed skills:** "`frontend-design` we didn't write - it's Anthropic's, installed into the repo. Skills travel. (How you distribute and govern them across an org is its own story - we'll get there with the AI-toolkit.)"
- **Frontmatter = the control surface (TWO MOVES: breadth then depth):**
  - **MOVE 1 - breadth (open `_frontmatter-reference`):** **TYPE:** `/_frontmatter-reference` (or open the file). "Every skill starts with a control block. Here's the full menu - one skill that catalogs all 16 fields." Skim the table quickly, one line each: `description` drives auto-invoke; `when_to_use` adds trigger phrases; `disable-model-invocation`/`user-invocable` decide *who* can call it; `allowed-tools`/`disallowed-tools` grant/remove tools; `model`/`effort` tune *how* it runs; `context: fork`+`agent` decide *where*; `argument-hint`/`arguments`/`paths` handle args + scoping; `hooks`/`shell` for lifecycle/shell. "Don't memorize it - this skill is your take-home cheat sheet. It also demonstrates a field on *itself*: `disable-model-invocation`, so Claude never auto-runs a reference doc."
  - **MOVE 2 - depth (walk the real skills, only the fields each actually uses):**
    - **commit-message:** `disable-model-invocation: true` ("you don't want Claude auto-committing"), `allowed-tools: Bash(git ...)` ("its git reads run without prompts"), `argument-hint`, and the `` !`git diff --staged` `` line - "that injects the live staged diff into the skill *before* Claude sees it. The skill arrives already knowing what changed."
    - **flip-until-heads:** `context: fork` + `agent: general-purpose` ("runs in its own isolated context") + `disallowed-tools: AskUserQuestion` ("an autonomous loop must never stop to ask - so we remove that tool").
    - **coin-flip:** `model: sonnet` - "a trivial skill doesn't need Opus; pin it to Sonnet just while it runs, then the session model comes back."
    - **add-dashboard-card:** `arguments: [slug, source]` -> `$slug`/`$source` ("named args"), `effort: high` ("a real multi-step build, pinned high"), `when_to_use`.
    - **flask-api-conventions:** (already shown above) `user-invocable: false` + `paths`.
  - **Land it:** "Same file format, but each field changes *who* invokes it, *how* it runs, *what* it can touch, and *where*. The reference skill is the map; these are the fields doing real work."
- **The real one:** open `add-dashboard-card` briefly. "And this is a skill encoding a real, multi-step repo workflow - adding a dashboard card end-to-end. We'll build with it live later; for now, note that everything you'd otherwise re-type every time is captured here once."
- **Composability + the bridge to subagents:** `flip-until-heads` - "skills can even call other skills." **TYPE:** `/flip-until-heads` *(runs true-random flips until heads; `context: fork` returns only the summary).* Then the mechanical hand-off: "and a skill can run in its *own* isolated context - `context: fork` with `agent:` sends the work to a forked subagent that runs it and returns just a summary, keeping this conversation clean. That forked context *is* a subagent - which is the next primitive." (-> Subagents.) **Frame `context: fork` honestly as NEW/experimental** ("this field is recent and can be a little buggy") - show the clean-summary behavior, don't over-assert it definitively forked.

**WATCH:** Reading `backend/config.py` shows **"1 skill available"** but does **NOT** invoke flask-api-conventions (its knowledge is already in an always-on rule + AGENTS.md — the teach-the-failure moment above). `/flip-until-heads` returns **only the summary** (no flip flood — `context: fork` isolation).

**GOTCHA:**
- Auto-invocation may not fire / fires the wrong skill (semantic match) — use explicit `/skill-name`; talk about auto-invocation rather than rely on it.
- `context: fork` behavior varies by version — confirm on the presenter's exact version; keep the context-crowding narrative as a verbal fallback for the subagent bridge.

**CUT IF TIGHT:**
- Drop `coin-flip-true-random` (keep guess -> script); mention external-API skills verbally.
- Cut either `commit-message` or `react-best-practices` (keep one for workflow-vs-knowledge).
- Compress the frontmatter walk to `description` + `disable-model-invocation` + "there are a few more (`model`, `allowed-tools`, experimental `context:`)."

---

## BEAT 6 — MCP · ~7-9 min · empower

**FRAME:** MCP gives the agent **new external capabilities** (tools, data, systems) through a standard protocol — and it **completes the trust spectrum**: a skill's script runs *locally and depends on the agent*; an MCP tool runs across a **protocol boundary**, so once it's called the code **definitely ran** and the result **can't be fabricated**.

**FRAMING:** Do NOT auth clickup here — reserved. Just point at it as "the board integration we'll use later"; save the OAuth flow for the board-loop.

**PRE-FLIGHT:**
- Install `uv` on the presenter machine; verify `claude` loads `random-tools` before stage; add `uv` to README prereqs.
- Trigger + approve the first-run `.mcp.json` server-approval once in rehearsal.
- Pre-warm the server (30s startup timeout); `MCP_TIMEOUT=60000 claude` if needed.
- Confirm context7 reachable on the conference network; have local random-tools as the guaranteed fallback.
- Verify the bare "Roll a 40-sided die" prompt reliably fires `mcp__random-tools__roll_die` (does NOT fabricate) before stage.

**ON SCREEN:**
1. `.mcp.json` (the three servers).
2. `mcp-servers/random-tools-mcp/server.py` (the small FastMCP server - `coin_flip` + `roll_die`).
3. A tool call in the transcript labeled with the server name.
4. `/mcp` panel.

**SAY:**
- **Complete the spectrum:** "Back to the coin flip. The skill-with-a-script ran `flip.py` - but the agent had to *choose* to run it and report honestly. Here's the MCP version." Open `server.py`. "**Same `random.choice`** - the code didn't change. What changed is *where it runs*: the agent calls a tool, and a **separate process** runs that code across the protocol and hands back the result. The model can decline to call it - but once it does, the code *definitely ran*, and it can't invent the answer. That's the trust boundary."
  - **TYPE:** `Use the random-tools coin_flip tool to flip a coin.`
  - *Watch:* call labeled `mcp__random-tools__coin_flip`; returns heads/tails.
- **Build one (FastMCP):** "And building a server is almost nothing - `FastMCP`, a decorated function, `mcp.run()`. A handful of lines per tool. If your team has an internal API, you can wrap it as an MCP tool this afternoon." *(Show-only: open `server.py`; no prompt to type.)*
- **Tools take parameters + the agent auto-selects (`roll_die`):** "And tools aren't just no-arg buttons - they take **typed arguments**. Watch - I won't even name the tool this time." Type the prompt below. "The agent reached for `roll_die` on its own - it's the only tool that fits - and passed a real typed argument, `sides: 40`, across the protocol. That's how MCP exposes *real* APIs: the model matches the task to the right tool, with parameters, types, validation - not just buttons." *(Contrast with coin_flip, where we named the MCP explicitly to force it over the coin-flip skill; here we let the agent choose.)*
  - **TYPE:** `Roll a 40-sided die.`
  - *Watch:* the agent **auto-selects** `mcp__random-tools__roll_die` (not named in the prompt) with `sides: 40`; returns 1-40.
- **Real capability (`context7`):** "MCP isn't just local toys. `context7` is a remote server that pulls **live library docs** - so instead of guessing an API from training data, the agent looks up the current signature. This repo uses Tailwind v4, whose theming syntax is new - let's check ours against the live docs."
  - **TYPE:** `Use the context7 MCP to pull the current Tailwind CSS v4 docs for the @theme directive and custom color variables, then confirm the syntax in frontend/src/index.css is correct.`
  - *Watch:* `mcp__context7__resolve-library-id` (tailwindcss -> ID) then `mcp__context7__query-docs` (live docs), then it cross-checks our real `@theme { --color-card-* }` block.
  - *Payoff line:* "That signature came from the live docs, not from what the model memorized. For a fast-moving library - or your own internal one - that's the difference between current and hallucinated."
  - **FALLBACK** (if Tailwind is slow/unindexed on the demo net) - **TYPE:** `Use the context7 MCP to look up the current React 19 docs for the use hook and show me its signature.`
- **Config + trust gate:** "Servers live in `.mcp.json`. Note: the *first* time Claude Code sees a project server, it asks you to approve it - a repo you clone can't silently launch processes. Manage everything with `/mcp`; remote servers authenticate with OAuth right in that panel."
  - **TYPE:** `/mcp` *(opens the panel: shows random-tools/context7/clickup, connect/disconnect, OAuth).*
- **Governance (GS):** "One cost to know: unlike skills, which load on demand, every connected MCP server's tools sit in your context **every** session. So be selective - and in a regulated org, you can enforce an allow-list of servers centrally." (-> `allowedMcpServers`.)
- **Tease the board:** "We've also got a ClickUp server wired up - that's how the agent will read and write a real project board later, when we build a feature end-to-end."
- **Bridge to subagents:** "So: rules, memory, permissions, hooks, skills, MCP - the agent now has context, guardrails, workflows, and tools. Last question: what if a task is big enough to need its *own* agent? (-> Subagents.)"

**WATCH:** The transcript shows the tool call labeled with the **server name** — `mcp__random-tools__coin_flip`, and `roll_die` **auto-selected** with `sides: 40` (not named in the prompt) — proving the code ran across the protocol boundary, not fabricated.

**GOTCHA:**
- `uv` not on PATH -> random-tools fails to start; install `uv` + verify the server loads before stage.
- Implicit "Roll a 40-sided die" may fabricate a number instead of calling `roll_die`; verify live it fires the tool — nudge ("using a tool") or name it explicitly if it fabricates.

**CUT IF TIGHT:**
- Drop the FastMCP build (show config + a tool call). Drop the context7 live lookup; describe it.
- Keep the random-tools `coin_flip` trust-boundary completion (non-negotiable payoff); `roll_die`/params is first to cut.

---

## BEAT 7 — SUBAGENTS · ~7-9 min core + ~3-4 min coda · empower

**FRAME:** A subagent **delegates a sub-task to an agent with its own context window**, its own tools/model/permissions; it works independently and **returns just a summary** — keeping your main conversation clean and letting you *constrain* what the helper can do.

**FRAMING:** Frame **agent teams** (the coda) as experimental — "where this is heading," not a production-hardened primitive. Flag the higher token cost for a cost-conscious org.

**PRE-FLIGHT:**
- Confirm every `.claude/agents/*.md` has `name:` (lowercase-hyphen) + `description:`; verify both agents appear in a live session before stage.
- Rehearse the `tools:` restriction: ask the read-only agent to edit a file and confirm it's blocked.
- Confirm network for research-assistant (WebSearch/WebFetch); fall back to code-reviewer only.
- Agent-teams coda: enable `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in presenter `~/.claude/settings.json` (`echo $CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` -> `1`); fallback screenshot ready at `assets/agent_team_sending_messsages.png`.

**ON SCREEN:**
1. **Built-ins firing:** an explicit `Explore` delegation, then a `general-purpose` delegation (both show a child-context Agent call returning a summary).
2. `_agent-reference.md` (all-16-field frontmatter catalog - breadth), then `.claude/agents/code-reviewer.md` (`tools:` + prompt - depth).
3. A live delegation: ask Claude to review a file -> code-reviewer runs -> structured findings return.
4. research-assistant running a quick background research task.

**SAY:**
- **Payoff of the on-ramp:** "Last beat we saw a skill can fork into its own context. The primitive for that is a **subagent** - a helper with its *own* context window that does a job and returns a summary, so your main thread stays clean."
- **You've been using them already (built-ins) - let's fire each one on purpose:** "You don't have to define anything to use a subagent. Claude Code ships with **built-in** ones - **Explore**, **Plan**, and **general-purpose** - and delegates to them automatically. Normally Claude picks them for you behind the scenes; I'll name each one explicitly so you can *see* the delegation happen."
  - **Explore (fast read-only search):** "Explore is a read-only searcher - it even skips your CLAUDE.md to stay cheap and fast. Watch - I'll call it by name."
    - **TYPE:** `Use the Explore subagent to find every place a card accent color is defined and applied, and report the files and line numbers.`
    - *Watch:* an **`Explore` (Agent) delegation** appears in the transcript; it searches in its **own** context and returns only the file/line summary - none of the search noise lands in your main thread.
  - **general-purpose (multi-step worker):** "general-purpose is the do-anything worker - it loads your **full** CLAUDE.md and rules, chains multiple dependent steps, and unlike Explore it can also *modify*. Same explicit invocation."
    - **TYPE:** `Use the general-purpose subagent to trace how a card's data flows from the backend service through the API route to the frontend component, and summarize the full path with file references.`
    - *Watch:* a **`general-purpose` delegation**; it does the multi-file trace in its own context and hands back a **synthesized summary** (more reasoning than Explore's raw search).
  - **Plan:** "The third, **Plan**, is what **plan mode** uses for read-only research - same idea, scoped to planning. No separate demo; just know it's there." *(Optional: `Shift+Tab` into plan mode, ask a question, note the `Plan` delegation.)*
  - *Teaching contrast:* **Explore = cheap, read-only, skips CLAUDE.md (pure search)** vs **general-purpose = full context, multi-step, can modify (a real worker).** Both free, both automatic - you just watched them fire.
- **Built-in vs custom (the point of defining your own):** "So if built-ins are free and automatic, why define your own? Because built-ins are **generalists** - `general-purpose` is a blank slate with broad tools; `Explore`/`Plan` are fast read-only researchers that even **skip your CLAUDE.md and rules** to stay cheap. A **custom** subagent is where you encode a **specific job**: a named role Claude delegates to by `description`, a **constrained toolset you enforce**, your **repo's conventions** baked in, a **pinned cheaper model**. You reach for custom when you keep spawning the *same specialized, governed worker* - which is exactly our reviewer."
- **Frontmatter breadth (open `_agent-reference`):** **TYPE:** `/agents`, then open `.claude/agents/_agent-reference.md`. "Same as the skills reference - one file, the full subagent control surface." Skim grouped: `name`/`description` (identity + auto-delegate; **'use proactively'** encourages); `tools`/`disallowedTools`/`permissionMode` (*what it touches* - Permissions beat, per-agent); `model`/`effort`/`maxTurns` (*how hard*); `skills`/`mcpServers`/`hooks`/`memory` (*composes with* - `skills` preloads **full** content; hooks/MCP per-agent); `background`/`isolation`/`color`/`initialPrompt` (*where/how it shows*). **Two contrasts:** (1) subagents are **camelCase** (`disallowedTools`) vs skills **hyphenated** (`allowed-tools`) - cross-pasting silently fails; (2) **no `disable-model-invocation`/`user-invocable`** on subagents - only the `description` steers who invokes (why this file's description says "never delegate to this"). "Take-home cheat sheet; it also lists the 5 built-ins - and note there's **no** built-in `claude` (that's an agent-team/orchestration thing). Now the fields for real:" (-> code-reviewer = depth.)
- **The reviewer (depth):** open `code-reviewer.md`. "It's just markdown - a description and a system prompt. The description is how Claude decides to delegate to it." Point it at its own file: "In fact, let's have it review *itself* - no magic, it's a text file."
- **Enforced read-only (callback):** "Notice `tools: Read, Grep, Glob`. Earlier this agent just *said* 'never modify files' - but saying isn't enforcing, same lesson as rules-vs-hooks. Now its toolset makes it read-only. You wouldn't give a reviewer a pen." Delegate a real review -> structured findings come back.
- **Applies your rules:** "And it's reviewing against *this repo's* conventions - the same security, API, Tailwind, and migration rules we set up earlier. The primitives compound."
- **Background research:** "Second agent, research-assistant - I'll send it a research question and it works in the background while we keep talking. It comes back with a sourced summary; the digging never cluttered our thread."
- **CC advantage:** "And unlike some tools' single-level 'no sub-sub-agents,' Claude Code lets agents delegate a few levels deep - real orchestration."
- **CODA - agents that talk to each other (agent teams):** "One more level. Everything so far, a subagent reports back to *me*. But agents can also talk to *each other*. That's **agent teams** - experimental, opt-in: each teammate is a full Claude session, they share a task list, and they message each other directly with a tool called **SendMessage**." Run the team demo (scripted below) or show the saved screenshot. "Watch - the security reviewer just sent its findings to the performance and error reviewers, and they're challenging each other *before* anything comes back to me. That's the jump from **delegation** to **collaboration**."
- **Bridge to the finale:** "So that's the full kit: memory, permissions, sandbox, hooks, skills, MCP, subagents - and, at the far end, teams of agents collaborating. Last question - how do you *package* all of this and roll it out across a team? (-> Plugins / the AI-toolkit.)"

**CODA — AGENT TEAMS (SendMessage) · advanced/experimental · ~3-4 min**

*Teaching contrast:* Subagents report to the lead **only**, one-shot, lead manages all work, lower cost. Agent teams: teammates **message each other** via `SendMessage`, share a **task list** and self-claim, each is a **full independent Claude session**, **significantly higher cost**. (`SendMessage`: `to:` = a teammate **name** for peer-to-peer, or `"main"` for a subagent -> lead. An agent must call SendMessage to communicate; team-coordination tools stay available even under a restrictive `tools:` allowlist.)

*Display mode:* we demo **in-process** (any terminal incl. VS Code — teammates live in the agent panel below the prompt; idle rows hide ~30s, message a teammate by name to bring its row back). Mention only: **tmux / iTerm2 split-panes** as the advanced setup (each teammate its own pane) — NOT run live, not supported in VS Code's integrated terminal.

**SCRIPTED DEMO (in-process):**
1. Ensure the flag is on (`echo $CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` -> `1`), launch `claude` in the demo repo.
2. **TYPE:** `Spawn 3 teammates to review backend/app/routes/data.py - one on security, one on performance, one on error handling. Have them share findings and challenge each other's disagreements directly before synthesizing.`
3. **Watch:** a shared **task list** + an **agent panel** with the 3 teammates (SecReviewer / PerfReviewer / ErrReviewer) appear. Select a teammate (up/down) + **Enter** *while it's still working* to watch `SendMessage` fire.
4. **The money moment:** in the security reviewer's transcript you see `Message from @PerfReviewer` / `@ErrReviewer` arriving, and the reviewer saying *"Let me send my security findings to both teammates."* -> **peer-to-peer messaging, live.**
5. Land it: *"That's the jump from delegation to collaboration - and it's the same SendMessage tool under the hood."*

**FALLBACK screenshot** (if the live team is flaky / token-budget tight): `assets/agent_team_sending_messsages.png`.

*Caveats to state on stage:* experimental; **higher token cost** (flag it for a cost-conscious org); known limits (no in-process resume, one team per session, no nested teams). Frame as "where this is heading," not production-hardened.

**WATCH (core):** The `code-reviewer` delegation returns **structured findings** while only having read the file (Read/Grep/Glob) — it cannot write; the review work stays in the subagent's context, only the summary comes back. **WATCH (coda):** In the security reviewer's transcript, `Message from @PerfReviewer`/`@ErrReviewer` arrives and it sends findings to peers — peer-to-peer messaging, live.

**GOTCHA:**
- Custom agents don't load / "Agent type not found" — cause was a missing `name:` frontmatter field; confirm every `.claude/agents/*.md` has `name:` (lowercase-hyphen) + `description:`.
- `tools:` restriction doesn't block a write — rehearse (ask the read-only agent to edit a file, confirm it's blocked; a silent write undercuts the point).

**CUT IF TIGHT:**
- Drop the agent-teams coda entirely (or shrink to the fallback screenshot + one sentence) — first to cut.
- Drop research-assistant; keep code-reviewer (read-only + own-file gag + enforced-tools callback).
- Skip the live review; show the agent file + explain delegation.
