# rearc/pocock-kit

A curated 19-skill subset of [Matt Pocock's publicly-shipped skills](https://github.com/mattpocock/skills) (MIT-licensed), distributed via APM. Tracks Pocock's **v1.1** release ([ADR-0039](../../ADR.md#adr-0039-rearcpocock-kit-tracks-pococks-v11-release-18-skill-transitively-complete-curation)).

This is an **APM-native kit** ([ADR-0016](../../ADR.md#adr-0016-external-installer-wrapper-kits-as-a-second-supported-kit-shape)) — `dependencies.apm:` declares 19 per-skill subpath references against `mattpocock/skills` (per [ADR-0015](../../ADR.md#adr-0015-upstream-skills-are-declared-at-per-skill-subpath-granularity-not-whole-collection)); APM resolves and deploys them. No `scripts:` sidecars, no upstream installer to dispatch to.

## What you get

19 skills covering Pocock's v1.1 SDLC arc plus its shared vocabulary and several take-home utilities. The curation is **transitively complete** — several v1.1 skills are thin shims over sibling skills (`grill-me` -> `grilling`; `implement` -> `tdd` + `code-review`; `wayfinder` -> `research` + `prototype` + `grilling` + `domain-modeling`), so those building blocks are bundled too and nothing references an absent skill.

**v1.1 SDLC arc (9):**

| Skill | What it does |
|---|---|
| `wayfinder` | Session-spanning planning for work too big for one agent session — charts the unknowns as a tree of blocking decision-tickets on the issue tracker and resolves them one at a time until the route compiles into a spec. |
| `research` | Spins up a background agent to investigate a question against primary sources and write the findings to a Markdown file in the repo. |
| `grilling` | The relentless one-question-at-a-time interview that builds shared understanding (facts vs decisions; confirm before acting). The substance behind `grill-me`. |
| `to-spec` | Synthesizes the current conversation into a **spec** filed on the configured tracker (renamed from `to-prd` — a spec is broader than a PRD, which stops non-PRD material leaking in). No interview, just synthesis. |
| `to-tickets` | Breaks a spec/plan/conversation into **tracer-bullet tickets**, each declaring its blocking edges (renamed from `to-issues`). |
| `implement` | Builds a ticket: TDD at pre-agreed seams, regular typecheck/tests, then `code-review`, then commit. Deliberately thin — chains the pipeline together. |
| `tdd` | Red/green reference (now reference-only so an unattended agent can run it; refactoring deferred to review). |
| `code-review` | Two-axis review — **standards** and **spec** — run as parallel sub-agents; names Fowler's refactoring smells to invoke the model's prior. |
| `prototype` | Throwaway code that answers a design question (logic or UI/state); model-invokable so `wayfinder` can call it to raise discussion fidelity. |

**Shared design vocabulary + bootstrap (3):**

| Skill | What it does |
|---|---|
| `setup-matt-pocock-skills` | One-time per-repo bootstrap — captures issue-tracker preference, triage labels, and domain-doc layout. **Hard prerequisite** for the skills that read that config: `to-spec`, `to-tickets`, `code-review`, `triage`, and `wayfinder`. |
| `domain-modeling` | Actively builds/sharpens the project's domain model — ubiquitous language + recorded decisions. Called by `wayfinder`, `grill-with-docs`, `improve-codebase-architecture`, `triage`. |
| `codebase-design` | Shared vocabulary for designing deep modules (a lot of behaviour behind a small interface at a clean seam). Called by `improve-codebase-architecture`. |

**Ergonomic grill aliases (2):**

| Skill | What it does |
|---|---|
| `grill-me` | Friendly entry point — runs a `grilling` session. |
| `grill-with-docs` | Runs a `grilling` session using `domain-modeling`, so ADRs and glossary are written as you go. Successor to the deprecated `ubiquitous-language` skill. |

**Take-home utilities + meta (5):**

| Skill | What it does |
|---|---|
| `improve-codebase-architecture` | Scans for "deepening opportunities," presents them as a report, then grills through the one you pick — built on `codebase-design` + `domain-modeling`. |
| `triage` | State-machine-based issue triage workflow. |
| `diagnosing-bugs` | Disciplined diagnosis loop for hard bugs and performance regressions. |
| `resolving-merge-conflicts` | Resolves an in-progress git merge/rebase conflict by finding each change's original intent, preserving both where possible, then running the project's checks. |
| `writing-great-skills` | Reference for writing and editing skills well: the vocabulary and principles that make a skill predictable. |

Excluded from this curation: `ask-matt`, `handoff`, `teach`, Pocock's other setup/hygiene and personal-project skills, and anything under `skills/deprecated/` or `skills/in-progress/`. See [NOTICE.md](NOTICE.md) for the full inclusion/exclusion map.

## Prerequisites

- `apm` — https://microsoft.github.io/apm/getting-started/installation/

That's it for the kit itself. The skills themselves describe per-task prerequisites (`gh` CLI for tracker writes under `to-spec`/`to-tickets`/`triage` if you choose the GitHub tracker, etc.).

## Install

From any project:

```bash
apm install -t claude,copilot rearc/ai-toolkit-private/packages/rearc-pocock-kit
```

> **Where this installs from.** The kit installs directly from this repo by subpath — no clone, no marketplace required (see [enterprise-private-host.md](../../enterprise-private-host.md)). Pin the kit ref for reproducibility: `apm install rearc/ai-toolkit-private/packages/rearc-pocock-kit#<tag-or-sha>` (note this pins the *kit*; the 19 upstream skill refs stay unpinned per ADR-0024 — see below). An enterprise fork swaps the `rearc/ai-toolkit-private` owner for its own. There is no `apm install rearc/pocock-kit` short form today (that needs a marketplace, deferred per [todo.md](../../todo.md) items 5/25).

> **Pick your targets.** On APM 0.18.0, `apm install` no longer fans out to every detected IDE — with more than one harness present it errors and asks you to choose. Pass `-t`/`--target` (as above, with the IDEs you run) or declare `targets:` in your `apm.yml`.

APM resolves the 19 upstream subpath references against `mattpocock/skills`, places the upstream content in `apm_modules/mattpocock/skills/`, and deploys each skill directory (SKILL.md + any companion files like `tdd/refactoring.md` or `setup-matt-pocock-skills/issue-tracker-github.md`) to the skill dirs for your chosen targets — `.claude/skills/` for Claude, `.agents/skills/` for Copilot (APM #1103).

You'll see APM print `[!] N dependencies unpinned: <list> -- add #tag or #sha to prevent drift` on install (it lists each unpinned dep and counts the local kit ref too). That's expected — the 19 refs are intentionally unpinned per [ADR-0024](../../ADR.md#adr-0024-rearcresearch-kit-upstream-deps-stay-unpinned-in-010-apm-0110-transitive-cleanup-on-uninstall-is-broken-under-pinning) because pinning breaks `apm uninstall` cleanup (re-validated against APM 0.20.0 on 2026-07-19 — still broken). See [NOTICE.md](NOTICE.md) for the pinning gate and update procedure.

### First action after install: run `setup-matt-pocock-skills`

`setup-matt-pocock-skills` is a **hard prerequisite** for `to-spec`, `to-tickets`, `code-review`, `triage`, and `wayfinder`. Without it, those skills don't know where to write specs/tickets, what triage labels to use, or where to find the project's domain docs.

It's a prompt-driven skill, not a deterministic script — APM doesn't run it at install time, and the kit doesn't auto-invoke it. The first time you sit down with the kit, ask your agent:

> "Run the `setup-matt-pocock-skills` skill against this repo."

The skill walks the user through the configuration interactively and writes its results into the repo (typically into `AGENTS.md` / `CLAUDE.md` and `docs/agents/`, depending on what the agent finds). After it runs once, the dependent skills can read the configuration and behave correctly. The standalone skills (`grill-me`, `grill-with-docs`, `prototype`, `writing-great-skills`) work without the bootstrap.

## Substrate posture

This kit is general-purpose and makes **no companion-substrate recommendation**. Pocock's flow includes both read-and-design-heavy work (`grilling`, `improve-codebase-architecture`) and write-heavy work (`to-spec`/`to-tickets` filing tracker items, `implement`/`tdd` editing code and tests, `diagnosing-bugs` running scripts) — there's no single Rearc safety posture that fits all of it. Pair the kit with whichever substrate matches the work you're actually doing, or with no substrate at all if you have your own permission posture.

## Two distribution paths for the same content

Pocock's skills are also installable directly via the upstream-recommended `npx skills add mattpocock/skills/<name>` (Vercel Labs' [`vercel-labs/skills`](https://github.com/vercel-labs/skills) CLI). That path fetches `SKILL.md` content from Pocock's repo's tip-of-main without an intermediary.

This kit is a parallel distribution path. Same upstream content, different properties:

| | This kit (`rearc/pocock-kit`) | `npx skills add mattpocock/skills/<name>` |
|---|---|---|
| **Bus** | APM | Vercel Labs `skills` CLI |
| **Curation** | 19 skills selected by Rearc | Per-skill or whole-repo, your choice at install time |
| **Composes with** | Other `rearc/*` APM kits, lockfile-tracked, `apm uninstall`-reversible | Whatever the consumer's IDE picks up |
| **Pinning** | Currently unpinned (gated on ADR-0024); will be pinned once APM's bug is fixed | Tip-of-main; updates are immediate |

If you're already using APM for other Rearc kits, this kit composes alongside them. If you're not, the upstream `npx skills` path is fine — you're not missing functionality, just the distribution properties listed above.

## What gets installed

The 19 skills above plus their companion files (e.g. `tdd/refactoring.md`, `setup-matt-pocock-skills/issue-tracker-github.md`, `diagnosing-bugs/scripts/hitl-loop.template.sh`). APM bundles each skill directory as a unit and deploys it to every IDE target you select.

| Source | Destination | Notes |
|---|---|---|
| `apm_modules/mattpocock/skills/skills/<category>/<skill>/SKILL.md` | `.claude/skills/<skill>/SKILL.md` (Claude), `.agents/skills/<skill>/SKILL.md` (Copilot, per APM #1103) | Per selected target |
| `apm_modules/mattpocock/skills/skills/<category>/<skill>/<companion>.md` | Same skill directory at each target | Travels with `SKILL.md` |
| `apm_modules/mattpocock/skills/LICENSE` | (not deployed) | Upstream MIT license preserved at the apm_modules layer |

## Uninstall

```bash
apm uninstall rearc/ai-toolkit-private/packages/rearc-pocock-kit
```

`apm uninstall` consults `apm.lock.yaml`'s `deployed_files` and removes only what was deployed by this kit. Repo-level state created by `setup-matt-pocock-skills` (entries in `AGENTS.md` / `CLAUDE.md`, files under `docs/agents/`) is your repo's content — uninstalling the tooling does not touch it. Remove those manually if you want them gone.

## Maintainer notes

### Layout

```
packages/rearc-pocock-kit/
├── apm.yml             # 19 per-skill subpath refs against mattpocock/skills, unpinned per ADR-0024
├── README.md           # this file
└── NOTICE.md           # upstream provenance, pinning gate, update procedure
```

The kit ships zero `.apm/` content. All deployed content comes from upstream via APM's transitive resolution; there's no Rearc-authored skill, agent, or instruction layered on top.

### Sandcastle is intentionally not bundled

Pocock also ships [`mattpocock/sandcastle`](https://github.com/mattpocock/sandcastle), a TypeScript orchestration library for parallel agent loops. It is not in scope for this kit per [ADR-0025](../../ADR.md#adr-0025-rearcpocock-kit-distributes-pococks-skills-via-apm-native-subpath-refs-skips-sandcastle-and-recommends-no-substrate) — Rearc's analogous concept is the `sbx` runtime layer (per [ADR-0021](../../ADR.md#adr-0021-apm-and-sbx-are-orthogonal-layers-sandbox-runtime-is-not-an-apm-package)), and the workshop framing benefits from showing both side-by-side rather than auto-bundling Pocock's answer. Consumers who want Sandcastle install it directly from npm.

### Pinning gate

The 19 refs are unpinned per [ADR-0024](../../ADR.md#adr-0024-rearcresearch-kit-upstream-deps-stay-unpinned-in-010-apm-0110-transitive-cleanup-on-uninstall-is-broken-under-pinning). When APM's resolver bug is fixed (re-validated still-broken on 0.20.0), pin every entry to a single SHA — see [NOTICE.md](NOTICE.md) for the recorded intent and the update procedure.

### Pre-publish checklist

This kit is **workshop-temporary** per [ADR-0025](../../ADR.md#adr-0025-rearcpocock-kit-distributes-pococks-skills-via-apm-native-subpath-refs-skips-sandcastle-and-recommends-no-substrate). It is not currently planned for publish. If publish becomes a goal, revisit before tagging:

- **Resolve the pinning gate** per ADR-0024 — either confirm APM has shipped the resolver fix and pin to specific SHAs, or pin and ship a sidecar `scripts/teardown.sh` consumers run alongside `apm uninstall` to remove the orphaned upstream skill deployments.
- Run the test harness against this kit's consumer fixture to verify install/uninstall and primitive deployment ([test/run_tests.sh](../../test/run_tests.sh)). Test 40 specifically covers the uninstall-cleanup contract that the pinning bug breaks; it will fail under pinning until the bug is fixed or the teardown sidecar is added.
- If publish becomes a long-term goal, communicate with Matt Pocock about the redistribution path so it doesn't surprise him.
