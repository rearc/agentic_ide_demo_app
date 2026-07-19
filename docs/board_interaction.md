# Interacting with the demo project board (GitHub Projects)

> **Status: interim reference.** How an agent working in this repo reads and updates the Section-4
> (Day-4) demo's **GitHub Projects** board via the `gh` CLI. This is a candidate to become a
> `.claude/skills/board-interaction/` skill or to fold into the kit's `/to-tickets` primitive (TBD with
> the Pocock-kit rebuild). **Parameterize everything by project number + owner** - each demo run works a
> **per-run copy** of the golden board, so the project number changes every run.

## The board

- A **GitHub Projects (v2)** project owned by the presenter (e.g. `markdegroat`). Each run works a
  **copy** of the golden, so the **project number varies per run**. Find it: `gh project list --owner <owner>`.
- Items are **draft issues** by default (no repo issue number). The board fully functions on drafts; the
  demo default is to **stay on drafts** (reset = copy + delete, zero repo pollution).
- **Status workflow:** Backlog -> Ready -> In Progress -> In Review -> Blocked -> Done.
- **Fields:** `Status`, `Type` (Epic/Story/Task/Bug), `Priority` (Urgent/High/Medium/Low),
  `Story Points` (number), `Epic` (single-select, one option per epic), `Execution` (Agent/HITL/Either -
  the PM's label for who works a story).

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

## (Optional) real issue <-> PR linking

Default is to stay on drafts. If a run wants native `closes #N` linking, convert a draft to a real issue:

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
