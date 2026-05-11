# Command: /delete-release [name]

Deletes a release and optionally reverts its implementation.

`approval_rate` from `ai-plugins.json` is **read but does not change
this command's gating**. `/delete-release` is destructive end-to-end —
every step already requires explicit user confirmation regardless of
`approval_rate: auto`. Treat the per-step prompts in Steps 2–3 as
mandatory gates that fire universally. The detailed gating rules are
in the **Approval Gating** section below.

---

## Step 0: Verify Plugin Manifest + Inherit Prerequisites

Two checks before any destructive work:

1. **Plugin manifest** — verify `../ai-plugins.json` exists and
   every path resolves on disk. Same gate as `/new-release`,
   `/edit-release`, and `/finish-release` — destructive operations
   must not run against a broken instruction pack.

   - If `../ai-plugins.json` is missing, stop and tell the user:
     > `ai-plugins.json` is missing. Run `/bootstrap` first to generate it.
   - For each `enabled: true` entry in `plugins.roles`,
     `plugins.guides`, `plugins.guidelines`, `plugins.refactoring`,
     and every `commands[].path`, check the file exists.
   - If any path is missing, list them and ask the user whether
     to halt, run `/verify-plugins` to auto-fix, or proceed
     anyway. Default to halt — deleting against a stale manifest
     can mis-identify the files to revert.

2. **Inherit `skipped_prereqs[]`** — read
   `configure.json.skipped_prereqs[]`. The only prereq that
   matters here is `editor_cli` — when skipped, Step 3 Option 2's
   diff-tab review falls back to chat-only output. The destructive
   confirmation gate still fires.

Only proceed to Step 1 once the manifest is clean or the user
explicitly waives the check.

---

## Approval Gating

`/delete-release` is destructive. Unlike `/configure`, `/bootstrap`,
`/new-release`, `/edit-release`, and `/finish-release`, this command
**does not honor `approval_rate: auto`** — every prompt below fires
regardless of the setting. The user must explicitly confirm each
destructive choice.

**Mandatory gates (always fire, all `approval_rate` values):**

1. **Step 1 — `init` guard.** If the user names `init`, refuse with
   the standard message and exit. There is no override.
2. **Step 2 — Show Impact.** Always present the requirements summary,
   task progress, and affected file list. Always offer the three
   options (Delete requirements only / Delete + revert / Cancel) and
   wait for the user's pick.
3. **Step 3 Option 2 — Revert confirmation with editor diff
   tabs.** Before reverting any code, **open every affected file
   in the editor's diff view** so the user reviews real diffs,
   not chat-rendered text. Use the same editor-detection rules
   as `/configure` Step 5's "How files are presented for review"
   (env vars `TERM_PROGRAM` / `TERMINAL_EMULATOR` first, then
   `command -v`). Per-file commands:

   - **Files about to be reverted** (`git checkout` target) —
     `code --diff {path} <(git show HEAD:{path})`, or for editors
     without a process-substitution-friendly diff CLI, copy the
     pre-revert content to `/tmp/claude-delete-release-{run-id}/{path}`
     first and then `code --diff {staging-path} {path}`. The
     direction is "what's there now" → "what it'll become."
   - **Files about to be deleted** — `code -r {path}` so the user
     sees the file content before it's removed. Mark these in the
     prompt as "DELETE" rather than "DIFF" so the action is
     unmistakable.
   - **Files with uncommitted local edits** — surface as a
     separate warning **before** opening the diff: "`{path}` has
     uncommitted changes — reverting will discard them. Open
     anyway?" Only open after the user confirms.

   Group the openings into a single batch (one chat message
   listing every staged file with its planned action), then ask
   for **yes, revert** / **edit** (let the user manually back out
   files from the revert list) / **abort**. `code --diff` opens
   tabs in the existing window; chat-only fallback is allowed
   when no editor is detected, but the prompt must say so
   explicitly so the user knows they're reading text instead of
   tabs.
4. **Step 3 — Test failure handling.** After reverting, if the test
   suite fails, halt and ask the user before continuing — do not
   silently leave the project in a broken state.

**`approval_rate: per-file` adds no extra gates here** — file-level
prompts are already mandatory under `auto`. The setting is read for
consistency with the other commands but has no effect on this flow.

**Skip handling.** Any "Cancel" reply in Step 2 ends the run cleanly
without writing or deleting. Aborting at Step 3 mid-revert leaves the
project in whatever state the partial revert produced — surface the
exact state to the user (which files reverted, which didn't) so they
can finish manually with `git`.

---

## Step 1: Resolve Release Name

If a name was provided as argument, verify `releases/{name}/` exists.

If no name was provided:
1. List all existing releases in `releases/`
2. Present the list and ask which to delete

If the release does not exist, say so and list available releases.

The `init` release is reserved for `/configure`'s project summary
(`releases/init/project-summary.md`) and **cannot be deleted** by this
command. If the user names `init`, refuse with: "`init` is the
project-summary release written by `/configure` and is required by
`/bootstrap`. Re-run `/configure` if you need to regenerate it." Do not
offer override options — there is no safe one.

---

## Step 2: Show Impact

Read the release folder (`requirements.md`, `tasks.md`) and scan the codebase
for related changes:

> You are about to delete release **{name}**.
>
> Requirements: {brief summary}
> Tasks: {completed}/{total} subtasks
> Affected files: {list of files that were created or modified for this release}
>
> Options:
> 1. **Delete requirements only** — remove `releases/{name}/` but keep the code
> 2. **Delete requirements and revert code** — remove the folder and undo the
>    implementation
> 3. **Cancel** — do nothing

Wait for the user to choose.

---

## Step 3: Execute

### Option 1: Delete requirements only

Delete the `releases/{name}/` directory. Code remains untouched.

### Option 2: Delete requirements and revert code

1. Identify all files created or modified for this release.
2. **Stage diffs in editor tabs per the Approval Gating rule
   above** (this is the mandatory file-by-file review) and wait
   for explicit `yes, revert`.
3. Revert changes — delete created files, restore modified files
   from git history.
4. Delete the `releases/{name}/` directory.
5. Run tests to verify the revert did not break anything. If the
   suite fails, halt and surface the failure per the Approval
   Gating "Test failure handling" rule.
6. Clean up the staging directory at
   `/tmp/claude-delete-release-{run-id}/`.

### Option 3: Cancel

Do nothing.

---

## Step 4: Confirm

> Release **{name}** has been deleted. {summary of what was removed}
