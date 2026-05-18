# Project Bootstrap

This prompt configures the AI instruction pack for your project and technology
stack. It runs on `/tmpl-bootstrap` or first session.

`/tmpl-bootstrap` configures the AI instruction pack. It does not implement any
code — code implementation starts with `/tmpl-release-new`.

`/tmpl-bootstrap` is a pure generator. Its only inputs are
`ai-instructions/configure.json` and
`ai-instructions/releases/init/project-summary.md` (both produced by
`/tmpl-setup`). Throughout the rest of this file, paths starting with
`releases/`, `roles/`, `guides/`, etc. are written **relative to
`ai-instructions/`** per the convention below — so `releases/init/`
means `ai-instructions/releases/init/` from the project root. From
those inputs, bootstrap generates the AI instruction pack: roles,
guides, `ai-plugins.json`, the project-specific `CLAUDE.md`, and
updated `AGENTS.md` / `AI_INSTRUCTIONS.md`.

Requirements:

- `/tmpl-setup` must have been run. If `configure.json` is missing,
  `/tmpl-bootstrap` halts — see Step 1.
- `../ai-settings.md` is one of bootstrap's outputs (Step 3). Do not read it
  for defaults on the first run.

All instruction files live in the `ai-instructions/` directory. Paths referenced
within that directory are relative to it (e.g., `guides/xxx.md` means
`ai-instructions/guides/xxx.md` from the project root).

Follow the steps below in order. Do not skip steps.

---

## Hard Rules (apply during bootstrap AND every release after)

These rules are non-negotiable. They define how the project is organized
and named. Violating them causes broken references and tooling friction.

The template makes **no assumption** about what kind of project this is.
Web app, IaC, CLI, library, mobile, data pipeline, documentation site,
firmware, game, browser extension — all are first-class. The shape comes
from `ai-plugins.json.layout` (which `/tmpl-bootstrap` writes from
`configure.json.layout`, in turn populated during `/tmpl-setup`'s
discovery questions). The rules below operate on whatever modules the
user declared.

### R1. Code lives only in declared modules

- Every source file must live inside the `path` of some entry in
  `ai-plugins.json.layout.modules[]`, or in a path explicitly listed in
  `layout.exceptions[]` with a recorded reason.
- The set of modules is decided during `/tmpl-setup` (no defaults — see
  Step 3a of `commands/tmpl-setup.md`). Common shapes:
  - **Web app**: two modules — `{name: backend, path: src/backend, kind: server}` and `{name: frontend, path: src/frontend, kind: client}`.
  - **API / single-language service**: one module — `{name: api, path: src/, kind: server}`.
  - **Library**: one module — `{name: lib, path: src/, kind: lib}` plus `tests/` and `examples/` paths.
  - **CLI**: one module — `{name: cli, path: src/, kind: cli}`.
  - **IaC**: one or more — `{name: terraform, path: terraform/, kind: iac}`, `{name: manifests, path: k8s/, kind: iac}`, `{name: playbooks, path: ansible/, kind: iac}`.
  - **Mobile**: depends on framework — `{name: app, path: src/, kind: mobile}` for React Native; or `{name: ios, path: ios/, kind: mobile}` + `{name: android, path: android/, kind: mobile}` for native.
  - **Documentation site**: `{name: docs, path: docs/, kind: docs}` plus optionally `{name: theme, path: src/theme/, kind: client}`.
  - **Monorepo**: each sub-project is a module.
- Adding files outside every declared module path **without** updating
  `layout.modules[]` or `layout.exceptions[]` first is forbidden. If a
  prior setup created such folders, migrate them under a declared
  module path (or declare a new module covering them) as part of
  bootstrap Step 4.

### R2. Independent modules stay independent

- Modules with `independent: true` (the default) own their own
  manifest, dependencies, build, and test commands. Examples:
  server vs client; library subproject vs example app; iOS vs Android
  natives.
- Cross-module imports between independent modules are forbidden.
  Communication goes over an explicit boundary — HTTP / RPC / message
  bus / file artifacts — not `import`. The release commands enforce this.
- When a module has `independent: false`, it shares the project's
  top-level manifest (e.g., a `tests/` directory for a library, a
  `shared/` types module consumed by both server and client). It is
  importable from any other module.

### R3. File and folder names

- Use **lowercase letters (a–z), digits (0–9), and hyphens (`-`)** only.
- No parentheses `( )`, brackets `[ ] { }`, spaces, underscores for names
  (source files follow the language's idiomatic casing, but *directory* names
  stay kebab-case), ampersands `&`, or other punctuation.
- Good: `user-auth/`, `payment-flow-v2/`, `checkout.tsx`, `terraform/network/main.tf`
- Bad: `User Auth (v2)/`, `payment_flow/`, `Users&Orders/`, `release (v1.1).md`
- When creating a release folder from a user-supplied name, normalize it:
  lowercase the string, replace every run of non-alphanumeric characters with
  a single hyphen, and trim leading/trailing hyphens.

---

## Step 0: Inherit Operating Modes from `/tmpl-setup`

`mode` and `approval_rate` were captured by the most recent
`/tmpl-setup` run (Step 2b + 2c) and live in
`../ai-instructions/configure.json`. Bootstrap **inherits both
silently**:

    mode          := configure.json.discovery_mode
    approval_rate := configure.json.approval_rate

Do **not** re-ask the user. Re-asking duplicates `/tmpl-setup`'s
work and is a place for the answers to drift.

### When to prompt anyway

Three exceptions:

1. **`configure.json` is missing.** Halt — `/tmpl-setup` must run
   first (this is also enforced by Step 1's hard requirement).
   When the user explicitly skipped `/tmpl-setup` to write a manual
   `ai-plugins.json`, fall through to step 5's manual-fallback path
   without prompting; bootstrap can read the existing `mode` /
   `approval_rate` from `../ai-plugins.json` if present.

2. **`configure.json` is missing one or both fields** (older
   `/tmpl-setup` runs from before these settings existed). Ask the
   single missing field once, with the same options as
   `/tmpl-setup` Step 2b/2c, and write back to `configure.json` for
   future runs.

3. **The user invoked `/tmpl-bootstrap --reconfigure` explicitly** —
   this signals intent to override. Re-prompt for both, with the
   current values shown as defaults. Persist the new answers back
   to both `configure.json` and `../ai-plugins.json` after Step 5.

### Operating-mode reference

These are the same enums `/tmpl-setup` uses; bootstrap honors them
verbatim.

**`mode`** (a.k.a. `discovery_mode` in `configure.json`):
- **auto** (~0–3 BA questions per release).
- **semi-auto** (~5–10 questions).
- **manual** (~10–20 questions).

**`approval_rate`**:
- **auto** — write everything immediately, no gates.
- **per-category** — pause at each major artifact group (one gate
  per Step 5–9 sub-section in this command). ~3–5 gates in a
  `/tmpl-bootstrap` run.
- **per-file** — pause at each individual file. ~10–15 gates in
  `/tmpl-bootstrap`.

**MCP-side-effect steps always gate regardless** — creating a
Confluence page, opening a Jira ticket, or opening a GitHub PR
touches external state that cannot be undone by editing a file.

### Approval-gate semantics

Whenever a step gates on `approval_rate`, present the proposed
artifact (or batch, for per-category) and offer four actions:

- **Approve** — write as shown, continue.
- **Edit** — describe what to change; AI revises and re-shows the
  proposal until approved.
- **Skip** — do not write this artifact; record the skip in
  `configure.json.skipped[]` so re-runs know not to re-prompt
  (unless the user explicitly asks to re-do).
- **Abort** — halt the entire run; leave already-written files in place.

### Persisting

Bootstrap writes `mode` and `approval_rate` into
`../ai-plugins.json` at Step 5 (the schema requires both — see
`ai-instructions/ai-plugins.schema.json`) and into
`../ai-settings.md` at Step 3 (the human-facing copy). Both copies
must agree with `configure.json` after the run.

---

## Step 1: Require `/tmpl-setup` output (HARD REQUIREMENT)

Check whether `../configure.json` exists at the project root.

**If it is missing, halt and tell the user:**

> `/tmpl-bootstrap` requires `ai-instructions/configure.json`, which is produced
> by `/tmpl-setup`. Requirement discovery, stack decisions, and gitflow
> choices are made by `/tmpl-setup`.
>
> Run `/tmpl-setup` first, then re-run `/tmpl-bootstrap`.

`/tmpl-bootstrap` does not ask questions and does not perform its own discovery.

**If it exists**, load it and treat it as the source of truth for everything
that follows:

- `project.*` → feeds `{PROJECT_DESCRIPTION}` and the summary in Step 6.
- `stack.*` → drives guide selection in Step 2 below and the `stack` block
  in `ai-plugins.json` (Step 5).
- `team_roles[]` → drives **AI role selection** in Step 2b: for every human
  role recorded here, enable the matching AI thinking-mode role under
  `ai-instructions/roles/`. Do not re-ask.
- `conventions.*` → propagated into generated guides and the `ai-settings.md`
  output rules. The human-facing `docs/conventions/*.md` files already exist;
  reference them from generated guides rather than duplicating content.
- `scope` (`core | full | custom`) → only used as the **default** for
  the `mode` question Step 0 already asked (core→auto, full→semi-auto,
  custom→manual). The actual value written to `ai-settings.md` and
  `ai-plugins.json` is whatever the user confirmed or overrode in
  Step 0 Question 1, not the scope mapping itself.
- `gitflow.*`, `integrations.*`, `hooks.*`, `ci.*` → not bootstrap's concern
  directly (the artifacts exist on disk already); reference them in generated
  docs where useful.

Also load `releases/init/project-summary.md` — it is the canonical
requirements summary and must inform every description-style field generated
below.

Present a short confirmation before proceeding:

> Loaded `configure.json` (scope: **{scope}**) and `project-summary.md`.
>
> - Product: {project.description}
> - Stack: {short summary}
> - Roles: {team_roles list}
>
> Generating the instruction pack from this now.

---

## Step 2: Content Selection and Generation

### Approval gating (applies to Steps 2 through 9 below)

Every step from here on produces files. Honor `approval_rate` (the
answer captured in Step 0):

- `approval_rate: auto` — write each file as soon as it is generated;
  no pause.
- `approval_rate: per-category` — at the **start** of each step
  (Step 2, Step 3, …, Step 9), stage the proposed files, open them in
  the user's editor as tabs, and offer **Approve / Edit / Skip /
  Abort**. Use the staging + editor-open workflow defined in
  `commands/tmpl-setup.md` Step 5 ("How files are presented for
  review") — the same staging path convention
  (`/tmp/claude-tmpl-bootstrap-{run-id}/{relative-path}`), the same editor
  detection (`code` → `cursor` → `idea` → fallback-to-chat), and the
  same four actions. Move staged → final on Approve; revise +
  re-stage on Edit; record skip; halt on Abort.
- `approval_rate: per-file` — same, but one gate per file.

There are no MCP-side-effect steps in `/tmpl-bootstrap` itself (those live
in `/tmpl-setup`), so no mandatory gates. Pure local file writes only.

When a user picks **Skip** for a step that downstream steps depend on
(e.g., skipping Step 5 means there's no `ai-plugins.json` for Steps
6–10 to reference), say so and ask whether to skip the dependent steps
too — do not silently break the chain.

Using the understanding built in Steps 1-4, build a generation manifest.

### 2a. Guides

For each technology in the stack:

1. **Check for a curated match** in `guides/`:
   - `guides/python-general.md` → Python (general)
   - `guides/backend-python-fastapi.md` → Python + FastAPI
   - `guides/backend-python-django.md` → Python + Django
   - `guides/backend-nodejs-express.md` → Node.js + Express
   - `guides/backend-java-spring.md` → Java + Spring Boot
   - `guides/frontend-react-fsd.md` → React + TypeScript + FSD
   - `guides/frontend-nextjs.md` → Next.js (App Router)
   - `guides/css-tailwind.md` → CSS / Tailwind
   - `guides/ml-llm-pipeline.md` → ML / LLM extraction
   - `guides/database-postgresql.md` → PostgreSQL
   - `guides/database-mongodb.md` → MongoDB
   - `guides/database-redis.md` → Redis
   - `guides/testing-react-vitest.md` → Vitest + React Testing Library
   - `guides/testing-pytest.md` → Pytest
   - `guides/testing-jest.md` → Jest
   - `guides/testing-junit.md` → JUnit 5
   - `guides/testing-playwright.md` → Playwright (E2E)
   - `guides/verification-python-service.md` → Python service verification

2. If a curated guide matches the stack → **keep it**
3. If a curated guide partially matches (e.g., React but not FSD) → **generate
   a new guide** using the curated one as a structural reference but with the
   correct architecture
4. If no curated guide matches → **generate a new guide** following
   `bootstrap/templates/guide.template.md`

When generating, name the file descriptively:
`guides/{layer}-{language}-{framework}.md` (e.g., `guides/backend-go-gin.md`,
`guides/frontend-vue-nuxt.md`, `guides/testing-pytest.md`)

If web search is available, look up official documentation and best practices
for the technology before generating. This produces significantly better output.

### 2b. Roles

The set of enabled AI thinking-mode roles comes from `configure.json`
`team_roles[]` — **whatever the user declared during /tmpl-setup, no
additions, no defaults**. For each entry:

1. Look for a curated role file at `ai-instructions/roles/{name}.md`
   (using the entry's `name` slug verbatim). If found, enable it.
2. If no curated file exists, generate a new role file using
   `bootstrap/templates/role.template.md` (mark `source: "generated"`
   in `ai-plugins.json`) and enable it.
3. Special handling for composite roles — e.g., `tech-lead` traditionally
   maps to both `roles/backend-architect.md` and `roles/business-analyst.md`.
   These mappings are an **assist**, not a default: enable both curated
   files when the slug matches, but do not add tech-lead to the team
   automatically.

Curated catalog (the 15 slugs that ship with curated role files at
`ai-instructions/roles/{slug}.md` — check the directory for the
authoritative list):

`business-analyst`, `qa-engineer`, `backend-architect`,
`backend-developer`, `frontend-developer`, `ui-ux-designer`,
`ml-engineer`, `devops-engineer`, `platform-engineer`, `sre`,
`library-author`, `tech-writer`, `data-engineer`, `mobile-developer`,
`security-engineer`.

The slug `tech-lead` is **composite** — it has no standalone role
file. When `team_roles[]` contains `tech-lead`, enable both
`roles/backend-architect.md` and `roles/business-analyst.md`
together (per step 3 above) instead of looking for
`roles/tech-lead.md`.

Older curated sets only included the first eight slugs — assume
generation for any missing slug rather than failing.

The template **does not auto-enable Business Analyst or QA Engineer**
— those used to be hard-coded as always-on, but the project's "no
defaults" principle now puts the choice in the user's hands. If the
user wants BA or QA as always-available AI thinking modes, they list
them in `team_roles[]` during `/tmpl-setup`.

**After enabling each role, populate its stack-guides marker block** so
the role's "For detailed guidance, also load:" list matches the active
stack — not the template's default Python/React content. The marker
block looks like:

    <!-- /tmpl-bootstrap: stack-guides start ({role-slug}) -->
    - `../guides/{guide}.md`
    - `../guides/{another-guide}.md`
    <!-- /tmpl-bootstrap: stack-guides end ({role-slug}) -->

Replace everything between the two markers with the relevant
`enabled: true` guides from `ai-plugins.json.plugins.guides[]`,
filtered to the role's domain:

| Role slug | Guide filter |
|---|---|
| `backend-developer` | guides whose `name` starts with `backend-` plus any matching `verification-*-service` |
| `backend-architect` | same as `backend-developer` plus `database-*` guides |
| `frontend-developer` | guides whose `name` starts with `frontend-` or `testing-react-*`, plus `css-*` if present |
| `ml-engineer` | `ml-*` guides plus the project's backend guide for the host service |
| `mobile-developer` | guides whose `name` starts with `mobile-` plus any matching `testing-*` for the chosen mobile framework |
| `data-engineer` | `database-*` guides plus `ml-*` guides plus the project's backend guide if it hosts the data pipeline |
| `devops-engineer` · `tech-writer` · `library-author` · `security-engineer` · `platform-engineer` · `sre` | no stack-guides block by default — these roles are not stack-organized. Keep the markers but leave the block between them empty (`<!-- /tmpl-bootstrap: stack-guides start ({slug}) -->\n<!-- /tmpl-bootstrap: stack-guides end ({slug}) -->`) |
| `qa-engineer`, `business-analyst`, `ui-ux-designer` | no stack-guides block — these roles are stack-agnostic. Skip population (no markers in the role file at all) |

The marker block must be regenerated **idempotently**: locate the start
and end markers, replace everything between them, never duplicate the
markers themselves. If a role file is missing markers (e.g., a
hand-edited or pre-update file), do not silently insert them — log a
warning and skip that role's stack-guides population, telling the user
the role file needs to be regenerated from `bootstrap/templates/role.template.md`.

Do not ask the user anything in this step — `configure.json` is authoritative.

### 2c. Refactoring docs

- `refactoring/refactoring-process.md` — **always keep** (stack-agnostic)
- For each stack-specific refactoring doc, check if it matches:
  - `refactoring/python/python-refactoring.md` → Python projects
  - `refactoring/django/django-refactoring.md` → Django projects
  - `refactoring/nodejs/nodejs-refactoring.md` → Node.js projects
  - `refactoring/java/java-refactoring.md` → Java / Spring Boot projects
  - `refactoring/react/react-refactoring.md` → React projects
  - `refactoring/nextjs/nextjs-refactoring.md` → Next.js projects
  - `refactoring/css/css-refactoring.md` → Tailwind CSS projects
  - `refactoring/backend-pipeline.md` → pipeline-based backends
  - `refactoring/postgresql/postgresql-refactoring.md` → PostgreSQL
  - `refactoring/mongodb/mongodb-refactoring.md` → MongoDB
  - `refactoring/redis/redis-refactoring.md` → Redis
  - `refactoring/pytest/pytest-refactoring.md` → Pytest
  - `refactoring/jest/jest-refactoring.md` → Jest
  - `refactoring/junit/junit-refactoring.md` → JUnit 5
  - `refactoring/playwright/playwright-refactoring.md` → Playwright
- For technologies without a curated refactoring doc, generate one only if
  there are concrete, enforceable rules with clear before/after patterns.
  Follow `bootstrap/templates/refactoring.template.md`.
- Not every technology needs a refactoring doc. Skip generation if unsure.

### 2d. Guidelines

Guidelines are optional and are the longest documents. Only generate when
the condensed guide is not sufficient.

Drive the decision from `configure.json` `scope`:

- `core` → skip guidelines generation. Record that they can be added later.
- `full` → generate guidelines for every technology in `stack.*` that has a
  curated template or clearly benefits from normative rules.
- `custom` → if the user's original `/tmpl-setup` answers requested detailed
  guidelines (recorded in `configure.json` under a `guidelines` field, when
  that field exists), generate them; otherwise skip.

Do not ask the user anything in this step. If a field is missing in
`configure.json`, apply the default for the recorded scope.

If generating, follow `bootstrap/templates/guidelines.template.md`.

---

## Step 3: Configure ai-settings.md

Rewrite `../ai-settings.md` so only the items relevant to this project are
checked. Go through EVERY section:

### Mode

Use the answer captured in **Step 0 Question 1** (the discovery mode the
user picked, possibly overriding the scope-derived suggestion). Step 0
already presented the scope→mode mapping (`core`→`auto`,
`full`→`semi-auto`, `custom`→`manual`) as the default, so on a fresh
run where the user accepted the default, the value matches the scope.
On runs where the user picked a different mode, that override wins.

If Step 0 was somehow not run (only happens in a partial-state
recovery), fall back to the scope-derived mapping above.

Write it as:

    mode: {auto | semi-auto | manual}

The same value is also written to `../ai-plugins.json.mode` in Step 5
— the two must agree.

### Roles

Driven entirely by `configure.json.team_roles[]` — **no defaults, no
auto-enables**. Check the box for every role recorded there; uncheck
every other role from the template's starter list. This matches the
"no auto-enable Business Analyst or QA Engineer" rule in Step 2b: if
the user wants BA/QA active, they list those slugs in `team_roles[]`
during `/tmpl-setup`. Bootstrap does not second-guess that choice.

Mapping from `team_roles[].name` (slug) to display label in
`ai-settings.md` follows `team_roles[].display` when present;
otherwise title-case the slug (e.g., `mobile-developer` → "Mobile
Developer"). Generated roles (those without a curated file in
`ai-instructions/roles/`) get a new checkbox entry pointing at the
generated file.

Sanity check: the set of `[x]`-checked roles in `ai-settings.md` must
match the set of `enabled: true` entries in
`ai-plugins.json.plugins.roles[]` exactly. Any drift here means
Step 5's manifest write disagrees with this section — re-run both.

### Guides

For each guide, check it ONLY if the project uses that technology. Uncheck all
others. Use the stack profile from `configure.json` `stack.*`:

- Python project → check Python (General). FastAPI → also check FastAPI. Django → also check Django.
- Node.js project → check Node.js / Express
- Java project → check Java / Spring Boot
- React frontend → check Frontend React / FSD
- Next.js frontend → check Frontend Next.js
- Tailwind → check CSS / Tailwind
- ML/AI → check ML / LLM Pipeline
- PostgreSQL → check Database PostgreSQL. MongoDB → check MongoDB. Redis → check Redis.
- Testing: check ONLY the testing frameworks this project uses (Pytest for Python, Jest for JS, JUnit for Java, Vitest for React, Playwright for E2E)

If a guide was generated for a technology not in the curated list, add a new
checkbox entry pointing to the generated file.

### Guidelines

Same logic as Guides — check only guidelines matching the project's stack.
Uncheck all others.

### Refactoring Rules

- Always check: Refactoring Process (stack-agnostic)
- Check only refactoring docs matching the project's stack
- Uncheck all others

If a refactoring doc was generated, add a new checkbox entry.

### Output Rules

Go through EVERY rule group. Check the group only if the project uses that
technology. Uncheck entirely if it does not apply:

| Rule group | Check when |
|---|---|
| React Component Rules | Project uses React |
| Next.js Rules | Project uses Next.js |
| Tailwind / CSS Rules | Project uses Tailwind |
| TypeScript Rules | Project uses TypeScript |
| Logic Separation Rules | Project has frontend with component architecture |
| Backend Rules | Project has a backend (adjust sub-rules: keep Django lines for Django, Spring lines for Spring, etc.) |
| Python Rules | Project uses Python |
| Java Rules | Project uses Java |
| Database Rules | Project uses databases (keep only sub-rules for the specific DBs used) |
| Testing Rules | Always check (stack-agnostic) |

Within a checked group, uncheck individual rules that don't apply. For example,
if the project uses PostgreSQL but not MongoDB or Redis, check "All foreign keys
indexed" and "Parameterized queries" but uncheck "Schema validation on
collections" and "TTL on every cache key".

### Task Protocol

Keep all items checked — these are stack-agnostic.

### Verify the result

After configuring, the file should have a clear mix of `[x]` and `[ ]` that
accurately reflects this project's stack. If everything is still checked, you
did not configure it properly — a real project never uses ALL technologies.

---

## Step 4: Enforce declared layout

Before generating `CLAUDE.md`, verify that the project layout matches the
hard rules from the top of this file.

1. **Scan the project root** for any of: `backend/`, `frontend/`, `app/`,
   `server/`, `client/`, `api/`, `web/`, `ui/`, or any other top-level
   directory that clearly contains application source code.
2. **If no such directory exists and `src/` also does not exist**, plan to
   create `src/backend/` and/or `src/frontend/` during the first release — do
   NOT create them empty during bootstrap.
3. **If a misplaced directory exists**, present a migration plan to the user:

   > I found application code at `./{dir}/`. The convention for this template
   > is to keep all code under `src/` (specifically `src/backend/` and
   > `src/frontend/`). I plan to:
   >
   > - Move `./{dir}/` → `./src/{backend|frontend}/`
   > - Update import paths, build scripts, and config files that reference the
   >   old location
   >
   > Confirm before I run the migration, or tell me to keep the current layout.

   If the user confirms, perform the migration. If not, record the exception
   in `ai-plugins.json` under `layout.exceptions` (see Step 5).

4. **Verify file and folder names** follow rule R3 (lowercase-hyphen only).
   Rename any offending paths during the same migration pass. If renaming
   would break published URLs or external references, flag each case for the
   user before renaming.

---

## Step 5: Generate Plugin Manifest

Create `../ai-plugins.json` at the project root. This file is the project's
AI-instruction-pack equivalent of `package.json` — it declares which plugins
(roles, guides, guidelines, refactoring docs) this project depends on, plus
the stack those plugins target. The file is the source of truth that the
release commands verify against on every run.

Write it as JSON with this shape:

    {
      "$schema": "./ai-instructions/ai-plugins.schema.json",
      "name": "{project-name}",
      "version": "0.1.0",
      "mode": "auto",
      "stack": {
        "backend": ["python", "fastapi"],
        "frontend": ["react", "typescript", "tailwind"],
        "database": ["postgresql"],
        "testing": ["pytest", "vitest"],
        "infra": ["docker"]
      },
      "layout": {
        "kind": "{copied verbatim from configure.json.layout.kind}",
        "modules": [
          { "name": "backend", "path": "src/backend", "kind": "server", "language": "python", "manifest": "src/backend/pyproject.toml", "tests": "src/backend/tests", "independent": true },
          { "name": "frontend", "path": "src/frontend", "kind": "client", "language": "typescript", "manifest": "src/frontend/package.json", "tests": "src/frontend/tests", "independent": true }
        ],
        "exceptions": []
      },
      "plugins": {
        "roles": [
          { "name": "business-analyst", "path": "ai-instructions/roles/business-analyst.md", "enabled": true },
          { "name": "backend-developer", "path": "ai-instructions/roles/backend-developer.md", "enabled": true }
        ],
        "guides": [
          { "name": "backend-python-fastapi", "path": "ai-instructions/guides/backend-python-fastapi.md", "enabled": true }
        ],
        "guidelines": [],
        "refactoring": [
          { "name": "refactoring-process", "path": "ai-instructions/refactoring/refactoring-process.md", "enabled": true }
        ]
      },
      "commands": [
        { "name": "tmpl-setup", "path": ".claude/commands/tmpl-setup.md" },
        { "name": "tmpl-bootstrap", "path": ".claude/commands/tmpl-bootstrap.md" },
        { "name": "tmpl-verify", "path": ".claude/commands/tmpl-verify.md" },
        { "name": "tmpl-analyze", "path": ".claude/commands/tmpl-analyze.md" },
        { "name": "tmpl-reconfigure", "path": ".claude/commands/tmpl-reconfigure.md" },
        { "name": "tmpl-release-new", "path": ".claude/commands/tmpl-release-new.md" },
        { "name": "tmpl-release-edit", "path": ".claude/commands/tmpl-release-edit.md" },
        { "name": "tmpl-release-finish", "path": ".claude/commands/tmpl-release-finish.md" },
        { "name": "tmpl-release-delete", "path": ".claude/commands/tmpl-release-delete.md" },
        { "name": "tmpl-release-list", "path": ".claude/commands/tmpl-release-list.md" },
        { "name": "tmpl-release-list-active", "path": ".claude/commands/tmpl-release-list-active.md" },
        { "name": "tmpl-version-bump", "path": ".claude/commands/tmpl-version-bump.md" }
      ]
    }

Rules for filling it in:

- `stack` — list every technology detected or chosen in Steps 1–4. Use short
  lowercase identifiers (e.g., `"python"`, `"fastapi"`, not `"Python 3.11"`).
- `plugins.*` — one entry per role/guide/guideline/refactoring doc you either
  kept from the curated set or generated in Step 2. `enabled: false` entries
  are kept in the file but skipped at load time (mirrors `ai-settings.md`
  checkboxes — keep them in sync). Each entry **must** include `name`,
  `path`, `enabled`. Also include `source` (`"curated"` if the file
  shipped with the template under `ai-instructions/`, `"generated"` if
  bootstrap wrote it from a template in `ai-instructions/bootstrap/templates/`)
  so `/tmpl-verify` can tell the two apart and so future regenerations
  know what is safe to overwrite. `description` (one-line) is optional but
  recommended for human readers — populate it from the file's first
  non-frontmatter line when present.
- `commands` — list every file in `.claude/commands/`. This lets verification
  catch orphaned command files.
- `layout` — copy `kind`, `modules[]`, and `exceptions[]` from
  `configure.json.layout`. The `modules[]` array is the source of truth
  for what code lives where; the release commands enforce R1 (files only
  inside declared module paths) against this list. **Do not invent
  modules** the user did not declare; if Step 3a in `/tmpl-setup`
  recorded a single-module project, do not split it into backend/frontend
  here.
- `layout.exceptions` — same array `/tmpl-setup` produced. Each exception
  must already have a recorded `reason`. Do not add new exceptions in
  bootstrap.

### Verification pass

After writing the manifest, verify every declared path exists on disk:

1. For each entry in `plugins.*.path` and `commands[].path`, check the file
   exists. Missing files are an error — either the file must be generated or
   the entry removed.
2. For each module in `layout.modules[]`, check the `path` exists OR is
   explicitly planned for the first release. Do not fail if absent on a
   greenfield project. Also check the `manifest` (when declared) exists,
   except in greenfield mode.
3. If any plugin is referenced by `AGENTS.md`, `AI_INSTRUCTIONS.md`, or
   `ai-settings.md` but missing from `ai-plugins.json`, report the drift.

Present verification results:

> **Plugin manifest verification**
> - Roles: {n} enabled, {n} disabled, {n} missing
> - Guides: {n} enabled, {n} disabled, {n} missing
> - Guidelines: {n} enabled, {n} disabled, {n} missing
> - Refactoring: {n} enabled, {n} disabled, {n} missing
> - Commands: {n} present, {n} missing
> - Layout: {ok / needs migration}
>
> {If missing > 0:} Missing files:
> - `{path}` — referenced by `{where}`
>
> Fix now, or proceed and leave placeholders for the user to fill in later?

`ai-plugins.json` is re-verified at the start of every `/tmpl-release-new`,
`/tmpl-release-edit`, and `/tmpl-release-finish` run. If verification fails at that
point, the command halts and asks the user to re-run `/tmpl-bootstrap` or fix the
manifest manually.

---

## Step 6: Generate CLAUDE.md

**Important:** CLAUDE.md goes at the **project root** (one level above
`ai-instructions/`), not inside `ai-instructions/`. Copy `CLAUDE.template.md`
to `../CLAUDE.md` (replacing the lean index file) and resolve all placeholders:

The template uses ~24 distinct placeholders. They fall into two
buckets — **detected** (substitute from a known source) and
**descriptive** (write 1–3 sentences from `project-summary.md` /
`configure.json` / repo scan; if no source exists, leave
`<!-- TODO: fill in -->`).

**Detected placeholders** (substitute exact values):

| Placeholder | Source |
|---|---|
| `{PROJECT_DESCRIPTION}` | `configure.json.project.description` (one-liner) |
| `{SETUP_COMMAND}`, `{DEV_COMMAND}` | Always `./setup.sh` and `./run.sh`. Generated during the first `/tmpl-release-new` (Step 7 of `commands/tmpl-release-new.md`). Do not substitute raw framework commands here. |
| `{BACKEND_START_COMMAND}` | Detected from `src/backend/` framework config (used in the "manual" block) |
| `{FRONTEND_START_COMMAND}` | Detected from `src/frontend/package.json` `"dev"` script |
| `{BACKEND_TEST_COMMAND}`, `{FRONTEND_TEST_COMMAND}` | Detected from each side's test framework config |
| `{DOCKER_BUILD_COMMANDS}`, `{DOCKER_COMPOSE_COMMAND}` | Detected from `Dockerfile` / `docker-compose.yml`. If neither exists, **remove the entire Docker section** rather than leaving an empty placeholder. |
| `{VERIFICATION_COMMANDS}` | List the actual check scripts in this repo (lint, typecheck, tests, smoke). Pull from `package.json` scripts / `Makefile` / `pyproject.toml` `[tool.poe.tasks]`. |
| `{ENV_CHECK_COMMAND}`, `{UNIT_TEST_COMMAND}`, `{INTEGRATION_TEST_COMMAND}`, `{E2E_CHECK_COMMAND}` | Detected per-stack from test runners and env validators. Leave the row out of the Verification table when the project has no entry for it. |
| `{LAYOUT_TREE}` | Render an ASCII tree of `ai-plugins.json.layout.modules[]`. One line per module showing `path`, `kind`, `language`, and whether it is `independent`. See CLAUDE.template.md "Project Layout — Module-driven" section for the exact format. |
| `{ARCHITECTURE_PER_MODULE}` | For each module, emit one `### {Module name} (`{path}`)` subsection with key files, manifest path, start command, and test command. Skip start/test for modules that have none (docs, raw IaC, etc.). |
| `{BACKEND_DIR}`, `{FRONTEND_DIR}` | **Deprecated** — replaced by per-module substitution above. Older CLAUDE.template.md drafts hardcoded these; the current template uses `{LAYOUT_TREE}` + `{ARCHITECTURE_PER_MODULE}` instead. If you find these placeholders in a stale template copy, regenerate from `ai-instructions/CLAUDE.template.md`. |
| `{LIST_REQUIRED_AND_OPTIONAL_ENV_VARS_WITH_DESCRIPTIONS}` | Scanned from `.env.example` (group as required vs optional with one-line descriptions) |
| `{DESCRIBE_CI_CD_PIPELINE_AND_DEPLOYMENT_APPROACH}` | Detected from `.github/workflows/` + any deploy scripts. Mention the runner, the trigger, the deploy target. |
| `{ONLY_IF_SHARED_EXISTS}` | If `src/shared/` doesn't exist, **remove the entire `### Shared` subsection** (do not leave a stub). |

**Descriptive placeholders** (write narrative; fall back to `<!-- TODO: fill in -->` if no source):

| Placeholder | Source |
|---|---|
| `{DESCRIBE_THE_MAIN_DATA_FLOW}` | `project-summary.md` Architecture section — numbered steps from input to output |
| `{LIST_KEY_FILES_AND_THEIR_RESPONSIBILITIES}` | Scan `src/backend/` and `src/frontend/` entry points + module roots. One line per file. |
| `{DESCRIBE_DI_PATTERNS,_ERROR_HANDLING,_TESTING_APPROACH,_STORAGE_APPROACH}` | Distill from `docs/conventions/{lang}.md` (written by `/tmpl-setup` Step 5k) plus stack-specific guides under `ai-instructions/guides/`. |
| `{DESCRIBE_WHERE_DATA_LIVES}` | Pull from the database/cache rows in `configure.json.stack` and any persistence patterns documented in the active guides. |
| `{LIST_FILES_THAT_DEFINE_CONTRACTS}` | Models, schemas, API specs, OpenAPI/protobuf files. Empty list is OK — say "None" rather than leaving the placeholder. |
| `{DESCRIBE_RULES_SPECIFIC_TO_YOUR_DATA_PIPELINE}`, `{LIST_KNOWN_FAILURE_PATTERNS}` | Pipeline section — only if `project-summary.md` describes a pipeline. Otherwise **remove the Pipeline Rules section entirely**. |
| `{ADD_OR_REMOVE_LAYERS_AS_NEEDED}` | Add an extra row to the Service Architecture table (e.g., "queue", "scheduler") or remove the whole subsection if the stack has none. |
| `{STAGE_1}`, `{STAGE_2}`, `{WHAT_TO_INSPECT}`, `{COMMON_CAUSES}` | One row per pipeline stage. **Remove the Debugging-by-Stage table entirely** when the project has no pipeline (no worker, no extraction, no batch jobs). |

**Remove** sections that don't apply (decide based on declared modules
and stack — not on assumptions). The CLAUDE.template.md ships with
sections covering the most common shapes; trim what isn't relevant:

- No `client`-kind module → remove Frontend Rules, Tailwind CSS,
  Frontend Testing
- No `server`-kind module → remove Service Architecture Rules, Worker
  Rules, route/handler discussions
- No `iac`-kind module → remove any Deployment / Infra-as-Code
  subsection
- No `mobile`-kind module → remove Mobile-specific subsections (none
  ship by default; add if needed)
- No pipeline / data flow described in `project-summary.md` →
  remove Pipeline Rules, Debugging by Pipeline Stage
- No worker / background job described → remove Worker / Background
  Job Rules
- No `Dockerfile` / `docker-compose.yml` detected → remove Docker
  section

**Add** sections for technologies not in the template if relevant (e.g., Mobile
Structure, GraphQL Rules, Database Migration Rules).

Any placeholder that cannot be resolved → replace with `<!-- TODO: fill in -->`
so the user can complete it later.

---

## Step 7: Customize AGENTS.md

1. **Loading Order** — ensure the numbered list under "How To Use This Pack"
   contains, in order: `AGENTS.md`, `../ai-settings.md`, `../ai-plugins.json`,
   `releases/`, then the filtered `roles/` / `guides/` / `guidelines/` /
   `refactoring/` entries, then `../docs/` (project-facing onboarding,
   gitflow, role docs, conventions — produced by `/tmpl-setup`), then repo
   docs, then project code. Add `ai-plugins.json` and `docs/` explicitly if
   the template did not list them.

2. **Default Mental Model** — replace the placeholder with the project's actual
   data flow extracted from requirements. If not available, write a brief
   description based on the stack profile.

3. **Role Selection** — list only the active roles with correct file paths.
   Remove entries for disabled roles.

4. **Technology Guides** — list only the active guides (curated and generated)
   with correct file paths.

5. **Refactoring Guides** — list only the active refactoring docs with correct
   file paths.

6. **Project Docs** — add a short section pointing at `../docs/` with entries
   for every file produced by `/tmpl-setup` and `/tmpl-bootstrap`:
   `project-summary.md`, `onboarding.md`, `gitflow.md`, `code-review.md`
   (Full only), per-role files under `docs/roles/`, per-language files
   under `docs/conventions/`, and **`ai-workflow.md`** (the human-readable
   AI pack explainer written by Step 8b). Plus the project-root
   `README.md` as the entry point.

---

## Step 8: Customize AI_INSTRUCTIONS.md

1. **Loading order** — the numbered list at the top must include
   `../ai-plugins.json` (always loaded, between `../ai-settings.md` and
   `releases/`) and `../docs/` (always available, loaded after the filtered
   instruction-pack folders). Add them explicitly if the template did not
   list them.

2. **Where to find what** — add entries for all generated files, including
   `configure.json`, `project-summary.md`, every `docs/` file produced
   by `/tmpl-setup`, and **`docs/ai-workflow.md`** (written by Step 8b).
   Remove entries for disabled files.

3. **Mandatory output rules** — remove rule sections that don't apply to the
   stack. Add new stack-specific rules if relevant (e.g., "Go Error Handling
   Rules" for Go projects).

4. **Roles in this project** — update the table to list only active roles.

---

## Step 8b: Generate `docs/ai-workflow.md` (human-readable AI workflow guide)

`AGENTS.md` and `AI_INSTRUCTIONS.md` are written for AI agents — terse,
loading-order-driven, structured for machine consumption. A new team
member opening them sees a wall of directives and can't quickly answer
"what is this AI workflow and how do I use it?" Step 8b solves that by
writing a single narrative explainer at `../docs/ai-workflow.md` that
mirrors what's in those files but in human-friendly prose, with
concrete examples and pointers back to the canonical AI files for
deeper detail. This doc lives alongside `onboarding.md` /
`gitflow.md` / `project-summary.md` so a human reader who lands in
`docs/` can build a complete mental model of the project (product +
process + AI tooling) without ever opening `ai-instructions/`.

Generate the file with the structure below. Substitute the bracketed
values from `configure.json` and `ai-plugins.json` (read both — they
are already on disk by Step 5).

    # AI Workflow

    This project uses an **AI instruction pack** — a set of files under
    `ai-instructions/` that shape how an AI coding assistant
    (Claude Code, Cursor, etc.) understands and changes this codebase.
    You don't need to read those files to work here: this guide
    summarizes everything a human contributor needs.

    ## When you'd use the AI

    - Adding a feature → `/tmpl-release-new [name]`
    - Editing an existing feature → `/tmpl-release-edit [name]`
    - Finalizing and marking a feature done → `/tmpl-release-finish [name]`
    - Auditing project state → `/tmpl-analyze`
    - Adjusting setup (stack, roles, integrations, …) → `/tmpl-reconfigure`
    - Sanity-checking the AI manifest after manual edits → `/tmpl-verify`

    Run them by typing the slash command in the AI tool's chat. Each
    one is self-contained — the AI walks you through the steps and
    asks for confirmation at decision points (controlled by
    `approval_rate`, see below).

    ## Lifecycle (how this project was set up, and how it evolves)

    1. **`/tmpl-setup`** — collected the project's decisions: stack,
       conventions, gitflow, hooks, CI, integrations, team roles. The
       answers were saved to `ai-instructions/configure.json` and
       generated the workflow artifacts you see in the repo
       (`.gitignore`, `.editorconfig`, `.pre-commit-config.yaml`,
       `.github/`, `docs/onboarding.md`, etc.).
    2. **`/tmpl-bootstrap`** — read the decision record and generated the
       AI instruction pack (`ai-plugins.json`, `ai-settings.md`,
       project-specific `CLAUDE.md`, role / guide / guideline /
       refactoring file selection). Pure generator, no questions.
    3. **`/tmpl-release-new`** — implemented the first feature. The first
       run also wrote `setup.sh` + `run.sh`. Every subsequent feature
       is another `/tmpl-release-new`.
    4. **`/tmpl-reconfigure`** — used later to change setup decisions
       (swap a database, add a role, toggle a plugin). The free-form
       version reads the project state and proposes changes.

    ## The two settings that change AI behavior

    - **`mode`** (in `ai-settings.md` and `ai-plugins.json`) — how
      chatty release commands are when gathering requirements.
        - `auto` — 0–3 questions per release; for solo work or strong
          upstream specs.
        - `semi-auto` — 5–10 questions; typical team work.
        - `manual` — 10–20 questions; discovery-heavy or vague specs.
      Current value: **{mode}**.
    - **`approval_rate`** (in `ai-plugins.json`) — how often the AI
      pauses for your approval before writing files.
        - `auto` — write everything immediately, no gates.
        - `per-category` — pause once per logical group of files.
        - `per-file` — confirm each file individually.
      Current value: **{approval_rate}**.
      Override per-command via `approval_rate_overrides.{command}` in
      `ai-plugins.json`. Some operations (creating Confluence pages,
      opening Jira tickets, opening PRs) **always** prompt regardless
      of `approval_rate` because external state can't be undone by
      editing a file later.

    ## Where things live

    Project root:

    - `README.md` — landing page (this is what a stranger reads first).
    - `CLAUDE.md` — AI entry point (project-specific). Loaded by the
      AI tool on every session.
    - `ai-settings.md` — human-facing pipeline toggles + mode. Edit
      checkboxes here to enable / disable role / guide / guideline /
      refactoring docs. Stays in sync with `ai-plugins.json`.
    - `ai-plugins.json` — machine manifest counterpart of
      `ai-settings.md`. Verified by every release command.
    - `setup.sh` / `run.sh` — the project's only canonical entry
      points (written by the first `/tmpl-release-new`).

    `docs/` (everything human-readable):

    - `project-summary.md` — what the product is, who it's for.
    - `onboarding.md` — environment setup, first-week flow.
    - `gitflow.md` — branches, commits, PRs.
    - `code-review.md` — review checklist (Full scope only).
    - `conventions/{language}.md` — code conventions per language.
    - `roles/{role-slug}.md` — per-role onboarding doc (one per
      `team_roles[]` entry from `/tmpl-setup`).
    - `ai-workflow.md` — this file.
    - `images/ui/`, `images/architecture/` — preserved imagery from
      the source requirements.

    `ai-instructions/` (everything AI-targeted — read this only if
    you want to understand how the AI thinks):

    - `AGENTS.md` — the AI's loading order and rules entry point.
    - `AI_INSTRUCTIONS.md` — task protocol, output rules, loading
      priorities.
    - `configure.json` — decision record, written by `/tmpl-setup`.
    - `roles/` — AI thinking-mode personas. The set enabled for this
      project comes from `team_roles[]`.
    - `guides/` — condensed per-stack operational reference.
    - `guidelines/` — full normative reference (Full scope only).
    - `refactoring/` — process docs for cleanup passes.
    - `commands/` — detailed implementation of each slash command.
    - `releases/` — one folder per release, with `requirements.md`
      and `tasks.md`.

    ## Day-to-day flow

    1. Open the AI tool. It auto-loads `CLAUDE.md`, then
       `ai-settings.md`, `ai-plugins.json`, then any role / guide
       file matching the task (filtered by the checkboxes in
       `ai-settings.md`).
    2. Type a slash command (`/tmpl-release-new`, `/tmpl-release-edit`, …).
    3. Answer the questions the command asks. The number of questions
       depends on `mode`.
    4. Approve or edit each file the AI proposes. The frequency of
       prompts depends on `approval_rate`. Files are staged in
       `/tmp/claude-*` and opened as tabs in your editor (VS Code,
       Cursor, JetBrains) so you can read them with syntax
       highlighting before approving.
    5. The release lands as a folder under
       `ai-instructions/releases/`, plus the actual code changes
       under the project's declared modules (see
       `ai-plugins.json.layout.modules[]`).

    ## Active configuration

    - **Stack:** {short summary from `configure.json.stack`}
    - **Modules:** {list of `name (path, kind)` from `layout.modules[]`}
    - **Active AI roles:** {list of enabled `plugins.roles[].name`}
    - **Active guides:** {count} ({list of `plugins.guides[].name` enabled})
    - **Mode:** {mode}
    - **Approval rate:** {approval_rate}

    ## When this guide goes stale

    `/tmpl-setup` and `/tmpl-reconfigure` regenerate this file on every run
    so the "Active configuration" section above stays accurate. If
    you edit the AI instruction files manually (e.g., flip a
    checkbox in `ai-settings.md`), re-run `/tmpl-reconfigure` or
    `/tmpl-verify` to keep the human-readable doc in sync. If you
    spot drift, the canonical AI-targeted source is `AGENTS.md` +
    `AI_INSTRUCTIONS.md`.

    ## Going deeper

    - `ai-instructions/AGENTS.md` — the AI's own version of this
      guide (loading order, role selection, technology guides).
    - `ai-instructions/AI_INSTRUCTIONS.md` — task protocol, mandatory
      output rules, self-check checklist.
    - `ai-instructions/commands/{command}.md` — detailed step-by-step
      for each slash command.
    - `ai-plugins.schema.json` — JSON schema for `ai-plugins.json`.

The same content also gets a brief "AI Workflow" mention in `README.md`
(Step 9 below) — but the README block is just an entry point that
links here. This file is where the actual explanation lives.

If `docs/ai-workflow.md` already exists from a prior run, regenerate
it in place (the doc is fully deterministic from `configure.json` +
`ai-plugins.json`, so re-runs are safe). The file has no hand-edit
markers — re-running `/tmpl-bootstrap` overwrites it cleanly.

---

## Step 9: Update README.md (Quickstart + AI Workflow)

`/tmpl-setup` Step 5a wrote a project-facing `README.md` at the root and
left a single delimiter comment marker as the last line:

    <!-- /tmpl-bootstrap appends below this line -->

Append (or, on a re-run, replace) everything below that marker with the
section described here. Two markers in total wrap the bootstrap-owned
block so re-runs are idempotent — find the existing block by scanning
for the closing marker and overwrite between them.

Output (markdown, written verbatim — substitute the bracketed values):

    <!-- /tmpl-bootstrap appends below this line -->

    ## AI Workflow

    This project uses an AI instruction pack — slash commands like
    `/tmpl-release-new` and `/tmpl-reconfigure` walk the AI through structured
    workflows for feature work, edits, and project setup.

    Full human-readable explanation:
    **[docs/ai-workflow.md](docs/ai-workflow.md)** — what each
    command does, the lifecycle, where files live, what `mode` and
    `approval_rate` mean, and how the AI loads context.

    ### Quick reference

    - `/tmpl-release-new [name]` — start a new feature.
    - `/tmpl-release-edit [name]` — modify an existing release.
    - `/tmpl-release-finish [name]` — finalize and mark a release done.
    - `/tmpl-release-list` / `/tmpl-release-list-active` — show release status.
    - `/tmpl-reconfigure` — change setup decisions (stack, roles, etc.).
    - `/tmpl-analyze` — read-only project audit.
    - `/tmpl-verify` — sanity-check `ai-plugins.json`.

    ### Active stack

    - **Roles:** {comma-separated list of enabled roles from
      ai-plugins.json `plugins.roles[].name` where `enabled: true`}
    - **Guides:** {count} active ({list of names})
    - **Mode:** {ai-settings.md mode value} ({auto / semi-auto / manual})
    - **Approval rate:** {ai-plugins.json approval_rate value}

    ### First-time setup

    Run `/tmpl-release-new` to scaffold the first feature. That command
    also writes `setup.sh` and `run.sh`, after which the canonical
    flow is:

        ./setup.sh   # idempotent: install deps, migrate, generate .env
        ./run.sh     # dev servers per the project's modules

    <!-- /tmpl-bootstrap appends above this line -->

The two delimiter comments (`appends below this line` /
`appends above this line`) demarcate the bootstrap-owned block. On
re-run, locate both markers and replace everything between them.
Never duplicate the section, never strip the markers, and never edit
content above the opening marker (that belongs to `/tmpl-setup`).

If `README.md` is missing entirely (e.g., the user deleted it after
`/tmpl-setup` ran), regenerate the `/tmpl-setup` portion first by
re-reading `configure.json` and `project-summary.md` — do not write
the bootstrap section in isolation.

---

## Step 10: Verify and Present

After all generation and configuration is complete:

1. **List all files** created, modified, and disabled:
   - New files generated
   - Existing files configured
   - Files unchecked in ai-settings.md

2. **Check cross-reference consistency**:
   - Every file referenced in AGENTS.md exists
   - Every file referenced in AI_INSTRUCTIONS.md exists
   - Every file in guides/, roles/, refactoring/ has an ai-settings.md entry
   - All paths in ai-settings.md checkboxes point to real files
   - `ai-plugins.json` lists every enabled file and every command, and every
     path in it resolves on disk (re-run the Step 5 verification pass)

3. **Flag TODOs** — list any `<!-- TODO -->` placeholders left in CLAUDE.md
   for the user to fill in

4. **Present summary**:
   > Bootstrap complete. Here is your instruction pack:
   >
   > **Stack**: {stack summary}
   > **Active roles**: {count} / {total}
   > **Guides**: {count curated} curated + {count generated} generated
   > **Files created**: {list}
   > **Files configured**: {list}
   >
   > Next steps:
   > - Review generated guides for accuracy
   > - Fill in any TODO placeholders in CLAUDE.md
   > - Review ai-settings.md and adjust if needed
   > - Run `/tmpl-release-new` to start your first feature
   > - Delete `bootstrap/` when you are satisfied with the setup

---

## Release Management

After bootstrap, all project requirements live in `releases/`. Each release
or major feature gets its own subfolder. The AI creates these automatically.

### During configure

The initial requirements gathered by `/tmpl-setup` Step 1 are saved to
`releases/init/project-summary.md` before bootstrap runs.

### During development

When working on a new release or feature:

1. Create a folder under `releases/` named after the release:
   `releases/v1.1-auth/`, `releases/2026-Q2-payments/`, `releases/sprint-5/`
2. Put requirements, specs, or notes for that release inside
3. The AI reads all releases to understand the project's evolution

The AI should create release folders automatically when implementing a new
feature or release. If the user says "let's add authentication" and no release
folder exists for it, create `releases/{appropriate-name}/` and save the
requirements there before starting implementation.

### Naming convention

Any sortable naming works. Recommended patterns:
- Version-based: `v1.0/`, `v1.1/`, `v2.0/`
- Date-based: `2026-05-mvp/`, `2026-07-auth/`
- Sequential: `01-mvp/`, `02-auth/`, `03-payments/`
