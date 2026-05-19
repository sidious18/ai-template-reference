# Welcome, Frontend Developer

Welcome to Fleet Operations. You own the two screens fleet managers actually look at every day — the 8×8 dashboard grid with its widget composer, and the research workspace with eleven analytics tools. Most tickets that touch routing, components, dashboard layout, widget UX, the SQL-console UI, or accessibility land on your plate. On day two read the interactive HTML prototype at [`docs/requirements/fleet_mockup.html`](../requirements/fleet_mockup.html) start-to-end with the spec open alongside it; getting the *feel* of the product into your head is the single highest-leverage thing you can do early.

## What you own here

**You own the `frontend` module at [`src/frontend/`](../../src/frontend/)** — SvelteKit + Tailwind in TypeScript, strict mode, tested with Vitest (unit) and Playwright (e2e). The two main routes are the dashboard (8×8 grid composer + nine-widget catalog) and the research workspace (three categories: Explore, Analyse, Deliver — eleven tools total). Auth is its own small surface (sign in, create account with live password-strength meter, SSO tab).

Tickets labeled `frontend` come to you. You're also the first responder for anything user-visible: rendering glitches, layout drift, accessibility regressions, performance budget violations on first paint. The spec pins concrete numbers — *dashboard <1.5s with 12 widgets, auth <500ms FCP, research page switch <300ms* — and you're the person those budgets bind to.

## Tools you'll use

| Tool | What for |
|---|---|
| TypeScript (strict) | Source language. No implicit `any`, no untyped event handlers. |
| SvelteKit | App framework — routing, SSR, page loaders. |
| Tailwind CSS | Styling. Tokens live in `src/frontend/tailwind.config.ts`. |
| `prettier` + `prettier-plugin-svelte` | Formatter. `npm --prefix src/frontend run format`. |
| `eslint` + `eslint-plugin-svelte` | Linter. `npm --prefix src/frontend run lint`. |
| `svelte-check` / `tsc --noEmit` | Type + Svelte component checking. `npm --prefix src/frontend run typecheck`. |
| `vitest` | Component unit tests. `npm --prefix src/frontend test`. |
| `playwright` | End-to-end browser tests. `npm --prefix src/frontend run test:e2e`. |
| `axe-core` (via Playwright) | Accessibility checks (WCAG 2.1 AA target). |

Conventions for this language are in [`docs/conventions/typescript.md`](../conventions/typescript.md).

## Sample tickets you might pick up

The Jira backlog for `KAN` is empty right now (greenfield project), so here are realistic shapes drawn from the spec:

> - "Implement the 8×8 grid composer's *selecting* state: click-and-drag rectangle selection across cells with keyboard alternative (arrow keys + shift-arrows)."
> - "Add the live password-strength meter to the sign-up form. Hooks into zxcvbn; visual states match the prototype's Strong / Medium / Weak."
> - "Build the SQL-console editor's read-only sandbox banner — the banner that says 'Sandbox mode — DDL/DML blocked' and the link to request write access."
> - "Add named-layout switching to the dashboard: dropdown of saved layouts; selecting one re-renders without a full page reload, hitting the <300ms page-switch budget."

Three-or-four concrete tickets like these will appear in *To Do* once the team plans the first sprint. Ask your tech lead for a small starter ticket to walk the gitflow before tackling the bigger ones.

## Your first PR

**Goal:** add a `404` page that matches the visual style of the auth screen, so the project has a non-default not-found view. It exercises SvelteKit's `+error.svelte`, the Tailwind token system, the lint hooks, the PR template, and the commit hook in one small change.

1. Move your starter ticket (say `KAN-3 Add 404 page`) to *In Progress* in Jira.
2. Branch off `main`:
   ```
   git switch main && git pull
   git switch -c feature/KAN-3-add-404-page
   ```
3. Add `src/frontend/src/routes/+error.svelte`. Keep it short — a centered card with the status, message, and a link back to `/`. Use the same color tokens as the auth screen so it feels native.
4. Add a Playwright test asserting the 404 page renders with the expected text on a bad route.
5. Commit with `feat: KAN-3 add styled 404 page`.
6. Push. `pre-push` runs `lint` and `typecheck`. Fix what it flags.
7. Open the PR with the matching title. Fill the four template sections; in *Test Plan* include `npx playwright test` output.
8. One approval, squash-merge, delete the branch, move `KAN-3` to *Done*.

## Who to ask when stuck

- **UI/UX Designer** → ask about visual tokens, motion, accessibility patterns, anything pixel-shaped. They own the Tailwind config and the design-system handoff from the HTML prototype to production components.
- **Backend Developer** → ask about API contracts. If a payload doesn't shape the way the UI needs, they're the change. The widget batch-data endpoint and the scheduled-exports flow are particularly tightly coupled to the UI.
- **Tech Lead** → ask about architecture decisions that cross frontend and backend (real-time vs polling, SSR vs CSR for a specific page, state-management approach for a new flow).
- **QA Engineer** → ask about Playwright flake, the e2e harness, and the accessibility checks. They own the test infrastructure.
- **Data Scientist** → ask about how the analytics tools' outputs should be visualized — when to show a confidence interval, when to truncate, what counts as "anomalous enough to highlight."
- **DB Architect** → mostly indirect, via the Backend Developer. If you need to know whether a new filter is cheap or expensive to add to a list endpoint, they're who knows.

## Your first week

> **Day 1.** Get the frontend running locally. Visit `http://localhost:5173`; click through the auth screen, the dashboard placeholder, and any research-workspace stubs that exist.

> **Day 2.** Open the interactive prototype at `docs/requirements/fleet_mockup.html` and walk *every* screen. Read the spec's Section 4 (dashboard) and Section 5 (research workspace) with the prototype open. By the end of the day you should be able to describe the dashboard's three states (empty / selecting / configured) and the eleven research tools in one breath.

> **Day 3.** Walk a dry-run PR end-to-end as described in `docs/onboarding.md`. Touch a frontend file so the hooks fire on the right module.

> **Day 4.** Pick up your real starter ticket. Branch, commit, get the component test passing, push.

> **Day 5.** Continue. Get an approval and squash-merge. Re-read `docs/conventions/typescript.md` with the component you just shipped in mind.

## Recommended reading

These are the docs you'll keep coming back to:

1. [`docs/project-summary.md`](../project-summary.md) — what the product is and who it's for.
2. [`docs/requirements/fleet_mockup.html`](../requirements/fleet_mockup.html) — the interactive prototype. The most efficient way to learn the product.
3. [`docs/requirements/fleet_operations_spec.md`](../requirements/fleet_operations_spec.md) — the spec. Section 3 (auth) through Section 7 (RBAC, audit log) cover everything user-visible.
4. [`docs/onboarding.md`](../onboarding.md) — local setup and the team's day-to-day.
5. [`docs/gitflow.md`](../gitflow.md) — branches, commits, PR lifecycle.
6. [`docs/conventions/typescript.md`](../conventions/typescript.md) — formatter, linter, idioms.
7. `ai-instructions/guides/frontend-*` — once populated by `/tmpl-bootstrap`, the AI guides for SvelteKit + Tailwind + accessibility are here. Patterns expected on PR review come from these.

## When you're ready to ship for real

1. You've shipped a real KAN ticket end-to-end — branched, commits passed the hook, PR passed the title check, one approval, squash merge.
2. You can name the three states of the dashboard grid and what triggers each transition without looking at the spec.
3. The performance budgets (1.5s dashboard, 500ms auth FCP, 300ms page switch) are reflexes — you reach for the Network tab and the Performance profile before declaring a feature done.
4. You've made one accessibility-driven change (keyboard navigation, focus order, contrast) and you know how the Playwright + axe-core check would catch the regression.
5. You can read a Tailwind class string in code review and immediately spot anti-patterns (arbitrary values where a token exists, layout fixes via `!important`, missing focus-visible state).
