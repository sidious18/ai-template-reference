# Welcome, UI/UX Designer

You own the visual and interaction language of fleet-operations. The interactive prototype at [`docs/requirements/fleet_mockup.html`](../requirements/fleet_mockup.html) is the canonical source of truth for the look and feel — every color token, type scale, and micro-interaction is captured there. Your job is to evolve that prototype as the product grows, keep the design tokens consistent between mockup and code, and protect the accessibility commitments in spec §6.2. Your first few days are about reading the prototype like a designer reads someone else's Figma file: noting every choice, asking "why this".

## What you own here

You own the **design system** (tokens, components, layout primitives), the **interactive prototype**, every **screen mockup** that future tickets will reference, and the **accessibility commitments** baked into spec §6.2 (keyboard navigation, WCAG 2.1 AA contrast, no color-only signals). Tickets labeled `design` or `ux` land on you, plus any change that touches the design tokens (`--bg-*`, `--text-*`, `--info`, `--teal`, `--coral`, etc.).

You do not own component implementation in code — that's the Frontend Developer's plate. You do own keeping the prototype and the implemented UI from drifting apart.

## Tools you'll use

| Tool | Purpose |
|---|---|
| The prototype file ([`docs/requirements/fleet_mockup.html`](../requirements/fleet_mockup.html)) | Single source of visual truth |
| Figma (or your tool of choice) | High-fidelity mockups for new screens |
| Browser dev tools | Spot-check contrast, layout, keyboard nav in the running app |
| WCAG contrast checker | Verify token combinations stay at AA |
| `axe-core` / Lighthouse | Audit shipped pages for accessibility regressions |

## Sample tickets you might pick up

- Refresh the design tokens so the dashboard widget chrome reads consistently across the 9 widget types — colors, spacing, hover states.
- Mock up the in-product onboarding tour for first-time users landing on the empty dashboard (per spec §4.2.1's offer of starter templates).
- Audit the SSO Recent-organizations row for tap-target sizing and add a keyboard-focus state matching the rest of the auth screen.
- Specify the empty-state illustrations for the Saved views library, Anomaly feed, and Scheduled exports list (today they're plain text — they should feel deliberate).

## Your first PR

**Goal:** propose a small, well-scoped design-token tweak via a PR that updates the prototype + a short rationale doc. Even though you'll mostly work in Figma, having an opened-and-merged PR teaches you the gitflow.

1. Pick something small — e.g., the chip background opacity, a button height, the disabled-state shade of a CTA.
2. Edit `docs/requirements/fleet_mockup.html` (the CSS variables block near the top) **only** if the token change should ripple to the prototype. If the change is purely about the design system that the Frontend Developer will implement separately, create `docs/design/{change-slug}.md` with rationale, before/after screenshots, and acceptance criteria.
3. Branch from `main` as `feature/KAN-XXXX-design-token-{slug}` and commit with `docs: KAN-XXXX adjust {token} for {reason}`.
4. Open the PR and tag the Frontend Developer for implementation visibility. Confirm CI is green (only the doc + secret-scan jobs apply).

## Who to ask when stuck

- **Frontend Developer** — what's implementable in CSS Modules today; pair on tricky interactions like the lasso selection.
- **Business Analyst** — when a screen design implies a requirements change. They own the spec text.
- **Product Manager** — when a design decision involves a roadmap or scope tradeoff.
- **QA Engineer** — accessibility audits, regression checklists.

If a question isn't urgent, [open a GitHub Discussion](https://github.com/sidious18/ai-template-reference/discussions) tagged `design`.

## Your first week

**Day 1.** Open the prototype in Chrome and click through every state. Note every screen you'd want to redesign. Don't redesign anything yet — just observe.

**Day 2.** Read spec §6.2 (accessibility), §6.3 (browser support), §6.7 (i18n). Skim the CSS variables block at the top of the prototype HTML — those are the tokens you'll be working with.

**Day 3.** Audit the prototype against WCAG 2.1 AA using a contrast checker. Write up findings in a Discussion (don't open tickets yet — wait for design-review with the team).

**Day 4.** Mock up one improvement from your audit and ship a small design-token PR following the steps above.

**Day 5.** Read the dashboard widget catalog (spec §4.4) and the research-tool descriptions (§5). Sketch in Figma what you'd want each empty state to look like. Share with the team.

## Recommended reading

1. [`docs/project-summary.md`](../project-summary.md) — product idea and target users.
2. [`docs/requirements/fleet_operations_spec.md`](../requirements/fleet_operations_spec.md) — full spec; §6.2 (accessibility), §6.7 (i18n), §8 (design decisions) are core for you.
3. [`docs/requirements/fleet_mockup.html`](../requirements/fleet_mockup.html) — your design system in HTML form.
4. [`docs/onboarding.md`](../onboarding.md) — environment setup and team workflow.
5. [`docs/gitflow.md`](../gitflow.md) — branches, commits, PR lifecycle for the doc PRs you'll open.

## When you're ready to ship for real

1. You can name every design token in the prototype without consulting the file.
2. The Frontend Developer comes to you for ambiguity instead of inventing colors or spacing.
3. You've shipped at least one design improvement end-to-end (Figma → prototype tweak → code change → released).
4. You can run an a11y audit in 15 minutes and produce a written summary the team can act on.
