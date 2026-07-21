# Demo Branching Model

How this repo is branched for the Section 4 (Day 4) N2 live demo, and how to run,
restore, and update it. The model is **locked** — this doc describes it; it does not
redesign it.

## The model

```
main  ──────────●────────────●────────────────────────────●──────────▶  (living base)
                 \            (curated improvements land here)
                  \
   demo/day4-<date> ●────────●──────────────────────●─────────────▶  (throwaway, per run)
   (cut from main)   \        \                      ▲
                      \        \  Task 2 (HITL)      │ finale: review-then-integrate
                       \        ●───●───●────────────┤   sandbox-<name> INTO throwaway
                        \                            │
       Task 1 (autonomous, sbx clone-mode)          │
       clones off HEAD; commits return as ──────────┘
       branch  sandbox-<name>  (pull-not-push)
```

### `main` = the starting / ideal state (a **living base**)
- The demo **always re-runs from `main`.** `main` is the clean, fully-prepped starting
  state (Day-3 prep is merged in).
- `main` is **living, not immutable.** Throwaway branches never touch it, but curated
  improvements are **deliberately committed to `main`**: the ADR split, v1.1 kit wiring,
  and learnings from each dry run. That gives us both a clean **restore** point and a way
  to **improve the base over time**.

### Per-run throwaway branches: TWO streams

**Updated 2026-07-20.** A Day-4 run cuts **two independent throwaway branches** off `main`, one per demo
stream, so they cannot contaminate each other and each resets on its own:

```
main                                    (living base - NEVER touched)
|-- demo/day4-<date>-eightball          unattended stream (Docker sbx)
|   `-- sandbox-<name>                  sbx clone-mode returns commits here; NEVER merged -
|                                       switch to this branch to SHOW the work landed
`-- demo/day4-<date>-plant              supervised stream (the decomposed epic)
    `-- demo/day4-<date>-plant-<slice>  git worktree branch for a parallel ticket,
                                        merged back = the consolidation beat
```

Parallel tickets that touch the same files run in a **git worktree** (`git worktree add ../<dir> -b <branch>`),
not a container - match the isolation weight to the risk: a container for unattended work, a worktree for
supervised parallel work.

### Legacy single-branch form: `demo/day4-<date>`
- Cut fresh from `main` for each run (precedent: the existing `demo/7_14_run`).
- The agent and the presenter (HITL) experiment freely here.
- **Deleted after each run.** To restore, re-cut / hard-reset from `main`.

### Two-task topology (both branch off the throwaway branch)
- **Task 1 — autonomous**, runs in **sandbox clone-mode**: it clones off the throwaway
  branch's HEAD and runs isolated (Docker sandbox). Its commits come back as a
  `sandbox-<name>` branch — **pull-not-push** (the sandbox never pushes onto your working
  branch; you pull its branch when you're ready to look at it).
- **Task 2 — HITL**: the presenter drives an interactive iteration **directly on the
  throwaway branch**.
- Both run **at the same time** — one autonomous stream in the background, one interactive
  stream in the foreground.

### Finale: review-then-integrate
- Back in the HITL session, the agent first **reviews** the autonomous run's output
  (`sandbox-<name>`) as a read-only pass — the gate before accepting autonomous work.
- Then it **integrates** `sandbox-<name>` into the throwaway branch.
- **`main` is never touched** during a run. The whole run is discardable and re-runnable.
- Lesson the topology teaches: you can run autonomous + interactive work concurrently and
  bring them together without chaos — the payoff of isolation (sandbox + throwaway
  branches) plus a deliberate review-and-merge step.

> **Board mirror (parallel, implement after board access):** GitHub Projects don't branch
> natively, so the board equivalent is a **frozen reference board** tied to `main`'s task
> set plus a **duplicated working-copy board** per run that the agent edits; discard and
> re-duplicate to restore. Out of scope for this doc — noted so the repo and board stay in
> lockstep.

## Runbook

### Run a demo
```bash
# from a clean main
git -C /Users/admin/code/agentic_ide_demo_app switch main
git pull                                   # get the latest curated base
git switch -c demo/day4-$(date +%m_%d_run) # throwaway branch for this run
# Task 1: kick off the autonomous run in sbx clone-mode (clones off HEAD;
#         its commits return as branch  sandbox-<name>, pull-not-push).
# Task 2: drive the HITL task interactively on this throwaway branch.
# Finale: review sandbox-<name> (read-only), then merge it into the throwaway branch.
```

### Restore (between runs / after a botched run)
```bash
git switch main
git branch -D demo/day4-<date>             # delete the throwaway branch
git branch -D sandbox-<name>               # delete the returned sandbox branch, if pulled
# re-cut from main to start fresh (see "Run a demo")
```
`main` is untouched by any run, so restore is just "delete the throwaway branches and
re-cut."

### Update the base from a dry run
Dry runs are how we validate the flow and find improvements. When a dry run surfaces a
real base-state improvement (a fix, a better starting card, a cleaner ADR, kit wiring):
```bash
git switch main
# cherry-pick or re-apply just the curated improvement onto main
git add <the specific files>
git commit -m "Update: <the improvement> (from <date> dry run)"
git push
```
Curate deliberately — only durable improvements land on `main`. Throwaway
experimentation stays on the throwaway branch and is discarded.

## Invariants
- `main` is the single source of truth for the starting state; every run starts from it.
- Throwaway branches (`demo/day4-<date>`, `sandbox-<name>`) never merge into `main`.
- Only curated, reviewed improvements are committed to `main`.
- The autonomous sandbox is **pull-not-push**: it never writes onto your working branch.
</content>
</invoke>
