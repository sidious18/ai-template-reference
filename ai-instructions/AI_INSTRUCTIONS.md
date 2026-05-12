# AI Instructions

## Purpose

This repository uses a structured AI instruction set for consistent, architecture-aware,
test-covered code generation across sessions and tools.

It ensures that:
- Every session produces architecture-consistent, test-covered, accessible code
- Rules accumulate in files — not in the developer's memory
- Role presets change how the AI thinks, not just what it outputs

---

## Loading order (highest priority first)

1. `CLAUDE.md`                    — project-level instructions (always loaded first)
2. `../ai-settings.md`            — all settings and pipeline configuration
3. `../ai-plugins.json`           — plugin manifest (verified by every release command)
4. `releases/`                    — project requirements and vision (always scanned)
5. `roles/`                       — role persona for the current task (filtered by ai-settings.md)
6. `guides/`                      — technology guide matching the current stack (filtered by ai-settings.md)
7. `guidelines/`                  — detailed reference rules (filtered by ai-settings.md)
8. `refactoring/`                 — loaded only during dedicated cleanup passes (filtered by ai-settings.md)
9. `../docs/`                     — onboarding, gitflow, code-review, per-role, per-language conventions (produced by `/configure`)
10. Project code                  — actual implementation to read and modify

---

## Where to find what

### Settings & Pipeline
- `../ai-settings.md`                         — all settings, pipeline toggles, output rules, task protocol

### Requirements
- `releases/`                             — project requirements in any format (scanned recursively)

### Roles
The list below is the **template's starter sample** — eight common
roles from the 15-slug curated catalog at `AGENTS.md § Role
Selection`. `/bootstrap` Step 8
**rewrites this section** so it lists only the roles enabled in
this project (the set comes from `configure.json.team_roles[]` —
no defaults, no auto-enables). Generated (non-curated) roles get
appended here too.

- `roles/business-analyst.md`     — requirements analysis role
- `roles/ui-ux-designer.md`       — design system and accessibility role
- `roles/qa-engineer.md`          — TDD and test coverage role
- `roles/frontend-developer.md`   — frontend implementation role
- `roles/backend-architect.md`    — system design role
- `roles/backend-developer.md`    — backend implementation role
- `roles/ml-engineer.md`          — ML/LLM pipeline role
- `roles/devops-engineer.md`      — deployment and infrastructure role

Other curated slugs available (selectable in `team_roles[]`):
`platform-engineer`, `sre`, `security-engineer`, `data-engineer`,
`mobile-developer`, `library-author`, `tech-writer`.

### Guides (condensed operational reference)
- `guides/backend-python-fastapi.md`        — Python/FastAPI service guide
- `guides/frontend-react-fsd.md`            — React/TypeScript/FSD guide
- `guides/ml-llm-pipeline.md`               — LLM extraction pipeline guide
- `guides/testing-react-vitest.md`          — Vitest/RTL testing guide
- `guides/verification-python-service.md`   — Python service verification guide

### Guidelines (detailed normative reference)
The list below is the **template's starter sample** — two examples
from the ~15 curated guidelines under `guidelines/` (covering
Python, Django, Java, JUnit, Node.js, React, Next.js, Jest, Pytest,
Playwright, MongoDB, PostgreSQL, Redis, CSS, plus the cross-cutting
testing guidelines). `/bootstrap` Step 8 rewrites this section to list
only guidelines matching the active stack.

- `guidelines/react/ai-react-guidelines.md` — Full React/TS architecture rules
- `guidelines/testing-guidelines.md`        — Full TDD philosophy and coverage rules

### Refactoring
- `refactoring/refactoring-process.md`      — When and how to refactor
- `refactoring/backend-pipeline.md`         — Backend/pipeline refactoring
- `refactoring/css/css-refactoring.md`      — Tailwind utility extraction
- `refactoring/react/react-refactoring.md`  — Component extraction, controller hooks

### Project docs (human-readable, in `docs/` and the project root)
The list below is the **template's starter sample**. `/configure`
writes these files (Step 5a project summary + README, 5d gitflow,
5e onboarding, 5f SECURITY/CONTRIBUTING/code-review, 5j per-role
docs, 5k per-language conventions); `/bootstrap` Step 8
rewrites this section to include only the docs the project actually
has (e.g., `code-review.md` only in Full scope; one entry per
language under `conventions/`; one entry per `team_roles[]` under
`roles/`).

- `../README.md`                               — landing page (project root)
- `../docs/project-summary.md`                 — idea, target users, requirements overview, stack
- `../docs/onboarding.md`                      — environment setup and first-week flow
- `../docs/gitflow.md`                         — branches, commits, PR lifecycle
- `../docs/code-review.md`                     — review checklist (Full only)
- `../docs/conventions/{language}.md`          — human-facing code conventions per language
- `../docs/roles/{role-slug}.md`               — per-role onboarding (one per `team_roles[]`)
- `../docs/ai-workflow.md`                     — human-readable explainer for the AI pack and slash commands

---

## Mandatory output rules (apply when checked in ai-settings.md)

### Architecture
- Follow the established project architecture
- No upward or cross-boundary imports
- Place new files in the correct layer — decide from context

### Components (if using React)
- Maximum component file size: **150 lines** (strict)
- If an inline sub-component exceeds **30 lines**, extract it to a named file
- Never select a component via a JSX ternary in the render body

### CSS / Styling (if using Tailwind)
- Maximum **3 Tailwind utilities** per `className` attribute
- If more utilities are needed, extract a semantic class using `@apply`
- Semantic class names must describe purpose, not appearance

### TypeScript
- Strict mode — no `any`, no type assertions without comment justification
- Domain types in UI, not raw API shapes
- Prefer discriminated unions for state variants

### Logic
- Extract all business logic into custom hooks or service functions — no logic in JSX
- Named predicates for complex conditions
- No inline handlers with branching in JSX props

---

## Task execution protocol

The steps below apply when their corresponding entry is checked in `ai-settings.md`
under Task Protocol. If a step is unchecked, skip it.

### For any non-trivial task:

1. **Explore and plan** — investigate the codebase, propose a file plan
2. **Define types/contracts** — list affected types and interfaces
3. **Get approval** — present the plan before writing code
4. **Implement per file** — use filenames as section headings
5. **Run tests** — confirm passing after implementation
6. **Self-check** — verify against the relevant checklist before finishing

### For bug fixes:
1. Read the failing test or reproduce the issue
2. Identify the root cause — do not patch symptoms
3. Fix the source
4. Confirm tests pass

### For refactoring tasks:
1. Identify all violations of the triggered rule across the codebase
2. Batch by file — fix all violations in one file before moving to the next
3. Run tests after each file — catch regressions immediately
4. New extracted files require their own tests
5. See `refactoring/refactoring-process.md` for the full process

### Never:
- Start implementation without a plan for tasks touching more than 2 files
- Skip tests for new logic
- Mix large refactors with feature implementation

---

## Roles in this project

The list below is the **template's starter sample** — eight common
roles from the 15-slug curated catalog at `AGENTS.md § Role
Selection`. `/bootstrap` Step 8 rewrites this section so it lists
only the roles enabled in this project (from
`configure.json.team_roles[]`).

| Role            | When to activate                                      |
|-----------------|-------------------------------------------------------|
| Business Analyst| New feature, scope change, requirements clarification |
| UI/UX Designer  | New screens, design tokens, component specification   |
| QA Engineer     | Any new logic — runs alongside the developer          |
| Frontend Dev    | Frontend implementation tasks                         |
| Backend Arch    | System design, API contracts, architecture decisions  |
| Backend Dev     | Backend implementation tasks                          |
| ML Engineer     | LLM prompts, extraction, schema alignment             |
| DevOps Engineer | CI/CD, deployment, infrastructure                     |

Other curated slugs available: `platform-engineer`, `sre`,
`security-engineer`, `data-engineer`, `mobile-developer`,
`library-author`, `tech-writer`.

QA Engineer is not a phase — it is a mode that runs **in parallel** with development
on every feature.

---

## Self-check before finishing

Before submitting any non-trivial change, verify:

1. Established architecture boundaries are maintained
2. No component file over 150 lines (if applicable)
3. No inline sub-component over 30 lines (if applicable)
4. All business logic in hooks/services, not in UI
5. Complex conditions use named predicates
6. No `any` types introduced
7. Styling rules followed
8. Tests written and passing for all new logic
