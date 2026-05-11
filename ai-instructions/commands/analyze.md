# Command: /analyze [free-form focus, optional]

Read-only discovery command. Surveys an existing project and produces a
report covering: what is present, what is missing relative to what
`/configure` would have generated, what has drifted (if both states
exist), and which follow-up commands would close each gap.

`/analyze` is **never destructive**. It does not write `ai-plugins.json`,
`configure.json`, `ai-settings.md`, `CLAUDE.md`, code, git state, or any
external system. The only optional write is the analysis report itself
(saved at the end if the user accepts), and that write honors
`approval_rate` like every other write.

Every suggestion is **optional**. The user picks which (if any) to
include in the final implementation plan; `/analyze` then prints a
tailored, copy-pasteable sequence of follow-up commands the user
runs themselves. `/analyze` never executes any of them — that
guarantee is the whole reason `/analyze` is safe to run anywhere
(unfamiliar repo, production checkout, sandbox).

## When to use

- You inherited an existing codebase and want a baseline of what's there
- You ran `/configure` long ago and want a drift report
- You want to preview what `/configure` would do before committing to it
- You want a concrete checklist of `/edit-config` invocations to pick from

If the user supplied a free-form focus argument
(`/analyze CI workflows`, `/analyze missing role docs`,
`/analyze Confluence drift`), narrow the report to that area. Without
an argument, produce the full report.

---

## Step 0: MCP availability (informational only)

Check whether the GitHub MCP and Atlassian MCP servers are reachable.
Record availability for the report — some checks need them — but **do
not halt** if either is missing. `/analyze` runs in any environment;
unavailable checks are reported as "not checked, MCP not available"
rather than treated as errors.

---

## Step 1: Repo + stack survey

Walk the working tree (excluding `.git/`, `node_modules/`, `__pycache__/`,
`.venv/`, build outputs, instruction-pack files) and capture:

- **Requirements locations:** check every conventional spot —
  `ai-instructions/releases/`, `requirements/`, `docs/requirements/`,
  `specs/`, `specifications/`, `product/`, top-level
  `REQUIREMENTS.md` / `PRD.md` / `SPEC.md` — and report which contain
  content. Multiple locations is fine and common; report all of them.
  If none have content, flag the project as greenfield from a
  requirements perspective.

- **Git state:** branch, remote (if any), uncommitted changes,
  commits in the last 30 days (rough activity signal).
- **Manifests detected:** `pyproject.toml`, `package.json`, `go.mod`,
  `Cargo.toml`, `pom.xml`, `Gemfile`, `composer.json`,
  `*.csproj` / `*.sln`, `Package.swift`, `pubspec.yaml`,
  `Dockerfile`, `docker-compose.yml`, IaC manifests (`*.tf`,
  `helm/Chart.yaml`, `ansible.cfg`, `playbook.yml`).
- **Stack inferred from manifests:** primary languages, frameworks
  (e.g., `fastapi` from `pyproject.toml` deps; `react` + `next` from
  `package.json` deps), test runners, package version floors.
- **Modules inferred from layout:** every directory containing a
  manifest is a candidate module. Also flag standalone `terraform/`,
  `k8s/`, `ansible/`, `docs/`, `examples/`, `tests/` trees as
  possible modules even without manifests.
- **Existing CI:** `.github/workflows/`, `.gitlab-ci.yml`,
  `.circleci/`, `azure-pipelines.yml`, `.buildkite/`, `Jenkinsfile`.
- **Existing hooks:** `.pre-commit-config.yaml`, `.husky/`,
  `lefthook.yml`.
- **Existing licensing / governance:** `LICENSE`, `SECURITY.md`,
  `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `CODEOWNERS`.

---

## Step 2: Template-state survey

Determine which of the three states the project is in:

1. **Greenfield** — no `configure.json`, no `ai-plugins.json`. Project
   exists outside the template's flow. The report focuses on "what
   `/configure` would add" and inferred starting values.
2. **Bootstrapped** — both `configure.json` and `ai-plugins.json`
   present and schema-valid. The report focuses on drift between
   recorded state and reality, plus any `/configure` Full-scope
   artifacts that were skipped.
3. **Partially configured** — one present, the other missing or
   broken; or hand-written subset. The report focuses on completing
   whichever side is missing.

For each of these files, check presence + schema validity:

- `ai-instructions/configure.json` — presence; basic JSON validity;
  whether it has the required sections (`project`, `layout`, `stack`,
  `gitflow`, `integrations`, `team_roles[]`, `discovery_mode`,
  `approval_rate`, `prereqs`, `skipped[]`, `skipped_prereqs[]`,
  `docs_media[]`). Note: `discovery_mode` here becomes `mode` in
  `ai-plugins.json` after `/bootstrap` — they are the same setting
  under different field names.
- `ai-plugins.json` — presence; conforms to
  `ai-instructions/ai-plugins.schema.json`; same fields the
  `/verify-plugins` command checks.
- `ai-settings.md` — presence; has Mode + Approval Rate sections;
  has the four checkbox sections (Roles, Guides, Guidelines,
  Refactoring Rules).
- `CLAUDE.md` — present at project root and **not** the template
  copy (look for placeholder text like `{PROJECT_DESCRIPTION}` —
  if found, the project never ran `/bootstrap`).
- `AGENTS.md`, `AI_INSTRUCTIONS.md` — present in `ai-instructions/`.

---

## Step 3: Artifact inventory (mirror of `/configure` Step 5)

For each `/configure` Step 5 sub-section, mark present / partial /
missing. Group by category:

**Decision + project summary**
- `ai-instructions/configure.json`
- `ai-instructions/releases/init/project-summary.md`
- `README.md` (project-facing, with the bootstrap-marker comments)

**Git baseline**
- `.gitignore`, `.gitattributes`, `.editorconfig`

**Hooks**
- `.pre-commit-config.yaml` or `.husky/`
- `commit-msg` Conventional Commits validation
- `commit-msg` ticket-ID enforcement (if Jira project key declared)

**Gitflow + onboarding**
- `docs/gitflow.md`, `docs/onboarding.md`

**Full-scope docs** (Full only — flag as missing-Full not missing-Core)
- `SECURITY.md`, `CONTRIBUTING.md`, `LICENSE`,
  `docs/code-review.md`

**Per-language conventions**
- `docs/conventions/{lang}.md` for each detected language

**Per-role onboarding**
- `docs/roles/{role}.md` for each entry in `team_roles[]`

**GitHub artifacts** (Full only)
- `.github/CODEOWNERS`, `.github/dependabot.yml`
- `.github/PULL_REQUEST_TEMPLATE.md`
- `.github/ISSUE_TEMPLATE/{bug,feature,task,chore}.yml` +
  `.github/ISSUE_TEMPLATE/config.yml`
- `.github/workflows/ci.yml`, `pr-title-check.yml`, `labeler.yml`
- `.github/workflows/ai-pr-review.yml` (Full when `integrations.github.rules.prs.ai_review.enabled` is `true`)
- `.github/labeler.yml`

**Release automation** (Full only)
- `release-please-config.json`, `.release-please-manifest.json`,
  `.github/workflows/release-please.yml` — OR `changeset` setup

**External-system state** (requires MCP — skip if unavailable)
- Branch protection rules on default branch (GitHub MCP)
- Confluence pages: Project Overview / Requirements / Technologies /
  User Roles (Atlassian MCP) — or local-docs HTML at
  `docs/confluence/*.html`
- Tech Lead review ticket (Jira) — `integrations.jira.review_ticket`
- Per-role onboarding tickets (Jira) —
  `integrations.jira.role_onboarding_tickets`

**AI instruction pack** (`/bootstrap` outputs)
- `ai-plugins.json`, `ai-settings.md`, customized `CLAUDE.md`,
  customized `AGENTS.md`, `AI_INSTRUCTIONS.md`
- Active role / guide / guideline / refactoring files referenced
  by the manifest

For each artifact, capture: present (✓), missing (✗), or drifted (⚠ —
present but doesn't match the schema or the recorded decision).

---

## Step 4: Stack + module inference (greenfield + partial only)

When `configure.json` is missing, infer the values `/configure` would
have captured. Present them as **starting points the user would
confirm or edit during a future `/configure` run**, not as decisions.

- `project.kind` — best guess from module shape (`web-app`,
  `library`, `cli`, `iac`, `mobile-app`, `data-pipeline`,
  `documentation-site`, etc.). Show the reasoning ("two manifests
  in `src/backend/` and `src/frontend/` — looks like `web-app`").
- `layout.modules[]` — one entry per detected module with `name`,
  `path`, `kind` guess, `language` from manifest, `manifest`,
  `tests` (if a tests directory was detected nearby).
- `layout.exceptions[]` — any source directories outside detected
  modules (typically empty for greenfield).
- `stack.*` — keys mirror module kinds (e.g.,
  `stack.backend = { language: ..., framework: ... }`).
- `team_roles[]` — empty by default, with **suggestions** based on
  declared modules: an `iac` module suggests asking about a
  Platform Engineer / SRE; a `mobile` module suggests Mobile
  Developer; a `library` module suggests Library Author. These are
  conversation prompts for `/configure`, not defaults.

---

## Step 5: Drift detection (bootstrapped + partial only)

When both `configure.json` and reality exist, compare:

- **Layout drift:** directories on disk not in `layout.modules[]`
  (candidate new modules) and modules in the manifest whose `path`
  no longer exists (stale entries). Same check `/edit-config` Step
  2 runs.
- **Plugin drift:** `ai-plugins.json` entries with `enabled: true`
  whose `path` is missing on disk; missing files referenced in
  `AGENTS.md` or `AI_INSTRUCTIONS.md`; checkboxes in `ai-settings.md`
  out of sync with `enabled` in the manifest.
- **Stack drift:** `stack.backend.language` says `python` but the
  detected manifest is `package.json`; `stack.frontend.framework`
  says `react` but `package.json` has no React dep.
- **Skipped-item drift:** any item recorded in
  `configure.json.skipped[]` that the user might want to revisit
  (only surface; do not pressure).
- **Skipped-prereq drift:** any prerequisite recorded in
  `configure.json.skipped_prereqs[]` (e.g., `atlassian_mcp`,
  `ide_mcp`, `editor_cli`). Surface each with the lost
  functionality from Step 0c — "Atlassian MCP was skipped: live
  Confluence + Jira disabled. Install and re-run `/configure` to
  enable." Only surface; do not pressure.
- **Settings drift:** `ai-settings.md` Mode / Approval Rate values
  differ from `ai-plugins.json` — flag for reconciliation.

---

## Step 6: Generate suggestions

Walk every finding (missing item from Step 3, inferred starting value
from Step 4, drift from Step 5) and attach a concrete action. The
goal is a complete, granular suggestion list that mirrors `/configure`
Step 5 — every artifact and every external-system action that
`/configure` would have produced shows up here as one suggestion the
user can pick or skip individually.

| Finding kind | Suggested action |
|---|---|
| `configure.json` missing entirely | Run `/configure full` (or `/configure core` / `/configure custom`) |
| Git baseline missing (`.gitignore`, `.gitattributes`, `.editorconfig`) | `/edit-config "add git baseline files"` |
| Hooks missing (`.pre-commit-config.yaml` / `.husky/`, commit-msg validation) | `/edit-config "add commit hooks"` |
| Gitflow + onboarding docs missing (`docs/gitflow.md`, `docs/onboarding.md`) | `/edit-config "add gitflow + onboarding docs"` |
| Per-language conventions missing (`docs/conventions/{lang}.md`) | `/edit-config "add language conventions docs"` |
| Per-role onboarding docs missing (`docs/roles/{role}.md`) | `/edit-config "regenerate role onboarding docs"` |
| Full-scope governance missing (`SECURITY.md`, `CONTRIBUTING.md`, `LICENSE`, `docs/code-review.md`) | `/edit-config "add governance docs"` |
| GitHub artifacts missing (CODEOWNERS, dependabot, PR/issue templates, CI, labeler) | `/edit-config "add GitHub artifacts"` |
| AI PR review workflow missing (`.github/workflows/ai-pr-review.yml`) — flag only when `integrations.github.rules.prs.ai_review.enabled` is `true` (or unset and the user wants it) | `/edit-config "enable AI PR review with {bedrock\|anthropic-api\|vertex}"` |
| Release automation missing (release-please / changesets) | `/edit-config "add release automation"` |
| Branch protection rules missing on default branch | `/edit-config "set branch protection rules"` (requires GitHub MCP) |
| Confluence pages missing (Project Overview / Requirements / Technologies / User Roles) | `/edit-config "create Confluence pages"` (requires Atlassian MCP + space key + page-create permission on that space) |
| Tech Lead review Jira ticket missing | `/edit-config "open Tech Lead review ticket"` (requires Atlassian MCP + Jira project key + create-issue permission) |
| Per-role onboarding Jira tickets missing | `/edit-config "open role-onboarding tickets"` (requires Atlassian MCP + Jira project key) |
| Specific Step 5 sub-section missing in a configured project | `/edit-config "add {artifact name}"` — e.g., `/edit-config "add CI workflows"` |
| Manifest drift (file gone, plugin still enabled) | Run `/verify-plugins`, then `/edit-config` to reconcile |
| Layout drift (new directory not declared) | `/edit-config "add {path} as a {kind} module"` |
| Stale `team_roles[]` (no role for declared module kind) | `/edit-config "add a {role} role"` |
| Skipped item the user may want to revisit | "Recorded as skipped on {date}; re-run `/edit-config 'redo {item}'` if you want it now" |
| MCP-only check that wasn't reachable | "Install the {GitHub\|Atlassian} MCP and re-run `/analyze` to check this" |

**Optional tracking-ticket suggestion.** If the Atlassian MCP is
reachable AND `configure.json.integrations.jira.project_key` resolves
to a real Jira project, append one extra suggestion at the bottom of
the list (always optional):

| Finding kind | Suggested action |
|---|---|
| Track this analysis as a Jira ticket | `/edit-config "open Jira ticket for /analyze findings on {YYYY-MM-DD}, assigned to {runner}"` (requires Atlassian MCP + create-issue permission). The ticket body includes the picked-action checklist below; the runner is the user invoking `/analyze` (Atlassian `accountId` from `mcp__*atlassian*__atlassianUserInfo`). |

For greenfield projects the runner-Jira suggestion is suppressed —
there is no Jira project key recorded yet to open the ticket against.

Every suggestion is **optional**. Mark the report accordingly. Each
suggestion is what a user can pick in Step 8.

---

## Step 7: Present the survey

Single concise survey, organized for skim-ability. **Do not include
the implementation plan yet** — that is Step 9, after the user picks.

> ## `/analyze` report — {project name or path} ({date})
>
> **State:** Greenfield | Bootstrapped | Partially configured
>
> ### What you have
> - `ai-plugins.json` ✓ (schema-valid; {N} enabled plugins)
> - `.gitignore`, `.gitattributes`, `.editorconfig` ✓
> - `.pre-commit-config.yaml` ✓ ({N} hooks)
> - `docs/gitflow.md`, `docs/onboarding.md` ✓
> - `.github/workflows/ci.yml` ✓
> - {... continue ...}
>
> ### What's missing (each one is pickable below)
> - **CI labeler workflow** — `.github/workflows/labeler.yml` not present.
> - **Per-role onboarding docs** — `docs/roles/` directory missing.
> - **Release automation** — no `release-please-config.json`.
> - **Confluence pages** — Project Overview / Requirements / Technologies / User Roles not detected on the configured space.
> - **Tech Lead review Jira ticket** — `integrations.jira.review_ticket` empty.
> - {... continue ...}
>
> ### Drift detected (if any)
> - Module `web-ui` declared in `layout.modules[]` but `web-ui/`
>   directory is missing on disk.
> - {... continue ...}
>
> ### Inferred from filesystem (greenfield only)
> - `project.kind`: **library** (single `pyproject.toml` at root,
>   `tests/` directory present, no client / server split)
> - `layout.modules[]`:
>   - `lib` → `src/`, kind=lib, language=python, manifest=pyproject.toml, tests=tests/
>   - `examples` → `examples/`, kind=lib, independent=false
> - `stack.lib`: `{ language: python, publishing: pypi }` (inferred)
> - **Suggested team roles:** Library Author, QA Engineer, Tech Writer
>
> ### MCP-gated checks not run
> - Branch protection rules (GitHub MCP not available)
> - Confluence space contents (Atlassian MCP not available)
> - Install the missing MCP server(s) and re-run `/analyze` to include these.

Keep the survey dense. Skip empty sections rather than padding.
Phrase each item in **What's missing** / **Drift detected** as a
neutral observation; the per-finding command suggestions live in
Step 6's table and surface in Step 9 (implementation plan), so the
survey itself stays a clean inventory.

---

## Step 8: Interactive pick

Present every actionable finding from Step 7 (missing items + drift
items, plus the optional runner-Jira tracking-ticket suggestion if
Atlassian MCP is reachable) as a numbered checklist. **Default: nothing
is checked.** Order by category, not by priority — the user is the one
who decides priority.

> Pick which suggestions to include in the implementation plan.
> Reply with: numbers (e.g., `1, 3, 5-7`), `all`, `none`, or
> a category name (`hooks`, `ci`, `confluence`, `jira`).
>
> **Git baseline & hooks**
> [ ] 1. Add `.gitignore`, `.gitattributes`, `.editorconfig`
> [ ] 2. Add `.pre-commit-config.yaml` with Conventional Commits + ticket-ID validation
> [ ] 3. Add `docs/gitflow.md`, `docs/onboarding.md`
>
> **Governance & docs**
> [ ] 4. Add `SECURITY.md`, `CONTRIBUTING.md`, `LICENSE`, `docs/code-review.md`
> [ ] 5. Add per-language conventions (`docs/conventions/python.md`, ...)
> [ ] 6. Add per-role onboarding docs (`docs/roles/{role}.md`)
>
> **GitHub & CI**
> [ ] 7. Add `.github/CODEOWNERS`, `.github/dependabot.yml`
> [ ] 8. Add PR + issue templates
> [ ] 9. Add `.github/workflows/ci.yml`, `pr-title-check.yml`, `labeler.yml`
> [ ] 9a. Add `.github/workflows/ai-pr-review.yml` (Claude PR review) — only when `integrations.github.rules.prs.ai_review.enabled` is true OR the user picks it now
> [ ] 10. Set branch protection rules on default branch  *(requires GitHub MCP)*
> [ ] 11. Add release automation (release-please / changesets)
>
> **Confluence**  *(each requires Atlassian MCP + write permission on the target space)*
> [ ] 12. Create Project Overview page
> [ ] 13. Create Requirements page
> [ ] 14. Create Technologies page
> [ ] 15. Create User Roles page
>
> **Jira**  *(each requires Atlassian MCP + create-issue permission on the target project)*
> [ ] 16. Open Tech Lead review ticket
> [ ] 17. Open per-role onboarding tickets
> [ ] 18. Open a Jira tracking ticket for this analysis run, assigned to {runner display name}
>
> **Drift fixes**
> [ ] 19. Reconcile `layout.modules[]` — remove stale `web-ui` entry
> [ ] 20. Run `/verify-plugins` to reconcile manifest
>
> Your picks (or `all` / `none`):

Suppress any category whose findings are empty (e.g., if all Confluence
pages already exist, drop the Confluence category from the list rather
than render it empty). Suppress items whose prerequisites are
*permanently* unavailable (e.g., Atlassian MCP not installed) — list
them once at the bottom under "Skipped because prerequisite missing"
instead of putting unselectable rows in the list.

Wait for the user's reply before continuing. Parse number ranges,
category names, `all`, and `none`. If the input is unclear, ask once
to clarify.

If the user replies `none` (or selects zero items), skip directly to
Step 10 with an empty implementation plan and a one-line "no actions
selected — rerun `/analyze` any time" note.

---

## Step 9: Generate the implementation plan

Translate the user's picks into a tailored, copy-pasteable command
sequence. Group commands so the user runs as few of them as possible
to apply all picks. Order: file-only changes first → MCP-touching
changes last (so any MCP failure does not block the safe fast wins).

For each picked item, look up its suggested action from Step 6's
table. Then condense:

- **Multiple `/edit-config` picks against the same project** can
  often combine into one invocation: `/edit-config "add git
  baseline + commit hooks + gitflow docs"`. Use one combined call
  per logical group (file-only / MCP-side-effect / drift) rather
  than one call per item.
- **For greenfield (no `configure.json`)**, suggest `/configure
  custom` instead of stitching `/edit-config` calls — `/configure`
  knows how to ask the upfront questions that `/edit-config`
  assumes are already answered. Note in the plan which Step-3
  decisions the user can copy-paste straight from the survey.
- **MCP-gated picks** explicitly state the prerequisite and current
  status (✓ available / ✗ missing). If missing, suggest the install
  step before the command, not as a footnote.

Render the plan as a new section appended to the report:

> ### Implementation plan ({N picks})
>
> Run these commands in order. `/analyze` did not execute any of
> them — every change is yours to make.
>
> **Prerequisites:**
> - GitHub MCP: ✓ available
> - Atlassian MCP: ✓ available — Confluence space `ENG`, Jira project `PLAT`
>
> **1. File-only changes** *(no external state touched)*
>
> ```
> /edit-config "add git baseline + commit hooks + gitflow + onboarding docs + per-language conventions + GitHub artifacts (CODEOWNERS, dependabot, PR/issue templates, ci/labeler/ai-pr-review workflows) + release-please"
> ```
>
> Touches: 14 files under `.gitignore`, `docs/`, `.github/`. No
> network calls. `approval_rate` gates apply.
>
> **2. GitHub branch protection** *(GitHub MCP)*
>
> ```
> /edit-config "set branch protection rules on main: required PR review, status checks (ci, pr-title-check), no force-push"
> ```
>
> **3. Confluence + Jira** *(Atlassian MCP)*
>
> ```
> /edit-config "create Confluence pages (Project Overview, Requirements, Technologies, User Roles) on space ENG"
> /edit-config "open Tech Lead review ticket on PLAT, assignee {tech-lead-from-configure.json}"
> /edit-config "open role-onboarding tickets on PLAT, one per team_roles[]"
> /edit-config "open Jira tracking ticket on PLAT for /analyze findings on {YYYY-MM-DD}, assigned to {runner display name + accountId}, body = picked-action checklist below"
> ```
>
> The runner-tracking ticket body should include this exact
> implementation plan as a checklist so the assignee can mark each
> item done as they complete it.
>
> **4. Drift cleanup**
>
> ```
> /verify-plugins
> /edit-config "remove stale web-ui module from layout"
> ```
>
> **Skipped because prerequisite missing:**
> - (none — all prerequisites available for picked items)
>
> **What you didn't pick** — re-run `/analyze` any time to revisit
> the suggestions you skipped this round.

Render only the sections relevant to the user's picks (drop empty
sections). The plan is **always** the last section of the report.

---

## Step 10: Optionally save the report

After presenting the survey + plan inline, ask once whether to save
the full report (survey + picks + implementation plan):

> Save this report to `ai-instructions/releases/init/analysis-{YYYY-MM-DD}.md`
> for future reference?
>
> 1. **Save** — write the report file
> 2. **Don't save** — keep it inline only (default)

This single write honors `approval_rate` (and
`approval_rate_overrides.analyze` if added in a future schema bump).
For `auto`, write without asking. For `per-category` / `per-file`,
the prompt above IS the gate.

`/analyze` writes nothing else. The report file (if saved) goes to the
release `init/` directory because it's project-context, not a code
release.

---

## What `/analyze` never does

- Never writes `ai-plugins.json`, `configure.json`, `ai-settings.md`,
  `CLAUDE.md`, `AGENTS.md`, or any other workflow file.
- Never opens PRs, creates Confluence pages, or creates Jira tickets
  — including the runner-tracking ticket. The implementation plan
  *describes* the command that would create it; the user runs it.
- Never modifies code, hooks, CI workflows, or git state.
- Never deletes anything.
- Never invokes `/configure`, `/bootstrap`, `/edit-config`, or any
  release command on the user's behalf — it only **suggests** them.

This makes it safe to run anywhere: a brand-new clone, a long-lived
production repo, or a sandboxed copy. Re-running `/analyze` produces
a fresh report (no incremental state).
