# Welcome, Frontend Developer

You own the `src/frontend/` module — React, TypeScript, Tailwind. The SPA hosts the auth flows, the 8 × 8 dashboard composer, and the eleven-tool research workspace. The product is desktop-first but must read OK on mobile (read-only fallback on viewports ≥ 375 px per §6.3). WCAG 2.1 AA is non-negotiable — keyboard navigation, focus rings, color-as-redundant-signal apply across every screen you'll build.

## What you own here

Everything under `src/frontend/`. Tickets labeled `frontend` or in the Frontend area of the Jira board are yours. Hot zones: `auth/` (sign-in / create-account / SSO + the strength meter), `dashboard/` (the 8 × 8 grid composer — drag-to-select, widget picker, configured-state rendering), `research/` (the eleven tool workspaces — query builder, pivot, cohorts, SQL console, trend & forecast, anomaly detection, driver scoring, correlation matrix, report builder, scheduled exports, saved views), and `shared/` (the design tokens that mirror the Tailwind config).

The 17 reference renders in [`docs/images/ui/screens/`](../images/ui/screens/) are your visual contract. When you change a surface, update the contract by re-running the prototype renderer (`.venv-configure/render_screens.py`) and committing the updated PNG.

## Tools you'll use

| Tool                 | Command                                                                                             |
| -------------------- | --------------------------------------------------------------------------------------------------- |
| Run dev server       | `npm run dev --workspace src/frontend`                                                              |
| Run unit tests       | `npm run test --workspace src/frontend`                                                             |
| Run e2e (Playwright) | `npm run test:e2e --workspace src/frontend`                                                         |
| Lint                 | `npm run lint --workspace src/frontend`                                                             |
| Typecheck            | `npm run typecheck --workspace src/frontend`                                                        |
| Build                | `npm run build --workspace src/frontend`                                                            |
| Accessibility audit  | `npm run test:a11y --workspace src/frontend` (added by `/new-release` once the suite is scaffolded) |

Conventions: [`docs/conventions/typescript.md`](../conventions/typescript.md). When `/new-release` adds Tailwind-specific guidance, it'll land at `docs/conventions/css.md`.

## Sample tickets you might pick up

- "Add the keyboard alternative for dashboard drag-to-select per §6.2 — arrow keys move a focus cell, shift+arrows extend selection."
- "Implement the live password-strength meter on Create account per §3.4 — coral / amber / blue / teal segments based on length + case + digit/symbol mix."
- "Fix the cohort grid's future-cell rendering: the dash-only style is missing on the rightmost column for months ahead of today."
- "Polish the empty-state message on the dashboard to match the spec's exact text in §4.2.1."

## Your first PR

> **Goal**: add a Vitest render test for one component without coverage. Same shape as the Backend Developer's first PR, scoped to the React side.
>
> 1. From `src/frontend/`, find a component without a `.test.tsx` sibling — start with leaf components (a single button, a single label, a status pill).
> 2. Write a render test using Testing Library: render the component, assert one or two visible affordances (text, role, aria-label).
> 3. Branch: `git switch -c feature/KAN-XXX-test-{ComponentName}`. Use a real ticket the Tech Lead pins for onboarding.
> 4. Commit: `test: KAN-XXX add render test for {ComponentName}`.
> 5. PR per the template. Run `npm run test --workspace src/frontend` and paste passing output into Test Plan.
> 6. Address AI-review findings if any are non-stylistic.

## Who to ask when stuck

- **UI/UX Designer** — design tokens, mockup interpretation, missing affordance on a screen, WCAG considerations on visual design.
- **Backend Developer** — API contract changes, request shape, edge cases on the data side.
- **QA Engineer** — Playwright e2e patterns, cross-browser quirks (Safari has the most).
- **Tech Lead** — when a refactor crosses two surfaces or touches the design tokens.

[GitHub Issues](https://github.com/sidious18/ai-template-reference/issues) `question` tag for everything else.

## Your first week

> **Day 1.** Environment up. Open every one of the 17 screens in the local SPA. Compare against the renders under `docs/images/ui/screens/` and the live mockup at `docs/requirements/fleet_mockup.html`.

> **Day 2.** Dry-run PR. Read §4 (Dashboard) and §5 (Research) of the spec end-to-end so the widget catalog and the tool list are in your head.

> **Day 3.** Read `src/frontend/dashboard/` and follow the drag-to-select state machine. This is the most novel UX in the product; spend time on it.

> **Day 4.** Start your first ticket. Aim for a small visual or interaction change — the kind where the AI reviewer's screenshots-in-PR habit will help.

> **Day 5.** Merge your first PR. Confirm the rendered screen in `docs/images/ui/screens/` is still accurate or open a follow-up to refresh.

## Recommended reading

1. [`docs/project-summary.md`](../project-summary.md) — product context + Screens table.
2. [`docs/conventions/typescript.md`](../conventions/typescript.md) — your style guide.
3. [`docs/code-review.md`](../code-review.md) sections 8 (Accessibility) and 9 (Frontend / React).
4. [`docs/requirements/fleet_operations_spec.md`](../requirements/fleet_operations_spec.md) §4 (Dashboard, including §4.3 selection mechanics and §8.1 / §8.2 design decisions), §5 (Research workspace), §6.2 (Accessibility).
5. React + Tailwind official docs — only if you're new to the stack.

## When you're ready to ship for real

1. You've shipped a real ticket without needing a hand-holding review.
2. You can describe the dashboard's three lifecycle states (Empty → Selecting → Configured) and the keyboard alternative for drag-to-select, without consulting the spec.
3. You know which screens have linked requirement codes in `docs/project-summary.md` and you can jump from a code in the spec to the right screen render in two clicks.
4. The browser support matrix (last 2 stable Chrome / Edge / Firefox / Safari) doesn't surprise you — you check Safari early, not last.
