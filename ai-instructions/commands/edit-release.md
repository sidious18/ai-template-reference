# Command: /edit-release [name]

Edits an existing release — updates requirements, adjusts tasks, and
re-implements changes.

Read `../ai-plugins.json` for the current `mode` (BA-discovery
verbosity) and `approval_rate` (file-write gating) before starting.
Same semantics as `/new-release`. If
`approval_rate_overrides.edit_release` is set and is not `"inherit"`,
use it; otherwise use the global `approval_rate`. The detailed
approval-gating rules for this command are in the **Approval Gating**
section below.

---

## Step 0: Verify Plugin Manifest + Inherit Prerequisites

Run the same Step 0 check as `/new-release`:

1. **Plugin manifest** — verify `../ai-plugins.json` exists and
   every path resolves. If missing or broken, halt and ask the
   user to run `/bootstrap` or `/verify-plugins`.
2. **Inherit `skipped_prereqs[]`** — read
   `configure.json.skipped_prereqs[]` and short-circuit any
   downstream path that depends on a missing prereq. The mapping
   is identical to `/new-release` Step 0:
   - `ide_mcp` skipped → no `mcp__ide__getDiagnostics` calls; CLI
     test/typecheck commands are the validation source of truth.
   - `atlassian_mcp` skipped → no Jira lookups for related-tickets
     context.
   - `github_mcp` skipped → no GitHub Issues/PR lookups.
   - `editor_cli` skipped → review gates fall back to chat-only
     output.

---

## Layout and Naming Rules

Any new or moved file created as part of the edit obeys:

- New or moved code lives inside the `path` of some entry in
  `ai-plugins.json.layout.modules[]`. Do not introduce a new module here;
  if the edit genuinely needs one, re-run `/configure` to declare it first.
- Lowercase-hyphen names only — no parentheses, brackets, spaces,
  underscores in directory names, or other punctuation.
- Independent modules (`independent: true`) stay independent — own manifest,
  own deps, no cross-module imports between them.

---

## Approval Gating

Every step that writes a file honors `approval_rate` (read from
`ai-plugins.json` at the top of this command). Four actions per gate:
**Approve / Edit / Skip / Abort**.

When a gate fires (per-category or per-file), use the staging +
editor-open workflow defined in `commands/configure.md` Step 5
("How files are presented for review"): write proposed files to
`/tmp/claude-edit-release-{run-id}/{relative-path}`, open them in
the user's editor as tabs (`code --diff` for modifications to
existing files; `code -r` for new files), present the chat prompt,
and move staged → final on Approve.

- **`approval_rate: auto`** — write each file as soon as it is
  generated; no pause.
- **`approval_rate: per-category`** — pause once per logical write group:
  - Step 4 — updated `requirements.md` (with the new changelog entry)
  - Step 5 — updated `tasks.md` (this gate is mandatory regardless;
    see below)
  - Step 6 — implementation, batched per affected task in `tasks.md`
- **`approval_rate: per-file`** — same as per-category, but Step 6
  implementation fires once per file rather than per task.

**Mandatory gates regardless of `approval_rate`:**
- The Step 5 task-list approval is always required before Step 6 — the
  user must confirm the diff between the old and new task list (new
  tasks added, changed tasks marked, removed tasks struck through)
  before any code is touched. This protects against silently
  rewriting work that was already merged.
- Any **destructive change to merged code** (deleting a file that was
  in a previous release's `summary.md`, replacing > 50 lines in a
  function, dropping a public-API symbol) always pauses with the diff
  visible — `approval_rate: auto` does not bypass this. The user
  must explicitly approve the destructive change.

**Skip handling.** When the user picks **Skip** for a gated batch:
- Step 4 skipped → halt; cannot edit a release without a recorded
  requirements diff.
- Step 5 skipped → halt; cannot implement without an approved task
  diff.
- Step 6 per-task or per-file skipped → mark the task `skipped` in
  `tasks.md` with a reason, continue with the rest. Surface the skip
  in the changelog at the bottom of `requirements.md`.

Whenever the user picks Skip on a sub-section or file, also append
a stable identifier to `configure.json.skipped[]` (format:
`edit-release:{release-name}:{step-id-or-relative-path}`) so re-runs
and `/analyze` can see what was deferred. Same convention as
`/configure`'s `skipped[]` tracking. Re-runs re-prompt the gate
unless the user explicitly asks to keep it skipped.

---

## Step 1: Resolve Release Name

If a name was provided as argument, verify `releases/{name}/` exists.

If no name was provided:
1. List all existing releases in `releases/`
2. Present the list:
   > Which release do you want to edit?
   > 1. init
   > 2. v1.1-auth
   > 3. v1.2-payments
3. Use the selected name

If the release does not exist, say so and suggest `/new-release` instead.

---

## Step 2: Read Current State

Read everything in `releases/{name}/`:
- `requirements.md` — current requirements
- `tasks.md` — current task list with progress

Present a brief summary:

> Here is what I have for **{name}**:
> - Goal: {summary}
> - Key features: {list}
> - Tasks: {completed}/{total} complete
>
> What do you want to change?

---

## Step 3: BA Discovery for Changes (mode-dependent)

Act as an experienced BA. Focus on understanding what changed and why.
Read `../ai-settings.md` for the mode.

### Auto mode (1-2 questions)

> What needs to change in this release?

Infer the full impact from the answer. Present updated requirements for approval.

### Semi-auto mode (3-6 questions)

Ask about the change and its impact:

1. "What needs to change?"
2. Based on the answer, ask 2-5 follow-ups:
   - "Does this change affect the existing user stories?"
   - "Are there new edge cases to handle?"
   - "Does this change the scope (add or remove features)?"
   - "Any new constraints or dependencies?"

Present the updated requirements for approval.

### Manual mode (8-15 questions)

Walk through each section of the existing requirements:

1. **Goal**: Has the goal changed?
2. **User stories**: Which stories are affected? Any new ones?
3. **Scope**: Has scope expanded or contracted?
4. **Technical notes**: Any new technical considerations?
5. **Constraints**: Any new constraints?

For each section, present current content and ask what changes.
Present the full updated requirements for approval.

---

## Step 4: Update Requirements

Update `releases/{name}/requirements.md` with the changes.

Add a changelog entry at the bottom:

    ## Changelog
    - {date}: {summary of changes}

---

## Step 5: Update Task List

Update `releases/{name}/tasks.md` to reflect the requirement changes:

- **New requirements** → add new tasks and subtasks
- **Changed requirements** → update affected tasks, uncheck subtasks that need rework
- **Removed requirements** → strike through or remove tasks (mark removed tasks
  with `~~strikethrough~~` so the history is visible)
- **Unchanged tasks** → leave as-is, preserve checkbox state

Present the updated task list for approval.

---

## Step 6: Implement Changes

After the user approves the updated tasks, proceed with implementation.

1. Work through new and updated tasks in `tasks.md`
2. Check subtask boxes as you complete them
3. Only modify code affected by the changes — do not rewrite unrelated code
4. Follow the task protocol from AI_INSTRUCTIONS.md
5. Run tests to verify changes do not break existing functionality
