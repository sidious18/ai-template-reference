# Welcome, QA Engineer

You own the test strategy across both modules — Vitest unit / integration in `src/backend/` and `src/frontend/`, Playwright end-to-end against the running SPA, plus the manual UX flows that automation can't cover yet. The product has a wide surface (3 auth modes, 9 dashboard widgets, 11 research tools, 4 user roles, WCAG 2.1 AA on everything) so test prioritization matters more than coverage percentage.

## What you own here

The Playwright suite at `src/frontend/tests/e2e/`. The accessibility audit (`axe-core` integration scaffolded by `/new-release`'s first run; you'll author the rules). The browser matrix — last 2 stable Chrome / Edge / Firefox / Safari (§6.3). The cross-cutting test infrastructure (test fixtures for workspaces, test data for the SQL console sandbox, CI parallelization). Test coverage on PRs (you don't gate, but you flag in review when a new feature has no e2e and probably should).

## Tools you'll use

| Tool                                        | Command                                                                                                      |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Run all unit tests                          | `npm run test --workspaces --if-present`                                                                     |
| Run frontend e2e                            | `npm run test:e2e --workspace src/frontend` (Playwright; requires a built backend + frontend)                |
| Run e2e against staging                     | `PLAYWRIGHT_BASE_URL=https://staging.fleet-operations.example.com npm run test:e2e --workspace src/frontend` |
| Run a11y audit                              | `npm run test:a11y --workspace src/frontend`                                                                 |
| Generate Playwright code from a click trace | `npx playwright codegen http://localhost:5173`                                                               |
| CI logs                                     | GitHub Actions tab on every PR                                                                               |

## Sample tickets you might pick up

- "Add a Playwright spec covering the SQL console's promotion gate — sandbox mode visible, admin promote click, production mode visible after."
- "Browser audit: confirm the dashboard drag-to-select selection rectangle renders correctly on Safari 17.x. The 8 × 8 grid uses CSS subgrid; Safari had a regression in 17.0."
- "Coverage gap: §3.6 says failed sign-in must rate-limit per IP after 5 attempts in 5 minutes. Add a unit test on the rate-limit service and an e2e that triggers the lockout."
- "Audit color contrast on the new screen the Frontend Developer is shipping in KAN-XXX. Use `axe-core` plus a manual eye on the heatmap cells."

## Your first PR

> **Goal**: add one Playwright e2e covering an existing flow that doesn't have one yet — e.g., the "Create account" auth mode.
>
> 1. Run `npm run test:e2e --workspace src/frontend` locally; identify uncovered flows from the `.spec.ts` filenames in `tests/e2e/`.
> 2. Author one new `*.spec.ts` — clean, focused, no `Promise.all` parallel awaits unless they're actually independent.
> 3. Branch: `feature/KAN-XXX-e2e-create-account`. Real ticket from the Tech Lead.
> 4. Commit: `test: KAN-XXX add e2e for create-account auth mode`.
> 5. PR per the template. Test Plan: paste the passing local run output.

## Who to ask when stuck

- **Frontend Developer** — when an e2e is flaky and you suspect a timing bug in the SPA, not the test.
- **Backend Developer** — when an e2e fails because the API contract changed.
- **DevOps Engineer** — when CI flakes you can't reproduce locally (runner version, browser version, network).
- **UI/UX Designer** — accessibility audit findings.

[GitHub Issues](https://github.com/sidious18/ai-template-reference/issues) `question` tag.

## Your first week

> **Day 1.** Environment up. Run every test command (`npm run test --workspaces`, `npm run test:e2e --workspace src/frontend`, `npm run test:a11y --workspace src/frontend`). Note any that fail or are skipped.

> **Day 2.** Walk all 17 screens manually in Chrome, Edge, Firefox, Safari. Note browser-specific quirks for the Tech Lead.

> **Day 3.** Read every existing `*.spec.ts` to internalize the team's e2e conventions.

> **Day 4.** Dry-run PR via the gitflow. First real ticket: a small coverage gap.

> **Day 5.** Merge your first real PR. Watch the Playwright job pass in CI.

## Recommended reading

1. [`docs/code-review.md`](../code-review.md) §4 (Test coverage), §8 (Accessibility).
2. [`docs/requirements/fleet_operations_spec.md`](../requirements/fleet_operations_spec.md) §6.1 (Performance — these are SLOs you'll audit), §6.2 (Accessibility), §6.3 (Browser support).
3. Playwright docs: <https://playwright.dev/docs/intro>
4. `axe-core` ruleset: <https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md>

## When you're ready to ship for real

1. Every auth mode has at least one Playwright e2e.
2. Every dashboard state (Empty / Selecting / Configured) has an e2e.
3. The accessibility audit produces zero high-severity violations on the 17 reference screens.
4. The browser matrix is documented: which screen renders differently on Safari, which on Firefox.
