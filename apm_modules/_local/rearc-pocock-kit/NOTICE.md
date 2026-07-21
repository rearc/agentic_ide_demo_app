# NOTICE — upstream provenance

This package distributes a curated subset of Matt Pocock's publicly-shipped skills via APM-native per-skill subpath references.

- **Source repo:** https://github.com/mattpocock/skills
- **License:** MIT (preserved verbatim by APM at `apm_modules/mattpocock/skills/LICENSE` after `apm install`)

The 19 skills are declared in [`apm.yml`](apm.yml)'s `dependencies.apm:` block at per-skill granularity per [ADR-0015](../../ADR.md#adr-0015-upstream-skills-are-declared-at-per-skill-subpath-granularity-not-whole-collection). APM resolves each reference, places the upstream content in `apm_modules/mattpocock/skills/`, and deploys each skill directory (SKILL.md + companion files) to each selected IDE target (`.claude/skills/` for Claude, `.agents/skills/` for Copilot per APM #1103). As of APM 0.18.0, targets are chosen explicitly via `-t`/`--target` or `targets:` rather than auto-fanned-out.

This set tracks Pocock's **v1.1** release (see [ADR-0039](../../ADR.md#adr-0039-rearcpocock-kit-tracks-pococks-v11-release-18-skill-transitively-complete-curation)). Several v1.1 skills are thin shims over new sibling skills (`grill-me` -> `grilling`; `grill-with-docs` -> `grilling` + `domain-modeling`; `implement` -> `tdd` + `code-review`; `wayfinder` -> `research` + `prototype` + `grilling` + `domain-modeling`), so the building-block skills are vendored alongside them — the curation is **transitively complete**: every bundled skill's `/reference` resolves to a bundled sibling.

## Pinning gate

The 19 refs are **intentionally unpinned** per [ADR-0024](../../ADR.md#adr-0024-rearcresearch-kit-upstream-deps-stay-unpinned-in-010-apm-0110-transitive-cleanup-on-uninstall-is-broken-under-pinning) — pinning a transitive dep breaks `apm uninstall`'s cleanup (the pinned lockfile entry omits `resolved_by`/`depth`, so the orphan-detector can't prune it). Same posture `rearc/research-kit` took. **Re-validated against APM 0.20.0** (2026-07-19): the bug still reproduces — a pinned uninstall left `apm_modules/mattpocock/` orphaned (removed only the local kit ref), while the unpinned uninstall cleaned the full tree.

When the upstream APM bug is fixed, pin every subpath to a single SHA so the workshop demo gets deterministic content. The current verified tip is:

```
9603c1cc8118d08bc1b3bf34cf714f62178dea3b
```

That SHA was the tip of `mattpocock/skills` `main` on 2026-07-19 and carries all 19 skills at the paths declared in `apm.yml` (verified by resolving + deploying each `SKILL.md` at that SHA). The earlier intent SHA `6eeb81b…` (tip on 2026-06-22) is now stale: it predates upstream's v1.1 reshape — the renames of `to-prd` to `to-spec` and `to-issues` to `to-tickets`, and the additions of `wayfinder`, `research`, `implement`, `code-review`, `grilling`, `domain-modeling`, and `codebase-design` — so it no longer resolves the declared paths. The actual pin used at workshop delivery time should reflect whatever content review surfaces between now and then. Bump deliberately; do not auto-track upstream once pinned.

## Vendored skills (19)

Grouped by role in the v1.1 flow (order matches `apm.yml`):

| Skill | Upstream path | Role |
|---|---|---|
| `wayfinder` | `mattpocock/skills/skills/engineering/wayfinder` | v1.1 arc — session-spanning planning |
| `research` | `mattpocock/skills/skills/engineering/research` | v1.1 arc — background primary-source investigation |
| `grilling` | `mattpocock/skills/skills/productivity/grilling` | v1.1 arc — the relentless interview (building block) |
| `to-spec` | `mattpocock/skills/skills/engineering/to-spec` | v1.1 arc — conversation -> spec (was `to-prd`) |
| `to-tickets` | `mattpocock/skills/skills/engineering/to-tickets` | v1.1 arc — spec -> tracer-bullet tickets (was `to-issues`) |
| `implement` | `mattpocock/skills/skills/engineering/implement` | v1.1 arc — build a ticket (calls `tdd`, `code-review`) |
| `tdd` | `mattpocock/skills/skills/engineering/tdd` | v1.1 arc — red/green reference |
| `code-review` | `mattpocock/skills/skills/engineering/code-review` | v1.1 arc — two-axis (standards + spec) review |
| `prototype` | `mattpocock/skills/skills/engineering/prototype` | v1.1 arc — throwaway artifact to answer a design question |
| `setup-matt-pocock-skills` | `mattpocock/skills/skills/engineering/setup-matt-pocock-skills` | bootstrap — hard prereq for the tracker-writing skills |
| `domain-modeling` | `mattpocock/skills/skills/engineering/domain-modeling` | shared vocab — ubiquitous language + ADRs (building block) |
| `codebase-design` | `mattpocock/skills/skills/engineering/codebase-design` | shared vocab — deep-module design (building block) |
| `grill-me` | `mattpocock/skills/skills/productivity/grill-me` | alias — `grilling` |
| `grill-with-docs` | `mattpocock/skills/skills/engineering/grill-with-docs` | alias — `grilling` + `domain-modeling` |
| `improve-codebase-architecture` | `mattpocock/skills/skills/engineering/improve-codebase-architecture` | utility — deepening-opportunity scan |
| `triage` | `mattpocock/skills/skills/engineering/triage` | utility — issue triage state machine |
| `diagnosing-bugs` | `mattpocock/skills/skills/engineering/diagnosing-bugs` | utility — hard-bug diagnosis loop |
| `resolving-merge-conflicts` | `mattpocock/skills/skills/engineering/resolving-merge-conflicts` | utility — resolve an in-progress merge/rebase conflict |
| `writing-great-skills` | `mattpocock/skills/skills/productivity/writing-great-skills` | meta — authoring/editing skills |

## Skills deliberately NOT included

- **`ask-matt`** (`skills/engineering/ask-matt/`) — a Pocock-personal Q&A skill. (`resolving-merge-conflicts` was initially excluded as a narrow git utility, but was **added in** once dry runs showed parallel worktree/sandbox streams produce real merge conflicts the consolidation step must resolve.)
- **`handoff`** and **`teach`** (`skills/productivity/`) — session-handoff and tutoring utilities, out of scope for this workflow kit.
- **Other setup / hygiene skills** at `skills/misc/setup-pre-commit/` and `skills/misc/git-guardrails-claude-code/` — out of scope for this kit's selection.
- **Personal-project skills** at `skills/misc/migrate-to-shoehorn/`, `skills/misc/scaffold-exercises/`, `skills/personal/edit-article/`, `skills/personal/obsidian-vault/` — Pocock-project-specific.
- **Anything under `skills/deprecated/`** — preserved upstream for historical reference but not active (includes the old `ubiquitous-language` skill, now succeeded by `domain-modeling` + `grill-with-docs`).
- **Anything under `skills/in-progress/`** — explicitly upstream-WIP per its directory name.

## Update procedure (post-pin)

Once the ADR-0024 pinning gate clears (upstream APM uninstall bug fixed) and the deps are pinned:

1. Choose a target commit on `mattpocock/skills` `main`. Diff against the current pinned SHA before bumping.
2. Verify each of the 19 skills still exists at the same upstream path, and that the shim/building-block references still resolve (`grill-me`/`grill-with-docs`/`implement`/`wayfinder` invoke siblings — a rename there can silently break a shim). Pocock's skill set has had renames and reshapes (the v1.1 reshape is the latest; see Appendix A of `pocock_primitives.md` in the prompt-engineering knowledge base).
3. Bump the SHA on every entry in `apm.yml` (and the example pin above).
4. Run the harness — Phase 6 (Tests 37–40) verifies all 19 skills resolve, deploy, and uninstall cleanly.
5. Commit with a message that names the upstream commit range diffed.

While the pinning gate is open: bumps are immediate (every `apm install` re-resolves to upstream tip-of-main). The drift risk is real — Pocock has renamed skills before and may again. Mitigation is the harness, which surfaces missing skills via Test 38, and the workshop's content review window.

## Parallel distribution paths

Pocock's skills are also installable directly via the upstream-recommended `npx skills add mattpocock/skills/<name>` (Vercel Labs' [`vercel-labs/skills`](https://github.com/vercel-labs/skills) CLI). This kit is a parallel bus to that path — same content, different distribution properties (lockfile-tracked, reversible via `apm uninstall`, composes alongside other Rearc APM packages). See the kit's [README](README.md) for the consumer-facing version of this framing.
