# Welcome, QA Engineer

Welcome to Fleet Operations. You'll own quality across the two product modules — the Vitest unit suite and the Playwright e2e suite, the accessibility checks (axe-core via Playwright), the performance-budget regressions (the spec pins specific numbers — 1.5s dashboard with 12 widgets, 500ms auth FCP, 300ms research-page switch, 30s SQL-console wall-time), and the release-readiness check before anything ships. Day-two priority is running the full test suite green on `main` and reading every "Key Constraints" line in the spec — those are the regressions you'll be paid to catch before users do.

## What you own here

**You own the testing pyramid and the release-readiness check** — not a module, but the bar that decides whether something ships. Concretely:

- The Vitest unit suite across `src/backend/` and `src/frontend/`. Coverage targets and naming conventions live in `docs/conventions/typescript.md`.
- The Playwright e2e suite at `src/frontend/tests/e2e/` — golden paths through the auth screen, the dashboard grid composer, the research workspace tools.
- Accessibility regression: axe-core wired into the Playwright runs. The WCAG 2.1 AA bar applies to every interactive element.
- Performance budgets: the four numbers the spec pins (dashboard, auth FCP, research page switch, SQL-console wall-time). You design the regression checks (lighthouse-ci or equivalent) so a budget violation fails CI rather than slipping through.
- The release-readiness checklist — what you confirm before approving a release PR. Tied to `/tmpl-release-finish`.
- CI test infrastructure — once the CI workflows are generated (Full scope or `/tmpl-reconfigure`), you're the first responder to flaky tests, slow jobs, and infrastructure drift.

Tickets labeled `qa`, `e2e`, `a11y`, `perf`, or `test-infra` come to you. So do any bug reports — you triage them, reproduce them, and decide which suite catches the regression once it's fixed.

## Tools you'll use

| Tool | What for |
|---|---|
| `vitest` | Unit / integration tests in both modules. `npm test` in either. |
| `playwright` | End-to-end tests. `npm --prefix src/frontend run test:e2e`. `npx playwright install chromium` to grab the browser binaries. |
| `axe-core` (via Playwright) | Accessibility checks per page. |
| `lighthouse-ci` (or equivalent) | Performance-budget regression in CI. |
| `eslint`, `tsc --noEmit` | Same tools the developers use — you'll run them on PRs too. |
| `gh` CLI / GitHub MCP | Re-runs of flaky jobs, label management, release-readiness PR comments. |

## Sample tickets you might pick up

The Jira backlog for `KAN` is empty right now. Tickets in your area tend to look like:

> - "Wire axe-core into the Playwright runs. Fail on any new WCAG 2.1 AA violation; add a baseline-allow-list for known issues so PRs are blocked only on regressions."
> - "Add a lighthouse-ci check that fails the build if the dashboard's first-paint with 12 widgets exceeds 1.5s on the standard run."
> - "Stabilise the auth-screen Playwright test — the rate-limit case is flaky because Redis state leaks between runs. Add a test-only Redis flush hook."
> - "Define the release-readiness checklist for `/tmpl-release-finish`: tests green; lighthouse-ci within budget; no open `qa-blocker` tickets; CHANGELOG entry reviewed."

Three-or-four concrete tickets like these will appear in *To Do* as the first sprint plans. Ask the Tech Lead for a starter ticket — usually one missing test for an obvious flow — to walk the gitflow first.

## Your first PR

**Goal:** add a Playwright smoke test for the home route that asserts a 200 response and a single expected heading. It exercises the e2e harness, the test runner, the lint hooks, the commit hook, and the PR template in one small change.

1. Move your starter ticket (say `KAN-7 Add home-route smoke test`) to *In Progress* in Jira.
2. Branch off `main`:
   ```
   git switch main && git pull
   git switch -c feature/KAN-7-add-home-route-smoke
   ```
3. Add `src/frontend/tests/e2e/smoke.spec.ts` with a single Playwright test:
   ```ts
   import { test, expect } from '@playwright/test';

   test('home route renders the auth screen', async ({ page }) => {
     const response = await page.goto('/');
     expect(response?.status()).toBe(200);
     await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
   });
   ```
4. Run it locally: `npm --prefix src/frontend run test:e2e`. Confirm green.
5. Commit with `test: KAN-7 add home-route smoke e2e`.
6. Push. `pre-push` runs lint + typecheck. Fix anything.
7. Open the PR. Paste the Playwright command output into *Test Plan*.
8. One approval, squash-merge, delete the branch, move `KAN-7` to *Done*.

## Who to ask when stuck

- **Frontend Developer** → ask about component test approaches (Vitest + Testing Library patterns), selector strategy, when to assert against role vs label vs text.
- **Backend Developer** → ask about API test setup (in-process server, test-only env vars, Redis flush, Postgres seed data).
- **Tech Lead** → ask about coverage targets, release-readiness rules, and the bar for declaring a regression critical vs minor.
- **DB Architect** → ask about how database state is reset between tests, seed data, and the fastest way to assert on a query result.
- **UI/UX Designer** → ask about the accessibility cases that matter most for the spec's RBAC roles. They'll have a sense for which a11y failures are *user-visible* vs *technically-failing-but-no-one-affected*.
- **Data Scientist** → ask about test fixtures for analytics endpoints — what counts as a representative input and what the expected output should be to within what tolerance.

## Your first week

> **Day 1.** Get both test suites green on `main` locally. Run `npm --prefix src/backend test`, `npm --prefix src/frontend test`, `npm --prefix src/frontend run test:e2e`. Note any flake.

> **Day 2.** Read every *Key Constraints* line in the spec — performance budgets, accessibility, security (SQL-console safeguards), browser support, i18n. These are the regressions you're paid to catch.

> **Day 3.** Walk a dry-run PR end-to-end. Touch a test file so the hooks fire on the right module.

> **Day 4.** Pick up your starter ticket. Add the test, get it green, push.

> **Day 5.** Continue. Sketch what the release-readiness checklist should look like — bring it to the Tech Lead next week.

## Recommended reading

1. [`docs/project-summary.md`](../project-summary.md) — especially *Key Constraints*. Every line is a regression you'll write a test against.
2. [`docs/requirements/fleet_operations_spec.md`](../requirements/fleet_operations_spec.md) — the full spec. Knowing the product is knowing what to assert.
3. [`docs/requirements/fleet_mockup.html`](../requirements/fleet_mockup.html) — the prototype. Walk it before writing any e2e selector strategy.
4. [`docs/onboarding.md`](../onboarding.md) — team rhythm.
5. [`docs/gitflow.md`](../gitflow.md) — PR shape; release-readiness is yours but Release Please is the Tech Lead's.
6. [`docs/conventions/typescript.md`](../conventions/typescript.md) — test naming, layout, and coverage rules.
7. Playwright's official docs on tracing and the test report — bookmark them; you'll re-read after every flaky run.
8. `ai-instructions/guides/testing-*` and `ai-instructions/guides/qa-*` — once populated by `/tmpl-bootstrap`, the AI guides for testing strategy and release readiness are here.

## When you're ready to ship for real

1. The full test suite (unit + e2e + a11y) runs green on `main` and you can recognise a flaky test by its failure shape, not by running it twice.
2. You can name every *Key Constraint* in the spec and point at the test (or write the test) that catches its regression.
3. You've found at least one regression in a PR review that the test suite missed and added the missing test in the same PR.
4. You can read a Playwright trace file end-to-end and pinpoint *exactly* which assertion failed and why.
5. The release-readiness checklist is documented and used in at least one merged release PR.
