# Interacting with the demo project board (GitHub Projects)

> **Status: interim reference.** How an agent working in this repo reads and updates the Section-4
> (Day-4) demo's **GitHub Projects** board via the `gh` CLI. This is a candidate to become a
> `.claude/skills/board-interaction/` skill or to fold into the kit's `/to-tickets` primitive (TBD with
> the Pocock-kit rebuild). **Parameterize everything by project number + owner** - each demo run works a
> **per-run copy** of the golden board, so the project number changes every run.

## The board

- A **GitHub Projects (v2)** project owned by the presenter (e.g. `markdegroat`). Each run works a
  **copy** of the golden, so the **project number varies per run**. Find it: `gh project list --owner <owner>`.
- **NEVER write to the GOLDEN board.** `gh project list` returns **both** the per-run copy and the golden
  template (titled `... (GOLDEN)`). The golden is the source every future run is copied from, and it **must
  stay 100% draft issues** - adding a real issue to it corrupts `copy --drafts` for every run after.
  **Rules:** (1) if the project title contains `GOLDEN`, it is **read-only** - never add, convert, or edit;
  (2) if you were told a project number, use **only** that one; (3) if you were **not** told which board and
  more than one matches, **stop and ask** - do not guess. Guessing wrong is not recoverable by undo.
- The **golden** board's pre-seeded items are **draft issues** (no repo issue number) - that is what makes
  `gh project copy --drafts` able to duplicate them. **Items created live during a run are REAL GitHub
  issues**, because the engineering skills' tracker is GitHub Issues and `wayfinder`/`to-tickets` need
  native sub-issue + blocking relationships that drafts cannot carry.
- **When you publish a ticket, also set its board fields** - APM's auto-add puts the issue on the board but
  sets **no** custom fields. Set **Status** (`Backlog`, or `Ready` if unblocked), **Epic** (= the parent
  epic), and **Execution**.
- **`Execution` mirrors the triage label you already applied**: `ready-for-agent` -> `Agent`,
  `ready-for-human` -> `HITL`, and `Either` when it genuinely could go either way. Do not leave it blank.
  The label is the per-ticket signal; the field is the same signal lifted to a **board dimension** so it can
  be grouped and filtered across the whole backlog. Set it from the label, then let the human **override** -
  reassigning who works a slice is the PM's call, not yours.
- **Create child tickets as native sub-issues of the parent epic**, and wire blocking with native issue
  dependencies (see "Native issue relationships" below). Sub-issues auto-add to the board via the
  `Auto-add sub-issues to project` workflow, so adding the parent once pulls the whole tree in.
- **Status workflow:** Backlog -> Ready -> In Progress -> In Review -> Blocked -> Done.
- **Fields:** `Status`, `Type` (Epic/Story/Task/Bug), `Priority` (Urgent/High/Medium/Low),
  `Story Points` (number), `Epic` (single-select, one option per epic), `Execution` (Agent/HITL/Either -
  who works a story; mirrors the `ready-for-agent`/`ready-for-human` label, human overrides).

## Read the board

```bash
# ALWAYS pass --limit: the default page size is 30 and silently truncates.
gh project item-list <num> --owner <owner> --limit 200 --format json
# Discover field ids + single-select option ids before editing:
gh project field-list <num> --owner <owner> --format json
```

## Move a card / set a field

Field edits use the **item id** (`PVTI_...`, from `item-list[].id`) + the **project id** (`PVT_...`):

```bash
# single-select (Status, Type, Epic, Priority, Execution):
gh project item-edit --id <PVTI_item> --project-id <PVT_project> \
  --field-id <field_id> --single-select-option-id <option_id>
# number field (Story Points):
gh project item-edit --id <PVTI_item> --project-id <PVT_project> \
  --field-id <storypoints_field_id> --number 3
```

## Add a decomposed story to the board (the `/to-tickets` move)

```bash
gh project item-create <num> --owner <owner> --title "..." --body "..." --format json
# -> returns the new item id; then set Type/Status/Epic/Execution/Story Points via item-edit above.
```

## Edit a draft's title or body

Use the **content id** (`DI_...`, from `item-list[].content.id`), NOT the item `PVTI_` id:

```bash
gh project item-edit --id <DI_content> --title "..." --body "..."
```

## Native issue relationships (sub-issues + blocking)

`wayfinder` and `to-tickets` need these; a text "Blocked by #N" convention is NOT equivalent because it
does not render the frontier in GitHub's UI.

```bash
# link a child as a sub-issue of a parent (needs the CHILD's numeric database id)
CHILD_ID=$(gh api repos/<owner>/<repo>/issues/<child> --jq .id)
gh api --method POST repos/<owner>/<repo>/issues/<parent>/sub_issues -F sub_issue_id=$CHILD_ID

# declare a blocking edge (needs the BLOCKER's numeric database id, NOT #number or node_id)
BLOCKER_ID=$(gh api repos/<owner>/<repo>/issues/<blocker> --jq .id)
gh api --method POST repos/<owner>/<repo>/issues/<blocked>/dependencies/blocked_by -F issue_id=$BLOCKER_ID

# read the live gate: blocked_by counts OPEN blockers only (drops to 0 when they close)
gh api repos/<owner>/<repo>/issues/<n> --jq .issue_dependencies_summary
```

**Gotcha:** these endpoints take the issue's numeric **database id** (`--jq .id`), not the `#number` and
not the `node_id`. Using the wrong one fails confusingly.

## Converting a golden draft to a real issue

To grill/spec/implement against a pre-seeded golden epic, convert that draft on the **per-run copy** (never
the golden - it must stay all-drafts or `copy --drafts` breaks). Convert preserves all field values:

```bash
REPO_ID=$(gh repo view <org>/<repo> --json id -q .id)
gh api graphql -f query='mutation($i:ID!,$r:ID!){convertProjectV2DraftIssueItemToIssue(input:{itemId:$i,repositoryId:$r}){item{content{... on Issue{number url}}}}}' -f i=<PVTI_item> -f r="$REPO_ID"
```

- Convert **preserves all field values**. Converted issues are permanently deletable
  (`gh issue delete <n> --repo <org>/<repo> --yes`).
- `gh project link` will NOT link a **user-owned** project to an **org** repo ("different owner"), but
  convert takes the repo id directly, so no link is needed.

## Gotchas (quick reference)

- `item-list` default page size = **30** -> always pass `--limit`.
- Draft **title/body** edits need the `DI_` content id; **field** edits need the `PVTI_` item id.
- Creating/reconfiguring fields or the status/option sets is **not** exposed by `gh` - use the GraphQL
  `updateProjectV2Field` mutation. That is an authoring concern (building the golden), not a per-run one.
- **Views** (Board / Epic layouts) cannot be created via API - UI only - but `gh project copy` preserves
  them, so a per-run copy inherits the golden's views.
