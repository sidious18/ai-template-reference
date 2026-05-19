# Welcome, UI/UX Designer

Welcome to Fleet Operations. You're the bridge between the interactive HTML prototype at [`docs/requirements/fleet_mockup.html`](../requirements/fleet_mockup.html) and the production SvelteKit + Tailwind app at [`src/frontend/`](../../src/frontend/). The prototype is the source of truth for visual decisions today; your job is to evolve it into a real design system as components ship. Day-two priority is walking every screen of the prototype with the spec open alongside, then auditing the Tailwind config to see which tokens are wired and which are still placeholders.

## What you own here

**You own the visual and interaction design across the product** — the dashboard grid composer, the eleven research-workspace tools, the auth screens, and the accessibility bar (WCAG 2.1 AA) everywhere. Concretely:

- The Tailwind token system in `src/frontend/tailwind.config.ts` — colors, spacing, typography scale, radius, shadow, motion durations. Everything visual in the product traces back here.
- The component library inside `src/frontend/` — when one is established. Today the prototype is monolithic; expect the first few real tickets to lift small reusable pieces out into shared components.
- The accessibility contract — keyboard navigation, focus order, color contrast, drag-to-select keyboard alternatives. The spec pins WCAG 2.1 AA as the bar.
- Motion and interaction polish — the dashboard's *selecting* state, the widget-composer's drop preview, modal transitions, micro-feedback. The prototype implies a lot of these; you formalize them.
- Visual review of every PR that touches `src/frontend/` user-visible behavior.

Tickets labeled `design`, `a11y`, or anything that touches visible behavior come to you. You're also the first stop when a developer asks "what should this look like in {edge case}?" and the prototype doesn't cover it.

## Tools you'll use

| Tool | What for |
|---|---|
| The HTML prototype | The current source of truth. Open it in a browser to confirm a spec interpretation. |
| Tailwind CSS + the `tailwind.config.ts` file | Visual tokens — your design system in code. |
| `prettier-plugin-tailwindcss` | Class-name ordering. Keeps reviews focused on logic, not class order. |
| `axe-core` (via Playwright) | Automated accessibility checks. Look at its output as much as the QA Engineer does. |
| Browser devtools | Focus order, contrast inspector, reduced-motion media-query simulation. |
| Atlassian MCP (Confluence) | Documenting design decisions on the Confluence pages created in `/tmpl-setup` Step 5m. |

## Sample tickets you might pick up

The Jira backlog for `KAN` is empty right now. Tickets in your area tend to look like:

> - "Extract the auth-screen color tokens from the prototype into `tailwind.config.ts`. Document the palette in the Confluence Project Overview page."
> - "Design the keyboard-only flow for the dashboard's drag-to-select rectangle. Spec the focus rings, the live-region announcements, and the cancel affordance."
> - "Build the *empty / selecting / configured* state transitions for the dashboard cell — motion, easing, duration. Land them as `transition-*` utility classes plus one or two reusable Svelte components."
> - "Audit the widget-composer for WCAG 2.1 AA. Find every failure with axe-core; categorise (color contrast / focus visibility / live region / keyboard trap) and rank by user impact."

Three-or-four concrete tickets like these will appear in *To Do* as the first sprint plans. Ask the Tech Lead for a starter ticket — usually a token extraction or a small accessibility fix — to walk the gitflow before the bigger pieces.

## Your first PR

**Goal:** add the project's brand color tokens to `tailwind.config.ts` and prove they render by applying one to the existing 404 page (or auth screen). Small, visible, useful.

1. Move your starter ticket (say `KAN-6 Add brand color tokens`) to *In Progress* in Jira.
2. Branch off `main`:
   ```
   git switch main && git pull
   git switch -c feature/KAN-6-add-brand-color-tokens
   ```
3. Open the prototype's CSS; pull the hex values. Add them to `src/frontend/tailwind.config.ts` under `theme.extend.colors`. Use semantic names (`brand`, `surface`, `accent`) rather than `blue500`.
4. Apply one new token to an existing component (the auth screen background, or the 404 page's heading color). Take a before/after screenshot.
5. Commit with `feat: KAN-6 add brand color tokens to tailwind config`.
6. Push. `pre-push` runs lint and typecheck on `src/frontend/`. Fix anything.
7. Open the PR. Embed the before/after screenshot in *Summary* or *Test Plan*; visual PRs without screenshots stall.
8. One approval, squash-merge, delete the branch, move `KAN-6` to *Done*.

## Who to ask when stuck

- **Frontend Developer** → ask about how a design lands in code. They know which Tailwind class is idiomatic, when a token needs to be added vs reused, when a component should be split.
- **Tech Lead** → ask before adding a new external visual dependency (a charting library, an icon set, a CSS framework). It's an ops + bundle-size decision as much as a visual one.
- **Backend Developer** → ask about API constraints that ripple into UX (loading states, error envelope shape, timeouts). When you design empty/error/loading states, you need to know what data shapes the backend actually returns.
- **Data Scientist** → ask about what counts as "noteworthy" in the analytics tools (anomalies, forecast confidence intervals, correlation strengths) so colors and badges map to real semantics.
- **QA Engineer** → ask about accessibility regression coverage and how Playwright + axe-core fits into the test suite.
- **DB Architect** → almost never directly, but ask if a list-ordering decision implies an index.

## Your first week

> **Day 1.** Open the interactive prototype at `docs/requirements/fleet_mockup.html` and walk every screen. Note any visual decisions that look improvised (single colors used only once, magic spacing values) — those are first-week tickets.

> **Day 2.** Read Section 4 (dashboard) and Section 5 (research workspace) of the spec with the prototype open. Pay attention to interaction descriptions — "drag to select", "named layouts", "saved view promotion to widget". Sketch the keyboard-equivalent flows you'll need to design.

> **Day 3.** Walk a dry-run PR end-to-end. The hooks live in `src/frontend/` for any visual change, so make the dry-run change there.

> **Day 4.** Pick up your starter ticket — most likely extracting tokens from the prototype into `tailwind.config.ts`.

> **Day 5.** Open the PR; merge it. Skim the prototype's accessibility — look for missing focus rings, low-contrast text, drag-only interactions. Pick the next two tickets from what you find.

## Recommended reading

1. [`docs/requirements/fleet_mockup.html`](../requirements/fleet_mockup.html) — the prototype. Bookmark it; you'll open it every day.
2. [`docs/requirements/fleet_operations_spec.md`](../requirements/fleet_operations_spec.md) — Sections 4 and 5 are your home; Section 7 (RBAC) and the *Key Constraints* (accessibility, browser support) are non-negotiable.
3. [`docs/project-summary.md`](../project-summary.md) — the product story; *Target Users* tells you who the design is for.
4. [`docs/onboarding.md`](../onboarding.md) — the team rhythm.
5. [`docs/gitflow.md`](../gitflow.md) — PR shape.
6. [`docs/conventions/typescript.md`](../conventions/typescript.md) — the linter and formatter rules you'll work alongside in `*.svelte` files.
7. Tailwind's official docs on `theme.extend` and on accessibility utilities — bookmark.
8. `ai-instructions/guides/frontend-*` — once populated by `/tmpl-bootstrap`, the AI guides for SvelteKit + Tailwind + accessibility patterns are here.

## When you're ready to ship for real

1. You've shipped at least one token-extraction PR and one keyboard-accessibility fix.
2. You can name every reachable state of the dashboard cell (empty / selecting / configured) and describe the transition cues — visual, motion, and live-region — for each.
3. The Tailwind config has at least one semantic token group (colors or spacing) you can defend without referencing the prototype.
4. You've reviewed a Frontend Developer's PR and caught a visual or a11y regression that wasn't in the test suite yet.
5. You can run axe-core via Playwright and read its output without needing a refresher.
