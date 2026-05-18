# Command: /tmpl-setup

`/tmpl-setup` is the first command run on a new project, before
`/tmpl-bootstrap`. It collects every up-front decision (stack, code conventions,
gitflow, issue tracker, CI, documentation) and writes them to a decision
record at `ai-instructions/configure.json`. It also generates the workflow
artifacts — git configuration, hooks, CI workflows, onboarding documents,
and the initial pull request.

`/tmpl-bootstrap` consumes the decision record and generates the AI instruction
pack. `/tmpl-release-new` then produces application code.

Order of operations on a new project:

    /tmpl-setup   →   /tmpl-bootstrap   →   /tmpl-release-new

---

## Hard Rules (apply during configure AND every release after)

1. Application code lives **only inside paths declared in
   `ai-plugins.json.layout.modules[]`** (decided during Step 3a) or in
   `layout.exceptions[]` with a recorded reason. There is no fixed
   "`src/`" rule — modules can live at any path the user picks (e.g.,
   `src/backend/` for a server module, `terraform/` for IaC, `src/` for
   a library, `docs/` for a docs site). The shape is project-specific.
2. Folder and file names use lowercase letters, digits, and hyphens only.
3. Backend and frontend are independent subtrees with their own manifests.

---

## Step 0: Prerequisites Check

`/tmpl-setup` (and every later command — `/tmpl-bootstrap`, `/tmpl-release-new`,
`/tmpl-release-edit`, `/tmpl-release-finish`, `/tmpl-reconfigure`) depends on a small
set of runtime prerequisites: git state, MCP servers, and an editor
CLI. Step 0 inventories each one, probes its status, and — for
anything that fails — offers **fix / skip / abort** with an explicit
warning about what functionality is lost on skip. Raw REST and
CLI-based access to GitHub / Jira / Confluence is not permitted; only
the MCPs.

### 0a. Inventory of prerequisites

| # | Prerequisite | Class | Probe | Used by |
|---|---|---|---|---|
| 1 | **Git working tree** | required | `.git/` + `origin` remote + `user.name`/`user.email` + clean tree | every later step |
| 2 | **GitHub MCP** (`mcp__*github*`) | required when `integrations.github.enabled` | list authenticated user | 5i branch protection, 5n initial PR + Tech Lead review ticket fallback, 5o role-onboarding tickets fallback, GitHub Issues tracker |
| 3 | **Atlassian MCP** (`mcp__*Atlassian*`) | recommended | list accessible Confluence spaces + Jira projects | live Confluence pages (5m), live Jira tickets (5l, 5n review ticket, 5o per-role onboarding tickets) |
| 4 | **IDE MCP** (`mcp__ide__executeCode`, `mcp__ide__getDiagnostics`) | optional | both tools listed in the session | live diagnostics + in-IDE code execution during `/tmpl-release-new` validation |
| 5 | **Editor CLI** (`code` / `cursor` / `idea` / `pycharm` / `webstorm`) | recommended when `approval_rate ≠ auto` | host-terminal env vars (`TERM_PROGRAM`, `TERMINAL_EMULATOR`) → `command -v` PATH probe | tabbed review of staged proposals at every Step 5 gate |

**Required** prereqs cannot be skipped — only **fix** or **abort**.
**Recommended** and **optional** prereqs can be skipped, but the user
must see the lost-functionality warning first.

### 0b. The check loop (run for each prerequisite, in table order)

For each item in 0a, run this loop:

1. **Probe.** Run the probe described in the table. Record `ok` /
   `missing` / `unauthenticated` / `unreachable`.
2. **On success** — record OK in the working record and continue to
   the next item.
3. **On failure** — present a single decision block:

   > **{Prerequisite} — {missing | unauthenticated | unreachable}**
   >
   > Without it, the following will not be supported:
   > - {bullet list of lost functionality, drawn from 0c}
   >
   > To fix:
   >
   > {exact install or repair commands from 0c}
   >
   > Reply: **fix** (you'll install/repair and reply `done` when
   > ready), **skip** (continue without it — see warning above),
   > **abort** (halt the whole `/tmpl-setup` run).

   For **required** items, omit the **skip** option from the prompt.

4. **On `fix`** — wait for the user's `done` reply, then re-probe.
   Loop until success, the user changes the answer, or aborts.
5. **On `skip`** — append the prereq's identifier to
   `configure.json.skipped_prereqs[]`, flip the dependent
   integration flags (see 0c per-item), echo the warning back to
   the user verbatim so the cost is unmistakable, and continue.
6. **On `abort`** — halt the whole `/tmpl-setup` run. Preserve any
   working state already captured (no destructive cleanup).

### 0c. Per-prerequisite details — fix paths, skip warnings, dependent flags

#### 1. Git working tree (required)

`/tmpl-setup` opens an initial PR in Step 5n, so the working tree must
be ready to push.

**Fix paths:**
- `.git/` missing → ask the user once, then run `git init` if they
  agree.
- `origin` remote missing or not pointing at a GitHub repo the
  authenticated MCP user can push to:

      git remote add origin git@github.com:{org}/{repo}.git
      git push -u origin main

- `git config user.name` / `git config user.email` missing → ask once
  and set via `git config --local`.
- Working tree dirty with **unrelated** changes (i.e., not from a
  prior partial `/tmpl-setup` run) → ask the user to commit or stash
  first.

**Skip:** not allowed. Required.

#### 2. GitHub MCP (required when `integrations.github.enabled`)

**Fix:**

    # Local server authenticated with a Personal Access Token.
    # Replace ghp_xxx with a PAT scoped to repo, workflow, read:org at minimum.
    claude mcp add github --env GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxx \
        -- docker run -i --rm -e GITHUB_PERSONAL_ACCESS_TOKEN \
               ghcr.io/github/github-mcp-server

Then restart the session and reply `done`.

**Skip warning** (only if the user explicitly confirms the project
does not use GitHub — otherwise this prereq is required, not
recommended):

> Skipping the GitHub MCP. The following will NOT be supported:
> - Step 5i: branch protection rules on `main`
> - Step 5n: initial PR + Tech Lead review (review checklist will be
>   written to a local file under `docs/` instead)
> - Step 5o: per-role onboarding tickets (no GitHub Issues fallback)
> - GitHub Issues as the tracker (Jira is the only remaining option)
> - Auto-PR-labeling, CODEOWNERS auto-assign, and the
>   `pr-title-check` workflow at later commands
> - Step 5g.1: the AI PR review workflow (no GitHub Actions to host it
>   — the equivalent for non-GitHub CI is documented as a TODO)

On skip, set `integrations.github.enabled: false` and skip every
GitHub-dependent step downstream.

#### 3. Atlassian MCP (recommended)

The Atlassian MCP provides both Jira and Confluence. Verify each
capability with one read-only call per probe (list accessible Jira
projects, list accessible Confluence spaces).

**Fix:**

    claude mcp add --transport sse atlassian https://mcp.atlassian.com/v1/sse

Then restart the session and reply `done`.

**Skip warning** (this is the existing **local-docs fallback** —
preserved verbatim from the prior step):

> Skipping the Atlassian MCP. Switching to **local-docs mode**:
> - Confluence pages → generated as static HTML under
>   `docs/confluence/` (Confluence-style UI; not live)
> - Jira → disabled entirely (no review ticket, no per-role
>   onboarding tickets, no `{KEY}-{NUMBER}` enforcement on
>   branches/PRs/commits)
> - Tracker defaults to **GitHub Issues** (when the GitHub MCP is
>   live)
>
> Re-run `/tmpl-setup` after installing the Atlassian MCP to switch
> back to live mode.

On skip, set:

    "integrations.confluence.enabled": false,
    "integrations.confluence.local_fallback": true,
    "integrations.confluence.local_path": "docs/confluence/",
    "integrations.jira.enabled": false

Then skip every Jira-dependent step (5l, 5n Jira ticket, 5o per-role
onboarding tickets) and replace step 5m's Confluence-MCP calls with
the local-docs generator described in that step.

The same fallback fires automatically when the MCP is present but
returns 0 accessible Confluence spaces or rejects the auth probe —
treat it as if the user picked **skip** without re-prompting, and
print the warning anyway so the user knows local-docs is in effect.

#### 4. IDE MCP (optional)

Provides `mcp__ide__executeCode` and `mcp__ide__getDiagnostics`.

**Fix:**
- Open VS Code or Cursor.
- Install / enable the **Claude Code** extension from the
  marketplace.
- Reload the editor and run `/tmpl-setup` from the **integrated
  terminal** (the MCP is auto-mounted there). Reply `done` once the
  tools appear in the session.

**Skip warning:**

> Skipping the IDE MCP. The following will NOT be supported:
> - Live in-editor diagnostics during `/tmpl-release-new` validation
>   (commands fall back to running the project's CLI tools — same
>   correctness, no in-tab squiggles)
> - In-IDE code execution snippets used by some guides
>   (`mcp__ide__executeCode`)
>
> No project-level functionality is lost — only the IDE-side polish.

On skip, set `integrations.ide_mcp.enabled: false`. Release commands
read this and skip the diagnostics-via-MCP path.

#### 5. Editor CLI (recommended when `approval_rate ≠ auto`)

The Step 5 approval gates open staged files in the host editor as
tabs. Detection priority (per-run, cached after first probe):

1. Explicit override: `review_editor` in `ai-plugins.json` ≠ `auto`.
   `chat-only` disables tabs entirely; honor it without probing.
2. Host-terminal env vars: `TERM_PROGRAM=vscode` / `=cursor` /
   `TERMINAL_EMULATOR=JetBrains-JediTerm`.
3. PATH probe: `command -v code` → `cursor` → `idea` / `pycharm` /
   `webstorm`.

The check is **conditionally fired**: skip it entirely when Step 2c
will resolve to `approval_rate: auto` (no gates, no tabs). Run it
otherwise. Because Step 2c hasn't happened yet at this point,
**default to running the check** — flipping it off later is cheap; a
missing CLI discovered mid-run is not.

**Fix:**
- VS Code → Command Palette → **"Shell Command: Install 'code'
  command in PATH"**
- Cursor → Command Palette → **"Shell Command: Install 'cursor'
  command in PATH"**
- JetBrains → Tools → **Create Command-line Launcher** (or
  Settings → Tools → Terminal)

Reply `done` once the CLI is on PATH.

**Skip warning:**

> Skipping the editor CLI. Setting `review_editor: chat-only` for
> this run. The following changes:
> - Step 5 approval gates print proposed file content **inline in
>   chat** instead of opening editor tabs (no syntax highlighting,
>   no diff view, no inline editing)
> - Modifications to existing files print the full new content
>   rather than a diff
>
> All gating still happens — only the presentation downgrades.

On skip, set `review_editor: chat-only` in the working record (and
write it to `ai-plugins.json` during `/tmpl-bootstrap`).

### 0d. Record the result

After every prereq has been resolved, the working record contains:

    "prereqs": {
      "git":           { "status": "ok" },
      "github_mcp":    { "status": "ok | skipped" },
      "atlassian_mcp": { "status": "ok | skipped" },
      "ide_mcp":       { "status": "ok | skipped" },
      "editor_cli":    { "status": "ok | skipped", "detected": "vscode | cursor | intellij | pycharm | webstorm | none" }
    },
    "skipped_prereqs": ["atlassian_mcp", "ide_mcp"]

`/tmpl-bootstrap` reads `prereqs` to know which integration files to
generate. Release commands read `skipped_prereqs` to short-circuit
features whose prerequisites the user declined.

Print a one-line summary before moving on:

> Prereqs: git OK · GitHub MCP OK · Atlassian MCP **skipped (local-docs)** · IDE MCP OK · editor CLI **vscode**.

If the user changes their mind later (e.g., installs the Atlassian
MCP after `/tmpl-setup` finished), re-running `/tmpl-setup` re-probes
every prereq from scratch and updates the dependent flags
accordingly.

---

## Step 1: Discover Requirements

This is the first substantive step. Run it before asking about scope, stack,
or anything else. `/tmpl-setup` owns all requirement gathering for the
project.

### 1a. Silent scan

Before speaking to the user:

1. Read every file in **all conventional requirements locations**, in
   order, until you find content. Treat all formats as input — text,
   markdown, exported docs, notes, specs, meeting minutes,
   diagrams-as-text, screenshots. Do not judge the format. Locations
   to check (deduplicate when more than one resolves):

   - `ai-instructions/releases/` — the canonical post-`/tmpl-setup`
     home (this is where `/tmpl-setup` itself writes
     `releases/init/project-summary.md`)
   - `requirements/` — common convention for project-level requirement
     docs at the repo root
   - `docs/requirements/` — common convention for repos that nest docs
     under `docs/`
   - `specs/`, `specifications/`, `product/` — alternates seen in the
     wild
   - Top-level files: `REQUIREMENTS.md`, `requirements.md`,
     `PRD.md`, `prd.md`, `SPEC.md`, `spec.md`
   - Anything the user explicitly named when invoking `/tmpl-setup`
     (e.g., a `--requirements-from {path}` argument, if supplied)

   When multiple locations have content, treat them all as input —
   they often complement each other (a top-level `REQUIREMENTS.md`
   summary + a `requirements/` folder with detailed specs). Record
   the source-of-truth paths in working memory; the same paths are
   used in 5a / 5d / 5e / 5m for image preservation.

   **Also count the media** while scanning: number of image files
   (`.png` / `.jpg` / `.jpeg` / `.gif` / `.svg` / `.webp` / `.bmp` /
   `.tiff`) and number of HTML / HTM requirement files. These counts
   are reported back to the user in Step 4's confirmation summary so
   they can spot a missed-scan early. If the user expected media but
   the counts are zero, that signals the scan paths missed
   something — Step 1c is the place to add the missing path.

2. Scan the project root for stack signals: `package.json`, `pyproject.toml`,
   `requirements.txt` (Python deps file — distinct from a
   `requirements/` directory of project requirements; check both),
   `go.mod`, `Cargo.toml`, `pom.xml`, `build.gradle`, `Gemfile`,
   `pubspec.yaml`, `tsconfig.json`, `docker-compose.yml`, any
   framework config files (`next.config.*`, `vite.config.*`,
   `angular.json`, Django settings), source layout (`src/`, `app/`,
   `lib/`, `terraform/`, `k8s/`, etc.).
3. Scan for existing git and workflow state: `.git/`, `.gitignore`,
   `.github/`, CI workflows, `.pre-commit-config.yaml`, `CODEOWNERS`.

Build an inventory of detected technologies with versions where available.

While scanning the requirements locations from step 1, also extract an
initial list of **user and team roles** mentioned anywhere — explicit
lists, stakeholders, personas, responsibility matrices, org-chart
diagrams. Use this list as the starting point for `team_roles[]` in
Step 3j. When no roles are named anywhere in the scanned material,
leave the candidate list empty and let Step 3j ask the user.

If **none** of the requirements locations contain content, treat the
project as greenfield from a requirements perspective. Step 1c will ask
the user openly (and Step 5a will write the resulting summary into
`releases/init/project-summary.md`, which becomes the canonical
post-`/tmpl-setup` home — the user can keep their existing
`requirements/` folder unchanged or move it; configure does not delete
either).

### 1b. Build knowledge map

Classify each of these six areas as **Known**, **Partial**, or **Unknown**
based on what the silent scan found:

| Area | What it covers |
|---|---|
| Vision | What the product is, who it's for, what problem it solves |
| Domain | Core concepts, entities, vocabulary, business rules |
| Tech stack | Languages, frameworks, databases, tools |
| Features | What the system should do, scope, priorities |
| Architecture | System shape, how components connect, data flow |
| Constraints | Performance, compliance, hosting, deadlines |

This map is internal. Do not present it to the user.

### 1c. Choose discovery depth (based on map)

Decide how deep to go in BA questioning, and tell the user:

- **4+ areas Known** — Skim mode: 0–3 clarifying questions, only if genuinely
  ambiguous. Proceed on the strength of the written requirements.
- **2–3 areas Known** — Targeted mode: 3–8 questions filling specific gaps.
  Skip areas already covered.
- **0–1 areas Known** — Guided mode: 10–20 questions, walking each area in
  order. This is a full BA discovery session.

Present the recommendation, then run the questions.

> I read {N files} in `releases/` and detected {short stack summary}. I am
> running **{skim | targeted | guided}** product discovery — expect
> **{0–3 | 3–8 | 10–20}** questions in this step.
>
> You can force a different depth: reply `skim`, `targeted`, or `guided`.

### 1d. Ask product questions

Only ask about areas classified **Partial** or **Unknown**. Group related
questions together — never one at a time. Use the defaults below to prompt
the user rather than asking blind.

**Vision** (if Partial/Unknown):
- What is this product in one sentence?
- Who are the target users?
- What problem does it solve that existing options don't?

**Domain** (if Partial/Unknown):
- What are the core concepts or entities (e.g., *order*, *invoice*,
  *patient*)? Give me the vocabulary.
- Any business rules or invariants worth calling out up front?

**Features** (if Partial/Unknown):
- What are the must-have features for the first release?
- What is explicitly out of scope for now?
- What is the single most important user flow to get right?

**Architecture** (if Partial/Unknown):
- Monolith or services? Single SPA or server-rendered? Any message bus?
- What talks to what? (Client → API → DB → background jobs → …)

**Constraints** (if Partial/Unknown):
- Performance targets (latency, throughput)?
- Compliance (HIPAA, GDPR, SOC2, etc.)?
- Hosting target (cloud provider, on-prem, edge)?
- Timeline or deadlines?

**Tech stack** is handled separately in Step 3b — do not ask about it here.
Just record what the silent scan detected.

### 1e. Summarize and confirm

Present a compact summary of what you now know. Ask for corrections before
continuing.

> Here is my understanding of the product:
>
> - **Idea**: {one-liner}
> - **Users**: {who}
> - **Problem**: {what}
> - **Must-have features**: {3–5 bullets}
> - **Architecture shape**: {one-liner}
> - **Key constraints**: {hosting, compliance, timeline}
>
> Correct anything? Otherwise say "go" and I'll move on to workflow scope.

Save this summary in memory — Step 5a writes it to
`ai-instructions/releases/init/project-summary.md`.

---

## Step 2: Choose Scope + Operating Modes

Three settings, asked together up front because they all govern how the
rest of `/tmpl-setup` (and every later command) behaves.

### 2a. Scope

Present three options with their tradeoffs. Recommend **Full** unless
the user has already indicated minimalism.

> How much do you want `/tmpl-setup` to set up?
>
> - **Core** — requirements summary, tech stack decisions, code conventions,
>   gitflow, `.gitignore` / `.gitattributes` / `.editorconfig`, pre-commit
>   hook (format + secret scan), pre-push checks (lint + typecheck), basic
>   onboarding doc. ~10 questions.
> - **Full** — Core plus branch protection rules, PR/issue templates,
>   CODEOWNERS, `SECURITY.md`, `CONTRIBUTING.md`, dependency automation, CI
>   baseline, release automation, code-review guide, commit-msg hook.
>   ~25 questions.
> - **Custom** — walks every question individually with a default you can
>   accept by hitting Enter.
>
> Which one? (core / full / custom)

Save the chosen scope. It controls which questions run in Step 3 and
which artifacts are generated in Step 5.

### 2b. Discovery mode

How chatty should release commands be when gathering requirements?
Default tracks scope: `core`→`auto`, `full`→`semi-auto`, `custom`→`manual`.
The user can override.

> Discovery mode for `/tmpl-release-new` and friends:
>
> - **auto** (~0–3 BA questions per release) — fastest; assumes the user
>   holds requirements in their head or has detailed upstream specs.
> - **semi-auto** (~5–10 questions) — typical team work; ask at decision
>   points, accept defaults otherwise.
> - **manual** (~10–20 questions) — discovery-heavy work; talk through
>   requirements before building.
>
> Pick one (default: {scope-derived value}).

Save as `discovery_mode` in the working record. This becomes
`mode` in `ai-plugins.json` and `ai-settings.md`.

### 2c. Approval rate

How often should `/tmpl-setup` (and later commands) pause for the user
to approve generated files before writing them?

> Approval rate when writing files:
>
> - **auto** — write everything immediately; no gates. Fastest.
> - **per-category** — pause at each major artifact group (~6–8 gates
>   in Full scope). Balance of oversight and speed.
> - **per-file** — show every file's content and confirm individually
>   (~30–40 gates in Full scope). Slow but maximum oversight.
>
> Pick one (default: **auto**).

**MCP-side-effect steps always gate regardless of this setting** —
creating a Confluence page, opening a Jira ticket, or opening a GitHub
PR all touch external state that cannot be undone by editing a file.
`/tmpl-setup` will show what it's about to send and wait for
confirmation even when `approval_rate: auto`.

Save as `approval_rate`. This propagates into `ai-plugins.json`
during `/tmpl-bootstrap` Step 5 and is read by every later command that
writes files.

---

## Step 3: Walk Questions

Every question has a **default** (shown in **bold**). In Core and Full modes,
ask only the questions in that scope's list — for the rest, apply the default
silently. In Custom mode, ask every question but present the default; the
user can accept with Enter or override.

Group related questions. Do not ask one at a time.

### 3a. Project classification + module declaration

Vision, users, and one-line description are already captured in Step 1.
The template makes **no assumption** about project shape. Get a clear
picture of (a) what the project is, and (b) what code modules it
contains, by extracting from the Step 1 scan first and asking the user
only for what the scan didn't reveal.

| # | Question | Default | Scope |
|---|---|---|---|
| 1 | Project kind (free-form short label) | **(extracted from Step 1 / asked when unclear)** — common values: `web-app`, `api`, `frontend-only`, `cli`, `library`, `mobile-app`, `iac`, `data-pipeline`, `ml-service`, `documentation-site`, `monorepo`, `browser-extension`, `desktop-app`, `embedded`, `game`, or any custom string | core |
| 2 | **Modules**: every code module the project contains | **(extracted from Step 1 / discussed with user)** — see "Module discovery" below | core |
| 3 | Layout exceptions: any files outside every declared module | **none** — only when the user names a specific path that must live elsewhere | full |

**Module discovery (question 2):**

A module is a self-contained unit of code with its own kind and (usually)
its own manifest. The shape of the project is the set of modules. Run
through this dialogue, do not pick from a fixed menu:

1. Read what the Step 1 scan found — `package.json`s, `pyproject.toml`s,
   `go.mod`s, `Dockerfile`s, `terraform/`, `k8s/`, `ansible/`, `docs/`,
   etc. Each is evidence of a module.
2. Present what was detected and ask the user to confirm or correct:
   > Based on what I found, this project has these modules:
   >   1. `src/backend/` — kind=server, language=python, manifest=pyproject.toml
   >   2. `src/frontend/` — kind=client, language=typescript, manifest=package.json
   >
   > Is that the full list? Anything to add, remove, or rename?
3. If the scan returned nothing meaningful (greenfield), ask:
   > What modules will this project have? Common shapes:
   >   - **Web app**: backend + frontend (two modules)
   >   - **API / single-language service**: one module
   >   - **Library / package**: one module + tests + (optionally) examples
   >   - **CLI**: one module
   >   - **Mobile**: one module (RN/Flutter) or two (ios + android)
   >   - **IaC**: one or more (terraform, k8s, ansible)
   >   - **Documentation site**: docs + (optional) theme
   >   - **Monorepo**: one entry per sub-project
   >   - Or describe your own shape.

For each module, capture: `name` (lowercase-hyphen), `path`
(project-root-relative), `kind` (free-form — use whatever describes the
module honestly: `server`, `client`, `lib`, `cli`, `iac`, `data`,
`docs`, `mobile`, `script`, `shared`, `firmware`, `game-asset`, etc.),
`language` (when there's a single primary one), `manifest` (when there
is one), `tests` (when there are any), `independent` (default `true` —
set `false` only for things like a `tests/` directory that shares the
parent module's manifest).

Record the result under `layout` in `configure.json` (see Step 4 example
for shape).

### 3b. Tech stack (always asked, scoped to declared modules)

The tech stack questions are **per-module** — only ask what's relevant
given the modules declared in 3a. If no client module exists, do not ask
about UI styling. If no server module exists, do not ask about a backend
framework. The questions below are the catalog; pick the subset that
applies.

| # | Question | Default | Scope | Asked when |
|---|---|---|---|---|
| 4 | Backend language(s) per server module | **(detected from manifest / asked if greenfield)** | core | any module with `kind=server` or `kind=cli` or `kind=lib` of language nature |
| 5 | Backend framework | depends on #4: Python→**FastAPI**, Node→**Express**, Go→**Gin**, Java→**Spring Boot**, Rust→**Axum**, etc. | core | any `kind=server` module |
| 6 | Frontend framework | **(detected / asked)** — React, Vue, Svelte, Angular, Solid, vanilla, etc. | core | any `kind=client` module |
| 7 | UI styling | **(detected / asked)** — Tailwind, CSS Modules, styled-components, vanilla CSS, etc. | core | any `kind=client` module |
| 8 | Primary database | **(asked)** — PostgreSQL / MySQL / MongoDB / SQLite / DynamoDB / Firestore / none | core | any `kind=server` or `kind=data` module that persists |
| 9 | Cache / queue | **(asked)** — Redis / Memcached / RabbitMQ / Kafka / SQS / none | core | any `kind=server` or `kind=data` module that needs one |
| 10 | Test stack per module | **(detected / asked)** — pytest, vitest, jest, junit, go test, cargo test, terratest, bats, etc. | core | every module with a `tests` path |
| 11 | TypeScript strict / mypy strict / equivalent for the language | **yes** when the language has a strict mode | core | per language detected |
| 11a | IaC stack details | **(asked)** — Terraform / Pulumi / CloudFormation / Helm / Kustomize; provider list (AWS, GCP, Azure, on-prem) | core | any `kind=iac` module |
| 11b | Mobile framework | **(asked)** — React Native / Flutter / native iOS (Swift) / native Android (Kotlin) | core | any `kind=mobile` module |
| 11c | Docs framework | **(asked)** — Docusaurus / MkDocs / Hugo / Astro / VitePress / Sphinx | core | any `kind=docs` module |
| 11d | Deployment target | **(asked, do not skip)** — AWS / Azure / GCP / DigitalOcean / Vercel / Netlify / Fly.io / Cloudflare / Render / Heroku / on-prem / hybrid / none-yet | core | any module of `kind=server`, `kind=client`, `kind=mobile`, `kind=cli`, or `kind=data` that the user intends to deploy |
| 11e | Managed-services breakdown | **(asked when 11d ∈ {AWS, Azure, GCP})** — concrete options per layer: compute (AWS: ECS / Lambda / EKS / EC2 · Azure: App Service / Functions / AKS / VMs · GCP: Cloud Run / Cloud Functions / GKE / GCE), data store (managed RDBMS / NoSQL / object storage), messaging (managed queue / pub-sub / streaming), edge (CDN / load balancer / WAF), secrets (KMS / Key Vault / Secret Manager) | core | follow-up to 11d when a major cloud is selected |

If detection from Step 1 already identified a stack for a module,
present it as the default rather than asking blind.

**Always surface the deployment target (11d).** When the project has
any deployable module, ask 11d explicitly — never silently default to
"no deployment" or omit the question. When the user picks a major
cloud (AWS / Azure / GCP), follow up with 11e and present concrete
service options for each layer (compute, data, messaging, edge,
secrets) rather than asking the open-ended "what services will you
use?". The goal is a deliberate, recorded decision, not a hidden
assumption — the user can still answer "decide later" / `none-yet`,
but the question must be asked. When an `iac` module also exists,
11a (IaC tooling) and 11d (deployment target) are both asked; the
provider lists must agree, and `/tmpl-setup` flags the mismatch if
they don't.

### 3c. Code conventions (per detected language, always asked)

| # | Question | Default | Scope |
|---|---|---|---|
| 12 | Python formatter + linter | **Ruff + Black + mypy** | core |
| 13 | JS / TS formatter + linter | **ESLint + Prettier** | core |
| 14 | Go tooling | **gofmt + golangci-lint** | core |
| 15 | Java tooling | **Spotless + Checkstyle** | core |

### 3d. Gitflow (always asked)

| # | Question | Default | Scope |
|---|---|---|---|
| 16 | Branching model | **trunk-based** | core |
| 17 | Branch naming | **`feature/PROJ-123-slug`** | core |
| 18 | Default merge strategy | **squash** | core |
| 19 | Protected branches | **`main`** | core |
| 20 | Commit signing | **none** | full |

### 3e. Issue tracker (always asked)

| # | Question | Default | Scope |
|---|---|---|---|
| 21 | Tracker | **Jira** (when Atlassian MCP is live) / **GitHub Issues** (local-docs fallback) | core |
| 22 | Jira project key | *(no default — ask)* | core |
| 23 | Enforce ticket ID in branch + commit | **yes** | core |

When Jira is chosen, use the Atlassian MCP to list accessible projects and
confirm the chosen key exists. Do not write a guessed prefix to
`configure.json` without verifying it.

When the Atlassian MCP is unavailable (local-docs fallback from Step 0),
Jira is already recorded as `enabled: false`. Skip questions 22 and 23,
default the tracker to **GitHub Issues**, and downgrade every Jira-ID
enforcement rule below (questions 23 branch/commit; 45 issue link; 46, 47 PR rules) accordingly — no
`{KEY}-{NUMBER}` prefix, no `Closes: {KEY}` line, no linked-ticket
requirement on PRs, and the PR template's **Linked Ticket** section is
dropped (question 47 defaults to `Summary, Changes, Test Plan` only).

### 3f. Commits & hooks

| # | Question | Default | Scope |
|---|---|---|---|
| 24 | Commit convention | **Conventional Commits** | core |
| 25 | Pre-commit framework | **`pre-commit`** (Husky + lint-staged if JS-only) | core |
| 26 | Secret scanning | **gitleaks** | core |
| 27 | Pre-push checks | **lint + typecheck** | core |

### 3g. CI, releases, dependencies

| # | Question | Default | Scope |
|---|---|---|---|
| 28 | CI provider | **GitHub Actions** | full |
| 29 | CI jobs | **lint + typecheck + test + build** | full |
| 29a | Deployment workflow (CI deploy job) | **(asked when 11d ≠ none-yet/none and ≠ on-prem-only)** — concrete pipeline matched to 11d/11e (e.g., GitHub Actions → AWS: build → ECR push → ECS/EKS/Lambda deploy; Azure: ACR push → App Service / AKS / Functions; GCP: Artifact Registry → Cloud Run / GKE / Cloud Functions; Vercel/Netlify/Fly.io: provider CLI). Asked **per environment** when staging and prod differ. | full |
| 29b | Environments | **staging + production** when 29a is enabled; **production only** otherwise; **none** when 11d is `none-yet` | full |
| 30 | Dependency automation | **Dependabot** | full |
| 31 | Release automation | **Release Please** | full |

When 11d/11e have already settled the deployment target, 29a pre-fills
the relevant secrets, actions, and image registry — do not ask the
user to re-enter what was already chosen. If the user picks "manual
only" / no automated deploy, record `integrations.deployment.automation: false`
and skip the deploy job in Step 5g (the rest of CI still generates).

### 3h. Licensing & docs

| # | Question | Default | Scope |
|---|---|---|---|
| 32 | License | **MIT** | full |
| 33 | Generate onboarding, code-review, SECURITY, CONTRIBUTING, gitflow docs | **yes to all** | core (onboarding + gitflow only) / full (all) |

### 3i. GitHub-side settings (always asked if GitHub MCP active)

**Branch protection**

| # | Question | Default | Scope |
|---|---|---|---|
| 34 | Apply branch protection rules to `main` via MCP | **yes** | full |
| 35 | Required checks before merge | **CI: lint, typecheck, test, build** (`pr-title-check` is appended automatically when #52 is yes) | full |
| 36 | Require linear history | **yes** | full |
| 37 | Require PR reviews (count) | **1** | full |
| 38 | Dismiss stale reviews on new commits | **yes** | full |

> Questions #39 and #40 live in Step 3j (team roles + per-language
> conventions) so the numbering jumps from 38 to 41 here. The sub-section
> ordering is deliberate; the numbers stay contiguous across all of Step 3.

**Issue rules + restrictions**

| # | Question | Default | Scope |
|---|---|---|---|
| 41 | Issue format | **issue forms (structured YAML)** / free-form markdown | full |
| 42 | Issue types available | **Bug, Feature, Task, Chore** | full |
| 43 | Require fields on every issue | **title, description, acceptance criteria, severity** | full |
| 44 | Auto-label issues by type | **yes** — label matches the type | full |
| 45 | Enforce linked Jira ticket on issues | **no** (issues ARE the tracker on GitHub; tickets already in Jira) | full |

**PR rules + restrictions**

| # | Question | Default | Scope |
|---|---|---|---|
| 46 | Require Jira ticket ID in PR title | **yes** (pattern: `^{KEY}-\d+`) | full |
| 47 | Require PR template sections filled | **Summary, Changes, Test Plan, Linked Ticket** | full |
| 48 | Auto-assign CODEOWNERS as reviewers | **yes** | full |
| 49 | Auto-label PRs by changed paths | **yes** — `backend/`, `frontend/`, `docs/`, `ci/` | full |
| 50 | Allow draft PRs | **yes** | full |
| 51 | Require conversations resolved before merge | **yes** | full |
| 52 | Block merge when PR title fails convention | **yes** — enforced by a `pr-title-check` GitHub Action | full |

**AI-powered PR review (asked in Full + Custom scopes when GitHub MCP active; skipped in Core):**

| # | Question | Default | Scope |
|---|---|---|---|
| 53 | AI service for the PR-review workflow | **github-models** (free, no signup, no card) — one of `github-models`, `anthropic-api`, `bedrock`, `vertex`, `none` | full |
| 54 | Model id for review | **(provider-specific default; see the table below)** | full (asked only when #53 ≠ `none`) |

Present #53 as a single short menu with brief cost / setup tags:

> Which AI service should the PR-review workflow use?
>
> 1. **GitHub Models** — free, no setup, uses `GITHUB_TOKEN` (recommended)
> 2. **Anthropic API** — needs `ANTHROPIC_API_KEY` repo secret ($5 min top-up)
> 3. **AWS Bedrock** — needs OIDC role + Bedrock model access (advanced)
> 4. **Google Vertex AI** — needs GCP service account (advanced)
> 5. **None** — skip AI PR review entirely

Heuristic for the default — keep GitHub Models in almost all cases. Only
suggest Bedrock when `deployment.target == "aws"` AND the user
explicitly volunteered Bedrock access during Step 1 discovery; same for
Vertex / GCP. Even then, GitHub Models stays the safer default because
its prerequisites are zero — Bedrock and Vertex setup can fail silently
at multiple layers (Marketplace activation, IAM trust policy, model
region availability) and the user only finds out when the first PR
runs. GitHub Models works on first PR.

In Core scope, default the provider to `none` silently — Core stays
minimal. Custom scope follows the user's per-question picks.

The `provider` value chosen at #53 maps directly to the template file
under `ai-instructions/templates/workflows/`:

| #53 value | Template file | Default `ai_review.model` |
|---|---|---|
| `github-models` | `ai-pr-review.github-models.yml` | `openai/gpt-4o` |
| `anthropic-api` | `ai-pr-review.anthropic-api.yml` | `claude-sonnet-4-6` |
| `bedrock` | `ai-pr-review.bedrock.yml` | `anthropic.claude-sonnet-4-6` (bare id — see Step 5g.1 notes) |
| `vertex` | `ai-pr-review.vertex.yml` | `claude-sonnet-4-6@20251001` |
| `none` | (no workflow generated; Step 5g.1 skipped) | (n/a) |

When the chosen provider is `github-models`, the workflow runs
immediately on the configure PR (the `actions/ai-inference` action
has no workflow-validation gate). For `anthropic-api` / `bedrock` /
`vertex`, `anthropics/claude-code-action@v1` skips the configure PR
with a "this is normal on first run" message and real reviews start
on the next PR after configure merges. Step 5n's pre-push prompt
calls this out per provider.

Every rule above produces either a YAML template, a workflow file, or a
branch-protection flag — see Step 5g for the concrete mapping. Record each
answer under `integrations.github.rules.*` in `configure.json`.

### 3j. Team roles (always asked — no fixed list)

This is **team roles for humans** — distinct from the AI thinking-modes
that `/tmpl-bootstrap` enables under `ai-instructions/roles/`. Every team role
listed here gets an onboarding doc at `docs/roles/{role}.md` with required
reading and initial study tasks, and a corresponding section on the
Confluence User Roles page (Step 5n).

The template imposes **no fixed role list**. Discover the roles from
requirements first, then ask the user. Add as many as needed:

1. **Roles extracted from the requirements scan** (Step 1) — explicit
   lists, stakeholders, personas, responsibility matrices, RACI charts,
   organization charts.
2. **Roles implied by the declared modules and the stack** — included
   in the suggested set whenever a signal is present, **not held back
   as optional prompts**. The user can still drop them, but bias
   strongly toward proposing rather than omitting. Default to the
   richer scenario when the requirements plausibly justify it.
   Signal → role mapping:

   | Signal (from Steps 1, 3a, 3b) | Suggested role |
   |---|---|
   | `kind=client` module | Frontend Developer |
   | `kind=server` / `kind=cli` / `kind=lib` module | Backend Developer |
   | `kind=iac` module **or** cloud deployment in 11d **or** non-trivial CI/CD | DevOps / Platform Engineer / SRE |
   | `kind=mobile` module | Mobile Developer |
   | `kind=docs` module, doc-heavy deliverables | Tech Writer |
   | `kind=data` module, data lake / warehouse / pipeline / ETL mention | Data Engineer |
   | ML / model / inference / training / recommender mention | ML Engineer |
   | Non-trivial schema, multi-store persistence, migrations strategy, OLAP / OLTP split | DB Architect |
   | Analytics / experimentation / A-B / dashboards / BI mentions | Data Scientist / Data Analyst |
   | Security-sensitive domain (PII, payments, auth-as-product, healthcare, gov, crypto) | Security Engineer |
   | Designs / Figma / mockups / screen library found in Step 4.5 | UI/UX Designer |
   | Stakeholders / requirements / acceptance-criteria mentions | Business Analyst |
   | Architecture / cross-team / decisions mentions, or > 1 module | Tech Lead |
   | Customer-facing rollout / KPI / pricing / roadmap mentions | Product Manager |
   | Manual-test-heavy domains, regulated QA, certification | QA Engineer |
   | Multi-cloud or system-of-systems architecture | Solutions Architect |

   When the user supplied a single requirements doc with no people
   list, this signal map **is** the suggested set — do not fall back
   to a generic four-role default (Frontend + Backend + BA + Tech Lead)
   unless the signals genuinely point only to those four. Surface every
   applicable role; the user prunes from there.

3. **Ask the user openly:**
   > Based on what I read, the team likely includes: {list from steps 1+2,
   > with a one-line rationale per role taken from the matching signal}.
   > Anyone to add or remove? Roles can be anything that fits how your
   > team actually works (Backend Developer, Frontend Developer, QA
   > Engineer, Tech Lead, Business Analyst, UI/UX Designer, DevOps
   > Engineer, Site Reliability Engineer, Platform Engineer, Security
   > Engineer, Data Engineer, Data Scientist, DB Architect, ML Engineer,
   > Mobile Developer, Library Author, Tech Writer, Product Manager,
   > Solutions Architect, Game Designer, Hardware Engineer, Customer
   > Success — or any custom role you use).

   Show the rationale alongside each suggestion so the user can decide
   informedly. Example:
   > - **DevOps Engineer** — you picked AWS in 11d and Terraform in 11a.
   > - **Data Scientist** — requirements mention A/B experimentation and
   >   conversion-rate dashboards.
   > - **Security Engineer** — the app stores payment tokens.

| # | Question | Default | Scope |
|---|---|---|---|
| 39 | Team roles to onboard (free-form list) | **(extracted from requirements; asked openly when scan is empty)** — never a fixed enum | core |
| 40 | Generate `docs/conventions/{language}.md` per stack language (human-facing code conventions) | **yes** | core |

In Custom mode, ask per-role: "Generate onboarding doc for {role}? (y/n)".

For each role the user names, capture: `name` (lowercase-hyphen slug
derived from the display name), `display` (human-readable form),
`onboarding_doc` (boolean). The `name` slug is what `/tmpl-bootstrap` uses
to look up an AI thinking-mode role under `ai-instructions/roles/{name}.md`
— if the slug matches a curated file, bootstrap enables it; if not,
bootstrap generates a new role file using
`bootstrap/templates/role.template.md`.

Record under `team_roles` in `configure.json`. **Example only** — the
actual list reflects the roles the user named:

    "team_roles": [
      { "name": "backend-developer", "display": "Backend Developer", "onboarding_doc": true },
      { "name": "platform-engineer", "display": "Platform Engineer", "onboarding_doc": true },
      { "name": "tech-writer", "display": "Tech Writer", "onboarding_doc": true },
      { "name": "tech-lead", "display": "Tech Lead", "onboarding_doc": true }
    ]

### 3k. Confluence (always asked — remote or local-docs fallback)

When `integrations.confluence.enabled` is `true` (Atlassian MCP is live),
pages are created in Confluence. When
`integrations.confluence.local_fallback` is `true` (from Step 0), the
same page set is generated locally under
`integrations.confluence.local_path` (default `docs/confluence/`) as
static HTML styled to resemble Confluence — questions 56 and 57 do not
apply and are skipped.

| # | Question | Default | Scope | Local-docs fallback |
|---|---|---|---|---|
| 55 | Create project docs | **yes** | core | same |
| 56 | Confluence space key | **(pulled from the MCP spaces list; ask if more than one is accessible)** | core | **skipped** |
| 57 | Parent page under which to create new pages | **space root** | core | **skipped** |
| 58 | Page set to create | **Project Overview, Requirements, Technologies, User Roles** (the basic set) | core | same |
| 59 | Additional pages | **none** — optional: Gitflow, Onboarding (copies of `docs/gitflow.md` + `docs/onboarding.md`) | full | same |
| 60 | Keep the pages in sync on later `/tmpl-setup` edits | **yes** — update rather than re-create | full | same (regenerate the HTML files in place) |

Verify the chosen space key via the Atlassian MCP before moving on (remote
mode only). If the user cannot name a Tech Lead or approver for the space
in Step 5n, use the page's authenticated creator as the fallback. In
local-docs mode the Tech Lead comes from `configure.json.team_roles[]` or
the user running `/tmpl-setup`.

---

## Step 4: Confirm and Write Decision Record

Present a compact summary. Step 4.5 (after this step) does the full
content-based scan + classify + verify-with-user pass for media; do
**not** preview classification counts here — that would force a
duplicate scan, and the per-row verification table in 4.5e is the
authoritative preview anyway. The summary below previews the
**configuration decisions** the user is about to commit to:

> Here is what I am configuring:
> - **Project**: {kind} — {one-line}
> - **Stack**: {backend lang + framework} / {frontend framework} / {db} / {cache}
> - **Deployment**: {target from 11d} — {compute / data / messaging from 11e when applicable} · automation {on/off}, environments {list from 29b}
> - **Conventions**: {formatters/linters for each language}
> - **Gitflow**: {model}, branches `{pattern}`, {merge strategy}, protected `{branches}`
> - **Tracker**: {Jira PROJ | GitHub Issues | Linear | none}
> - **CI**: {provider} — {jobs}
> - **Team roles**: {comma-separated list with rationale per role}
> - **Docs**: {list}
> - **Media preservation**: Step 4.5 will scan {N requirement paths + UX heuristics + project root fallback}, classify every candidate by content (mockups, wireframes, screenshots, HTML prototypes, architecture diagrams, narrative — open list), and ask you to verify the classification before any copy happens.
>
> Proceed? (yes / edit <section>)

If the user wants to edit a section, re-ask only those questions, then
re-confirm.

Write the decision record to `ai-instructions/configure.json`:

The configure.json shape below is an **example** — for a web-app
project. Real records vary with the modules and roles the user
declared. The fields shown are the ones bootstrap and the release
commands key off; do not omit them, but do replace the values with
what `/tmpl-setup` actually captured.

    {
      "version": "1",
      "scope": "core | full | custom",
      "discovery_mode": "auto | semi-auto | manual",
      "approval_rate": "auto | per-category | per-file",
      "skipped": [],
      "prereqs": {
        "git":           { "status": "ok" },
        "github_mcp":    { "status": "ok" },
        "atlassian_mcp": { "status": "ok" },
        "ide_mcp":       { "status": "ok" },
        "editor_cli":    { "status": "ok", "detected": "vscode" }
      },
      "skipped_prereqs": [],
      "project": {
        "name": "{project-slug}",
        "kind": "{free-form — whatever the user picked in 3a question 1}",
        "description": "{one-line}",
        "users": "{target-users}"
      },
      "layout": {
        "kind": "{same as project.kind — copied here for ai-plugins.json}",
        "modules": [
          { "name": "backend", "path": "src/backend", "kind": "server", "language": "python", "manifest": "src/backend/pyproject.toml", "tests": "src/backend/tests", "independent": true },
          { "name": "frontend", "path": "src/frontend", "kind": "client", "language": "typescript", "manifest": "src/frontend/package.json", "tests": "src/frontend/tests", "independent": true }
        ],
        "exceptions": []
      },
      "stack": {
        "comment": "Keys here mirror the kinds of modules in layout.modules[]. The web-app example below uses backend+frontend; for other shapes pick honest keys (e.g., 'lib', 'cli', 'iac', 'mobile', 'docs', 'data') so the rest of the pipeline can pattern-match on them.",
        "backend": { "language": "python", "framework": "fastapi", "strict_types": true },
        "frontend": { "framework": "react", "styling": "tailwind", "strict_types": true },
        "database": ["postgresql"],
        "cache": ["redis"],
        "testing": ["pytest", "vitest", "playwright"]
      },
      "//stack-examples-by-kind": {
        "comment": "These are NOT additional fields — they show what stack would look like for non-web-app projects. Pick the shape that matches this project's actual modules.",
        "library": {
          "lib": { "language": "python", "publishing": "pypi", "strict_types": true },
          "testing": ["pytest"]
        },
        "cli": {
          "cli": { "language": "go", "framework": "cobra" },
          "testing": ["go test"]
        },
        "iac": {
          "iac": { "tool": "terraform", "providers": ["aws"], "version": ">=1.5" },
          "testing": ["terratest", "tflint"]
        },
        "mobile": {
          "mobile": { "framework": "react-native", "language": "typescript", "platforms": ["ios", "android"] },
          "testing": ["jest", "detox"]
        },
        "data-pipeline": {
          "data": { "orchestrator": "airflow", "language": "python", "warehouse": "snowflake" },
          "testing": ["pytest", "great-expectations"]
        },
        "documentation-site": {
          "docs": { "framework": "docusaurus", "language": "typescript" },
          "testing": ["link-check"]
        }
      },
      "conventions": {
        "python": { "formatter": "ruff", "linter": "ruff", "types": "mypy" },
        "typescript": { "formatter": "prettier", "linter": "eslint" }
      },
      "gitflow": {
        "model": "trunk-based",
        "branch_pattern": "feature/{TICKET}-{slug}",
        "merge_strategy": "squash",
        "protected_branches": ["main"],
        "commit_signing": "none",
        "commit_convention": "conventional-commits"
      },
      "integrations": {
        "jira": {
          "enabled": true,
          "project_key": "PROJ",
          "enforce_ticket_id": true,
          "tech_lead": "user@example.com",
          "review_ticket": null,
          "initial_review_ticket_created": false,
          "role_onboarding_tickets": {
            "backend-developer": null,
            "frontend-developer": null,
            "qa-engineer": null,
            "tech-lead": null
          }
        },
        "github": {
          "enabled": true,
          "tech_lead": null,
          "branch_protection": {
            "apply": true,
            "required_checks": ["lint", "typecheck", "test", "build", "pr-title-check"],
            "linear_history": true,
            "required_reviews": 1,
            "dismiss_stale_reviews": true,
            "require_code_owner_reviews": true,
            "required_conversation_resolution": true
          },
          "rules": {
            "issues": {
              "format": "forms",
              "types": ["bug", "feature", "task", "chore"],
              "required_fields": ["title", "description", "acceptance_criteria", "severity"],
              "auto_label_by_type": true,
              "require_linked_jira": false
            },
            "prs": {
              "require_jira_in_title": true,
              "template_sections": ["Summary", "Changes", "Test Plan", "Linked Ticket"],
              "auto_assign_codeowners": true,
              "auto_label_by_path": true,
              "allow_draft": true,
              "require_conversations_resolved": true,
              "block_merge_on_bad_title": true,
              "ai_review": {
                "comment": "Output of questions #53–#54. `provider` is one of `github-models`, `anthropic-api`, `bedrock`, `vertex`, `none`. When provider != `none`, Step 5g.1 reads the matching template from `ai-instructions/templates/workflows/ai-pr-review.{provider}.yml`, substitutes `{{PROJECT_NAME}}` / `{{AI_REVIEW_MODEL}}` / `{{AI_REVIEW_REGION}}`, and writes the result to `.github/workflows/ai-pr-review.yml`. For `github-models` no secrets are needed (the workflow uses `GITHUB_TOKEN` with `models: read`); for the other three, Step 5n prints provider-specific secret-setup instructions before pushing. `region` is required for `bedrock` and `vertex`, must be omitted for `anthropic-api` and `github-models`. Set provider to `none` to skip the workflow entirely. The optional `secrets_pending: true` flag (added in Step 5n only when the user defers secret setup for a non-free provider) signals that the workflow file is committed but the runtime secrets haven't been set yet.",
                "provider": "github-models",
                "model": "openai/gpt-4o"
              }
            }
          },
          "review_pr": null,
          "initial_pr_created": false
        },
        "confluence": {
          "enabled": true,
          "local_fallback": false,
          "local_path": "docs/confluence/",
          "space_key": "TEAM",
          "parent_page_id": null,
          "pages_to_create": ["project-overview", "requirements", "technologies", "user-roles"],
          "sync_on_edit": true,
          "created_pages": {
            "project-overview": null,
            "requirements": null,
            "technologies": null,
            "user-roles": null
          }
        },
        "ide_mcp": {
          "enabled": true,
          "comment": "Optional. Set to false (and add 'ide_mcp' to skipped_prereqs[]) when the user skipped it in Step 0. Release commands key off this when deciding whether to call mcp__ide__getDiagnostics / mcp__ide__executeCode."
        },
        "deployment": {
          "comment": "Captures the deployment-target decisions from 3b (questions 11d, 11e) and the deployment automation from 3g (29a, 29b). When 11d is `none-yet` or `none`, set target=null and automation=false; the rest of the keys can be omitted. The web-app example below targets AWS — pick the keys that match the user's actual answers.",
          "target": "aws",
          "managed_services": {
            "compute": "ecs-fargate",
            "data": ["rds-postgres", "s3"],
            "messaging": ["sqs"],
            "edge": ["cloudfront"],
            "secrets": "secrets-manager"
          },
          "automation": true,
          "ci_pipeline": "github-actions",
          "environments": ["staging", "production"],
          "registry": "ecr"
        }
      },
      "hooks": {
        "framework": "pre-commit",
        "secret_scanning": "gitleaks",
        "pre_push_checks": ["lint", "typecheck"]
      },
      "docs_media": [
        {
          "comment": "Authoritative output of Step 4.5 (Media Preservation + Classification). Flat array of every preserved file with content-based role classification, type, optional human label, and rewritten image references. Empty array when nothing was found. `referenced_by` is populated by Step 5 as each downstream doc embeds/links the file. The role drives both the destination directory in 4.5c and the section assembly in Step 5 (4.5g).",
          "source": "requirements/mockup.html",
          "destination": "docs/requirements/mockup.html",
          "type": "html",
          "role": "ui-mockup",
          "label": "App layout mockup",
          "rewritten_refs": [
            { "from": "screens/login.png", "to": "../images/ui/login.png" }
          ],
          "referenced_by": ["readme", "project-summary"]
        },
        {
          "source": "requirements/screenshots/login.png",
          "destination": "docs/images/ui/screenshots/login.png",
          "type": "image-raster",
          "role": "screenshot",
          "label": "Login screen",
          "referenced_by": ["readme", "onboarding", "project-summary", "confluence-requirements"]
        },
        {
          "source": "requirements/architecture.png",
          "destination": "docs/images/architecture/architecture.png",
          "type": "image-raster",
          "role": "architecture-diagram",
          "label": "System architecture",
          "referenced_by": ["onboarding", "project-summary", "confluence-overview"]
        }
      ],
      "docs_imagery": {
        "comment": "Backward-compat synthesized view of docs_media[] for /tmpl-bootstrap consumers that haven't been migrated. UI entries are docs_media[] rows whose role is in the UI artifacts group (ui-mockup, wireframe, screenshot, html-prototype, style-guide, design-tokens) AND whose type is image-raster or image-vector. Architecture entries are similarly the architecture role group with raster/vector types. Step 4.5 re-derives both arrays on every run; do not edit them by hand.",
        "ui": [
          {
            "source": "requirements/screenshots/login.png",
            "destination": "docs/images/ui/screenshots/login.png",
            "referenced_by": ["readme", "onboarding", "project-summary", "confluence-requirements"]
          }
        ],
        "architecture": [
          {
            "source": "requirements/architecture.png",
            "destination": "docs/images/architecture/architecture.png",
            "referenced_by": ["onboarding", "project-summary", "confluence-overview"]
          }
        ]
      },
      "docs_requirements": [
        {
          "comment": "Backward-compat synthesized view of docs_media[] entries whose type is html / pdf / markdown (any role). Step 4.5 re-derives this on every run.",
          "source": "requirements/mockup.html",
          "destination": "docs/requirements/mockup.html",
          "rewritten_refs": [
            { "from": "screens/login.png", "to": "../images/ui/login.png" }
          ],
          "referenced_by": ["readme", "project-summary"]
        }
      ],
      "ci": { "provider": "github-actions", "jobs": ["lint", "typecheck", "test", "build"] },
      "dependencies": { "automation": "dependabot" },
      "releases": { "automation": "release-please", "workflow": ".github/workflows/release-please.yml" },
      "license": "MIT",
      "docs": ["onboarding", "gitflow", "code-review", "security", "contributing", "role-docs", "conventions"],
      "team_roles": [
        { "name": "backend-developer", "display": "Backend Developer", "onboarding_doc": true },
        { "name": "frontend-developer", "display": "Frontend Developer", "onboarding_doc": true },
        { "name": "qa-engineer", "display": "QA Engineer", "onboarding_doc": true },
        { "name": "tech-lead", "display": "Tech Lead", "onboarding_doc": true }
      ]
    }

Fields set to disabled/none stay in the record as `null` or `false` — never
drop them. Bootstrap and later commands key off their presence.

---

## Step 4.5: Media Preservation + Classification

**This step is unconditional.** It always runs — even when you think
the requirements have no media. Verify by scanning. The output of
this step is what makes UI mockups, wireframes, screenshots, HTML
prototypes, and architecture diagrams reachable from the docs that
Step 5 generates. If 4.5 doesn't find or copy a file, no downstream
step will rescue it.

Step 4.5 is **content-driven**: every candidate file is opened and
classified by what it actually is, not by extension or filename. A
file called `mockup.html` may or may not be a mockup; the AI
decides from the file's content. When the scan finds nothing in a
given role group, the corresponding section in the generated docs is
**omitted entirely** — no empty placeholders, no "(none provided)"
captions.

### 4.5a. Scan paths

Walk every path Step 1a recorded as a requirements location, plus
the additional UX/design heuristic paths below. Recurse into
subdirectories.

**Standard requirements paths** (from Step 1a):
`releases/`, `requirements/`, `docs/requirements/`, `specs/`,
`specifications/`, `product/`, top-level `REQUIREMENTS.md` /
`PRD.md` / `SPEC.md`, plus anything the user named explicitly in
Step 1c.

**Additional UX/design paths** (always scanned when present):
`mockups/`, `wireframes/`, `designs/`, `design/`, `ux/`, `ui/`,
`prototypes/`, `prototype/`, `screens/`, `screenshots/`,
`brand/`, `style-guide/`, `style-guides/`. Skip silently when a
path doesn't exist.

**Fallback root scan** (always runs after the above):
Walk the project root for any candidate media file
(`.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.webp`, `.bmp`,
`.tiff`, `.html`, `.htm`, `.pdf`, `.fig`, `.sketch`, `.xd`)
excluding standard noise: `node_modules/`, `.git/`, `dist/`,
`build/`, `out/`, `coverage/`, `target/`, `vendor/`, `.next/`,
`.cache/`, `tmp/`, `docs/` (already preserved), `ai-instructions/`,
`.venv/`, `venv/`, `__pycache__/`. Better to surface a candidate
the user rejects than miss one silently.

### 4.5b. Classify each candidate by content

For every candidate file, **read it and decide what it actually
is.** Classification is content-based, not extension-based, not
filename-based.

**Process:**

1. **Open the file.** For text-bearing formats (HTML, SVG with
   `<text>`, markdown), read the actual body — look at headings,
   embedded markup shape, presence of UI-component-like
   structures (`<button>`, `<form>`, layout grids), presence of
   architecture cues (boxes-and-arrows, swim lanes, sequence
   numbers), prose density, table density.
2. **For raster images,** classification leans on context: the
   filename is a hint (not a verdict), the parent directory is
   a hint, the surrounding markdown / HTML that references the
   image (and the heading above that reference) is the strongest
   signal. Use image dimensions / aspect ratio as a tiebreaker
   (mobile-portrait suggests a screen mockup; widescreen with
   sparse content suggests a diagram).
3. **Assign two fields per file:**
   - **`type`** — file format kind: `image-raster` (PNG/JPG/GIF/WebP/BMP/TIFF), `image-vector` (SVG), `html` (.html/.htm), `pdf`, `markdown`, `design-binary` (.fig / .sketch / .xd / .ai / .psd — preserve as opaque blob, no embedding), `text`.
   - **`role`** — what the file is *for*. Lowercase-hyphen,
     AI-judged from content, picked honestly. **Common values
     (open list — pick the most honest label):**
     - `ui-mockup` — low-/mid-fidelity UI representation, intent is to convey screen layout.
     - `wireframe` — structural sketch, often grayscale, no styling.
     - `screenshot` — high-fidelity capture of an actual or rendered UI.
     - `html-prototype` — interactive HTML demonstrating a flow or screen.
     - `architecture-diagram` — boxes, arrows, components, deployment shape.
     - `sequence-diagram` — vertical timeline with lifelines / messages.
     - `data-flow-diagram` — labeled arrows between data stores.
     - `threat-model` — STRIDE / attack-tree / trust-boundary diagram.
     - `deployment-topology` — network / cluster / region layout.
     - `entity-relationship-diagram` / `class-diagram` / `state-machine`.
     - `style-guide` / `design-tokens` — colors, typography, spacing reference.
     - `requirement-narrative` — prose, tables, schemas, BRD-style content.
     - `meeting-note` / `release-note` / `changelog`.
     - `other` — fallback when none fit. Use sparingly; flag for the user in 4.5e.
4. **Optionally extract a short human label** from the file (HTML
   `<title>`, first heading for markdown, alt text from the most
   prominent reference, or filename stripped of extension as last
   resort). Used for table rows in 4.5e and section bullets in
   Step 5.
5. **Extract linked requirement codes** (UI artifacts only). For
   each `ui-mockup` / `wireframe` / `screenshot` / `html-prototype`
   entry, scan the preserved requirement files (every file from
   the scan paths in 4.5a) and pattern-match requirement codes
   that reference this screen. Common patterns to match:

       FR-{AREA}-{NN}..{NN}      e.g., FR-AUTH-01..07
       FR-{AREA}-{NN}            e.g., FR-PROJ-03
       NFR-{NN}                  e.g., NFR-12
       US-{NN}                   e.g., US-04
       REQ-{NN}                  e.g., REQ-21
       {PROJECT-KEY}-{NN}        e.g., ACME-138 (when integrations.jira.project_key is set)

   Match codes to a screen using any of these signals:
   - Same paragraph or list item mentions the screen name (case-
     insensitive substring of the entry's `label`) AND contains a
     code.
   - Same paragraph references the image filename (e.g.,
     `sign-in.png`) AND contains a code.
   - The screen's name appears in a section heading whose body
     contains codes (collect every code in that section).
   - An HTML / markdown table maps screen names directly to codes
     (the most common shape — preserve the row as-is).

   Store the matched codes on the entry as
   `linked_requirements: ["FR-AUTH-01..07"]`. When a screen has
   no matches, set `linked_requirements: []` — do **not** invent
   codes. The codes drive the **Requirements** column in the
   Screens table that 4.5g + 5a + 5m render in Step 5.

6. **Render `html-prototype` screens to PNGs (when applicable).**
   A single `html-prototype` file often encodes multiple distinct
   screens. Downstream Step 5 templates (Screens table in 5a + 5m,
   inline embeds in 5e onboarding) want **inline images**, not a
   single link to an HTML file. So every prototype that contains
   multiple screens is split into per-screen PNGs **before** 4.5c
   routes the classified entries — otherwise the Preview column in
   the Screens table has nothing to render.

   **Detect multi-screen structure.** Open the prototype HTML and
   look for repeated patterns indicating distinct screens:
   - Multiple `<section class="screen">` / `<div class="screen">`
     / `<article class="screen">` blocks (any class containing
     `screen` / `page` / `view` is a strong signal).
   - Multiple `id`-anchored sections targeted by an in-page nav
     (`<a href="#sign-in">…</a>`, etc.).
   - Heading-anchored sections at consistent depth
     (`<h2 id="...">` or `<section><h2>...</h2></section>`).
   - Storybook-style `<template>` / `<dialog>` / `<frame>`
     elements with screen-shaped content.
   - A nav bar listing screen names with anchors.

   When the prototype is single-screen (no repeated structure or
   only one detectable section), render the whole page as a single
   PNG and stop.

   **Render each screen.** Use Playwright (preferred — gives
   accurate pixel rendering of CSS layouts):

       from playwright.sync_api import sync_playwright
       with sync_playwright() as pw:
           browser = pw.chromium.launch()
           page = browser.new_page(viewport={"width": 1200, "height": 900})
           for ordinal, screen in enumerate(detected_screens, start=1):
               page.goto(f"file://{abs_html_path}#{screen.anchor}")
               page.screenshot(
                   path=f"docs/images/ui/screens/{ordinal:02d}-{screen.slug}.png",
                   full_page=False,
               )
           browser.close()

   When Playwright isn't available locally, fall back in this
   order:
   1. **`mcp__ide__executeCode`** — when the IDE MCP is live (per
      `configure.json.prereqs.ide_mcp.status == "ok"`), drive the
      Playwright snippet through the MCP. This works in editor
      sessions where the local Python env doesn't have Playwright.
   2. **Headless Chrome via `chromium --headless --screenshot`** —
      a reasonable fallback when Playwright isn't installed but
      Chromium is. Less accurate for CSS-heavy layouts; use only
      when nothing else is available.
   3. **No tooling at all** — surface the gap explicitly and
      continue without renders. Do **not** silently skip:

      > **Inline previews missing.** `{prototype.html}` contains
      > {N} screens but no rendering tool is available locally.
      > The Screens table in `project-summary.md`, `README.md`,
      > and the Confluence Requirements page will link to the
      > prototype instead of embedding inline previews.
      >
      > To add inline previews, install Playwright
      > (`pip install playwright && playwright install chromium`)
      > and re-run `/tmpl-setup`. In a downstream project that has
      > already been bootstrapped, run `ai-template sync` after
      > installing Playwright; Step 4.5 picks up the renders on
      > the next pass.

   **Filename convention.** `{NN}-{slug}.png` where `NN` is the
   zero-padded 1-based ordinal in screen order, and `slug` is
   the screen's heading text lowercased with non-alphanumeric
   characters collapsed to hyphens (the same lowercase-hyphen
   rule the rest of the template uses). Land at
   `docs/images/ui/screens/`.

   **Add per-screen `docs_media[]` entries.** For each rendered
   PNG, push one entry of role `screenshot`:

       {
         "source": "requirements/mockup.html#sign-in",
         "destination": "docs/images/ui/screens/01-sign-in.png",
         "type": "image-raster",
         "role": "screenshot",
         "label": "Sign in / register",
         "linked_requirements": ["FR-AUTH-01..07"],
         "derived_from": "docs/requirements/mockup.html",
         "referenced_by": []
       }

   `linked_requirements` is extracted per-screen using step 5's
   pattern-matching scoped to the screen's section. `derived_from`
   cross-links the screenshot back to its source prototype so
   4.5g + Step 5 know to group them.

   **Cross-link the html-prototype entry.** Add a
   `rendered_screens[]` array to the prototype's `docs_media[]`
   entry listing each derived destination path:

       {
         "source": "requirements/mockup.html",
         "destination": "docs/requirements/mockup.html",
         "type": "html",
         "role": "html-prototype",
         "label": "App layout prototype",
         "rendered_screens": [
           "docs/images/ui/screens/01-sign-in.png",
           "docs/images/ui/screens/02-projects.png",
           "docs/images/ui/screens/03-new-project.png"
         ],
         "referenced_by": []
       }

   Both entries flow through 4.5c routing: the prototype HTML
   lands in `docs/requirements/`, the screenshot PNGs land in
   `docs/images/ui/screens/`. Both surface in 4.5e's verification
   table — the prototype as one row, each screenshot as its own
   row with a thumbnail.

**Ambiguity:** when a file plausibly fits two roles (e.g., a screen
mockup that includes a sequence diagram), pick the **dominant**
role and flag in the run summary. The user can correct in 4.5e.

### 4.5c. Route by role

The role determines where the file is copied. Routing buckets are
derived from role:

| Role group | Roles | Destination |
|---|---|---|
| **UI artifacts** | `ui-mockup`, `wireframe`, `screenshot`, `html-prototype`, `style-guide`, `design-tokens` | `docs/images/ui/{source-subpath}/` for raster/vector; `docs/requirements/{source-subpath}/` for HTML/PDF |
| **Architecture artifacts** | `architecture-diagram`, `sequence-diagram`, `data-flow-diagram`, `threat-model`, `deployment-topology`, `entity-relationship-diagram`, `class-diagram`, `state-machine` | `docs/images/architecture/{source-subpath}/` for raster/vector; `docs/requirements/{source-subpath}/` for HTML/PDF |
| **Narrative artifacts** | `requirement-narrative`, `meeting-note`, `release-note`, `changelog`, `other` | `docs/requirements/{source-subpath}/` (HTML/markdown/PDF) — no image copy |
| **Design binaries** | any role with `type: design-binary` | `docs/requirements/design-sources/{source-subpath}/` — preserved as opaque blob, not embeddable |

**HTML files** always land in `docs/requirements/{source-subpath}/`
regardless of role group. Inside the copied HTML, rewrite every
`<img src="...">` to point at the new image destination, and copy
referenced CSS / JS to `docs/requirements/assets/{source-subpath}/`
so the HTML renders standalone.

**Always create the destination directories**, even when empty.
Touch `docs/images/ui/.gitkeep`,
`docs/images/architecture/.gitkeep`, and
`docs/requirements/.gitkeep` so the convention is visible from day
one and re-runs are idempotent.

### 4.5d. Track every move in configure.json

Update `configure.json.docs_media[]` (a flat array — easier to
classify-and-iterate than the prior nested shape). Three example
entry shapes covering the common cases:

    // a directly-provided screenshot
    {
      "source": "requirements/screens/sign-in.png",
      "destination": "docs/images/ui/screens/sign-in.png",
      "type": "image-raster",
      "role": "screenshot",
      "label": "Sign in / register",
      "linked_requirements": ["FR-AUTH-01..07"],
      "rewritten_refs": [],
      "referenced_by": []
    }

    // an html prototype with multi-screen renders (4.5b step 6)
    {
      "source": "requirements/mockup.html",
      "destination": "docs/requirements/mockup.html",
      "type": "html",
      "role": "html-prototype",
      "label": "App layout prototype",
      "rendered_screens": [
        "docs/images/ui/screens/01-sign-in.png",
        "docs/images/ui/screens/02-projects.png",
        "docs/images/ui/screens/03-new-project.png"
      ],
      "referenced_by": []
    }

    // one of the screens rendered from the prototype above
    {
      "source": "requirements/mockup.html#sign-in",
      "destination": "docs/images/ui/screens/01-sign-in.png",
      "type": "image-raster",
      "role": "screenshot",
      "label": "Sign in / register",
      "linked_requirements": ["FR-AUTH-01..07"],
      "derived_from": "docs/requirements/mockup.html",
      "referenced_by": []
    }

`linked_requirements` is populated by 4.5b step 5 — empty array
when the requirement scan found no matching codes for the screen.
For non-UI artifacts (`architecture-diagram`, `requirement-narrative`,
etc.), the field is `[]` or omitted entirely; only UI role-group
entries carry codes.

`rendered_screens` and `derived_from` are populated by 4.5b step 6
when an html-prototype was split into per-screen PNGs. Both fields
are absent on entries that didn't go through the rendering pass.
Step 5 uses these cross-links to render screenshot rows in the
Screens table (the screenshots) and a sibling `## Interactive
prototypes` section (the html-prototypes themselves) without
duplication.

`referenced_by` is populated by Step 5 (each downstream doc that
embeds or links the file appends its identifier). For backward
compatibility with prior runs that wrote `docs_imagery.{ui,
architecture}[]` and `docs_requirements[]`, also write those
nested forms — same source paths, grouped by role group. New runs
read `docs_media[]` as the source of truth and synthesize the
nested forms only for `/tmpl-bootstrap` consumers that haven't been
migrated.

The arrays are **always written**, even when empty (`[]`). A re-run
can diff the old and new arrays to confirm "nothing new to
process" or list the additions.

### 4.5e. Verify with the user

**The verification gate is non-negotiable.** Do not copy a single
file before the user has seen the classification table. Print
**both** the classification table AND the prototype-render summary
(when 4.5b step 6 split any html-prototype into per-screen PNGs):

> **Media classification — please verify**
>
> Scanned paths: {list, max 10 with "+K more"}.
> Files scanned: {N}. Candidates after filtering: {M}.
>
> | # | File | Type | Role | Label | Notes |
> |---|---|---|---|---|---|
> | 1 | requirements/mockup.html | html | html-prototype | App layout prototype | rendered → 9 screenshots (rows 2–10) |
> | 2 | mockup.html#sign-in | image-raster | screenshot | Sign in / register | derived from row 1 |
> | 3 | mockup.html#projects | image-raster | screenshot | Projects list | derived from row 1 |
> | … | … | … | … | … | … |
> | 11 | requirements/architecture.png | image-raster | architecture-diagram | System architecture | |
> | 12 | requirements/features.md | markdown | requirement-narrative | Features overview | |
> | 13 | requirements/misc-shot.png | image-raster | other | (unable to classify — flagged) | |
>
> Role groups produced:
> - **UI artifacts:** 10 (1 html-prototype + 9 screenshots derived from it)
> - **Architecture artifacts:** 1 (1 architecture-diagram)
> - **Narrative artifacts:** 1 (1 requirement-narrative)
> - **Unclassified:** 1 — please review the last row
>
> When 4.5b step 6 produced renders, also surface a brief audit
> line per rendered screen so the user can spot a split misfire
> (wrong viewport / wrong anchor / blank page) before any copy
> happens. When rendering was skipped because no tooling was
> available, surface the warning here too:
>
> > **Inline previews missing.** `mockup.html` has 9 screens but
> > Playwright + IDE MCP are both unavailable. The Screens table
> > will link to the prototype instead of embedding inline
> > previews. Install Playwright (`pip install playwright &&
> > playwright install chromium`) and re-run to add them.
>
> Reply: **proceed** (continue with this classification),
> **edit <#>=<role>** to override (e.g., `edit 5=screenshot`),
> **add <path>** to point me at a missed location and I'll
> re-scan it, **skip <#>** to drop a row from preservation,
> **abort** to halt.

When the user picks `proceed`, **then** run the actual copy and
populate `configure.json.docs_media[]`. Honor every `edit` /
`skip` / `add` reply by re-classifying or re-scanning before
copying — the user's overrides win.

If the candidate list is empty after scanning, say so explicitly:

> No media or supplementary requirement files found across the
> scanned paths: {list}.
>
> If you expected mockups / wireframes / screenshots / diagrams /
> HTML prototypes, name the path now (`add <path>`) and I'll
> re-scan. Otherwise reply `proceed` and the generated docs will
> not contain a Mockups, Screenshots, Architecture, or Source
> Requirements section.

### 4.5f. Post-copy summary

After the copy completes, print a concise confirmation:

> **Media preservation complete**
> - UI artifacts: {N} → docs/images/ui/, docs/requirements/
> - Architecture artifacts: {N} → docs/images/architecture/, docs/requirements/
> - Narrative artifacts: {N} → docs/requirements/
> - Design binaries: {N} → docs/requirements/design-sources/
> - HTML rewrites: {N} `<img>` references redirected to new paths
> - CSS/JS assets copied: {N} → docs/requirements/assets/
> - Re-runs: {N} files unchanged (already at destination)

If everything is zero, say "No media to preserve; `docs/images/`
and `docs/requirements/` created empty for future use."

### 4.5g. Section-assembly rules for Step 5

This step's classifications drive every conditional section in
Step 5. Two parts: (a) section headings come from the **actual
roles found**, and (b) the **format** of the UI section is a
mandatory table whenever any UI artifact exists.

#### Headings (from actual roles found)

- All UI files are screenshots → heading is `## Screens`
  (default — the most common shape).
- All are wireframes → heading is `## Wireframes`.
- All are mockups → heading is `## Mockups`.
- Mixed UI roles → heading combines the present roles in
  frequency order (e.g., `## Mockups & Wireframes`,
  `## Screens, Mockups & Wireframes`).
- `html-prototype` present → **two outputs** when 4.5b step 6
  rendered the prototype's screens to PNGs:
  - The derived `screenshot` rows (each with `derived_from` set
    to the prototype) flow into the **Screens table** above
    just like any other screenshot — that's where the inline
    previews come from.
  - A **separate `## Interactive prototypes`** section lists the
    `html-prototype` entries themselves (one row per file) with
    a link to `docs/requirements/...html` so a reader can
    render it in a browser. Phrasing: "Open in a browser to
    interact with the live HTML rendering."

  When rendering was skipped (no Playwright + no IDE MCP), the
  `html-prototype` entry has no `rendered_screens[]` and the
  Screens table will have no rows for it — only the
  `## Interactive prototypes` link survives. The verification
  warning from 4.5e tells the user that inline previews are
  missing and what to install to add them.
- Architecture roles present → heading `## Architecture overview`
  when mixed; more specific when only one architecture sub-role
  was found (e.g., `## Sequence diagrams`).
- `style-guide` / `design-tokens` → `## Design tokens` section
  in **onboarding only** (not project-summary or README — these
  are reference material, not orientation material).
- Narrative roles present → README's Documentation section gets
  a "Source requirements" sub-list linking each preserved file
  under `docs/requirements/...`.

#### Mandatory UI-section format (table)

Whenever `docs_media[]` has at least one UI role-group entry, the
UI section in `docs/project-summary.md`, `README.md`, and the
Confluence Requirements page (5m) **must** render as a table with
this shape:

    ## {Heading per the rule above}

    {Optional one-sentence intro — generate when N >= 5 entries:
    "Static renders of all {N} {screens|mockups|wireframes},
    captured from the interactive prototype at {dimensions extracted
    from the largest image's pixel dimensions}. Source files in
    [docs/images/ui/screens/](docs/images/ui/screens/)."}

    | # | Screen | Requirements | Preview |
    |---|---|---|---|
    | 01 | {label} | {linked_requirements joined by comma, or — when empty} | ![{label}]({destination}) |
    | 02 | …       | …                                                      | …                          |

Numbering is sequential, zero-padded for ≥10 entries. Order of
rows: the order codes were first seen in the source requirements
when consistent (which is also the order designers ship them);
filename alphabetical when no source-requirements order exists;
the user can override during 4.5e.

When fewer than 5 UI entries, the optional intro is omitted; the
table renders directly under the heading.

The table is the canonical embed. Do **not** also embed the
images individually above or below the table — one rendering per
doc. (Onboarding is the exception: it embeds inline with full-
size previews because newcomers want the whole picture, not a
table; see 5e.)

#### No empty placeholders

A section appears in a generated doc if and only if 4.5
classified at least one file into that section's role group.
Skip the heading entirely otherwise. Headings are honest about
what's there — never write `## Mockups` when the only UI
artifacts found are screenshots.

#### API-only / no-UI projects

When `configure.json.layout.modules[]` contains **no** module of
`kind: client` or `kind: mobile`, the project is API-only / a
library / IaC / CLI / data-pipeline. **Zero UI artifacts is
expected** in that case — the scan's empty result is informational,
not a misfire. Print this fact in the 4.5e summary explicitly:

> No UI modules declared in `layout.modules[]` (this looks like
> an API-only / library / IaC / CLI project). The `## Screens`
> section will be skipped in every generated doc — that's
> intended for projects with a frontend.

Conversely, when a `client` or `mobile` module is declared but
the scan found zero UI artifacts, **flag it as suspicious**:

> A `client` (or `mobile`) module is declared in
> `layout.modules[]` but no UI artifacts (screens, mockups,
> wireframes, html-prototypes) were found in the scanned paths.
> If you have UI mockups elsewhere, name the path with `add
> <path>` so I re-scan; otherwise reply `proceed` and I'll skip
> the Screens section.

Do not auto-decide either way — the user confirms.

---

## Step 5: Generate Artifacts

Generate files in this order. Each file must be **scope-gated** — Core
generates a subset, Full generates everything, Custom generates whatever
the user enabled.

### Approval gating (applies to every 5x sub-section below)

Every sub-section of Step 5 produces one or more files. Honor
`approval_rate` (set in Step 2c) when writing them:

- `approval_rate: auto` — write each file as soon as it is generated;
  no gate, no pause.
- `approval_rate: per-category` — at the **start** of each sub-section
  (5a, 5b, 5c, …, 5o), stage the proposed files, open them in the
  user's editor (see "How files are presented for review" below), and
  offer **Approve / Edit / Skip / Abort**. Move staged → final on
  Approve; revise + re-stage on Edit; record the skip in
  `configure.json.skipped[]` on Skip; halt + clean staging on Abort.
- `approval_rate: per-file` — same, but one gate per file rather than
  per sub-section.

### How files are presented for review

When a gate fires (per-category or per-file), do not just print file
content in the chat. The user wants to review proposals **as editor
tabs** so they can read with syntax highlighting, scroll, and edit
inline. Workflow:

1. **Stage the proposal.** Write the proposed content to
   `/tmp/claude-tmpl-setup-{run-id}/{relative-path}` (where `{run-id}`
   is a short timestamp like `20260427-143000` and `{relative-path}`
   is the file's eventual path, e.g., `docs/gitflow.md`). The
   staging path is unmistakably "not the real file".
2. **Open the file.** The opener depends on the file's extension.

   **HTML / HTM files** — `.html` and `.htm` files are intended to be
   *rendered*, not read as source. By default they open in the user's
   default browser instead of an editor tab. The setting that controls
   this is `review_html_in` in `ai-plugins.json` (default
   `browser`):

   - `browser` (default) — open in the OS default browser only.
   - `editor` — open in the editor tab only (treat HTML like any
     other text file).
   - `both` — open in the browser **and** the editor tab. Useful
     when the user wants to see the rendered output and edit the
     source side-by-side.
   - `chat-only` — print HTML source inline (escape hatch when no
     browser/editor is available).

   Use the OS default-handler command to open in the browser:
   - macOS → `open {staging-path}`
   - Linux → `xdg-open {staging-path}`
   - Windows / WSL → `start {staging-path}` (cmd) or
     `cmd.exe /c start {wsl-path}` (WSL)

   Detect the platform once per run (cached). When the open command
   fails (e.g., headless environment, no default browser registered),
   fall back to opening in the editor tab and warn the user:
   > Could not open `{staging-path}` in the browser
   > (`{open-command}` exited non-zero). Falling back to editor tab.

   This applies to staged Confluence local-docs HTML pages (Step 5m),
   preserved HTML requirement files (Step 4.5), and any other HTML
   the gates produce.

   **All other files** — open in the editor. Detect the editor in
   this priority order:
   1. **Explicit override** — if `review_editor` is set in
      `ai-plugins.json` (see schema) to anything other than `auto`,
      honor it. `chat-only` disables tabs entirely.
   2. **Host-terminal env vars** — Claude Code is typically run from
      the host editor's integrated terminal. The canonical signals are
      set by the editor itself and are more reliable than a PATH probe:
      - `TERM_PROGRAM=vscode` → VS Code (or any VS Code fork that sets
        this var; check `TERM_PROGRAM_VERSION` for fork hints).
        Additional confirmations: `VSCODE_INJECTION=1`,
        `VSCODE_IPC_HOOK_CLI` set. Use the `code` CLI.
      - `TERM_PROGRAM=cursor` or `CURSOR_TRACE_ID` set → Cursor. Use
        the `cursor` CLI.
      - `TERMINAL_EMULATOR=JetBrains-JediTerm` → a JetBrains IDE. Use
        `idea` (or the specific CLI on PATH: `pycharm`, `webstorm`,
        `goland`, etc.).
   3. **PATH probe** (only when env vars don't identify a host) —
      probe `code`, then `cursor`, then `idea` / `pycharm` /
      `webstorm` via `command -v`.
   Once an editor is identified, use these flags:
   - **VS Code / Cursor** — `code -r {staging-path}` (or `cursor -r ...`)
     opens as a tab in the existing window. For modifications to
     existing files, prefer `code --diff {existing-path} {staging-path}`
     so the user sees a diff view rather than a stale full file.
   - **JetBrains** — `idea {staging-path}` opens as a regular tab (no
     diff-view flag).
   The detection is per-run, cached after the first probe.

   **When env vars say VS Code/Cursor but the CLI is missing on PATH**
   (common when shell integration didn't install the shim), do **not**
   silently fall back to chat output. Tell the user once, with the fix:
   > Detected VS Code (`TERM_PROGRAM=vscode`) but the `code` command
   > isn't on PATH. Run **Command Palette → "Shell Command: Install
   > 'code' command in PATH"** and re-run, or set `review_editor:
   > "chat-only"` in `ai-plugins.json` to suppress this. Falling back
   > to inline for this run.
   Then proceed with the inline fallback for the rest of the run, but
   keep the cached detection so the warning fires only once.

   **Chat-only fallback** — used when no editor is identified, env
   vars are absent, and no `review_editor` override is set. Print the
   file content in chat as before, with a clear "(no editor detected;
   review inline)" note.
3. **Present the chat prompt.** After opening tabs / browser
   windows, ask. Group the staged files by where they were opened so
   the user knows what to look at and where:
   > I've staged {N} file(s) for review:
   >   - **In editor:** {staging-path-1} → will become {final-path-1}
   >   - **In browser:** {staging-path-2.html} → will become {final-path-2.html}
   >   - **In editor + browser:** {staging-path-3.html} → will become {final-path-3.html}  (when `review_html_in: both`)
   >   - …
   >
   > Reply: **approve** (write all), **edit** (you'll modify in the
   > editor and reply 'done' when ready), **skip** (don't write
   > these), or **abort** (halt the whole run).

   When the user picks **edit** for an HTML file that opened in the
   browser only (`review_html_in: browser`), open it in the editor
   tab too at that point so they can actually modify it.
4. **Apply the action.**
   - **approve** → for each staged file, `mkdir -p` its parent and
     `mv` from staging to final; report each move.
   - **edit** → wait for the user's "done" reply. When they reply,
     re-read each staged file (the user may have edited it in the
     editor and saved). Optionally re-show the new diff and re-prompt
     once. Then on the next approve, mv to final.
   - **skip** → `rm` the staged files, append the sub-section's
     identifier to `configure.json.skipped[]`, continue.
   - **abort** → `rm -rf /tmp/claude-tmpl-setup-{run-id}/`, halt.
5. **Final cleanup.** At the end of the `/tmpl-setup` run, remove the
   staging directory.

For modifications to existing files (e.g., a re-run of `/tmpl-setup`
that updates an existing `docs/gitflow.md`), always use the diff view
when the editor supports it — the user wants to see what's changing,
not re-review unchanged content.

**MCP-side-effect sub-sections always gate** regardless of
`approval_rate`. These are 5l (Jira project verification), 5m
(Confluence pages — both remote and local-docs paths), 5n (initial PR
+ Tech Lead review ticket), and 5o (per-role onboarding tickets).
Show the user what will be sent to the external system (page bodies,
ticket descriptions, PR title + body) — for these, the staging area
holds preview files (`*.preview.md` for ticket descriptions, raw HTML
for Confluence pages) that the user can edit before the MCP call
fires. Wait for confirmation even when `approval_rate: auto`.
External state cannot be undone by editing a file later.

When a user picks **Skip** for a sub-section that downstream sub-sections
depend on (e.g., skipping 5a means there's no README to update in 5n's
PR commit), say so and ask whether to skip the dependent sub-sections
too — do not silently break the chain.

**`configure.json.skipped[]`** is an array of skipped step identifiers
(e.g., `["5h", "5o"]`). On a re-run of `/tmpl-setup`, do not re-prompt
for any step in this array unless the user explicitly asks to retry it
(e.g., "redo 5h"). When the user picks Skip during a fresh run, append
the step identifier to this array before continuing. The array is also
read by `/tmpl-bootstrap` and the release commands so they know which
artifacts to skip downstream (e.g., release-please workflow checks if
"5h" is in `skipped[]`).

### 5a. Project summary + README.md (always)

Write **three** files in this step. By now Step 4.5 has already run
the media preservation + classification pass, so
`configure.json.docs_media[]` is populated with every preserved
file's destination, role, label, and `linked_requirements`. The
three files below read from that array — they do not re-scan
source requirements themselves.

#### Pre-flight: verify Step 4.5 actually ran

Two checks before writing the three files:

1. **`configure.json.docs_media[]` exists.** If missing or
   `null`, halt and re-run Step 4.5 — Step 5a cannot write
   project-summary / README / Confluence Requirements against
   unclassified media.

2. **`docs_media[]` agrees with the filesystem.** Re-run the
   minimal scan from 4.5a (just count `*.png` / `*.jpg` /
   `*.jpeg` / `*.gif` / `*.svg` / `*.webp` / `*.html` / `*.htm`
   / `*.pdf` files under the recorded scan paths) and compare
   to the count of `docs_media[]` entries plus any items the
   user explicitly skipped via 4.5e. If the filesystem has
   significantly more candidate files than `docs_media[]`
   accounts for (rule of thumb: more than 1 unaccounted file or
   any unaccounted file with a UI-suggesting filename like
   `*screen*` / `*mockup*` / `*wireframe*` / `*ui*`), halt and
   tell the user:

   > Step 4.5 classified {M} files, but the requirements paths
   > contain {N} candidate media files. {N - M} appear to have
   > been missed: {list, max 10}. Re-running Step 4.5 to pick
   > them up. (You can also `skip {file}` after the re-classify
   > if some of these are genuinely not part of the
   > requirements.)

   Then re-run 4.5 from 4.5a and resume. This is the
   safety-net against the failure mode where the agent
   skipped 4.5 entirely or only classified part of the
   directory tree.

**1. `ai-instructions/releases/init/project-summary.md`** — internal
ground-truth for `/tmpl-bootstrap` Step 5 and for every future release's
context-gathering step.

**Also write a human-discoverable copy at `docs/project-summary.md`**
with the **identical** content (same headings, same body, same image
references — pointing at the freshly copied paths under
`docs/images/ui/` and `docs/images/architecture/`, not the original
source paths). Humans land in `docs/` first; placing the summary
there keeps it next to `onboarding.md`, `gitflow.md`,
`conventions/`, and `roles/` so a newcomer doesn't have to dig into
`ai-instructions/`.

The two copies must stay in sync. Treat `docs/project-summary.md` as
the **canonical** human edit point — if a user updates one, re-runs
of `/tmpl-setup` (or `/tmpl-reconfigure "sync project summary"`) read the
docs/ copy and rewrite the `ai-instructions/` copy from it. Do not
duplicate prose by hand at write time: generate the content once,
write the same string to both paths.

For the embedded sections in `project-summary.md`, read
`docs_media[]` and apply 4.5g's section-assembly rules
(headings from actual roles found + mandatory table format for UI):

- **UI artifacts** (any role in the UI group — `ui-mockup`,
  `wireframe`, `screenshot`, `html-prototype`) → render the
  **mandatory Screens table** from 4.5g (`# / Screen /
  Requirements / Preview` columns; zero-padded sequential
  numbering; entry's `label` as the screen name; entry's
  `linked_requirements` joined by comma, or `—` when empty;
  embedded preview from `destination`). Heading is per 4.5g's
  heading rule (`## Screens`, `## Mockups`, `## Wireframes`, or
  a combined heading). Place after `## Idea`, before `## Target
  Users`. **All entries appear in the table** — do not cap at 3.
  When the project has many screens (≥10), the table is still
  the right shape (it's compact one-row-per-screen).
- **`html-prototype`** entries → handled per 4.5g: derived
  screenshot rows from 4.5b step 6 already populate the
  Screens table above (with `derived_from` cross-link); the
  prototype itself goes into a separate `## Interactive
  prototypes` section listing each entry as a link to its
  `docs/requirements/...html` path so a reader can render it
  in a browser. The prototype does **not** itself appear as a
  row in the Screens table — its derived screenshots do.
- **Architecture artifacts** (any role in the architecture group —
  `architecture-diagram`, `sequence-diagram`, `data-flow-diagram`,
  etc.) → embed under `## Architecture overview` (or a more
  specific heading when only one sub-role is present). The
  architecture section uses inline embeds with captions, not the
  table format — diagrams are typically fewer and benefit from
  larger inline rendering.

When `docs_media[]` has no entries in a given role group, **omit
the corresponding section entirely** — do not leave empty
placeholders or "(none provided)" captions. The API-only / no-UI
detection from 4.5g applies: if no UI modules are declared, the
absence of a Screens section is intended, not a bug.

The three-file output below references the canonical homes so the
project summary, README, and downstream docs all point at the same
copied media:

- **UI imagery** (screens, mockups, wireframes, screenshots — see the
  "UI imagery preservation" rule below for the detection criteria) →
  `docs/images/ui/`. Example:
  `requirements/screenshots/login.png` →
  `docs/images/ui/screenshots/login.png`. This is the same canonical
  home referenced by README, onboarding (5e), and Confluence (5m), so
  one copy serves every downstream doc.
- **Non-UI imagery** (architecture diagrams, data-flow figures, threat
  models, sequence diagrams, etc.) → `docs/images/architecture/`.
  Example: `requirements/architecture.png` →
  `docs/images/architecture/architecture.png`. 5e's onboarding rule
  reads from this location for the non-UI branch.

Update the references in `project-summary.md` so they continue
rendering against the new locations. Do **not** delete or relocate the
original source files; treat the source folder as read-only.

Structure:

    # Project Summary

    ## Idea
    {2-3 sentences describing the product}

    ## Target Users
    {who it is for}

    ## Requirements Overview
    {digest of what was found in releases/ + what the user said}

    ## Stack
    {backend / frontend / db / cache / tests — bullet list}

    ## Out of Scope (for now)
    {anything the user said "not this release"}

**2. `README.md`** at the project root — the human-facing landing page.
Overwrites the template README that ships with `ai-template/`. Pulls
from `configure.json` (just written in Step 4) and `project-summary.md`
above. `/tmpl-bootstrap` will append a Quickstart / AI Workflow section
later (its Step 9); leave room for that by ending the file with **two**
delimiter comments — opening + closing — so re-runs are idempotent.
Bootstrap reads both markers to find and replace its block in place.

Structure:

    # {project.name}

    {project.description — one-line, from configure.json}

    ## What it does
    {project-summary.md "Idea" — 2-3 sentences}

    ## Screenshots
    Conditional — render only when UI imagery was detected in
    requirements (see "UI imagery preservation" below). Embed up to 3
    representative images from `docs/images/ui/`. Skip the section
    entirely if none were detected.

    ## Who it's for
    {project-summary.md "Target Users"}

    ## Technologies
    - **Backend:** {stack.backend.language} / {stack.backend.framework}
      {(strict types)} if `stack.backend.strict_types`
    - **Frontend:** {stack.frontend.framework} / {stack.frontend.styling}
      {(strict types)} if `stack.frontend.strict_types`
    - **Database:** {stack.database.join(", ")} — omit row if empty
    - **Cache:** {stack.cache.join(", ")} — omit row if empty
    - **Testing:** {stack.testing.join(", ")}
    - **CI:** {ci.provider} ({ci.jobs.join(" + ")})
    - **Release automation:** {releases.automation || "none"}

    ## Project structure
    Brief tree showing `src/backend/`, `src/frontend/`, `src/shared/`
    (only if present), `docs/`, `.github/`, plus any layout exception
    recorded in `ai-plugins.json`. Mirror the format of the template
    README's "Folder Structure" section but trimmed to what this
    project actually has.

    ## Setup
    Placeholder until `/tmpl-release-new` writes `setup.sh` + `run.sh`:

        # After /tmpl-release-new runs for the first time:
        ./setup.sh
        ./run.sh

    Do not invent commands here — `setup.sh` and `run.sh` are the
    project's only supported entry points (per CLAUDE.md). When those
    scripts exist, `/tmpl-release-new` (Step 7 of `commands/tmpl-release-new.md`)
    will replace this section with the real first-run instructions.

    ## Documentation
    - **Project summary:** [docs/project-summary.md](docs/project-summary.md)
    - **Onboarding:** [docs/onboarding.md](docs/onboarding.md)
    - **Gitflow:** [docs/gitflow.md](docs/gitflow.md)
    - **Code review:** [docs/code-review.md](docs/code-review.md) — Full only; omit row in Core
    - **Conventions:** [docs/conventions/](docs/conventions/)
    - **Per-role onboarding:** [docs/roles/](docs/roles/) — one file per entry in `team_roles[]`
    - **AI workflow:** [docs/ai-workflow.md](docs/ai-workflow.md) — what the slash commands do and how the AI pack fits together (written by `/tmpl-bootstrap` Step 8b)
    - **Source requirements:** [docs/requirements/](docs/requirements/) — preserved HTML / HTM / PDF / markdown requirement files from the original project spec; HTML files render in a browser. Conditional — render only when `docs_media[]` has any entry whose `type` is `html` / `pdf` / `markdown` (e.g., a `ui-mockup` HTML file or `requirement-narrative` markdown).
    - **UI artifacts:** [docs/images/ui/](docs/images/ui/) — mockups, wireframes, screenshots, prototype assets. The bullet's label reflects 4.5g's chosen heading (e.g., "Mockups", "Screenshots", "Wireframes" or a combined form). Conditional — render only when `docs_media[]` has any UI role-group entry with `type: image-raster` or `image-vector`.
    - **Architecture diagrams:** [docs/images/architecture/](docs/images/architecture/) — architecture diagrams, sequence diagrams, data-flow figures, threat models, deployment topologies. Conditional — render only when `docs_media[]` has any architecture role-group entry with `type: image-raster` or `image-vector`.
    - **Project Overview:** {confluence URL or `docs/confluence/project-overview.html`}
    - **Requirements:** {confluence URL or `docs/confluence/requirements.html`}
    - **Technologies:** {confluence URL or `docs/confluence/technologies.html`}
    - **User Roles:** {confluence URL or `docs/confluence/user-roles.html`}

    ## Tracker
    Render conditionally on `integrations.jira.enabled`:
    - Jira enabled: `**Jira:** {Atlassian project URL} — project key {KEY}`
    - Jira disabled: `**Issues:** {GitHub Issues URL for this repo}`

    ## Contributing
    See [CONTRIBUTING.md](CONTRIBUTING.md) — Full only; omit section in Core.

    ## License
    {license name} — see [LICENSE](LICENSE). Omit section in Core if
    no LICENSE was generated.

    <!-- /tmpl-bootstrap appends below this line -->
    <!-- /tmpl-bootstrap appends above this line -->

The Confluence rows use the same `{confluence URL or
docs/confluence/{slug}.html}` placeholder pattern as Step 5n's PR
body — Step 5m fills in the real URL when it creates each remote
Confluence page; in local-docs mode the relative `.html` path is
already known and used directly.

If a row's data is unavailable (e.g., `stack.cache` is empty, no
LICENSE was selected), drop the row entirely rather than rendering an
empty bullet.

**UI imagery preservation (applies to 5a, 5e, 5f, 5m).** Frontend /
user-interface imagery from the user's requirements must flow through
to user-facing docs, not just to the Confluence Requirements page. An
image counts as "UI imagery" when **any** of the following is true:

- It lives under a UI-suggesting directory: `requirements/ui/`,
  `requirements/screenshots/`, `requirements/mockups/`,
  `requirements/wireframes/`, `requirements/screens/`, `specs/ui/`,
  `docs/requirements/ui/`, `releases/init/screenshots/`, or any
  similarly named subdirectory.
- Its filename contains a UI hint: `screen`, `screenshot`, `mockup`,
  `wireframe`, `ui-`, `page-`, `view-`, `flow-`, or matches a screen
  name discussed in the requirements (e.g., `login.png`,
  `dashboard.svg`).
- It is referenced (markdown `![…](…)` or HTML `<img>`) from a
  requirements section whose heading or surrounding text mentions UI,
  frontend, screen, page, view, mockup, wireframe, or a named screen.
- The requirements file is HTML and embeds `<img>` tags inline with
  product description (the most common shape — UX teams ship
  requirements as HTML/PDF with screenshots embedded). Treat every
  `<img>` in such files as UI imagery unless the surrounding context
  is clearly an architecture or sequence diagram.

**Copying and classification are handled by Step 4.5** — every
candidate file is read, classified by content into a `role` (open
list: `ui-mockup`, `wireframe`, `screenshot`, `html-prototype`,
`architecture-diagram`, etc.), and copied to the routing
destination derived from that role. The result is in
`configure.json.docs_media[]`. The criteria above (UI-suggesting
directory, UI-hinting filename, UI-context surrounding text,
HTML-with-inline-`<img>` shape) are **inputs** to 4.5b's
classification, not primary rules — 4.5 looks at content, then uses
these criteria as supporting signal.

The rules below cover **embedding** the already-classified media
into downstream documents. Read `docs_media[]`, filter by the role
group the section is assembling (UI / architecture / narrative —
see 4.5c's routing table), then apply the section-heading rule
from 4.5g (heading reflects actual roles found; section omitted
when no entries match):

1. Render in **README** under the section produced by 4.5g for the
   UI role group (e.g., `## Screenshots`, `## Mockups`,
   `## Wireframes`, or a combined heading when mixed). Up to 3
   representatives — pick the entries closest to the product's
   primary screens; if there are more, link to `docs/images/ui/`
   for the rest. Append `"readme"` to each used entry's
   `referenced_by`. **Skip the section entirely** if no UI
   role-group entry exists in `docs_media[]`.
2. Render in **`docs/project-summary.md`** under the same
   heading 4.5g picked, plus a separate `## Interactive prototypes`
   section when any `html-prototype` entries exist (each entry
   linking to its `docs/requirements/...html` path). Up to 5
   representatives in the visual section. Append
   `"project-summary"` to each used entry's `referenced_by`. Skip
   either section when its entries are empty.
3. Render in **`docs/onboarding.md`** — embed every UI role-group
   entry inline with its `label` as alt text (onboarding is where
   a newcomer needs the whole picture). Append `"onboarding"` to
   each used entry's `referenced_by`. Add a `## Design tokens`
   sub-section that links every `style-guide` / `design-tokens`
   entry. Skip when empty.
4. Render in **Confluence Requirements page /
   `docs/confluence/requirements.html`** per the existing 5m rule
   (uploaded as attachments remotely, copied to
   `docs/confluence/assets/images/` locally). 5m's image flow runs
   in addition to the canonical `docs/images/ui/` copy from 4.5 —
   both happen, the Confluence path is for embedding only. Append
   `"confluence-requirements"` to each used entry's
   `referenced_by`.

If a UI entry was preserved by Step 4.5 but used by **no**
downstream embedder (rare — happens when there are more screens
than the README / project-summary / onboarding embedders take),
leave its `referenced_by` empty. The file still ships at its
destination and is reachable via the gallery link in README's
Documentation section.

Never silently drop UI media. Classification ambiguity is resolved
in 4.5e (the user-verification gate), not silently here.

**Non-UI imagery** (architecture diagrams, threat models, sequence
diagrams, data-flow figures — everything that didn't match the UI
detection criteria above) goes to `docs/images/architecture/` instead,
preserving source sub-paths the same way. This is the canonical home
read by 5e (onboarding's "Other embedded images" branch), 5f's
full-scope docs, and 5m's Project Overview / Technologies pages.
The architecture role-group entries are tracked by Step 4.5 in
`configure.json.docs_media[]` (and synthesized into the
backward-compat `docs_imagery.architecture[]` view) with
`referenced_by` populated by each downstream embedder
(`"onboarding"`, `"security"`, `"contributing"`, `"code-review"`,
`"confluence-overview"`, `"confluence-technologies"`).

### 5b. Git baseline (always)

- `.gitignore` — stack-aware, built from detected languages (Python, Node,
  Go, Java, OS files, editor files, `.env`, build artifacts). Do NOT write
  one-size-fits-all.
- `.gitattributes` — line-ending normalization, binary markers, LFS hints
  for common binaries.
- `.editorconfig` — indent style, charset, final newline, trim trailing
  whitespace. Language-specific overrides for Python (4 spaces) vs JS
  (2 spaces) vs Go (tabs) as applicable.

### 5c. Hooks (always)

- `.pre-commit-config.yaml` — entries for:
  - format + lint for each detected language
  - secret scan (gitleaks)
  - trailing whitespace / end-of-file fixer
  - conventional-commits validation on `commit-msg` stage (uses `commitizen`
    or a small shell hook)
  - Jira ticket enforcement on `commit-msg` — reject commits that don't
    include the project key pattern when enforcement is on
- If `hooks.pre_push_checks` is non-empty, add a `pre-push` stage that runs
  the listed commands.

If the JS-only path was chosen, swap to Husky + `lint-staged` + `commitlint`
and write `.husky/` hooks + `package.json` entries instead.

### 5d. Gitflow guide (always)

`docs/gitflow.md` — concrete, project-specific. Includes:

- Branching model chosen and what each branch means
- Exact branch name pattern with an example using the real ticket prefix
- Commit message format (Conventional Commits with Jira ID, with an example)
- PR lifecycle: open → review → merge strategy → tag
- How to pick up a ticket (Jira) and link it in commits/branches
- Merge rules (squash vs merge vs rebase) and why
- **Mermaid flowchart** of the branch lifecycle (ticket pickup →
  branch creation → commits → PR open → review → merge → tag → release).
  Embed as a fenced ` ```mermaid ` block. Use `flowchart LR` for
  trunk-based and `gitGraph` for git-flow. The diagram should reflect
  the actual chosen model, not a generic template.

### 5e. Onboarding doc (always)

`docs/onboarding.md` is **the first page a new team member reads on
day one**. Write it as a welcoming, narrative document with concrete
examples filled in from `configure.json` and the requirements scan
— **not** as a bullet-point spec. The document should read like a
helpful colleague walking the newcomer through their first day,
not like a checklist.

**Tone and shape rules:**

- Use second-person voice ("**you'll** clone the repo", "**your
  first PR**") throughout.
- Open with a warm welcome paragraph naming the product and what
  it does, so the reader immediately knows what they're walking
  into. Pull the one-liner from
  `ai-instructions/releases/init/project-summary.md`'s `## Idea`
  section; do not write a generic "welcome to the project."
- Use prose for explanations; reserve bullet lists for things that
  are genuinely list-shaped (commands to run, tools, links).
- Fill in **every** placeholder with concrete content from
  `configure.json` / the requirements scan. Never ship the doc with
  a `{stack-version}` or `{role}` literal.
- Embed visuals aggressively when 4.5 produced any UI artifacts —
  a newcomer learns the product fastest by seeing it.

**Required sections (in this order):**

#### 1. `# Welcome to {project-display-name}`

One paragraph: what the product is, who it's for, what problem it
solves. Sourced from `project-summary.md`'s Idea / Target Users /
Problem sections. End with a one-sentence preview of what the
reader will accomplish in this doc — e.g., "By the end of this
page you'll have the project running locally, opened a throwaway
PR end-to-end, and seen where to look when something goes wrong."

#### 2. `## What you're walking into`

A short narrative of the team and the codebase shape (2–4
paragraphs). Concrete content to include:

- The team roles on this project (read from
  `configure.json.team_roles[]`). Phrase as prose: "The team
  includes Backend Developers, a Tech Lead, and a Frontend
  Developer; you'll find their study lists in
  [`docs/roles/`](roles/)."
- The project's modules (read from `configure.json.layout.modules[]`
  — display each as "{name} ({kind}, {language}) at `{path}`"). Keep
  it to one sentence per module.
- The integrations that are live in this repo (Jira / Confluence /
  GitHub Issues / local-docs — read from
  `configure.json.integrations.*`). One sentence each.

#### 3. `## What it looks like` (conditional — only when 4.5 produced UI artifacts)

Embed every UI role-group entry from `docs_media[]` inline using
the entry's `label` as the image alt text. Heading reflects the
actual roles found (`## What it looks like` is the default; if
only screenshots, `## Screenshots`; only mockups, `## Mockups`;
mixed, follow 4.5g). One short caption per image describing what
the screen shows. Skip this entire section when the role group is
empty — no placeholder, no "(screenshots forthcoming)".

#### 4. `## Your first day` (≈ 30–60 min)

A narrative timeline with concrete commands and the **expected
output** for each step. Example shape (fill in real values):

    1. **Clone the repo.** `git clone {origin URL inferred from
       `git remote get-url origin`}` — about 30 seconds.
    2. **Run setup.** `./setup.sh` — installs {detected runtimes
       and package managers}. Expect output ending with
       "{realistic last-line from a successful setup}". If you see
       "{common error}", jump to [Troubleshooting](#troubleshooting).
    3. **Run the app.** `./run.sh` — starts {modules}. Open
       {primary URL, e.g., http://localhost:3000} in your browser.
       You should see {what the user actually sees — pulled from
       the UI mockups in 4.5 if present}.
    4. **Open the codebase.** Glance at the modules listed above.
       Don't try to read everything — find the entry point for
       your role (your role doc points at it).

When the project has no `setup.sh` / `run.sh` yet (no
`/tmpl-release-new` has run), say so explicitly: "These scripts will
exist after the first `/tmpl-release-new` runs. Until then, the manual
setup is: {fall-back commands derived from the stack}."

#### 5. `## Your first week`

A day-by-day plan, narrative tone. Five-day default; adjust based
on the stack (lighter for libraries, heavier for full-stack
products). Each day: one paragraph, no checkboxes, but mention the
concrete artifact the day produces (a passing test run, a
throwaway PR, a code-review comment, etc.). Concrete day-1 example:

> **Day 1.** Today is about getting the environment running and
> seeing the product end-to-end. Finish the steps in *Your first
> day* above, then read [`docs/project-summary.md`](project-summary.md)
> and the role doc that matches what you'll be doing
> ([`docs/roles/{role}.md`](roles/)). Don't write code yet; the
> goal is to know the lay of the land.

End the section with a "By the end of week one, you'll have…"
bullet list (the one place lists are explicitly fine — it's a
recap).

#### 6. `## Your first PR (a dry run)`

A walkthrough of the gitflow with **literal example strings**, not
templates. Use the real `integrations.gitflow.branch_pattern` and
`commit_convention` from `configure.json`. Show:

- The exact command to create a feature branch (with a sample
  ticket / slug).
- A sample commit message that satisfies the convention.
- A sample PR title that satisfies the title-check regex.
- A sample PR body that fills the PR template.

Frame the PR as a **dry-run merge**: open it, walk it through
review, then close without merging. The point is to feel the
workflow before doing real work.

#### 7. `## How to start a real ticket`

Concrete steps: pick a ticket in {Jira project key | GitHub
Issues}, branch from `{default-branch}` using the configured
pattern, commit using the configured convention, open a PR and
self-assign reviewers per CODEOWNERS. Use the project's actual
ticket prefix and labels — fill in literal values.

#### 8. `## Local test commands`

One bullet per module from `configure.json.layout.modules[]`:
`{module-name} — {test command from the module's manifest}`. End
with a single command (or `make test`, or whatever the
project-wide test command is) for "all tests at once."

#### 9. `## What's in this repo`

A short table mapping the **AI-pack files** (`CLAUDE.md`,
`ai-settings.md`, `ai-plugins.json`, `ai-instructions/`) and the
**human-pack files** (`docs/`, `README.md`, `SECURITY.md`,
`CONTRIBUTING.md`) to a one-line description each. The point is to
demystify the layout — many newcomers see `ai-instructions/` and
worry they need to read it. They don't.

#### 10. `## Glossary` (conditional — only when domain terms exist)

Pull every domain term mentioned in the requirements scan
(`project-summary.md`'s Domain section, requirement narratives
preserved by 4.5). Format as a definition list: term in bold
followed by a one-sentence definition in plain prose. Example:

> **Order** — a customer's request to purchase one or more line
> items, in any state from draft to fulfilled.
>
> **Tenant** — a single customer organization. The product is
> multi-tenant; data does not cross tenants.

Skip the section entirely when no domain terms were captured.
Never invent a glossary.

#### 11. `## When something breaks`

A narrative troubleshooting section, **not** a flat error→fix
table. For each common failure mode, one short paragraph:
*symptom*, *what's actually wrong*, *fix*. Cover at minimum: setup
script fails on a missing system dependency; `run.sh` can't bind a
port (something else is using it); tests pass locally but fail in
CI; pre-commit hook rejects a commit. Add stack-specific entries
when the detected stack has well-known gotchas (e.g., Python venv
not activated; Node `engines` mismatch; Docker daemon not
running).

End the section with: "If the fix isn't here, ask in {team
channel — see *Where to ask* below}. The doc gets updated with
new failure modes as we hit them."

#### 12. `## Where to ask`

A short paragraph with the team's actual channels when known.
During `/tmpl-setup` ask once: "What's the channel/email new
hires use for questions on this project?" Record under
`onboarding.support_channels` in `configure.json` and use the
recorded values verbatim. When the user declines to set a
channel, write a one-line placeholder linking to the GitHub
repo's Issues / Discussions: "Open an issue tagged `question`
when you get stuck."

#### 13. `## Pointers to your role doc`

For every entry in `configure.json.team_roles[]` with
`onboarding_doc: true`, link to `docs/roles/{role-slug}.md` with
a one-sentence hook describing what the role doc covers. Frame
warmly — "If you're joining as a {display}, [your role
doc](roles/{slug}.md) has a study list and a day-by-day plan
tailored to your work" — not as a flat list.

#### 14. `## Architecture overview` (conditional — only when 4.5 produced architecture artifacts)

Embed every architecture role-group entry from `docs_media[]` with
the entry's `label` as alt text. One short caption per diagram
explaining what it shows and when to consult it. Heading is the
default `## Architecture overview` when the entries are mixed; use
a more specific heading (e.g., `## Sequence diagrams`) when only
one architecture sub-role was found.

#### 15. `## Your first-week journey`

A Mermaid sequence diagram showing the arc: clone → setup.sh →
run.sh → first ticket → first PR → first merge. Caption it: "If
you ever get lost during the first week, this is the shape of
what you're doing."

**One step at a time** — write the doc as a flowing narrative
that a real new hire can follow on their first day. Avoid:

- Spec-style bullet skeletons with no prose between them.
- Template literals leaked into the output (`{role}`,
  `{stack-version}`, etc.).
- "See `X.md` for details" without a one-sentence hook explaining
  what `X.md` covers and *why the reader cares*.
- Repeating content from `project-summary.md` verbatim — link to
  it, don't duplicate.

When you're done, re-read the doc as if you were a new hire who
joined this morning. If any sentence reads like AI prompt
language, rewrite it.

### 5f. Full-scope docs (Full + matching Custom answers only)

- `SECURITY.md` — reporting channel, supported versions, disclosure policy
- `CONTRIBUTING.md` — code style, branching, testing, PR checklist;
  embed a small Mermaid flowchart showing the contribute → review → merge
  loop from the contributor's perspective
- `docs/code-review.md` — review checklist matched to the stack (e.g., React
  component size, Python type hints, SQL index checks)
- `LICENSE` — content of chosen license with project name + year filled in

For all four files: if the source requirements (in any of the
locations Step 1a scanned — `releases/`, `requirements/`,
`docs/requirements/`, `specs/`, top-level requirement files) contain
images relevant to security, code review, or contribution flow
(architecture diagrams, threat models, review checklists screenshotted
from a wiki, etc.), read them from `docs/images/architecture/`
(already populated in 5a) and embed inline.

### 5g. GitHub repo artifacts (Full + matching Custom)

Base set (always generated in Full):

- `.github/CODEOWNERS` — prompt for team/user once, seed with `*` → owner
- `.github/dependabot.yml` — one entry per detected manifest (pip, npm, go,
  maven, gradle)
- `.github/workflows/ci.yml` — matrix of the selected CI jobs against
  the detected stack

**`ci.yml` generation rules (these are mandatory, not optional):**

1. **Triggers** — `push: [main]` and `pull_request: [opened, synchronize, reopened]`.
2. **Permissions** — `contents: read`, `pull-requests: read`. Add
   `security-events: write` only when the `secret-scan` job runs (gitleaks needs it).
3. **No-workspace guard.** Every `ci.jobs[]` entry that depends on
   the application code (`lint`, `typecheck`, `test`, `build`, and
   any user-defined job that runs against module sources) **must
   start with** an early-exit step so PRs opened **before**
   `/tmpl-release-new` first scaffolds any module path don't show a sea
   of red checks:

       - name: Skip if no module sources exist yet
         id: scope
         run: |
           any=0
           for p in {{layout.modules[].path joined as space-separated list}}; do
             if [ -d "$p" ]; then any=1; break; fi
           done
           if [ "$any" = "0" ]; then
             echo "skip=true" >> "$GITHUB_OUTPUT"
             echo "No module sources found yet — skipping job."
           else
             echo "skip=false" >> "$GITHUB_OUTPUT"
           fi
       - if: steps.scope.outputs.skip == 'false'
         name: <real job step>
         run: |
           <job command>

   Substitute `{{layout.modules[].path joined as space-separated list}}`
   with the literal paths from `configure.json.layout.modules[].path`
   at generation time (e.g., `src/backend src/frontend` for the
   web-app shape). The same guard appears on every code-dependent
   job. Document the behavior in `CONTRIBUTING.md` as well so
   reviewers know the first few PRs may show "skipped" rather than
   actual lint/test output. The hook in `.husky/pre-push` already has
   the equivalent guard for local pushes; this pulls CI into the same
   contract.

4. **Gitleaks `secret-scan` job** (always generated when
   `commits.secret_scanning == "gitleaks"`):

       secret-scan:
         runs-on: ubuntu-latest
         steps:
           - uses: actions/checkout@v4
             with:
               fetch-depth: 0
           - uses: gitleaks/gitleaks-action@v2
             env:
               GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
               GITLEAKS_CONFIG: .gitleaks.toml

   The `GITHUB_TOKEN` env var is **required** — without it,
   `gitleaks/gitleaks-action@v2` aborts with
   `🛑 GITHUB_TOKEN is now required to scan pull requests`. The
   action needs `security-events: write` on the workflow (see
   permissions above). Do not gate this job by the no-workspace
   guard — gitleaks scans git history, which exists from the first
   commit even before any module path is populated.

5. **Matrix dimensions** — derive from `layout.modules[]`. For each
   module with a `language` and a `tests` path, add a matrix entry
   for the per-language `lint`, `typecheck`, `test`, `build` jobs.
   Skip per-module entries for `kind: "docs"` (lint/typecheck don't
   apply); `kind: "iac"` modules get a tooling-appropriate
   substitute (e.g., `terraform fmt` + `terraform validate` for
   Terraform).

**Issue templates — format driven by question #41:**

- If **issue forms**: generate `.github/ISSUE_TEMPLATE/bug.yml`,
  `feature.yml`, `task.yml`, `chore.yml` (one per type in #42). Each YAML
  lists the required fields from #43 with `required: true`, a dropdown for
  severity (Blocker / Major / Minor / Trivial), and a matching `labels:`
  array so #44 auto-labels new issues.
- If **free-form**: generate `.github/ISSUE_TEMPLATE/*.md` with the same
  sections as headings, marked "(required)".
- Always also write `.github/ISSUE_TEMPLATE/config.yml` with
  `blank_issues_enabled: false` so contributors cannot bypass the templates.

**PR template + enforcement — driven by questions #46–52:**

- `.github/PULL_REQUEST_TEMPLATE.md` with the sections from #47. Each section
  has a one-line instruction and a placeholder.
- `.github/workflows/pr-title-check.yml` — runs on `pull_request:
  types: [opened, edited, reopened]`. Two regex variants depending on
  `integrations.jira.enabled`. **`{KEY}` is a placeholder** — the
  generator must substitute it with the literal value of
  `integrations.jira.project_key` before writing the workflow file
  (e.g., for `project_key: "PROJ"`, the substituted regex starts
  `^(?:(feat|fix...): PROJ-\d+`). Failing to substitute leaves the
  workflow inert.
  - **Jira enabled** — accepts both standard ticket-prefixed titles
    AND release-please's auto-generated release PRs (which have no
    ticket because they are produced by the bot, not a developer):

        ^(?:(feat|fix|chore|docs|refactor|test|perf)(\(.+\))?: {KEY}-\d+ .+|chore: release \d+\.\d+\.\d+)$

    The second alternation matches the
    `pull-request-title-pattern: "chore: release ${version}"` set in
    the release-please config (5h), so release PRs can merge.
  - **Jira disabled** (local-docs fallback) — ticket-less form
    (already accepts the release-please title shape, so no second
    alternation is needed):

        ^(feat|fix|chore|docs|refactor|test|perf)(\(.+\))?: .+

  Workflow body (same in both cases — only the regex differs):

      name: pr-title-check
      on:
        pull_request:
          types: [opened, edited, reopened]
      permissions:
        pull-requests: read
      jobs:
        check:
          runs-on: ubuntu-latest
          steps:
            - name: Validate PR title
              env:
                PR_TITLE: ${{ github.event.pull_request.title }}
                PATTERN: '{substituted regex from above}'
              run: |
                printf '%s' "$PR_TITLE" | grep -qE "$PATTERN" || {
                  echo "PR title does not match required pattern: $PATTERN"
                  echo "Got: $PR_TITLE"
                  exit 1
                }

  Fails the check when the title does not match. Generated when #46 or
  #52 is yes; the workflow itself is still produced in the Jira-disabled
  case (using the **Jira-disabled regex** above), since #46 is a no-op
  there but #52 is independent.
- `.github/workflows/labeler.yml` + `.github/labeler.yml` — uses
  `actions/labeler`. Path → label mapping generated from the **declared
  modules** in `configure.json.layout.modules[]`: each module's `path`
  becomes a glob (`{path}/**`) mapped to a label of the module's `name`.
  Plus universal entries: `docs/**` → `docs`, `.github/**` → `ci`.
  Only generated when #49 is yes. Examples by project kind:

  - Web app — `src/backend/**` → `backend`, `src/frontend/**` → `frontend`
  - IaC — `terraform/**` → `terraform`, `k8s/**` → `k8s`, `ansible/**` → `ansible`
  - Library — `src/**` → `lib`, `tests/**` → `tests`, `examples/**` → `examples`
  - Monorepo — one entry per sub-project module
- `.github/pull_request_template.md` directive text reminds the author
  to link the Jira ticket explicitly in the **Linked Ticket** section
  when Jira is enabled. When `integrations.jira.enabled` is `false`, the
  **Linked Ticket** section and its reminder are omitted entirely (per
  the question 47 downgrade in Step 3e).

**Branch protection flags applied in Step 5i (from #46–52):**

- `required_pull_request_reviews.require_code_owner_reviews: true`
  when #48 is yes.
- `required_conversation_resolution: true` when #51 is yes.
- Add `pr-title-check` to `required_status_checks.contexts` when #52 is yes.

For a GitLab repo, substitute `.gitlab/merge_request_templates/*.md`,
`.gitlab/issue_templates/*.md`, and `.gitlab-ci.yml`.

### 5g.1. AI PR review workflow (Full + Custom when #53 ≠ none)

Generated only when `integrations.github.rules.prs.ai_review.provider`
is not `none`. Skip the entire sub-section otherwise.

Writes one file: `.github/workflows/ai-pr-review.yml`. The content is
**not synthesized inline** — it comes from a provider-specific template
under `ai-instructions/templates/workflows/`, with placeholders
substituted at write time.

**Generator algorithm:**

1. Map `ai_review.provider` to a template path:

       github-models → ai-instructions/templates/workflows/ai-pr-review.github-models.yml
       anthropic-api → ai-instructions/templates/workflows/ai-pr-review.anthropic-api.yml
       bedrock       → ai-instructions/templates/workflows/ai-pr-review.bedrock.yml
       vertex        → ai-instructions/templates/workflows/ai-pr-review.vertex.yml

2. Read the template. Halt with a clear error if the file is missing
   (this would indicate the project was bootstrapped from an old
   template version that didn't ship templates; run `ai-template sync`
   to fix).

3. Substitute placeholders:

   | Placeholder | Source | Required for |
   |---|---|---|
   | `{{PROJECT_NAME}}` | `project.name` | all providers |
   | `{{AI_REVIEW_MODEL}}` | `integrations.github.rules.prs.ai_review.model` | all providers |
   | `{{AI_REVIEW_REGION}}` | `integrations.github.rules.prs.ai_review.region` | bedrock, vertex |

   Failing to substitute leaves placeholders verbatim, which makes the
   YAML invalid and the workflow fails on first dispatch.

4. Write the substituted result to `.github/workflows/ai-pr-review.yml`.

5. Do **not** modify or copy the template comment header — it's there
   for the consumer to read in their own repo as documentation of
   secrets, gotchas, and the workflow-validation gate.

**Default model ids when #54 was not answered explicitly:**

| Provider | Default model | Default region |
|---|---|---|
| `github-models` | `openai/gpt-4o` | (n/a — region is not used) |
| `anthropic-api` | `claude-sonnet-4-6` | (n/a) |
| `bedrock` | `anthropic.claude-sonnet-4-6` | `us-west-2` |
| `vertex` | `claude-sonnet-4-6@20251001` | `us-east5` |

**Bedrock-specific model-id notes.** Newer Anthropic models on Bedrock
use **bare** ids like `anthropic.claude-sonnet-4-6` — not the older
dated cross-region form `us.anthropic.claude-sonnet-4-6-20251001-v1:0`.
The bare id is `INFERENCE_PROFILE`-only, which Bedrock routes
automatically; trying to invoke the foundation-model ARN directly
returns a 400. Discover the right id for the account:

    aws bedrock list-foundation-models --region us-west-2 \
        --query "modelSummaries[?contains(modelId, 'claude-sonnet')].modelId" \
        --output text

If the listed id differs from the default, override with question #54.

**Model-id sanity check before writing.** Whatever id ends up in
`ai_review.model`, surface it to the user as part of Step 5n's
pre-push prompt: "AI review will use `{ai_review.model}` — confirm
this id exists in your account, or override now." This is a
one-line confirmation, not a probe. The CI run is the source of
truth — if the id is wrong, the first PR-review job fails with a
clear "model not found" error and `/tmpl-reconfigure` can swap it.

**Workflow-validation gate (per provider):**

| Provider | Configure PR gets reviewed? |
|---|---|
| `github-models` | **Yes.** `actions/ai-inference@v1` has no validation gate; the workflow fires on the configure PR's open event. |
| `anthropic-api` | **No.** `anthropics/claude-code-action@v1` requires the workflow file on the PR head to byte-equal the version on the default branch. The configure PR adds the file, so its review is skipped with a "this is normal on first run" log. Real reviews begin on the next PR after configure merges. |
| `bedrock` | Same as `anthropic-api`. |
| `vertex` | Same as `anthropic-api`. |

Step 5n's pre-push prompt calls this out per provider so the user
knows whether to expect a review on the configure PR.

**Required-checks coupling.** Do **not** add `ai-pr-review` to
`required_status_checks.contexts` (Step 5i) by default — a model
outage, free-tier rate-limit hit, or transient provider error should
never block merges. Treat the AI review as advisory. The user can
opt in by editing `branch_protection.required_checks` manually.

**Failure handling.** If the secret(s) referenced by the chosen
variant are missing when the workflow first runs (irrelevant for
`github-models` since it uses `GITHUB_TOKEN`), GitHub Actions fails
the job with a clear "Missing secret" message but the PR itself is
unaffected. Step 5n below is responsible for printing the exact
secret-setup commands per provider so the user can complete this
**before** the configure PR is pushed.

**`github-models` rate-limit caveat.** Free-tier limits at time of
writing:

- "High" models (gpt-4o and similar): ~50 requests/day, ~10/minute.
- Output tokens capped at ~4000 per request.

For a single repo with normal PR traffic this is fine. For a
high-traffic monorepo it can throttle — recommend switching to a
paid provider (`anthropic-api` is the easiest), or to a "Low" tier
model in question #54. Mention this in the project's
`CONTRIBUTING.md` if AI review is part of the contribution flow.

For a GitLab repo, the equivalent is a `.gitlab-ci.yml` job that
calls the chosen provider's REST API and posts the review through
the GitLab MR Notes API. Document this as a TODO when
`ci.provider != "github-actions"` rather than generating a
half-working workflow.

#### Variant deep-dives (read the template-file headers)

Each `ai-pr-review.{provider}.yml` template carries its own comment
header documenting prerequisites, gotchas, and the secret list. Open
the relevant file to see them rather than duplicating the content
here:

- `ai-instructions/templates/workflows/ai-pr-review.github-models.yml` — free path, lists rate limits.
- `ai-instructions/templates/workflows/ai-pr-review.anthropic-api.yml` — single secret (`ANTHROPIC_API_KEY`); cheapest paid path.
- `ai-instructions/templates/workflows/ai-pr-review.bedrock.yml` — full Bedrock prerequisite list including the Marketplace activation risk that can return success on EULA acceptance but still block invocation with `ValidationException: Operation not allowed`.
- `ai-instructions/templates/workflows/ai-pr-review.vertex.yml` — WIF provider + service account secrets.

### 5h. Release automation (Full)

**Scope behavior:** Question 31 (Release automation) is `full`-scope, so
this step runs in **Full** mode and in **Custom** mode when the user
opts in. In **Core** mode the question is never asked, this step is
skipped entirely, and no release-automation files are written. Record
the choice in `configure.json.releases.automation` regardless — set it
to `null` (not `"release-please"`) when this step is skipped, so
downstream commands can tell "skipped on purpose" from "Release Please
selected but not yet generated".

- If Release Please:
  - `release-please-config.json` — `"release-type": "simple"` by default
    (switch to `"python"` / `"node"` per subtree only when the stack
    clearly calls for it); `bump-minor-pre-major: true` and
    `bump-patch-for-minor-pre-major: true` so `feat:` / `fix:` bump
    minor / patch while the project is pre-1.0; `pull-request-title-pattern:
    "chore: release ${version}"` so the release PR title passes the
    `pr-title-check` regex generated in 5g; `packages: { ".": { ... } }`
    rooted at the repo with `CHANGELOG.md` at the root.
  - `.release-please-manifest.json` — `{ ".": "0.1.0" }` initial state.
  - `.github/workflows/release-please.yml` — the runner that makes the two
    files do anything. Without this workflow, the configs are inert.
    Contents:

        name: release-please
        on:
          push:
            branches: [main]
        permissions:
          contents: write
          pull-requests: write
        jobs:
          release-please:
            runs-on: ubuntu-latest
            steps:
              - uses: googleapis/release-please-action@v4
                with:
                  config-file: release-please-config.json
                  manifest-file: .release-please-manifest.json

    Swap `main` for the repo's actual default branch if different
    (read from `.git/HEAD` or `git symbolic-ref refs/remotes/origin/HEAD`).
    Record the workflow path under `releases.workflow` in
    `configure.json` (the `releases` object lives at the top level of the
    record, alongside `ci` and `dependencies`).
- If changesets: run `npx changeset init` equivalent and commit the result.

### 5h.1. Deployment workflow (Full, when 29a is enabled)

Generate the deploy pipeline declared in `integrations.deployment` only
when `automation: true`. Skip entirely when `target` is `null`,
`none-yet`, or when the user picked `automation: false`.

For each environment in `integrations.deployment.environments[]`,
generate one workflow file under `.github/workflows/deploy-{env}.yml`
matched to the recorded `target` and `managed_services`:

- **AWS**: build → push to ECR → deploy to the chosen compute
  (ECS service update / Lambda function update / EKS rollout / EC2
  via SSM). OIDC to AWS via `aws-actions/configure-aws-credentials`;
  do **not** generate long-lived AWS keys. Reference secrets via
  `secrets.AWS_ROLE_TO_ASSUME` and `secrets.AWS_REGION`.
- **Azure**: build → push to ACR → deploy to App Service / AKS / Functions.
  Federated credentials via `azure/login@v2`.
- **GCP**: build → push to Artifact Registry → deploy to Cloud Run /
  GKE / Cloud Functions. Workload Identity Federation via
  `google-github-actions/auth@v2`.
- **Vercel / Netlify / Fly.io / Cloudflare Pages / Render**: provider
  CLI step gated on the environment (preview vs production). Token
  via the provider's documented secret name.
- **DigitalOcean / Heroku**: provider CLI / API call with token in
  `secrets.{PROVIDER}_TOKEN`.
- **on-prem / hybrid**: do not generate a workflow; instead, write
  `docs/deployment.md` describing the manual handoff (artifact
  location, target hosts, runbook). Set
  `integrations.deployment.automation: false` and surface a one-line
  warning to the user.

Trigger rules per environment:
- `staging` → `on: push: branches: [main]` (every merge to main).
- `production` → `on: workflow_dispatch:` plus
  `on: release: types: [published]` when Release Please was selected
  in 5h (so a Release Please tag triggers prod). Add a manual approval
  gate via GitHub `environment: production`; require reviewers from
  the recorded `tech_lead` / CODEOWNERS.

Each generated workflow must:
- Reuse the build artifact from `ci.yml` rather than rebuilding (use
  `actions/upload-artifact` + `actions/download-artifact` keyed on the
  commit SHA), so deploy and CI agree on what shipped.
- Include a smoke-test step that hits a documented health endpoint
  (`/healthz`, `/health`, or the equivalent for the framework). Fail
  fast on a non-2xx and trigger an automatic rollback step where the
  provider supports one (ECS deployment circuit breaker, Cloud Run
  traffic split, Vercel `--prebuilt` rollback, etc.).
- Record the resulting workflow file path under
  `integrations.deployment.workflows[{env}]` in `configure.json` so
  later release commands can update or extend it.

When the deployment shape is unfamiliar (target+services combination
not listed above), do not invent a workflow — instead, write a stub
`.github/workflows/deploy-{env}.yml.tpl` with `TODO` markers, set
`integrations.deployment.automation: false`, and tell the user which
parts need a human decision before automation can run.

### 5i. Apply branch protection (Full, requires GitHub MCP)

Use the GitHub MCP to apply the recorded branch-protection settings to the
default branch. If the repo has no remote yet, skip and leave a note in
`configure.json` under `integrations.github.branch_protection.pending: true`
so a later run can finish the job.

### 5j. Team role onboarding docs (always — one per role in `team_roles`)

For each role where `onboarding_doc: true`, generate a human-first
`docs/roles/{role-slug}.md`. Same tone rules as 5e: second-person
voice, narrative over bullets, every placeholder filled from
`configure.json` and the requirements scan, no spec-skeleton
output.

The role doc is **the page a person joining as this role reads on
their second day**, after `docs/onboarding.md`. Onboarding tells
them how the team works in general; the role doc tells them what
*their* role looks like on *this* project.

**Structure (each section has prose around the bullets, not just
headings + bullets):**

    # Welcome, {Display Name}

    A welcome paragraph (~3-4 sentences) that:
    - Names what this role owns on the project, in concrete terms
      (which modules from `configure.json.layout.modules[]`, which
      kinds of tickets in the tracker, which parts of CI).
    - Sets expectations for the first few days — short and warm,
      not "here are your tasks."
    - Points at the one or two artifacts the role most depends on
      (a specific config, a specific subsystem, a key API).

    ## What you own here

    A short narrative (1-2 paragraphs) describing the role's scope
    on this project. Use real names from `configure.json`:
    "**You own the `{module-name}` module at `{path}`** —
    {language}, {framework}, tested with {test stack}. Tickets
    labeled `{role-label}` or in the `{tracker-component}` Jira
    component land on your plate."

    ## Tools you'll use

    A short table or definition list — one row per tool actually
    used by the role on this project (formatter, linter, type
    checker, test runner, framework CLI). Pull from
    `configure.json.conventions.{language}` and
    `configure.json.stack.*`. One-line description per tool, no
    rehashing of `docs/conventions/{language}.md` — link to it
    instead.

    ## Sample tickets you might pick up

    Three or four concrete examples a person in this role would
    work on. When the requirements scan surfaced specific features
    in scope, ground the examples in those features. Examples for
    a Backend Developer on a checkout-flow project:

    > - "Add idempotency keys to the order-creation endpoint."
    > - "Investigate the spike in 503s on `/checkout` after the
    >   3pm deploy."
    > - "Wire up the new `payment_provider` env var into the
    >   payment-gateway adapter."

    Concrete, specific. Avoid generic ("fix a bug").

    ## Your first PR

    A role-specific walkthrough of opening a small, real PR.
    Should produce something the team would actually merge:
    typically a small refactor, a missing test, a doc fix, or a
    small configuration improvement in the role's area. Structure:
    one paragraph framing the PR, then numbered steps with the
    actual commands and files, ending with the PR title +
    description matching this project's conventions.

    Example for a Frontend Developer on a React project:

    > **Goal:** add a unit test for an existing untested
    > component, so you exercise the test runner, the lint hooks,
    > and the PR template before tackling a real ticket.
    >
    > 1. Run `npm test -- --listFiles | grep -L .test` from
    >    `src/frontend/` to find a component without a test.
    > 2. Pick the smallest one. Write a single render test using
    >    {testing-library / vitest / jest as configured}.
    > 3. Branch from `main` using the configured pattern …
    > 4. Open the PR with title `chore: PROJ-XXXX add render test
    >    for {ComponentName}` and the body filled per the PR
    >    template.

    Use the project's real values — never leave `{ComponentName}`
    or `PROJ-XXXX` literally; the AI should pick a real-looking
    placeholder that matches the project's domain.

    ## Who to ask when stuck

    A short paragraph naming the other roles on this team and what
    they're best to ask about. Pull from
    `configure.json.team_roles[]` — for each *other* role on the
    project, one sentence: "{Display} → ask about {what their role
    owns, derived from their role doc's mission}." When a team
    only has one role, replace this section with a pointer to the
    repo's Issues/Discussions or the channel from
    `onboarding.support_channels`.

    ## Your first week

    Day-by-day plan, narrative tone, role-specific. Five days
    default. Each day: one paragraph with the artifact the day
    produces. Different from `docs/onboarding.md`'s first-week
    plan — that one is generic, this one is shaped around the
    role's specific learning curve.

    ## Recommended reading

    A short prose intro ("These are the docs you'll keep coming
    back to. Skim them in this order.") followed by a numbered
    list of paths with a one-line *why care* note for each:

    1. `docs/project-summary.md` — the product idea and the
       must-have features for the first release.
    2. `docs/onboarding.md` — environment setup and how the team
       runs day to day.
    3. `docs/gitflow.md` — branches, commits, PR lifecycle on
       this project.
    4. `docs/conventions/{role-language}.md` — the formatter,
       linter, and idioms you'll be held to in code review.
    5. {role-specific guides from the table below — each with a
       one-line *why care* note}

    Frame as "recommended", not "required" — the role doc is a
    guide, not an order list.

    ## When you're ready to ship for real

    A short, narrative checklist (numbered prose, not unchecked
    boxes) describing what "done with onboarding" means for this
    role. The reader should be able to self-assess. Examples:

    > 1. You've picked up a small real ticket and shipped it
    >    without needing a hand-holding review.
    > 2. You can describe `{module-name}`'s entry point, request
    >    flow, and main external dependencies in two sentences.
    > 3. The CI failures you're most likely to hit on a PR don't
    >    surprise you — you know which job catches which mistake.

    Three to five entries, project-specific. No "Definition of
    Done" heading — that phrasing reads as ceremony; "When you're
    ready to ship for real" reads as friendly milestone.

The role-specific reading + sample tasks come from the table
below. They're inputs to the *Recommended reading* and *Sample
tickets you might pick up* sections — fold them into the prose,
do not paste them as a separate "Initial Tasks" checklist.

Role-specific reading and tasks (used as input to the sections
above — fold into the role doc's prose, don't paste verbatim):

| Role | Extra reading | Extra initial tasks |
|---|---|---|
| Backend Developer | `docs/conventions/{backend-language}.md`; backend framework guide in `ai-instructions/guides/` | Skim `src/backend/`; run backend test suite; list the three oldest open backlog items in the team's tracker (**Atlassian MCP** for Jira tickets labeled `backend` / in the Backend component when Jira is enabled; **GitHub MCP** for issues labeled `backend` otherwise) |
| Frontend Developer | `docs/conventions/typescript.md`; `docs/conventions/css.md` (if Tailwind); frontend framework guide | Skim `src/frontend/`; run frontend tests; list the three oldest open backlog items for the Frontend area (**Atlassian MCP** for Jira tickets in the Frontend component when Jira is enabled; **GitHub MCP** for issues labeled `frontend` otherwise); **via GitHub MCP** list open PRs touching `src/frontend/` |
| QA Engineer | `ai-instructions/guides/testing-*`; `docs/code-review.md` | Run the full test suite on main; review coverage reports; read the latest three release folders under `ai-instructions/releases/` |
| Tech Lead | Every `docs/conventions/*.md`; `ai-plugins.json`; every active guide | Review `ai-plugins.json` (run `/tmpl-verify`); review CI workflows under `.github/workflows/`; read every release's `requirements.md` in `ai-instructions/releases/` |
| UI/UX Designer | `docs/conventions/css.md`; Tailwind config; any Storybook setup | Audit existing components in `src/frontend/`; read the design-system guide if present |
| DevOps Engineer | `.github/workflows/`; `Dockerfile` / `docker-compose.yml`; CI provider config | Verify CI runs green on main; review branch-protection rules via GitHub MCP; inventory secrets and env vars |
| ML Engineer | `ai-instructions/guides/ml-llm-pipeline.md`; data schemas under `src/backend/` | Review extraction pipeline; run the ML test suite |

For every role, weave a *reading-existing-tickets* prompt into the
*Sample tickets you might pick up* section by querying the live
tracker for the three oldest open backlog items in the role's area
and listing them with their tracker IDs and titles. Tracker source:
the **Atlassian MCP** (Jira) when `integrations.jira.enabled` is
`true`; the **GitHub MCP** (Issues filtered by the role's label)
otherwise. Never emit an Atlassian-MCP-only instruction in a
Jira-disabled project — the generator must select the tracker
variant up front, not leave the choice to the reader. When the
tracker query returns nothing (greenfield project), drop the live
listing and rely on the synthetic examples described in the *Sample
tickets* prose above.

### 5k. Human-facing code conventions (run when question #40 is yes)

For each language present in `stack.backend.language`,
`stack.frontend.framework`'s language, and any other detected language,
generate `docs/conventions/{language}.md`.

Each conventions doc must be **human-first** — shorter than the AI guides
under `ai-instructions/guides/` and organized for a team member to skim
before their first PR. Structure:

    # {Language} Conventions

    ## Tooling
    - Formatter: {formatter} — run with `{command}`
    - Linter: {linter} — run with `{command}`
    - Type checker: {tool} — run with `{command}`
    - Test runner: {tool} — run with `{command}`
    Every tool must be runnable both locally and from the pre-commit hook.

    ## Naming
    - Files, directories, modules, classes, functions, variables — concrete
      examples for this language

    ## Error Handling
    - How errors propagate
    - What must never be caught silently
    - Logging pattern

    ## Testing
    - What to test (unit vs integration vs e2e)
    - Coverage target: {from configure.json}
    - Naming and layout of test files

    ## Patterns to Prefer
    - Short list of idiomatic patterns for this project

    ## Anti-Patterns (don't do this)
    - Short list of things that fail review

    ## PR Checklist for this Language
    - [ ] Formatter + linter clean
    - [ ] Tests added/updated
    - [ ] Types strict
    - [ ] No new `any` / `Any` / `interface{}`
    - [ ] Public functions documented

Languages covered by default: Python, TypeScript (covers JS too), Go, Java.
Pull the tooling rows from `conventions.{language}` in `configure.json` so
every command shown is the one configured for this project, not a generic
example.

### 5l. Jira project verification

Skip this step entirely when `integrations.jira.enabled` is `false`
(including the local-docs fallback case).

Use the Atlassian MCP to confirm:

- The project key exists and the authenticated user has access
- The project has at least one issue type matching the team's usage (Story,
  Task, Bug) — warn if the key is valid but the project is empty

Record the verified project key and a timestamp in `configure.json`.

### 5m. Project docs (Confluence or local-docs fallback)

Skip this step entirely when **both**
`integrations.confluence.enabled` and
`integrations.confluence.local_fallback` are `false`.

**Diagrams + images in every page.** The four pages are documentation,
not a wall of text. Each one gets visual content where it adds value:

- **Project Overview** — a Mermaid system-context diagram (or
  PlantUML if the user has explicitly chosen PlantUML). Show the
  project's outside boundary: external users, external systems,
  primary inputs/outputs. Use `flowchart TD` style or C4 context
  shapes if the topic warrants it. Pull the entities from
  `project-summary.md` Architecture section + the modules in
  `layout.modules[]`.
- **Requirements** — if any source file in the requirements locations
  Step 1a scanned (`releases/`, `requirements/`, `docs/requirements/`,
  `specs/`, top-level requirement files) contains images (markdown
  `![alt](path)` or HTML `<img>` references, or alongside-the-md
  image files), preserve them. Resolve relative paths to a stable
  location (`docs/confluence/assets/images/` for local-docs;
  Confluence attachments for remote — upload via the Atlassian MCP's
  attach-file tool, then reference the resulting attachment URL).
  Also generate a Mermaid feature-dependency diagram if the
  requirements describe features with explicit dependencies.
- **Technologies** — a Mermaid module/stack diagram driven by
  `layout.modules[]` and `stack.*`. Each module is a labeled box with
  language + framework underneath; arrows show declared inter-module
  communication (HTTP / RPC / message bus / file artifacts). For
  database / cache modules, show the storage shape.
- **User Roles** — a Mermaid `flowchart LR` **consults graph**: who
  asks whom about what. One node per entry in `team_roles[]`,
  labels from `team_roles[].display`. A directed edge `A -->|topic| B`
  means "as A, you'd ask B about *topic*"; the topic label is a
  short noun phrase (1–4 words) derived from B's role mission (the
  same mission used in 5j's "Who to ask when stuck" section, so the
  diagram and prose stay in sync). Cap each role at 2–3 outgoing
  edges — pick the most mission-relevant targets, not every other
  role. Edges may be reciprocal (A↔B as two separate edges) only
  when the topics differ in each direction. Skip the diagram when
  `team_roles[]` has fewer than two entries; on the page write one
  short paragraph pointing to `onboarding.support_channels` instead.

**Mermaid macro requirement on Confluence.** Remote-mode pages embed
Mermaid via the Atlassian Marketplace's Mermaid macro (or the
official Mermaid Cloud macro if installed). Wrap diagram source in
the macro's `{mermaid}` body. If the user's Confluence instance
doesn't have a Mermaid macro available, fall back to:
1. Render the diagram to PNG locally (the AI can't natively, but the
   `mmdc` CLI can if installed) and upload as an attachment, or
2. If neither macro nor `mmdc` is available, embed the raw Mermaid
   source in a code block and add a one-line note: "Install the
   Mermaid for Confluence app to render this diagram."
Pick option 2 by default; flag the fallback in the run summary so the
user can install the macro and re-run.

**Local-docs HTML embedding.** When generating local-docs HTML pages,
include the Mermaid CDN script in `<head>`:

    <script type="module">
      import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
      mermaid.initialize({ startOnLoad: true, theme: 'default' });
    </script>

Each diagram becomes:

    <pre class="mermaid">
    {mermaid source}
    </pre>

Mermaid renders client-side when the page loads. No build step needed.

**User-provided images** (markdown `![alt](relative-path)` or HTML
`<img src="...">` in any file in the requirements locations Step 1a
scanned — `releases/`, `requirements/`, `docs/requirements/`, `specs/`,
top-level requirement files) must be carried through:

- **Remote (Confluence)**: upload each image as an attachment to the
  destination page via the Atlassian MCP, then rewrite the reference
  to use the resulting attachment URL.
- **Local-docs**: copy each image file to `docs/confluence/assets/images/`
  (or sub-paths matching the source structure if there are many) and
  rewrite the reference to the new relative path.
- Track the moves in `configure.json.integrations.confluence.copied_images[]`
  so re-runs don't re-process files that haven't changed.

Two render targets, same page content:

- **Remote (Confluence MCP)** — when
  `integrations.confluence.enabled` is `true`. Create the basic page set
  from `integrations.confluence.pages_to_create` under the chosen space
  and parent page using the Atlassian MCP's Confluence create-page tool.
  Record the returned page ID and URL in
  `integrations.confluence.created_pages.{page_slug}`. If
  `sync_on_edit` is `true` and a page already exists from a prior
  `/tmpl-setup` run, update the existing page rather than creating a
  duplicate.

  **Failure handling:**

  - If the Atlassian MCP call fails on the first page (auth, network,
    or space-not-found despite the Step 3k pre-check), halt the step,
    record `integrations.confluence.created_pages` partial state in
    `configure.json`, and tell the user the exact MCP error. Do not
    silently fall through to local-docs — the user explicitly chose
    Confluence.
  - If the call fails partway through the page set (e.g., 3 of 4 pages
    created), keep the recorded page IDs for the successes, leave the
    failed slugs as `null`, and tell the user which slugs to retry. A
    later `/tmpl-setup` re-run with `sync_on_edit: true` will pick up
    the missing pages without duplicating the existing ones.
  - If a page returns 403 (permission denied on a parent page even
    though the space is accessible), surface the parent page ID and ask
    the user to either grant access or pick a different parent. Do not
    retry blindly.

- **Local-docs fallback** — when
  `integrations.confluence.local_fallback` is `true`. Write the same page
  set as static HTML files under
  `integrations.confluence.local_path` (default `docs/confluence/`),
  styled to resemble a Confluence page. File layout:

      docs/confluence/
      ├── index.html                 # space landing — lists every page
      ├── assets/confluence.css      # Confluence-style stylesheet
      ├── project-overview.html
      ├── requirements.html
      ├── technologies.html
      ├── user-roles.html
      └── {optional}.html            # gitflow, onboarding (question 59)

  Each file uses this template:

      <!doctype html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>{page.title} — {project.name}</title>
        <link rel="stylesheet" href="assets/confluence.css">
      </head>
      <body class="confluence">
        <header class="aui-header">
          <nav class="breadcrumbs">
            <a href="index.html">{project.name}</a> /
            <span>{page.title}</span>
          </nav>
        </header>
        <div class="page-layout">
          <aside class="sidebar">
            <h2>Pages</h2>
            <ul>{one <li><a> per page in pages_to_create}</ul>
          </aside>
          <main class="page-content">
            <h1 class="page-title">{page.title}</h1>
            <div class="page-labels">
              {one <span class="aui-label"> per label —
               "configure", "project-setup", and the page type}
            </div>
            <div class="page-body">
              {rendered body — the sections below}
            </div>
            <footer class="page-meta">
              Generated by /tmpl-setup on {ISO date}. Edit and regenerate
              in place on the next /tmpl-setup edit run.
            </footer>
          </main>
        </div>
      </body>
      </html>

  `assets/confluence.css` mimics Confluence's visible design:

  - System sans-serif stack (`-apple-system, BlinkMacSystemFont, "Segoe
    UI", Roboto, "Helvetica Neue", Arial, sans-serif`), 14px base.
  - Atlassian colors: text `#172b4d`, links `#0052cc` (hover `#0065ff`),
    page background `#fff`, app background `#f4f5f7`, borders
    `#dfe1e6`, muted text `#5e6c84`.
  - Fixed top header bar (48px, `#0747a6` background, white text, project
    name on the left).
  - Two-column page layout: 240px left sidebar with the page tree, main
    content capped at ~880px with 32px padding, centered.
  - Confluence-style heading scale (h1 24px/600, h2 20px/600, h3
    16px/600), 1.5 line-height, 16px paragraph spacing.
  - Pill-shaped labels (`.aui-label`) with `#f4f5f7` background and
    `#42526e` text.
  - Info / warning panels (`.aui-panel.info`, `.aui-panel.warning`) with
    the Atlassian left-border accent (`#0052cc` / `#ff991f`) for any
    admonitions rendered from `project-summary.md`.
  - Code blocks styled with `#f4f5f7` background and a monospace stack.

  Record local render state in `configure.json` under
  `integrations.confluence.created_pages.{page_slug}` as the relative path
  (e.g., `"project-overview": "docs/confluence/project-overview.html"`).
  On a re-run, regenerate every file in place — do not keep stale copies
  side-by-side.

  Every cross-page link in the body (Requirements → Technologies, etc.)
  uses a relative `.html` href in local-docs mode; in remote mode it uses
  the Confluence page URL returned by the MCP. All other
  repository-relative links (`docs/gitflow.md`, `src/...`) are identical
  between modes.

  **Failure handling (local-docs):**

  - If the target directory cannot be created (permission error,
    read-only filesystem), halt the step and surface the OS error.
    Do not silently fall back to a different path.
  - If a write fails partway through the page set, leave the files that
    were written successfully in place, record the failed slugs as
    `null` in `integrations.confluence.created_pages`, and tell the user
    which files to retry. A re-run regenerates everything in place.
  - On a re-run with `sync_on_edit: true`, overwrite each `.html` file
    in place rather than creating numbered duplicates. Stale files from
    a prior page set that is no longer in `pages_to_create` should be
    listed in the run report so the user can decide whether to delete
    them — never auto-delete.

After all pages are created (remote or local), backfill the Confluence
URL placeholders in `README.md` (written in Step 5a) with the actual
URLs returned by the MCP. In local-docs mode the relative `.html`
paths were already correct at write-time, so no backfill is needed.

Page content is derived from `configure.json` and `project-summary.md` —
do not invent details.

**Project Overview** (`project-overview`)

The Project Overview is the **landing page** for non-developer
stakeholders. Render it as a comprehensive "what is this product
and where do I go next" page — not a stripped-down summary.

    # {project.name}

    ## Idea
    {1-2 sentences from project-summary.md.Idea}

    ## Users
    {project-summary.md.Target Users}

    ## Problem
    {Conditional: render when project-summary.md has a Problem
    section. One short paragraph naming the pain the product
    solves.}

    ## Scope
    - In scope: {Must-have features bullets}
    - Out of scope: {Out of Scope items}

    ## What it looks like
    {Conditional: render when docs_media[] has any UI role-group
    entry. Show the top 3 representative previews inline (each
    image with its label as caption) and a one-line link:
    "See the full Screens index on the [Requirements page](...)
    for all {N} screens with linked requirement codes." Skip
    entirely when no UI artifacts exist.}

    ## Architecture at a glance
    {Architecture shape one-liner from project-summary.md, plus
    the inline-embedded architecture diagram when docs_media[]
    has any architecture role-group entry. When multiple
    architecture artifacts exist, embed the most representative
    one and link to the [Requirements page](...) for the rest.}

    ## Team
    {Auto-generated from configure.json.team_roles[]: a one-line
    summary "Team on this project: {N} roles — {comma-separated
    display names}" followed by a link: "See the full team and
    per-role onboarding on the [User Roles page](...)."}

    ## Tech stack at a glance
    {Three to five bullets from configure.json.stack — backend
    language + framework, frontend framework + styling, primary
    database, cache/queue, key infra (when declared). One line per
    bullet. End with a link: "See the full stack on the
    [Technologies page](...)."}

    ## Non-functional requirements (highlights)
    {Conditional: render when project-summary.md has constraints.
    A short bullet list extracting only the load-bearing entries
    — performance targets, compliance frameworks, hosting
    constraints, deadlines — pulled from configure.json /
    project-summary.md.Constraints. End with a link to the full
    NFR section on the Requirements page.}

    ## Open questions
    {Conditional: render when project-summary.md has an Open
    Questions section. Mirror it here (not a link to the
    Requirements page — open questions are stakeholder-relevant
    and belong on the landing page). Mark each with an
    @mention for the Tech Lead when possible.}

    ## Releases
    {Empty when no releases have been finished yet. Once
    /tmpl-release-finish Step 6b runs, this section grows one row per
    finished release: name, date, short summary, link to PR.
    Auto-managed by /tmpl-release-finish; manual edits are overwritten
    on the next run.}

    ## Links
    - Repository: {GitHub repo URL}
    - Project summary in repo: {path to project-summary.md}
    - Onboarding: {link to docs/onboarding.md or, when Onboarding
      Confluence page is created, that URL}
    - AI workflow explainer: {link to docs/ai-workflow.md}
    - Gitflow: {link to Confluence Gitflow page if created, else
      link to docs/gitflow.md in the repo}
    - Tracker: when `integrations.jira.enabled` is `true`, render
      `Jira project: {Atlassian MCP URL for project key}`. When
      Jira is disabled, render `Issue tracker: {GitHub Issues
      URL for the repo}` instead. Never emit a Jira link in a
      Jira-disabled project.

**Length.** ~600–1200 words is the target. Conditional sections
that are empty stay omitted — the page should never have
"(none provided)" placeholders. A reader who lands here should
get a complete picture of the product, the team, the stack, and
where to read more.

**Requirements** (`requirements`)

Rendered from `ai-instructions/releases/init/project-summary.md` plus
`configure.json.docs_media[]` (for the Screens section). When the
summary is richer than the headings below, preserve its structure
and expand the Confluence page accordingly.

    # Requirements

    ## Vision
    {project-summary.md.Idea — 2-3 sentences}

    ## Target Users
    {project-summary.md.Target Users}

    ## User Stories / Features
    {bullet list of must-have features from project-summary.md.Features}

    ## Scope
    - In scope: {what the first release includes}
    - Out of scope: {what is explicitly deferred}

    ## Screens

    {Conditional: render this section ONLY when docs_media[] has at
    least one UI role-group entry. Use 4.5g's heading rule
    (## Screens / ## Mockups / ## Wireframes / combined). Section
    is placed AFTER ## Scope and BEFORE ## Architecture so a
    reader sees the product before the system shape.}

    {Optional one-sentence intro when N >= 5 entries: "Static
    renders of all {N} screens, captured from the interactive
    prototype at {pixel dimensions of the largest preview} (2× DPR
    when the source dimensions are >= 2x the rendered size).
    Source files in [docs/images/ui/screens/](docs/images/ui/screens/)."}

    | # | Screen | Requirements | Preview |
    |---|---|---|---|
    | 01 | Sign in / register | FR-AUTH-01..07 | <ac:image><ri:attachment ri:filename="sign-in.png"/></ac:image> |
    | 02 | Projects list     | FR-PROJ-01..06 | <ac:image><ri:attachment ri:filename="projects.png"/></ac:image> |

    {Each row reads from one docs_media[] UI entry: `#` is the
    sequential number, `Screen` is the entry's `label`,
    `Requirements` is `linked_requirements` joined by comma (or `—`
    when empty), `Preview` is the embedded preview thumbnail.

    Remote Confluence: upload each preview image as a page
    attachment (Atlassian MCP) and use the
    `<ac:image><ri:attachment.../></ac:image>` storage-format
    syntax. Local-docs mode: render as a regular markdown
    `![label](relative-path)` reference and copy the image into
    `docs/confluence/assets/images/` per the existing 5m image
    flow.

    The `Requirements` column links each code to its anchor in
    the same page — when the # User Stories / Features section
    above lists `FR-AUTH-01..07` as a bullet, render the Screens
    column as a markdown link `[FR-AUTH-01..07](#fr-auth-01-07)`
    so a reader can jump from screen → requirement and back.}

    ## Architecture
    {one-paragraph description of the system shape from project-summary.md}

    ## Non-Functional Requirements
    - Performance: {targets if recorded, else "none captured"}
    - Compliance: {constraints from project-summary.md.Constraints}
    - Hosting: {target from project-summary.md.Constraints}
    - Timeline: {deadline from project-summary.md.Constraints}

    ## Open Questions
    {anything Step 1 left unresolved — mark each with an `@mention` for
    the Tech Lead when possible}

    ## Links
    - Repository: {GitHub repo URL}
    - Project summary in repo: ai-instructions/releases/init/project-summary.md
    - Technologies page: {link to Technologies Confluence page}
    - User Roles page: {link to User Roles Confluence page}

This page is the single place a non-developer can read to
understand what the project does — including what it looks like.
Keep prose short, link everything else, but **never** skip the
Screens section when UI artifacts exist. The visual representation
is the most important context for stakeholders who don't read
code.

When `docs_media[]` has zero UI entries AND the project has no
`client` or `mobile` module declared (API-only / library / IaC),
the Screens section is omitted entirely. When `docs_media[]` has
zero UI entries BUT a `client`/`mobile` module is declared, 4.5g
already surfaced this as suspicious before reaching Step 5 —
proceed only after the user confirmed in 4.5e.

**Technologies** (`technologies`)

The Technologies page is the wiki-side reference for the project's
stack — what's used, what command runs each tool, and where the
full per-language conventions live. Render it as a runnable
reference, not just a list of names.

    # Technologies

    A short opening paragraph framing the page: "This page lists
    every tool active in this project, the command that runs each
    one, and a link to the per-language conventions doc. The
    canonical home for stack details is
    [`ai-plugins.json`](repo link); the sections below are
    regenerated from that file on every `/tmpl-setup` run."

    Rendered from `configure.json.stack`, `conventions`, `hooks`,
    `ci`, `releases.automation`, and `layout.modules[]`. One
    section per top-level category. Each subsection ends with a
    "How to run it" mini-table when commands exist for that
    category.

    ## Modules

    A table mapping every module to its language, manifest, and
    test command. One row per `configure.json.layout.modules[]`
    entry.

    | Module | Path | Kind | Language | Manifest | Tests |
    |---|---|---|---|---|---|
    | backend | src/backend | server | python | pyproject.toml | pytest |
    | frontend | src/frontend | client | typescript | package.json | vitest |

    ## Backend
    {Render only when at least one `kind: server` / `kind: cli` /
    `kind: lib` module exists.}

    - Language: {stack.backend.language}
    - Framework: {stack.backend.framework}
    - Strict typing: {stack.backend.strict_types ? "yes" : "no"}
    - Formatter / linter / type checker:
      {conventions.{language}.formatter} /
      {conventions.{language}.linter} /
      {conventions.{language}.types}

    **How to run it**

    | Tool | Command |
    |---|---|
    | Format | `{formatter run command}` |
    | Lint | `{linter run command}` |
    | Type-check | `{type checker run command}` |
    | Test | `{test runner command}` |

    Full reference:
    [`docs/conventions/{language}.md`](repo link).

    ## Frontend
    {Render only when at least one `kind: client` / `kind: mobile`
    module exists.}

    - Framework: {stack.frontend.framework}
    - Styling: {stack.frontend.styling}
    - Strict typing: {stack.frontend.strict_types ? "yes" : "no"}
    - Formatter / linter: {conventions.{language}.*}

    **How to run it** — same table shape as Backend.

    Full reference:
    [`docs/conventions/{language}.md`](repo link); also
    `docs/conventions/css.md` when styling is Tailwind / CSS-in-JS.

    ## Data
    {Render only when stack.database or stack.cache has entries.}

    - Database: {stack.database joined by comma}
    - Cache / queue: {stack.cache joined by comma}

    ## Testing
    A table summarizing the test stacks per module — pull from
    `stack.testing` joined with the module's `tests` path:

    | Module | Test stack | Run command |
    |---|---|---|
    | backend | pytest | `cd src/backend && pytest` |
    | frontend | vitest | `cd src/frontend && npm test` |

    ## Build and runtime
    - Pre-commit framework: {hooks.framework} — runs
      {comma-separated hooks.* values}
    - Secret scanning: {hooks.secret_scanning}
    - CI: {ci.provider} running {ci.jobs joined with commas}
    - Release automation: {releases.automation}
    - Dependency automation: {dependencies.automation}

    **CI workflows** — link to each workflow file in the repo
    (one row per `.github/workflows/*.yml` written by Step 5g):

    | Workflow | Trigger | What it does |
    |---|---|---|
    | ci.yml | push, pull_request | Lint + typecheck + test + build |
    | pr-title-check.yml | pull_request: opened/edited/reopened | Enforces commit-convention + ticket-ID prefix |
    | release-please.yml | push to main | Auto-generates release PRs and tags |
    | labeler.yml | pull_request | Auto-labels PRs by changed paths |

    ## Conventions reference
    A short list pointing at every per-language conventions doc
    written by Step 5k. One row per language detected:

    - [Python](docs/conventions/python.md) — formatter, linter,
      type checker, naming, error handling, PR checklist
    - [TypeScript](docs/conventions/typescript.md) — same
    - {one row per other language}

    ## Editing this page
    The canonical sources are
    [`ai-plugins.json`](repo link) (stack manifest) and
    [`docs/conventions/`](repo link) (per-language details).
    Edit those, then re-run `/tmpl-setup` (or `/tmpl-reconfigure "sync
    technologies page"`) to regenerate this page. Manual edits
    inside Confluence will be overwritten on the next run.

Every bullet maps directly to a value in `configure.json`. Do not
invent technologies that aren't in the record. Do **not** truncate
sections to fit a "summary" — the Technologies page is the
runnable reference. A developer should be able to copy a command
straight from the table.

**User Roles** (`user-roles`)

The User Roles page is the canonical Confluence-side home for
**every** team role on the project. Render the page so that a
stakeholder browsing Confluence can read the same content as
[`docs/roles/{role-slug}.md`](roles/) **without leaving the
wiki**. The HTML body is generated from the role doc — full
fidelity, not an abbreviated summary.

    # User Roles

    Open with a "team at a glance" paragraph and a small index
    table. Both are generated, not hand-written:

    > Team on this project: {N} roles. Quick links by role:
    >
    > | Role | Mission (one line) | Modules they own |
    > |---|---|---|
    > | Backend Developer | Owns the order pipeline and payment-gateway adapter | src/backend |
    > | Frontend Developer | Owns the storefront SPA and checkout flow | src/frontend |
    > | … | … | … |
    >
    > Full onboarding for each role is below; the source of truth
    > lives at [`docs/roles/`](roles/) in the repo. The sections
    > below are regenerated from those files on every `/tmpl-setup`
    > run — edit the markdown, not this page.

    One section per entry in `configure.json.team_roles[]`. Each
    section renders the **complete** content of the matching
    `docs/roles/{role-slug}.md` — translated to Confluence
    storage-format markup but otherwise identical.

    **Hard rule: full fidelity, not a summary.**

    1. **Read each `docs/roles/{role-slug}.md` file in full before
       starting this section.** Do not generate the Confluence
       section from `team_roles[]` metadata alone — that produces
       a thin "role exists" stub, which is the failure mode this
       page is meant to prevent.
    2. **Copy every section from the role doc into the Confluence
       section.** Do not paraphrase, abbreviate, or "summarize for
       Confluence." Headings, prose paragraphs, tables, code
       blocks, bullet lists, blockquotes — all carry over.
    3. **Length parity.** Each role section in Confluence must be
       within ±10% of the word count of its source
       `docs/roles/{role-slug}.md`. If your Confluence section is
       noticeably shorter, you are summarizing — go back and copy
       the missing prose verbatim.
    4. **Missing sections in the source are missing sections
       here.** Do not invent content to fill a gap. If the role
       doc is short because the role is genuinely thin, that's
       fine; reflect it. If the role doc is rich, reflect that
       too.
    5. **If `docs/roles/{role-slug}.md` does not exist yet at the
       point Step 5n runs, halt this section and complete Step 5j
       first.** Step 5n is downstream of Step 5j by design.

    Every section produced by 5j must show up here in full:

    - Welcome paragraph
    - What you own here (prose)
    - Tools you'll use (table or list)
    - Sample tickets you might pick up (with the live-tracker
      query results when MCPs are available)
    - Your first PR (role-specific walkthrough with literal
      example strings)
    - Who to ask when stuck (cross-role pointers)
    - Your first week (day-by-day narrative)
    - Recommended reading (numbered list with one-line *why care*
      notes)
    - When you're ready to ship for real (self-assessable
      milestones)

    Before moving on from Step 5n, run this self-check for **each**
    role section on the page:

    - [ ] All nine subsection headings above are present.
    - [ ] Word count of the Confluence section is within ±10% of
          `docs/roles/{role-slug}.md`.
    - [ ] No phrase like "see the role doc for details" or "full
          content lives in the repo" appears — those are summary
          markers and indicate the copy was skipped.

    If any check fails, regenerate the section before moving on.

    Convert each section's markdown to Confluence storage format:
    - Headings (`##`, `###`) → `<h2>`, `<h3>`.
    - Tables → `<table>`/`<tr>`/`<td>` (Confluence uses real HTML
      tables in storage format).
    - Code blocks → `<ac:structured-macro
      ac:name="code">`...`</ac:structured-macro>` with the
      language attribute when known.
    - Inline links to repo paths → keep as `<a
      href="{repo-url}/blob/main/{path}">{path}</a>`.
    - Inline links to other Confluence pages → `<ac:link><ri:page
      ri:content-title="..."/></ac:link>`.
    - Embedded role-doc images (rare — most live in 5a's UI
      section) → upload as page attachments via the Atlassian MCP
      (remote) or copy to `docs/confluence/assets/images/`
      (local-docs).

    For each role section, end with a small footer panel:

    > **Editing this page.** The canonical home for this role is
    > [`docs/roles/{role-slug}.md`](repo link). Edit the markdown,
    > then re-run `/tmpl-setup` (or `/tmpl-reconfigure "sync user roles
    > page"`) to regenerate this section. Manual edits inside
    > Confluence will be overwritten on the next run.

    If the scan in Step 1 surfaced roles but Step 3j could not
    map them to any `docs/roles/{role-slug}.md` template, keep
    the Confluence section with this fallback paragraph:
    "Onboarding doc for this role is pending Tech Lead review —
    see `docs/roles/` once it's been written."

The User Roles page is the place a non-developer reads to
understand the team shape **and** what each person actually
does. Treat it as the wiki-side mirror of `docs/roles/`, not as a
trimmed-down index. A reader who lands here should not feel that
they need to clone the repo to get the full story.

**Length.** Per-section length matches the role doc (typically
~600–1500 words). The page can be long — Confluence handles
long pages well, and the table at the top gives readers a quick
in-page jump.

**Optional pages** when question #59 is yes:

- `gitflow` — a Confluence copy of `docs/gitflow.md`
- `onboarding` — a Confluence copy of `docs/onboarding.md`

For every page:

- Set page labels to `configure`, `project-setup`, and one per page type
  (e.g., `project-overview`, `technologies`, `user-roles`). In local-docs
  mode these render as `.aui-label` pills in the page header.
- Restrict edit permissions to the Tech Lead and the Atlassian space
  admins when the user confirms this is appropriate — otherwise leave
  defaults. Local-docs mode has no permission model; the static files
  inherit repo access.
- After creating every page, refresh the parent **Project Overview** page
  (or `index.html` + `project-overview.html` in local-docs mode) so its
  "Links" section lists the new page URLs (or relative `.html` paths).

### 5n. Initial PR + Tech Lead review ticket

This step runs **after every other artifact has been written to the working
tree**. It commits everything and opens a PR through the GitHub MCP. When
Jira is enabled it also creates a Tech Lead review ticket through the
Atlassian MCP and links the two; when Jira is disabled (local-docs
fallback or explicit opt-out) the review checklist lives directly in the
PR body.

Skip the step entirely if `integrations.github.enabled` is `false`; record
`integrations.github.initial_pr_created: false` with a reason.

**Identify the Tech Lead.** Use the `tech-lead` entry in
`configure.json.team_roles[]` if present; otherwise ask:

> Who should review the configure output? ({Jira account ID / email} when
> Jira is enabled, {GitHub username / email} otherwise).
> Default: the user running `/tmpl-setup`.

Record them under `integrations.jira.tech_lead` when Jira is enabled, or
`integrations.github.tech_lead` otherwise.

**Sequence** (order matters — ticket first so the commit message can cite
it, when Jira is enabled):

1. **Create the Jira ticket** via Atlassian MCP
   (skip this sub-step when `integrations.jira.enabled` is `false`):
   - Project: `integrations.jira.project_key`
   - Type: `Task`
   - Summary: `Review /tmpl-setup output for {project.name}`
   - Description (markdown in Jira's native format):
     ```
     /tmpl-setup has prepared the initial project setup. Please review:

     Repository artifacts
     - Decision record: ai-instructions/configure.json
     - Project summary: ai-instructions/releases/init/project-summary.md
     - Gitflow doc: docs/gitflow.md
     - Onboarding doc: docs/onboarding.md
     - Per-role docs: docs/roles/
     - Conventions docs: docs/conventions/
     - CI baseline: .github/workflows/
     - Branch protection: {applied | pending}

     Project docs
     - Project Overview: {confluence URL or docs/confluence/project-overview.html}
     - Requirements: {confluence URL or docs/confluence/requirements.html}
     - Technologies: {confluence URL or docs/confluence/technologies.html}
     - User Roles: {confluence URL or docs/confluence/user-roles.html}

     Pull request: {PR URL will be added after the PR is opened}

     Checklist:
     - [ ] Stack, conventions, gitflow match the team's expectations
     - [ ] Branch protection + required checks are appropriate
     - [ ] Onboarding + role docs are correct for the team
     - [ ] Project docs (Confluence or local-docs) accurately describe the project
     - [ ] PR templates + issue forms match how the team works
     - [ ] Approve PR or request changes
     ```
   - Assignee: Tech Lead from above
   - Labels: `configure`, `setup`
   - Record the returned ticket key in `configure.json` under
     `integrations.jira.review_ticket`.

2. **Create the branch + commit** locally via `git`:
   - Branch name: `feature/{KEY}-{NUMBER}-project-setup` when Jira is
     enabled and the ticket was created in step 1. When Jira is disabled
     (local-docs fallback or opt-out), fall back to `chore/project-setup`.
   - Stage every file produced by this `/tmpl-setup` run. Include
     `ai-instructions/configure.json`, `README.md`, every doc, every
     `.github/` file (issue templates, PR template, CODEOWNERS,
     dependabot, every workflow under `.github/workflows/` —
     `ci.yml`, `pr-title-check.yml`, `labeler.yml`,
     `ai-pr-review.yml` when `ai_review.provider` ≠ `none`, plus release
     automation), `.gitignore`, `.gitattributes`, `.editorconfig`,
     `.pre-commit-config.yaml`, release automation configs, `LICENSE`,
     and (in local-docs mode) `docs/confluence/`. Do **not** stage files
     outside the scope of configure.
   - Commit with Conventional Commits. Include the ticket ID when Jira is
     enabled; omit it otherwise:

         # Jira enabled
         chore: {KEY}-{NUMBER} initial project setup via /tmpl-setup

         # Jira disabled (local-docs fallback)
         chore: initial project setup via /tmpl-setup

         - Decision record and project summary
         - Git + hook baseline
         - Role + conventions docs
         - GitHub PR + issue rules, CI baseline, branch protection config
         - Project docs: {Confluence space / docs/confluence/}

3. **Push the branch** to `origin`.

   **Before this push**, branch on `ai_review.provider`:

   - **`none`** — no AI review workflow was generated. Skip the rest
     of this sub-step and push.

   - **`github-models`** — no secrets to set. The workflow uses the
     built-in `GITHUB_TOKEN` with `models: read` permission. Print a
     one-line confirmation and push:
     > AI review enabled via GitHub Models (free, model
     > `{ai_review.model}`). Workflow will run on this configure PR
     > the moment the branch is pushed. No secrets to set up.

   - **`anthropic-api` / `bedrock` / `vertex`** — **halt** and print
     the secret-setup instructions for the chosen provider, then wait
     for the user to confirm the secrets are in place. Important: for
     these three, `anthropics/claude-code-action@v1`'s
     workflow-validation gate **skips the configure PR's review** with
     a "this is normal on first run" log — real reviews start on the
     next PR after configure merges. Tell the user that explicitly so
     they don't wait for a comment that won't come on this PR.

     Provider-specific blocks:

     - **bedrock** —
       > The AI PR review workflow needs an AWS IAM role assumable via
       > GitHub OIDC, with permission to call `bedrock:InvokeModel` and
       > `bedrock:InvokeModelWithResponseStream` on the model
       > `{ai_review.model}` in region `{ai_review.region}`.
       >
       > Note: newer Anthropic models on Bedrock are
       > `INFERENCE_PROFILE`-only. Grant the policy on the
       > foundation-model ARNs in all three US regions
       > (us-east-1, us-east-2, us-west-2) AND on the matching
       > inference-profile ARN. Also: Bedrock Marketplace activation
       > can return success on EULA acceptance and still block
       > invocation with `ValidationException: Operation not
       > allowed` — that's a "contact AWS support" wall, not a
       > template bug.
       >
       > 1. Create (or reuse) an IAM role with the policy above and a
       >    trust relationship for
       >    `token.actions.githubusercontent.com` scoped to
       >    `repo:{owner}/{repo}:*`.
       > 2. Add the role ARN as a repository secret:
       >
       >        gh secret set AI_REVIEW_AWS_ROLE_ARN --body "arn:aws:iam::<acct>:role/<role>"
       >
       > Confirm both, then I'll push.

     - **anthropic-api** —
       > The AI PR review workflow needs an Anthropic API key with
       > access to model `{ai_review.model}`.
       >
       > 1. Create the key at <https://console.anthropic.com/>.
       > 2. Add the secret:
       >
       >        gh secret set ANTHROPIC_API_KEY --body "sk-ant-..."
       >
       > Confirm done, then I'll push.

     - **vertex** —
       > The AI PR review workflow needs a GCP service account with
       > Vertex AI User on the project that hosts the Claude model,
       > assumable via Workload Identity Federation from GitHub OIDC.
       >
       > Add three repository secrets:
       >
       >     gh secret set AI_REVIEW_GCP_WIF_PROVIDER --body "projects/.../locations/global/workloadIdentityPools/.../providers/..."
       >     gh secret set AI_REVIEW_GCP_SA_EMAIL    --body "ai-review@<project>.iam.gserviceaccount.com"
       >     gh secret set AI_REVIEW_GCP_PROJECT_ID  --body "<project-id>"
       >
       > Confirm done, then I'll push.

     If the user opts to skip secret setup right now (e.g., they
     need to coordinate with their cloud admin), still push the
     branch and open the PR, but **be explicit about the
     consequence**: the `ai-pr-review.yml` workflow file is already
     committed, so GitHub will run it on every subsequent PR until
     the secrets are added — the configure PR itself is exempt
     because the action's validation gate skips it. Failed runs
     don't block merges (the workflow is not in
     `branch_protection.required_checks`), but the red X is noisy.
     Two acceptable shapes:

     - **Default — leave the workflow file in.** Record the
       deferred state by adding the nested `secrets_pending: true`
       flag under `ai_review` (i.e. set
       `configure.json → integrations → github → rules → prs →
       ai_review → secrets_pending = true`).
       Mention in the PR body: "AI review workflow is committed but
       inactive until the `{provider-specific secret list}` are
       set; subsequent PRs will show as failed checks until then."
     - **Alternative — un-commit the workflow.** When the user
       prefers no failed checks, `git rm
       .github/workflows/ai-pr-review.yml` from the staging tree
       before pushing, set `ai_review.provider = "none"`, and tell
       them to re-enable later via
       `/tmpl-reconfigure "switch AI PR review to {provider}"`.

4. **Open the PR** via GitHub MCP:
   - Base: the default branch (usually `main`)
   - Head: the branch from step 2
   - Title: same format as the commit message (triggers `pr-title-check`
     — which must accept the ticket-less form when Jira is disabled; see
     the workflow generator in Step 5g)
   - Body:
     - When Jira is enabled: the same body as the Jira ticket description,
       plus a line `Closes: {KEY}-{NUMBER}` so Jira's GitHub integration
       auto-links.
     - When Jira is disabled: the same content inlined in the PR body
       (artifact list, project docs list pointing at
       `docs/confluence/*.html`, and the review checklist from step 1) —
       no `Closes:` line.
   - Assignees: Tech Lead
   - Reviewers: CODEOWNERS (GitHub resolves them automatically when #48 is
     yes)
   - Labels: `configure`, `setup` (and any paths the labeler adds)
   - Record the returned PR URL in `configure.json` under
     `integrations.github.review_pr`.

5. **Update the Jira ticket** via Atlassian MCP (skip when
   `integrations.jira.enabled` is `false`): replace
   `{PR URL will be added after the PR is opened}` in the description with
   the PR URL, and attach the PR URL as a remote link on the ticket.

6. **Do not merge the PR.** It serves as the Tech Lead's review
   artifact. Record in `configure.json`:

       "integrations.github.initial_pr_created": true,
       "integrations.jira.initial_review_ticket_created": {true | false — false when Jira is disabled}

**Failure handling:**

- If the Jira MCP call fails while Jira is enabled, halt the step and
  tell the user. Do not push a branch or open a PR without a ticket to
  link. (Does not apply when Jira is already disabled — there is no
  ticket to create.)
- If the PR creation fails after the ticket exists, leave the ticket in
  place, record the partial state in `configure.json`, and tell the user the
  exact command to finish manually.
- If the branch already has commits from a prior partial run, offer to
  `git reset --hard` to the tip of the default branch and retry — but only
  on explicit confirmation. Never silently rewrite.

### 5o. Per-role onboarding tasks

Skip this step when `integrations.jira.enabled` is `false`.

For every entry in `configure.json.team_roles[]`, create a Jira task via
the Atlassian MCP. These tasks give each role a concrete starting point
with direct links to the Confluence pages and the repository docs produced
by `/tmpl-setup`.

**Per-role ticket payload**

- **Project**: `integrations.jira.project_key`
- **Type**: `Task`
- **Summary**: `Onboarding: {team_role.display}`
- **Assignee**: unassigned by default. In Custom scope, ask the user for a
  Jira account ID per role before creating.
- **Labels**: `onboarding`, `configure`, and the role slug (e.g.,
  `backend-developer`)
- **Blocked by**: the Tech Lead review ticket from Step 5n — create a
  `blocks` / `is blocked by` link via the Atlassian MCP
- **Description** (Jira native markup):

      Welcome. /tmpl-setup has prepared a setup for the {display} role.

      Required Confluence pages
      - Project Overview: {integrations.confluence.created_pages.project-overview URL}
      - Requirements: {integrations.confluence.created_pages.requirements URL}
      - Technologies: {integrations.confluence.created_pages.technologies URL}
      - User Roles (your section: {display}): {integrations.confluence.created_pages.user-roles URL}#{anchor}

      Repository docs
      - Role doc: docs/roles/{role-slug}.md
      - Gitflow: docs/gitflow.md
      - Onboarding: docs/onboarding.md
      - Relevant conventions: docs/conventions/{language}.md for every
        language you work with

      Initial pull request
      - {PR URL from 5n} — review-only; wait for the Tech Lead to merge
        before you start real work

      Initial tasks (mirrors docs/roles/{role-slug}.md)
      - [ ] Clone the repo and run ./setup.sh
      - [ ] Run ./run.sh and confirm the dev environment starts
      - [ ] Walk a throwaway branch through gitflow end-to-end without
            merging (dry-run the commit convention and PR checks)
      - [ ] Read every Confluence page above
      - [ ] Read docs/roles/{role-slug}.md and the role-specific extras
            listed there
      - [ ] Acknowledge completion on this ticket

**Behavior notes**

- Use the Atlassian MCP to anchor the User Roles link at the role's
  section (`#{role-slug}` anchor). If the MCP cannot resolve anchors,
  link to the page root and mention the section by name in the body.
- Record every created ticket key in `configure.json` under
  `integrations.jira.role_onboarding_tickets`, keyed by role slug.
- On a re-run where `role_onboarding_tickets[role-slug]` already exists
  and is `Open` / `In Progress`, do not create a duplicate; edit the
  existing ticket's description to reflect the updated Confluence URLs.
- If Confluence is disabled, omit the "Required Confluence pages" block
  entirely rather than leaving placeholders.

**Failure handling**

- A single role ticket failure must not halt the others. Record each
  outcome individually in `role_onboarding_tickets` as either the ticket
  key or `"error": "..."`.
- At the end, report the successes and failures in the Step 6 summary.

---

## Step 6: Verify and Hand Off

After writing everything:

1. List what was created, grouped by category (decision record, git baseline,
   hooks, repository docs, role docs + conventions docs, GitHub artifacts,
   Jira verification, project docs (Confluence pages or
   `docs/confluence/` local files), branch protection, initial PR,
   Tech Lead review ticket, per-role onboarding tickets). State the
   integration mode explicitly — **remote (Confluence + Jira)** or
   **local-docs fallback (no Jira)**.
2. List anything that could not be completed and why (e.g., "branch
   protection deferred — no GitHub remote yet", "initial PR deferred —
   GitHub MCP auth failed", "Confluence pages deferred — space key not
   accessible", "Confluence switched to local-docs — Atlassian MCP not
   installed", "onboarding ticket for {role} failed — {reason}").
3. Present the next-step summary:

   > Configuration complete.
   >
   > Integration mode: {remote (Confluence + Jira) | local-docs fallback (no Jira)}
   > Decision record: `ai-instructions/configure.json`
   > Project summary: `ai-instructions/releases/init/project-summary.md`
   > Project docs: {list of Confluence page URLs | list of docs/confluence/*.html paths | "not enabled"}
   > Initial PR: {PR URL or "pending"}
   > Tech Lead review ticket: {ticket key | "skipped — Jira disabled" | "pending"}
   > Role onboarding tickets: {list of {role-slug}: {ticket key} | "skipped — Jira disabled" | "not enabled"}
   >
   > The initial PR is NOT merged — it is waiting on the Tech Lead's review.
   > After they approve and merge, run `/tmpl-bootstrap` on the updated default
   > branch. `/tmpl-bootstrap` reads `configure.json` and generates the AI
   > instruction pack (roles, guides, `ai-plugins.json`, `CLAUDE.md`)
   > without re-asking the questions you just answered.

---

## Re-running `/tmpl-setup`

If `configure.json` already exists, do not silently overwrite it. Offer:

> `configure.json` already exists (scope: **{scope}**, created {timestamp}).
>
> - **edit** — walk the existing answers, change any you want, rewrite
>   artifacts accordingly
> - **replace** — discard the existing record and start over
> - **cancel**
>
> Which one?

Edit mode re-runs Step 3 with the stored answers as defaults, then
regenerates only the artifacts whose inputs changed.
