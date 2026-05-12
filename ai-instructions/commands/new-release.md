# Command: /new-release [name]

Creates a new release, gathers requirements as an experienced BA, breaks them
into tasks, then implements the feature.

Read `../ai-plugins.json` for the current `mode` (controls BA-discovery
verbosity) and `approval_rate` (controls how often to pause for the
user to approve generated files) before starting. Both are set during
`/configure` Step 2 and `/bootstrap` Step 0 — see those files for
semantics. If `approval_rate_overrides.new_release` is set and is not
`"inherit"`, use it; otherwise use the global `approval_rate`. The
detailed approval-gating rules for this command are in the **Approval
Gating** section below.

---

## Step 0: Verify Plugin Manifest + Inherit Prerequisites

Two checks before any work:

1. **Plugin manifest** — verify `../ai-plugins.json` exists and
   every path it references resolves on disk. This is the
   template's equivalent of `npm install --dry-run` — a fast guard
   against editing against a broken instruction pack.

   - If `../ai-plugins.json` is missing, stop and tell the user:
     > `ai-plugins.json` is missing. Run `/bootstrap` first to generate it.
   - For each `enabled: true` entry in `plugins.roles`,
     `plugins.guides`, `plugins.guidelines`, `plugins.refactoring`,
     and every `commands[].path`, check the file exists. Also
     verify every module declared in `layout.modules[]` — its
     `path` should exist (or be planned for this release on a
     greenfield project), and its `manifest` (when declared)
     should resolve.
   - If any path is missing, list them and ask the user whether
     to halt, run `/verify-plugins` to auto-fix, or proceed anyway.

2. **Inherit `skipped_prereqs[]`** — read
   `configure.json.skipped_prereqs[]` (set by `/configure` Step 0
   when the user declined an optional prerequisite). Implementation
   in Step 6 reads this and short-circuits paths that depend on
   the missing prereq:

   - `ide_mcp` skipped → do not call `mcp__ide__getDiagnostics`
     during validation; fall back to running the project's CLI
     test/typecheck commands directly. Do not call
     `mcp__ide__executeCode` from any guide.
   - `atlassian_mcp` skipped → no Jira ticket lookups for context;
     pull related-tickets context from `releases/init/` and
     `requirements/` instead.
   - `github_mcp` skipped → no GitHub Issues lookups for related
     work; fall back to the local commit/branch state.
   - `editor_cli` skipped → Step 5's task-list approval gate uses
     chat-only fallback (no editor-tab review).

Only proceed to Step 1 once the manifest is clean or the user
explicitly waives the check.

---

## Layout and Naming Rules (apply to every file created in this release)

- New source code lives **only inside paths declared in
  `ai-plugins.json.layout.modules[]`** — the manifest is the source of truth
  for what modules this project has. Do not invent modules; if the change
  genuinely needs a new module, halt and ask the user to re-run `/configure`
  to declare it.
- Folder and file names use lowercase letters, digits, and hyphens only. No
  parentheses, brackets, spaces, ampersands, or other punctuation.
- Independent modules (entries with `independent: true`, the default) keep
  their own manifests and test commands. Cross-module imports between
  independent modules are forbidden — communicate over an explicit boundary
  (HTTP / RPC / message bus / file artifacts), not `import`.

---

## Approval Gating

Every step that writes a file honors `approval_rate` (read from
`ai-plugins.json` at the top of this command). Four actions per gate:
**Approve / Edit / Skip / Abort**.

When a gate fires (per-category or per-file), use the staging +
editor-open workflow defined in `commands/configure.md` Step 5
("How files are presented for review"): write the proposed file(s)
to `/tmp/claude-new-release-{run-id}/{relative-path}`, open them in
the user's editor (`code` → `cursor` → `idea` → fallback-to-chat),
present the chat prompt, and move staged → final on Approve.

- **`approval_rate: auto`** — write each file as soon as it is
  generated; no pause.
- **`approval_rate: per-category`** — pause once per logical write
  group:
  - Step 4 — `requirements.md`
  - Step 5 — `tasks.md` (this gate is mandatory regardless of
    `approval_rate`; see below)
  - Step 6 — implementation, batched per task in `tasks.md` (one gate
    per task, ~5–15 gates depending on task count)
  - Step 7 *(first release only)* — `setup.sh` + `run.sh` + the
    README.md Setup-section update, presented as one batch
- **`approval_rate: per-file`** — same as per-category, but the Step 6
  implementation gate fires once per file rather than per task. Plus
  one gate per file in Step 7's batch.

**Mandatory gates that fire regardless of `approval_rate`:**
- The Step 5 task-list approval is always required before Step 6
  begins. `/new-release` is the project's task-protocol checkpoint —
  the user reviews the task list before code starts.
- Any destructive change to existing files (e.g., overwriting a
  hand-edited section in `setup.sh` from a prior run) always pauses
  with the diff visible.

**Skip handling.** When the user picks **Skip** for a gated batch:
- Step 4 skipped → halt; the release has no requirements record.
- Step 5 skipped → halt; cannot implement without an approved task list.
- Step 6 skipped (per-task) → mark the task as `skipped` in
  `tasks.md`, continue with the rest. Record skipped tasks in the
  release summary so `/finish-release` knows.
- Step 7 skipped (first release only) → leave the README's Setup
  placeholder in place; tell the user they can re-run `/new-release`
  Step 7 manually or hand-edit `setup.sh` / `run.sh` later.

Re-runs of `/new-release` against an existing release with skipped
gates re-prompt — the abort isn't recorded as a permanent decision.

---

## Step 1: Resolve Release Name

The `init` release (`releases/init/`) is reserved — it holds
`project-summary.md` written by `/configure` Step 5a and is read-only
context for every subsequent release. Reject `init` as a release name
(say so explicitly: "`init` is reserved for `/configure`'s project
summary; pick a different name") and treat it as historical context
when scanning `releases/` in Step 2.

If a name was provided as argument, **normalize it**: lowercase the string,
replace every run of non-alphanumeric characters with a single hyphen, and
trim leading/trailing hyphens. Tell the user if the normalization changed the
name before creating the folder.

If no name was provided:
1. Read existing releases in `releases/` to understand context
2. Suggest a name based on what the user described (or ask what they want to build)
3. Present the suggestion:
   > I suggest naming this release `{suggested-name}`. Does that work, or would
   > you prefer a different name?
4. Use the confirmed name (normalize it the same way)

Create the directory `releases/{name}/`. The normalized name must match
`^[a-z0-9]+(-[a-z0-9]+)*$` before the directory is created.

---

## Step 2: Gather Context

Before asking questions, silently gather context:

1. Read all existing releases in `releases/` to understand the project history
2. Read the current CLAUDE.md for project context
3. Read ai-settings.md to understand the active tech stack
4. Scan the codebase for relevant existing code

---

## Step 3: BA Discovery (mode-dependent)

Act as an experienced Business Analyst. Your goal is to produce clear, complete,
actionable requirements for this release. Read `../ai-settings.md` for the mode.

### Auto mode (0-3 questions)

Ask only the essential question:

> What should this release accomplish?

If the user gave a description with the command, you may have enough. Ask 1-2
clarifying questions only if the scope is genuinely ambiguous:

- "Should this include {X} or is that a separate release?"
- "Any specific constraints I should know about (deadline, compatibility, etc.)?"

Then infer:
- User stories and acceptance criteria
- Affected components and files
- Edge cases and error handling
- Dependencies on existing code

Present the inferred requirements for approval before proceeding.

### Semi-auto mode (5-10 questions)

Start with the goal, then ask targeted questions:

1. "What is the goal of this release? What problem does it solve?"
2. Based on the answer, ask 4-9 follow-up questions. Pick from:
   - "Who are the users of this feature?"
   - "What are the key user stories? Walk me through the main flow."
   - "What should happen when {edge case}?"
   - "Are there any constraints (performance, security, compliance)?"
   - "Does this depend on or affect any existing features?"
   - "What does success look like? How will you know this works?"
   - "Are there any out-of-scope items I should be aware of?"

Group related questions — do not ask one at a time. After the user answers,
present the complete requirements for approval.

### Manual mode (10-20+ questions)

Walk through a full BA discovery session:

**1. Vision and scope** (2-3 questions)
- What is this release about? What problem does it solve?
- Who are the target users?
- What is explicitly out of scope?

**2. User stories** (3-5 questions)
- Walk me through the primary user flow step by step
- Are there alternative flows or paths?
- What happens on error or failure?
- What edge cases should we handle?

**3. Acceptance criteria** (2-3 questions)
- How will you verify this works?
- What are the must-have vs nice-to-have aspects?
- Any specific performance or quality requirements?

**4. Technical considerations** (2-4 questions)
- Which parts of the system does this affect?
- Any data model changes needed?
- Any new API endpoints or changes to existing ones?
- Any third-party integrations?

**5. Dependencies and risks** (1-3 questions)
- Does this depend on anything not yet built?
- Any known risks or unknowns?
- Timeline or deadline constraints?

Present each group, wait for answers, then move to the next. At the end,
present the full requirements for approval.

---

## Step 4: Save Requirements

Save the gathered requirements to `releases/{name}/requirements.md`.

Write it as a structured document:

    # Release: {name}

    ## Goal
    {1-2 sentence summary}

    ## User Stories
    {Numbered list of user stories with acceptance criteria}

    ## Scope
    ### In scope
    {What this release includes}

    ### Out of scope
    {What this release does not include}

    ## Technical Notes
    {Affected components, data changes, API changes}

    ## Constraints
    {Performance, security, timeline, compatibility}

---

## Step 5: Generate Task List

Break the requirements into concrete tasks and subtasks. Save to
`releases/{name}/tasks.md`.

Derive tasks from the requirements — each user story or technical requirement
becomes one or more tasks. Each task has subtasks that represent implementable
units of work.

    # Tasks: {name}

    ## 1. {Task title — derived from a requirement}
    - [ ] {Subtask — a single implementable unit}
    - [ ] {Subtask}
    - [ ] {Subtask}

    ## 2. {Task title}
    - [ ] {Subtask}
    - [ ] {Subtask}

    ## 3. {Task title}
    - [ ] {Subtask}
    - [ ] {Subtask}

Rules for task decomposition:
- Each task maps to a requirement or user story
- Subtasks are small enough to implement in one step (one file change, one
  function, one test)
- Include explicit subtasks for: schema/type changes, implementation,
  tests, and integration
- Order tasks by dependency — tasks that others depend on come first
- Mark optional/nice-to-have tasks with `(optional)` in the title

Present the task list to the user for approval before proceeding.

---

## Step 6: Implement

After the user approves the task list, proceed with implementation.

Work through `tasks.md` top to bottom. For each subtask:

1. Implement the change
2. Check the subtask box in `tasks.md`: `- [ ]` → `- [x]`
3. Move to the next subtask

Follow the task protocol from AI_INSTRUCTIONS.md:
- Read the relevant guides for the project's tech stack
- Activate the appropriate role (Backend Developer, Frontend Developer, etc.)
- Explore the codebase and identify affected files
- Implement per file
- Run tests
- Self-check

Implementation must follow all active rules in ai-settings.md AND the layout
and naming rules at the top of this file:

- Every new file lands under a `path` declared in
  `ai-plugins.json.layout.modules[]`. Do not invent a new module here;
  if the change genuinely needs one, halt and ask the user to re-run
  `/configure` to declare it first.
- Every new folder or file name uses lowercase-hyphen only.
- Never add dependencies to the wrong module's manifest. For modules with
  `independent: true`, dependencies stay in that module's own manifest.

Update `tasks.md` as you go — it is the live progress tracker for this release.

---

## Step 7: Bootstrap Scripts (first release only)

Trigger this step when this release is the first one that produces code —
i.e., neither `setup.sh` nor `run.sh` exists at the project root. On every
subsequent release, skip Step 7.

Create two executable shell scripts at the project root:

1. **`setup.sh`** — one-time (and re-runnable) setup. Iterate over every
   module in `ai-plugins.json.layout.modules[]` that has a `manifest` and
   install its dependencies using the manifest's idiomatic command
   (`pip install`, `poetry install`, `npm install`, `go mod download`,
   `cargo fetch`, `terraform init`, `mvn install`, etc.). Then:
   - Generate `.env` from `.env.example` if missing (when applicable)
   - Run database migrations and seed data if any module needs it
   - Run any IaC initialisation (e.g., `terraform init`) per declared module
   - Must be idempotent — re-running must not break a working setup
2. **`run.sh`** — start the dev environment. Iterate over every module
   with `kind` in {`server`, `client`, `mobile`, `cli`, `data`, `docs`}
   that has a runnable dev command, and start them (concurrently if more
   than one). Use each module's idiomatic dev command (`uvicorn`,
   `npm run dev`, `go run`, `cargo run`, `mkdocs serve`, etc.).
   - Forward `Ctrl+C` to child processes cleanly
   - For projects with no runnable module (pure library, IaC-only, docs
     repo where dev preview lives elsewhere), `run.sh` either runs the
     verification suite or prints a one-line note explaining the project
     has no dev server

Both scripts must:
- Start with `#!/usr/bin/env bash` and `set -euo pipefail`
- Be marked executable (`chmod +x setup.sh run.sh`)
- Match the stack declared in `ai-plugins.json` — do not hardcode tools the
  project doesn't use
- Fail with a clear message if a prerequisite binary is missing (node,
  python, docker, etc.)

Reference `setup.sh` and `run.sh` from `CLAUDE.md` under the Development
section (they replace `{SETUP_COMMAND}` and `{DEV_COMMAND}`).

### Offer to run them — gates as a side-effect step

Running `./setup.sh` and `./run.sh` actually executes shell. Treat
this offer as a **side-effect step**: gate it regardless of
`approval_rate`, the same way MCP-side-effect steps gate in
`/configure`.

Show the user what's about to run **before** offering to run it:

> I created `setup.sh` and `run.sh` at the project root. About to
> offer to run `./setup.sh` for you. Quick preview of what that
> will do:
>
>   - Install dependencies via {detected package managers}
>   - Run database migrations: {commands from setup.sh}
>   - Generate `.env` from `.env.example` (if missing)
>   - {any other concrete actions extracted from setup.sh}
>
> Run `./setup.sh` now? **yes** (run + surface output),
> **show** (open `setup.sh` in your editor for review first),
> **no** (skip — you can run it manually later).

On `show`, open `setup.sh` in the editor following the same
detection rules as `/configure` Step 5's "How files are presented
for review" (env vars first, PATH probe, chat-only fallback). After
the user has reviewed, re-prompt with **yes** / **no**.

On `yes`, run `./setup.sh` and surface its output. When it
finishes successfully, offer `run.sh` the same way (preview →
yes/show/no):

> Setup finished. Preview of `./run.sh`: {extracted commands}.
> Start the dev servers? **yes** / **show** / **no**.

If the user declines either offer, tell them they can run the
scripts manually later and move on.

When `setup.sh` exits non-zero, do **not** auto-proceed to
`run.sh` — surface the error and ask whether to investigate, retry
setup, or skip. A failed setup with a successful run is a worse
state than no run at all.

### Update README.md Setup section

`/configure` Step 5a wrote a placeholder Setup section in `README.md` at
the project root with this exact text (unchanged from the template):

    ## Setup
    Placeholder until `/new-release` writes `setup.sh` + `run.sh`:

        # After /new-release runs for the first time:
        ./setup.sh
        ./run.sh

    Do not invent commands here — `setup.sh` and `run.sh` are the
    project's only supported entry points (per CLAUDE.md). When those
    scripts exist, `/new-release` (Step 7 of `commands/new-release.md`)
    will replace this section with the real first-run instructions.

Now that `setup.sh` and `run.sh` exist, replace the entire Setup section
(from the `## Setup` heading up to the next `##` heading) with concrete
first-run instructions:

    ## Setup

    ```bash
    git clone {repo URL}
    cd {project name}
    ./setup.sh   # installs dependencies, runs migrations, generates .env
    ./run.sh     # starts {backend} + {frontend} dev servers
    ```

    Prerequisites: {detected from stack — e.g., "Node 20+, Python 3.11+,
    Docker"}. Set values in `.env` before running `./run.sh` (see
    `.env.example` for the full list).

Substitute `{repo URL}`, `{project name}`, the dev-server names, and the
prerequisite list from `ai-plugins.json` `stack.*` and the actual
`setup.sh` contents. Do **not** touch any other section of README.md
(the bootstrap-owned block between the `<!-- /bootstrap appends ... -->`
markers belongs to `/bootstrap`, and everything else belongs to
`/configure`).

This sub-step is a no-op on releases after the first — `setup.sh` and
`run.sh` already exist, the README Setup section is already concrete,
and Step 7 was skipped at the top.
