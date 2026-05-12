# Welcome, Frontend Developer

You own `src/frontend/` — every pixel a fleet manager sees, from the SSO-shortcut row on the auth screen to the lasso-selection feedback on the 8×8 dashboard grid to the dark editor of the SQL console. The team has already invested in a design-token system (`--bg-*`, `--text-*`, `--info`, `--teal`, `--coral`) that you'll inherit from the interactive prototype at [`docs/requirements/fleet_mockup.html`](../requirements/fleet_mockup.html); your job is to translate that prototype into a real React app while keeping the visual language consistent. Your first few days are about reading the prototype carefully and understanding how the spec's three top-level screens map to component trees.

## What you own here

**You own the `frontend` module at `src/frontend/`** — React + TypeScript (strict) + CSS Modules colocated with components. The 9-widget dashboard catalog, the 11 research-tool surfaces, the auth flows, the screen-grid lasso math, every loading and empty state. Tickets labeled `frontend` or in Jira's Frontend component land on you, plus any cross-cutting design-token or accessibility work.

## Tools you'll use

| Tool | Purpose | Where it's configured |
|---|---|---|
| TypeScript (strict) | Type checking | `src/frontend/tsconfig.json` |
| React 19+ | UI framework | conventional setup; entry at `src/frontend/src/main.tsx` |
| CSS Modules | Scoped styling | colocated `*.module.css` next to each component |
| Vite | Dev server + build | `src/frontend/vite.config.ts` |
| vitest + RTL | Unit tests | `src/frontend/tests/unit/` |
| Playwright | End-to-end browser tests | `src/frontend/tests/e2e/` |
| Prettier + ESLint | Formatting + lint (`react`, `react-hooks`, `jsx-a11y`) | `docs/conventions/typescript.md` |

## Sample tickets you might pick up

- Implement the Driver leaderboard widget so it consumes the existing `/api/analytics/drivers/leaderboard` endpoint and renders inside any 3×3 region (per spec §4.4).
- Add a keyboard alternative to drag-to-select on the dashboard: arrow keys to move a focus cell, shift+arrows to extend selection (per spec §6.2 accessibility).
- Wire the password-strength meter on the Create Account form to the four-segment thresholds in spec §3.4 (length ≥ 8 / ≥ 12 / mixed case / digits + symbols).
- Convert the SQL console's syntax highlighter from a static stylesheet to CodeMirror 6, preserving the dark theme and the existing token rules.

## Your first PR

**Goal:** add a single component test for an existing component so you exercise the test runner, the pre-commit hooks, the PR template, and a real DOM assertion before tackling a feature ticket.

1. Run `npm test -- --listFiles | grep -L .test` from `src/frontend/` to find a component without a test.
2. Pick the smallest one. Write a single render test using React Testing Library that asserts the component renders its props and exposes the right accessible name.
3. Branch from `main` as `feature/KAN-XXXX-add-render-test-for-{component}` and commit with `test: KAN-XXXX add render test for {ComponentName}`.
4. Open the PR titled the same and fill the four template sections. Confirm CI is green.

## Who to ask when stuck

- **Backend Developer** — when an API response shape doesn't match what the UI expects. Pair on a small contract change.
- **UI/UX Designer** — colors, type, spacing, animation curves, anything that touches the design tokens.
- **QA Engineer** — when a flow is hard to e2e test; they can pair on Playwright fixtures.
- **DevOps Engineer** — Vercel build issues, env vars in preview deploys, CDN cache busting.
- **Security Engineer** — anything that handles tokens, SSO redirects, or PII in the DOM.

If a question isn't urgent, [open a GitHub Discussion](https://github.com/sidious18/ai-template-reference/discussions) tagged `frontend`.

## Your first week

**Day 1.** Get the stack running. Open the prototype at [`docs/requirements/fleet_mockup.html`](../requirements/fleet_mockup.html) in Chrome and click through every state (auth modes, dashboard demo-states, all 11 research tools). Read `docs/project-summary.md`.

**Day 2.** Read spec §3 (auth) and §4 (dashboard) in detail. Open the prototype's source — every screen is in that one file. Identify the component boundaries you'd draw.

**Day 3.** Open the dry-run PR from [`docs/onboarding.md`](../onboarding.md). Then add the component test described above on a real ticket.

**Day 4.** Pick a real `frontend`-labeled ticket and ship it.

**Day 5.** Read every component in `src/frontend/src/components/` once it exists, even briefly. Skim the latest five merged PRs touching `src/frontend/`.

## Recommended reading

1. [`docs/project-summary.md`](../project-summary.md) — the product idea and must-have features.
2. [`docs/onboarding.md`](../onboarding.md) — environment setup, first-PR dry run.
3. [`docs/gitflow.md`](../gitflow.md) — branches, commits, PR lifecycle.
4. [`docs/conventions/typescript.md`](../conventions/typescript.md) — formatter, linter, idioms.
5. [`docs/code-review.md`](../code-review.md) — per-area review checklist (the React + a11y sections are yours).
6. [`docs/requirements/fleet_operations_spec.md`](../requirements/fleet_operations_spec.md) §3–§5 — auth, dashboard, research workspace.
7. [`docs/requirements/fleet_mockup.html`](../requirements/fleet_mockup.html) — the visual ground truth.

## When you're ready to ship for real

1. You can sketch the component tree for the dashboard's "Configured" state from memory.
2. You've picked up a real ticket and shipped it; the review felt like a discussion, not a hand-holding.
3. You know which design tokens to reach for without scanning the prototype CSS.
4. You can write a Playwright test for a multi-step flow without copy-pasting from an existing one.
