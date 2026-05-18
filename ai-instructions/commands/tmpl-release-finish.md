# Command: /tmpl-release-finish [name]

Finalizes a release — reviews task completion, runs verification, generates
a summary, and marks it as done.

Read `../ai-plugins.json` for the current `mode` (BA-discovery
verbosity, used only if Step 2's "Finish now" branch fires) and
`approval_rate` (file-write gating) before starting. Same semantics
as `/tmpl-release-new`. If `approval_rate_overrides.finish_release` is set
and is not `"inherit"`, use it; otherwise use the global
`approval_rate`. The detailed approval-gating rules for this command
are in the **Approval Gating** section below.

---

## Step 0: Verify Plugin Manifest + Inherit Prerequisites

Two checks:

1. **Plugin manifest** — same as `/tmpl-release-new` Step 0. Halt if
   `../ai-plugins.json` is missing or has unresolved paths.
2. **Inherit `skipped_prereqs[]`** — read
   `configure.json.skipped_prereqs[]`. Map to behaviour the same
   way `/tmpl-release-new` Step 0 does:
   - `atlassian_mcp` skipped → Step 5 cannot close the Jira review
     ticket; skip that sub-step (record the skip in
     `configure.json.skipped[]`).
   - `github_mcp` skipped → Step 5 cannot update the linked PR /
     create the release notes via MCP; halt the integration
     sub-steps with a one-line note.
   - `ide_mcp` skipped → no in-IDE diagnostics during Step 3
     verification; CLI tools are the source of truth.
   - `editor_cli` skipped → review gates use chat-only output.

---

## Approval Gating

Every step that writes a file honors `approval_rate`. Four actions per
gate: **Approve / Edit / Skip / Abort**.

When a gate fires (per-category or per-file), use the staging +
editor-open workflow defined in `commands/tmpl-setup.md` Step 5
("How files are presented for review"): write proposed files to
`/tmp/claude-tmpl-release-finish-{run-id}/{relative-path}`, open them in
the user's editor as tabs, present the chat prompt, and move staged →
final on Approve.

- **`approval_rate: auto`** — write each file as soon as it is
  generated; no pause. (Steps 2's "Close anyway" status changes and
  Step 5's `status: done` marker still happen visibly — no silent
  state changes.)
- **`approval_rate: per-category`** — pause once per logical write
  group:
  - Step 4 — `summary.md`
  - Step 5 — `requirements.md` append (the `status: done` /
    `completed: {date}` marker)
- **`approval_rate: per-file`** — same as per-category (only two
  files written; per-file matches per-category here).

If Step 2's **"Finish now"** branch fires (user chose to implement
remaining subtasks before closing), that branch follows `/tmpl-release-new`
Step 6 gating — per-task in per-category, per-file in per-file.

**Mandatory gates regardless of `approval_rate`:**
- Step 2's task-completion review is always interactive — the user
  must explicitly choose Finish now / Close anyway / Cancel.
- Step 3's verification results are always shown before any
  status-change write happens. If tests fail, the user must
  explicitly accept finishing with failing tests.
- The `init` release **cannot be finished** by this command. If the
  user names `init`, refuse: "`init` is the project-summary release
  written by `/tmpl-setup`; it has no task list to verify and no
  meaningful status to set." (Mirrors `/tmpl-release-delete`'s `init`
  guard.)

**Skip handling.** When the user picks **Skip** for a gated write:
- Step 4 skipped → no `summary.md` written; tell the user the release
  is still marked unfinished and `/tmpl-release-finish` can be re-run
  later.
- Step 5 skipped → no `status: done` marker written; the release
  stays Active in `/tmpl-release-list`.
- Step 6a/6b/6c skipped → integration update suppressed; record in
  `configure.json.skipped[]` so the user can see at a glance which
  integrations weren't updated for which release.

Whenever the user picks Skip, append a stable identifier to
`configure.json.skipped[]` (format:
`tmpl-release-finish:{release-name}:{step-id}` — e.g.,
`tmpl-release-finish:checkout-flow:6a`) so re-runs and `/tmpl-analyze` can
see what was deferred. Same convention as `/tmpl-setup`'s
`skipped[]` tracking. Re-runs re-prompt unless the user
explicitly asks to keep it skipped.

---

## Step 1: Resolve Release Name

If a name was provided as argument, verify `releases/{name}/` exists.

If no name was provided, use the **most recently modified** release folder
(by file modification time). Present it for confirmation:

> The latest release is **{name}**. Finishing this one — correct?

If the user says no, list all releases and let them pick.

---

## Step 2: Review Task Completion

Read `releases/{name}/tasks.md`. Count checked vs unchecked subtasks.

Present the task status:

> ## Release: {name}
>
> | Task | Progress |
> |---|---|
> | 1. User authentication | 4/4 subtasks done |
> | 2. Session management | 3/5 subtasks done |
> | 3. Password reset | 0/3 subtasks done |
>
> **Overall: 7/12 subtasks complete (58%)**

If any subtasks are unchecked, ask:

> Some tasks are not complete. Options:
> 1. **Finish now** — implement the remaining subtasks before closing
> 2. **Close anyway** — mark as done with known gaps
> 3. **Cancel** — go back to working on it

If the user picks "Finish now", implement the remaining subtasks — check each
box in `tasks.md` as you go — then return to this step.

---

## Step 3: Verification

Run the project's verification suite:

1. Run linter / type checker if configured
2. Run unit tests
3. Run integration tests if available
4. Check for any TODO/FIXME comments related to this release

Report results:

> ## Verification
> - Linter: {pass/fail}
> - Type check: {pass/fail}
> - Tests: {X} passed, {Y} failed
> - TODOs found: {count}

If tests fail, ask whether to fix them before finishing.

---

## Step 4: Generate Release Summary

Create `releases/{name}/summary.md`:

    # Release Summary: {name}

    ## Date
    {current date}

    ## What was delivered
    {Bulleted list of completed tasks from tasks.md}

    ## Task completion
    {X}/{Y} subtasks completed

    ## Files changed
    {List of created/modified files}

    ## Known gaps
    {Any unchecked subtasks or unimplemented requirements, or "None"}

    ## Test coverage
    {Summary of test results}

---

## Step 5: Mark as Done

Check all remaining task boxes if they were completed in Step 2.

Append to `releases/{name}/requirements.md` (the marker format must
match the `^status: done$` regex on its own line that `/tmpl-release-list`
greps for — not the markdown-bold form):

    ---
    status: done
    completed: {date}

---

## Step 6: Integration updates (when integrations are live)

A finished release should not be invisible to the integrations
`/tmpl-setup` set up. Run the following sub-steps **only when the
matching integration is enabled** in `configure.json` (and not in
`skipped_prereqs[]`); skip silently otherwise. Each sub-step is an
**MCP-side-effect step** — gates regardless of `approval_rate`,
shows what will be sent before sending.

### 6a. Close the Tech Lead review ticket (`integrations.jira.enabled`)

Read `configure.json.integrations.jira.review_ticket`. When set,
present:

> About to add a `done` status comment to Jira ticket
> **{review_ticket}** with this body:
>
> {preview of the comment — release name, completed subtasks,
> tests pass/fail summary, link to the PR, link to
> `releases/{name}/summary.md`}
>
> Send and transition the ticket to **Done**? **yes** / **edit**
> (revise the comment) / **skip** (record in
> `configure.json.skipped[]` and continue) / **abort**.

On `yes`, post the comment via Atlassian MCP and transition the
ticket. Record the transition in
`configure.json.integrations.jira.review_ticket_status: "done"`.

### 6b. Update the Confluence Project Overview (`integrations.confluence.enabled`)

The Project Overview page (created in `/tmpl-setup` Step 5m) has a
"Releases" section. Append a one-row entry: release name, date,
short summary, link to PR. Preview the update, then `yes` /
`edit` / `skip` / `abort`. Atlassian MCP for remote mode;
re-render the local-docs HTML in place when
`local_fallback: true`.

### 6c. Update the linked PR (`integrations.github.enabled`)

When the release has an open PR (the user typically opens one after
`/tmpl-release-new` finishes; `/tmpl-release-new` itself ends at Step 7
Bootstrap Scripts and does not open a PR), post a comment marking the
release done with the same summary used in 6a. Use the GitHub MCP.
Preview, then `yes` / `edit` / `skip` / `abort`. Do **not** auto-merge
— that is the team's call.

---

## Step 7: Final summary

Present the final summary:

> Release **{name}** is finished.
> - {completed}/{total} subtasks delivered
> - {files changed} files changed
> - Tests: {pass/fail summary}
> - Summary saved to `releases/{name}/summary.md`
> - Jira ticket: {link} → done
> - Confluence Releases section updated: {link}
> - PR: {link} → comment posted

Omit any line whose integration was not run (skipped or disabled).
