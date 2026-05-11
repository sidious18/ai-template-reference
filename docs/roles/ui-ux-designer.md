# Welcome, UI/UX Designer

You own the visual + interaction design of fleet operations. The interactive HTML mockup at `docs/requirements/fleet_mockup.html` is the design source-of-truth shipped with the spec, and the 17 rendered screens at `docs/images/ui/screens/` are its frozen reference. Most of the visual decisions are already settled — color palette, type scale, the 8 × 8 grid, the auth card width, the picker affordance — and your day-to-day work is the open questions in §8 and the new surfaces that v2 will need.

## What you own here

The design tokens that drive Tailwind (when `/new-release` lands `tailwind.config.ts`, you're the CODEOWNER for that file). The screen library at `docs/images/ui/screens/` — when a screen changes, you re-render and update the inline references in `docs/project-summary.md`'s Screens table. The mockup HTML — when a new surface needs visual design before code, you prototype it there first. Accessibility conformance against WCAG 2.1 AA, particularly the color-contrast + keyboard-alternative-for-drag-select rules.

You'll work most closely with the Frontend Developer (they implement what you design) and the Product Manager (they sequence what you design next).

## Tools you'll use

| Tool              | Purpose                                                                                                               |
| ----------------- | --------------------------------------------------------------------------------------------------------------------- |
| Browser           | Open `docs/requirements/fleet_mockup.html` and click through all 17 screens.                                          |
| Playwright render | `.venv-configure/bin/python .venv-configure/render_screens.py` — regenerate the 17 PNGs in `docs/images/ui/screens/`. |
| Figma / Sketch    | Source-of-truth for new visual proposals (kept outside the repo).                                                     |
| `axe-core`        | Accessibility audit — runs in `npm run test:a11y --workspace src/frontend` once `/new-release` scaffolds the suite.   |

## Sample tickets you might pick up

- "Design the empty-state CTA on the dashboard for users who land with no saved layouts." Today it just says the status text from §4.2.1; we want a more inviting illustration + a one-click 'Use starter layout' affordance.
- "Audit color contrast across the configured-state dashboard widgets. Issues feed severity dots and the heatmap need a recheck against WCAG 2.1 AA on small text."
- "Resolve the open question on auth-screen branding (`Open Questions` in `docs/project-summary.md` — no per-workspace branding in v1; PM confirms before SSO ships)."
- "Storyboard the v2 drag-resize affordance per §8.3 — the visual indicator when a resize hits an occupied cell."

## Your first PR

> **Goal**: refresh one of the rendered screens after a visual tweak. Lightweight; exposes you to the render workflow.
>
> 1. Open `docs/requirements/fleet_mockup.html` and make a tiny visual change inline — change a label, tweak a color literal — that's clearly intentional. (Talk with the Tech Lead first; we don't want production-affecting tweaks landing without a real motivation.)
> 2. Re-render: `.venv-configure/bin/python .venv-configure/render_screens.py`.
> 3. Verify the screen you changed looks right; the others should be byte-stable.
> 4. Branch + commit + PR using a real ticket. Include before/after PNGs in the Test Plan section.
> 5. The Frontend Developer reviews; the Tech Lead is CODEOWNER on `docs/`. Both should approve before merge.

## Who to ask when stuck

- **Frontend Developer** — implementation feasibility of a design proposal.
- **QA Engineer** — accessibility audit results, browser-specific rendering quirks.
- **Product Manager** — priority on competing design needs.
- **Tech Lead** — when a proposal needs a design-decision (`§8`) change.

[GitHub Issues](https://github.com/sidious18/ai-template-reference/issues) `question` tag.

## Your first week

> **Day 1.** Click through every screen in `docs/requirements/fleet_mockup.html`. Compare to `docs/images/ui/screens/`. Note any drift — a screen you'd render differently than the existing mockup has — for discussion with the Tech Lead and PM.

> **Day 2.** Read §3 (Auth), §4 (Dashboard), §5 (Research) of the spec end-to-end. Especially §4.2 (the three lifecycle states), §4.3 (selection mechanics), §4.4 (widget catalog with minimum region sizes), and every research tool's "Configuration" / "Output" detail.

> **Day 3.** Read §6.2 (Accessibility). Practice keyboard-only navigation through the auth flow and dashboard. Note what's broken (it will be).

> **Day 4.** Dry-run PR via the gitflow.

> **Day 5.** Start a real ticket. Pick something high-leverage: empty-state design, an audit of contrast on one screen, a storyboard of an open §8 question.

## Recommended reading

1. [`docs/project-summary.md`](../project-summary.md) Screens table — your visual contract.
2. [`docs/requirements/fleet_operations_spec.md`](../requirements/fleet_operations_spec.md) §3–§5 + §6.2 + §8 (design decisions).
3. [`docs/requirements/fleet_mockup.html`](../requirements/fleet_mockup.html) — open in a browser, click everything.
4. [`docs/code-review.md`](../code-review.md) §8 (Accessibility).
5. WCAG 2.1 AA quick-ref: <https://www.w3.org/WAI/WCAG21/quickref/?versions=2.1&levels=aa>

## When you're ready to ship for real

1. You can answer "what does §4.2.2 look like?" without opening the spec — the Selecting state is fully internalized.
2. You know which screens have known a11y debt and which are clean.
3. You've shipped at least one tiny visual change end-to-end (PR, render refresh, merge).
4. You can propose a v2 design decision (e.g., the resize affordance) with rationale that engages with the existing §8.3 commitment.
