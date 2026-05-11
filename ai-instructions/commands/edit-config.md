# Command: /edit-config [free-form description]

Adjusts an already-bootstrapped project's configuration. Lets the user change
modules, team roles, stack, modes, integrations, and any other field in
`configure.json` / `ai-plugins.json` — through a **conversation**, not a
fixed-form questionnaire.

This command is the lightweight counterpart to `/configure` (which is the
first-time, full-discovery setup). It exists so that long-lived projects can
evolve — add a new module mid-project, swap a stack, hire an SRE, change
discovery mode — without re-running the full setup.

Manual editing of `ai-settings.md` and `ai-plugins.json` by hand is **also
supported and unchanged**. Use this command when you want the AI to surface
drift / recommendations / consequences before you edit; use a text editor
when you know exactly what you want.

If the user supplied a free-form description as an argument
(`/edit-config rename frontend module to web-ui`,
`/edit-config add a Mobile Developer role`,
`/edit-config switch backend from Python to Go`), use that as the starting
intent and skip Step 2's "what would you like to change?" prompt.

---

## Step 0: Verify Plugin Manifest + Inherit Prerequisites

Two checks before any work:

1. **Plugin manifest** — read `../ai-plugins.json` and confirm every
   declared path resolves. If the manifest is missing or broken,
   halt and tell the user to run `/bootstrap` (or `/verify-plugins`
   to auto-fix). Do not edit a project whose manifest is already
   drifted — fix that first.
2. **Inherited prerequisites** — read
   `configure.json.prereqs` and `configure.json.skipped_prereqs[]`.
   These were captured by the most recent `/configure` Step 0 run.
   Do **not** re-probe every prereq blindly — that's `/configure`'s
   job. But surface the inheritance so the user knows which
   integrations are off-limits for this run:

   > Inherited from `/configure`: GitHub MCP **ok**, Atlassian MCP
   > **skipped (local-docs mode)**, IDE MCP **ok**, editor CLI
   > **vscode**.

   Step 3a re-probes only the specific MCP an intended change
   touches (e.g., re-enabling Jira fires the Atlassian probe).

---

## Step 1: Survey Current State

Silently load the current state from disk:

- `ai-instructions/configure.json` — decisions of record
- `ai-plugins.json` — active plugin manifest
- `ai-settings.md` — human-facing toggles
- `ai-instructions/releases/` — release history (for context only; do not edit)

Then scan the repo for **drift signals** — things that suggest a config
change is overdue:

1. **Undeclared directories.** Walk the repo (excluding `.git/`,
   `node_modules/`, `__pycache__/`, `.venv/`, instruction-pack files, etc.)
   and find any source directory not listed in `layout.modules[]` or
   `layout.exceptions[]`. Each such directory is a candidate new module.
2. **Stale enabled plugins.** Any `enabled: true` entry in `plugins.*`
   whose `path` no longer resolves on disk.
3. **Settings drift.** Any `[x]`-checked item in `ai-settings.md` whose
   matching `ai-plugins.json` entry is `enabled: false` (or vice versa).
4. **Stale stack signals.** A `manifest` file (e.g., `pyproject.toml`,
   `package.json`) whose declared deps no longer match `stack.*`.
5. **Empty / zero-use modules.** A `layout.modules[]` entry whose `path`
   exists but has no source files (or only a stub).
6. **Tech-lead / role coverage.** Compare `team_roles[]` against the work
   actually being done (e.g., the project has a `terraform/` module and
   recent commits in it but no `platform-engineer` role).

Hold these in working memory for Step 2.

---

## Step 2: Recommendations + Open Question

**If the user supplied an argument**, skip the recommendations preamble and
go straight to Step 3 with that argument as the starting intent.

**Otherwise**, present the drift signals concisely (skip empty categories):

> Quick scan of your project against the current configuration:
>
> - **New directories not declared as modules**: `terraform/`, `scripts/`
> - **Stale plugins**: `roles/old-role.md` is enabled but missing on disk
> - **Settings drift**: ai-settings.md has `[x] React Architecture` checked
>   but ai-plugins.json has it `enabled: false`
> - **Suggested role**: you have an iac module but no platform-engineer or
>   sre in `team_roles[]` — want to add one?
>
> What would you like to change? You can describe it in your own words —
> for example:
>
> - "Add a Terraform module at terraform/"
> - "Swap the backend from Python to Go"
> - "Hire an SRE — add the role"
> - "Change discovery mode to manual"
> - "Bump approval rate to per-file for everything"
> - "Disable the Django guide; we don't use it"
> - "Rename frontend module to web-ui"
> - "Remove the ML Engineer role; we shipped the ML feature"
>
> Or accept one of the suggestions above with "yes do that".

If the user has nothing to change, say so and exit cleanly without writing
anything: "No changes — your config matches the project as-is."

---

## Step 3: Classify Intent and Plan Edits

Parse the user's free-form description into a structured change plan. Do
not invent a fixed enum of intents — the AI's job is to read what was said
and figure out which fields need to change.

The change classes the AI must recognize (this is for the AI's reasoning,
not a menu shown to the user):

| Intent | Files affected | Downstream regeneration |
|---|---|---|
| Add a module | `configure.json.layout.modules[]`, `ai-plugins.json.layout.modules[]` | `.github/labeler.yml`, `CLAUDE.md` Project Layout + Architecture sections, `README.md` Project Structure tree, `setup.sh` (next `/new-release`), `run.sh` (next `/new-release`) |
| Remove a module | same as above | same — plus warn the user that source files in the removed path become rule violations and must be relocated or the path added to `layout.exceptions[]` |
| Rename a module | same | same — also rename the path on disk if the user wants (with a `git mv` plan presented for approval) |
| Change a module's `kind` / `language` / `manifest` / `tests` / `independent` | `layout.modules[]` only | re-run bootstrap Step 2b for any role whose stack-guides filter changes |
| Add a role | `configure.json.team_roles[]`, `ai-plugins.json.plugins.roles[]`, `ai-settings.md` Roles checklist | enable curated role file if the slug matches the catalog; otherwise generate via `bootstrap/templates/role.template.md`. Populate stack-guides marker block. Add `docs/roles/{slug}.md` onboarding doc |
| Remove a role | same | disable in manifest, leave the role file on disk (could be re-enabled), remove the onboarding doc |
| Rename a role | same | rename the slug everywhere; rename `docs/roles/{old}.md` → `docs/roles/{new}.md`; update onboarding doc references |
| Swap stack | `configure.json.stack.*`, `ai-plugins.json.stack`, `ai-plugins.json.plugins.guides[]`, `plugins.guidelines[]`, `plugins.refactoring[]` (enable/disable per new stack), `ai-settings.md` checkboxes | generate new guides via `bootstrap/templates/guide.template.md` if the new stack isn't curated. Re-run bootstrap Step 2b to update role marker blocks. Regenerate `docs/conventions/{language}.md` for the new language |
| Change `mode` or `approval_rate` | `configure.json`, `ai-plugins.json`, `ai-settings.md` Mode / Approval Rate sections | none — takes effect on the next command invocation |
| Toggle a guide / guideline / refactoring entry on/off | `ai-plugins.json.plugins.{kind}[].enabled`, `ai-settings.md` checkbox | none — takes effect on next load |
| Add / remove a `layout.exceptions[]` entry | `configure.json.layout.exceptions[]`, `ai-plugins.json.layout.exceptions[]` | none |
| Change an integration (Jira / GitHub / Confluence) | `configure.json.integrations.{name}` | re-verify integration via MCP if enabling; halt if disabling something with active state (e.g., open Tech Lead review ticket) and ask for confirmation |
| Toggle / reconfigure AI PR review | `configure.json.integrations.github.rules.prs.ai_review.{enabled, provider, model, region}` | enable → generate `.github/workflows/ai-pr-review.yml` per `/configure` Step 5g.1 (variant for the chosen provider) and print the secret-setup instructions for that provider per Step 5n; disable → delete the workflow file (gate with confirmation since this is a destructive change); switch provider/model → regenerate the workflow file in place and print the new provider's secret-setup instructions |
| Anything else | identify the right `configure.json` / `ai-plugins.json` field; if the user's intent doesn't map to a documented field, ask a clarifying question rather than guessing |

For ambiguous intents, **ask one clarifying question** before planning. Do
not present a menu of every possible change — just ask the specific thing
that's unclear ("you said 'add docs' — do you want a `docs/` module
declaration, a Tech Writer role, or a Confluence Documentation page set?").

---

## Step 3a: Re-probe affected MCPs (only when an integration is touched)

If the change plan from Step 3 touches an integration that depends
on an MCP that was previously skipped (e.g., enabling Jira when
Atlassian MCP was in `skipped_prereqs[]`), re-probe **just that
MCP** using the matching `/configure` Step 0c probe before
proceeding. Two outcomes:

- **Probe succeeds** → record `prereqs.{name}.status: "ok"` in
  `configure.json`, remove the entry from `skipped_prereqs[]`,
  continue.
- **Probe fails** → present the exact same fix/skip/abort prompt
  `/configure` Step 0 uses, with the same install snippets and
  lost-functionality warnings. On `skip`, halt the change plan
  cleanly — do not partially apply it. Don't write the configure
  field that depends on the missing MCP, since the resulting state
  will be inconsistent.

When the user's intent does not touch any integration (e.g., adding
a module, swapping a guide), skip Step 3a entirely.

---

## Step 4: Present the Plan + Stage Files for Review

Show the user the concrete plan before writing anything. Group by file:

> Here's what I'll change:
>
> **`configure.json`** + **`ai-plugins.json`**
> - `layout.modules[]`: add `{ "name": "terraform", "path": "terraform", "kind": "iac", "language": "hcl", "manifest": "terraform/.terraform.lock.hcl", "independent": true }`
> - `team_roles[]`: add `{ "name": "platform-engineer", "display": "Platform Engineer", "onboarding_doc": true }`
>
> **`ai-settings.md`**
> - Add `[x] Platform Engineer — roles/platform-engineer.md` under Roles
>
> **`docs/roles/platform-engineer.md`** (new file)
> - Onboarding doc generated from role + project context
>
> **`.github/labeler.yml`**
> - Add `terraform: [terraform/**]`
>
> **`CLAUDE.md`** Project Layout
> - Update tree to include `terraform/`
> - Add `### Terraform (terraform/)` Architecture subsection
>
> **`README.md`** Folder Structure
> - Update tree to include `terraform/`
>
> **Stack-guides markers** (regenerate per bootstrap.md Step 2b filter)
> - `roles/platform-engineer.md` — empty by filter rule (no change)
> - No other roles affected
>
> Total: 6 files modified, 1 file created.

Then **stage every file for review** following the
"How files are presented for review" rules in `configure.md`
(staging path `/tmp/claude-edit-config-{run-id}/{relative-path}`,
detect editor via env vars / PATH probe, open with `code -r` for
new files and `code --diff {existing} {staged}` for modifications,
HTML-typed staged files honor `review_html_in`, chat-only
fallback when no editor is detected).

For modifications to existing files (the common case in
`/edit-config`), **always use the diff view** when the editor
supports it — the user wants to see what's changing, not re-review
unchanged content.

Honor `approval_rate` for the gates:

- `auto` — open every staged file once, then **approve / edit /
  skip / abort** as a single batch (no per-file gates, but the
  user still sees the diffs).
- `per-category` — gate at each file group (`configure.json` +
  `ai-plugins.json` together as the manifest pair; `ai-settings.md`
  separately; new role file separately; etc.) with the four-action
  prompt.
- `per-file` — one gate per file with the four-action prompt.

For destructive changes (remove a module with files inside, delete
a role's onboarding doc, drop an integration with external state),
**always gate regardless of `approval_rate`** and require explicit
confirmation. Show exactly what will be lost — preserve the staged
"to-be-deleted" files in the staging dir as a snapshot until the
user approves.

When the user picks **Skip** for a sub-section or file, append the
identifier (the sub-section name or relative file path) to
`configure.json.skipped[]` so re-runs and `/analyze` can see what
was deferred.

---

## Step 5: Apply Changes

Apply the approved changes file by file. Order matters when changes
cascade — write the manifests (`configure.json` + `ai-plugins.json`)
first so that downstream files (`.github/labeler.yml`, `CLAUDE.md`,
`README.md`) can be regenerated from the new state.

For role additions where the slug is **not** in the curated catalog,
generate the role file via `bootstrap/templates/role.template.md` exactly
as `/bootstrap` Step 2b would. Mark `source: "generated"` in the manifest
entry.

For stack-guides marker regeneration (after a role add or stack swap), use
the same idempotent block-replacement logic as `/bootstrap` Step 2b: find
the start/end markers, replace the content between them, never duplicate
the markers, never insert markers into a file that is missing them (log a
warning instead).

For file deletions (removing a role's onboarding doc, removing a generated
guide that's no longer needed), present the file list and confirm before
`rm`. Never delete files outside the instruction pack and `docs/`.

---

## Step 6: Verify and Report

Re-run `/verify-plugins` automatically against the new state. If anything
fails, surface it and roll back? No — leave the state as-is and tell the
user what's broken; they can run `/edit-config` again or fix manually.

Present the final summary:

> Configuration updated.
>
> - **Modules**: {N} (was {M}) — added `terraform`
> - **Roles**: {N} (was {M}) — added `platform-engineer`
> - **Files modified**: 6
> - **Files created**: 1 (`docs/roles/platform-engineer.md`)
> - **Verification**: clean
>
> Next: run `/new-release` when you're ready to start work in the new
> Terraform module.

If the user invoked the command with an argument and only one change was
needed, the whole flow can be very short — Steps 1, 3, 4, 5, 6 with a
quick yes/no at Step 4. Don't over-elaborate when the intent was clear
from the argument alone.

---

## Re-running `/edit-config`

Idempotent. Running it again with no changes returns "no changes — your
config matches the project as-is" and exits without writing.

For destructive operations that were previously declined (Step 4 Abort or
Skip), re-running re-prompts — the abort isn't recorded as a permanent
"don't ask again". If a user wants permanent suppression, they should
edit `ai-plugins.json` / `ai-settings.md` directly to remove the relevant
field or entry.

---

## When to use this vs. manual editing

**Use `/edit-config` when:**
- You're not sure what files need to change for a given intent
- You want the AI to flag drift / consequences before you commit
- You want approval-gated writes per `approval_rate`
- You're adding/removing a module or role and want all the cascaded
  artifacts (labeler.yml, README, CLAUDE.md sections, role docs)
  updated automatically

**Edit `ai-settings.md` / `ai-plugins.json` directly when:**
- You know exactly what you want
- The change is a single toggle (e.g., flip `enabled: true` → `false`
  for one guide)
- You want zero AI involvement
- You're doing scripted bulk edits

Both paths converge on the same files; the release commands re-verify on
every run, so a manual edit and a `/edit-config` edit produce equivalent
results.
