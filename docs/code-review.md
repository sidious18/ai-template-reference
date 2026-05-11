# Code Review Guide

This is the checklist that reviewers (both human and AI) apply to every PR in this repo. It's tailored to the fleet operations stack — TypeScript / NestJS / React + Tailwind — and to the spec's locked invariants (workspace isolation, sandbox-by-default SQL, WCAG 2.1 AA, audit log on admin actions).

Use it in two ways:

- **As an author**, self-review against this checklist before flipping a PR from Draft to Ready for Review. Anything you can't tick, call out in the PR description.
- **As a reviewer**, walk top-to-bottom. The blocking categories (Correctness, Security, Workspace isolation, Test coverage) are the only "request changes" triggers; the rest are comments.

## Blocking categories

### 1. Correctness

- Does the change do what the linked Jira ticket asks? Read the acceptance criteria, then read the diff.
- Are happy paths covered by tests? Are at least two failure paths covered?
- Are date / time fields stored as UTC and rendered in the workspace timezone (`§6.4`)? Spot any `new Date()` against locale; require an explicit zone.
- Are currency / distance / volume units pulled from the workspace setting, not hard-coded (`§6.4`)?
- For changes touching the Dashboard grid: is the cell-rectangularity invariant preserved (`§4.3`)? Non-rectangular selections auto-snap when the bounding box is empty; otherwise the picker stays disabled (`§8.2`).
- For changes touching forecast / anomaly / driver-scoring / correlation: the analytics math must round-trip — the unit test should compute the expected value with a hand calculation, not just re-run the implementation under test.

### 2. Workspace isolation (`§6.5`)

The single most important invariant in this product. Every query and queue job must be scoped to a workspace id. Reject any new code that:

- Reads or writes a tenant entity (`vehicles`, `drivers`, `trips`, `incidents`, `schedules`, `saved_views`, `schedules`, `audit_log`, `dashboards`, `layouts`) without a `workspace_id` filter.
- Constructs a SQL query string that interpolates a workspace id from the request body. Use parameterized queries with the workspace id from the authenticated session.
- In the SQL console, runs a query without the workspace-restricted DB role.
- In a BullMQ job, processes a payload without verifying the `workspaceId` field against the authenticated context.

Where possible, enforce isolation at the persistence layer (RLS on Postgres tables) rather than relying on every query author to remember.

### 3. Security

- Auth changes: hashing algorithm is Argon2id or bcrypt with cost ≥ 12 (`§3.6`). No plaintext password logs.
- Session tokens expire correctly: 30 days with "Stay signed in" checked, 8 hours otherwise (`§3.6`).
- SAML / OIDC code paths validate the SAMLResponse / id_token signature against the workspace's configured provider — never trust the client-supplied issuer.
- Rate-limit code paths use a centralized counter (Redis `INCR` + TTL); reject changes that roll a new in-process rate limiter.
- PII (driver names, license numbers) is not logged. Export endpoints check the caller's role is `Admin` before serving (`§6.5`, `§6.6`).
- Audit log captures every admin action with actor / target / before / after (`§6.5`). New admin endpoints add audit entries.
- Secrets read from AWS Secrets Manager at boot or via the configured `@nestjs/config` provider — never from env files committed to the repo.
- New routes that accept user input validate via Zod / class-validator at the controller layer; rejecting malformed input with 400 not 500.

### 4. Test coverage

- New code has unit tests in Vitest. New components have a render test.
- Bug fixes have a regression test that fails before the fix (the PR should describe how you confirmed this).
- End-to-end Playwright tests are added when a new user-facing flow ships (auth mode, dashboard state, research tool).
- The CI jobs (`lint`, `typecheck`, `test`, `build`) pass cleanly on the PR's commit.

## High-priority comments (not blocking, but address)

### 5. TypeScript hygiene

- `strict: true` is on; `noUncheckedIndexedAccess` is on. No `any`. No `as unknown as X` unless commented.
- Public functions and exported types carry doc comments only when the type alone is insufficient (per repo style: comments explain _why_, not _what_).
- Discriminated unions over optional fields when the shape genuinely differs across cases.

### 6. Naming and structure

- File and directory names are lowercase-hyphen — `driver-scoring.service.ts`, not `DriverScoring.service.ts`. Lowercase-hyphen rule applies to all paths.
- Names describe the domain (`cohort-grid`, `widget-picker`, `sandbox-promotion`), not the layer (`utils`, `helpers`, `controllers/v1/`). A file is named for _what it does_, not where it lives.
- Public surfaces (exported classes, services, components) live at the module's index; private helpers stay file-local. Re-export sparingly.

### 7. Performance

- Dashboard data fetches are batched — one request returns all widget data for a layout (`§4.6`). Don't add a per-widget request.
- Query builder previews respect the 5-row default limit (`§5.1.1`). Pagination is required for anything that can exceed it.
- SQL console queries run with the 30 s timeout + 100 k row truncation + 10 M row cost-estimate (`§5.1.4`, `§8.4`). Don't disable these for "internal" callers — the rule is uniform.
- Frontend bundle size: new dependencies > 50 kB minified+gzipped need justification in the PR. Charts / grid / SQL editor have known footprints; new libraries get a second look.

### 8. Accessibility (`§6.2`)

- All interactive elements are keyboard-navigable. Tab order is sane; focus rings are visible.
- Color contrast meets WCAG 2.1 AA on every text + interactive element.
- Color is never the only signal — anomaly markers carry shape + label, severity dots carry text, correlation cells carry the numeric value.
- The dashboard drag-to-select has a keyboard alternative — arrow keys move a focus cell, shift+arrows extend the selection (`§6.2`).
- New components have an axe-core test, or there's a documented reason they're excluded (e.g., third-party widget with its own a11y story).

### 9. Frontend / React

- Component size: a component over ~200 lines is a smell. Extract sub-components.
- No `useEffect` for derived state — use `useMemo` or move the logic out of state.
- Tailwind classes ordered logically (layout → typography → color → state); use the Prettier Tailwind plugin if a contributor isn't natively sorting.
- New SPA routes register in `App.tsx` (or equivalent router config), not deep in a component.

### 10. Backend / NestJS

- Modules are feature-scoped (`auth.module.ts`, `dashboard.module.ts`, `research.module.ts`), not layer-scoped.
- DTOs separate from entities. Validation on the DTO; persistence shape on the entity.
- Services own business logic; controllers just shape the request/response. Repositories own SQL.
- Guards / interceptors / pipes are reusable — don't duplicate workspace-scoping logic across controllers.
- BullMQ producers and consumers live in a `queues/` subtree of each feature module — not a global `queues/` folder.

### 11. SQL / migrations

- Migrations are reversible (every `up` has a `down`).
- New tables have `workspace_id` if they belong to a workspace. Add an RLS policy in the same migration.
- New indexes have an `EXPLAIN ANALYZE` in the PR body confirming the query plan they're meant to fix.
- Soft-delete fields (`deleted_at`) are added on tenant tables; the 30-day retention sweep relies on this (`§6.4`).

### 12. CI / infra

- New workflow files: the AI review workflow is non-required by default; deploy workflows must have an `environment:` gate for production (manual approval).
- Secrets: never `echo $SECRET`. Use `--mask` when surfacing values in logs.
- Long-running steps have a `timeout-minutes` (default 30) so a hung job doesn't burn the action minutes.

## Style nits (comment freely, don't block)

- Inline comments that explain _why_, not _what_.
- Single-quote strings in TypeScript; the Prettier config enforces this.
- Imports sorted (Prettier + ESLint handles this).
- No `console.log` in production code; use the project logger.

## What we _don't_ review

- Anything Prettier or ESLint catches — the hook + CI gates those. Don't comment "missing semicolon"; tell the author to run `npm run format`.
- Anything Dependabot can land on its own (patch bumps with no API changes).
- Style preferences that aren't in `docs/conventions/*.md`. If you find yourself wanting a new rule, propose it in `docs/conventions/typescript.md` first, then enforce it.

## Approving + merging

- One CODEOWNER approval is required. Reviewers should not approve their own PR.
- Wait for CI green on `lint`, `typecheck`, `test`, `build`, `pr-title-check`. The AI review is advisory — don't block on it.
- Squash merge only. Edit the squash commit message if needed so it remains a Conventional Commit with `KAN-\d+` (release-please reads this).
- Delete the feature branch after merge (auto-deletion is on).

## When to request a second reviewer

- Anything in the auth / SQL-console / audit log surfaces.
- Anything that touches the multi-tenant schema (new tables, new RLS policies, migration that backfills tenant data).
- Anything that changes a public API contract (request/response shape).
- Anything > 800 lines of non-mechanical change.

A second reviewer is requested by adding them as a reviewer on the PR; don't wait for them to notice via GitHub notifications — ping in `#dev` or via Issues.
