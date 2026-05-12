# Welcome, QA Engineer

You own the team's confidence that fleet-operations actually meets the spec — across the auth flow, the dashboard's lasso + widget mechanics, the 11 research tools, and the cross-cutting commitments in spec §6 (performance budgets, WCAG 2.1 AA, browser matrix, i18n). The good news: you have a detailed spec, an interactive prototype to compare against, and Playwright pre-configured for end-to-end tests. Your first few days are about reading both, then writing the regression checklist nobody else has the time to maintain.

## What you own here

- **End-to-end tests** under `src/frontend/tests/e2e/` (Playwright). The auth → dashboard → research happy path is your top priority once `/new-release` scaffolds the modules.
- **The regression checklist** — a `docs/qa/regression.md` you'll author and maintain. Each release run, walk the checklist; each failure that escapes to production, add an entry.
- **Performance verification** — the targets in spec §6.1 (auth < 500 ms first-paint, dashboard < 1.5 s with 12 widgets, forecast < 5 s, etc.). Confirm on staging before the team merges the release PR.
- **Accessibility audits** — periodic axe-core sweeps against staging; report regressions as Bug issues with `severity: Major`.
- **Bug-triage discipline** — when a bug ticket lacks a clear reproduction or acceptance criteria, you ping the Business Analyst before it goes to engineering.

## Tools you'll use

| Tool | Purpose |
|---|---|
| Playwright | End-to-end browser tests |
| axe-core / Lighthouse | Accessibility + performance audits |
| `gh` CLI | Inspect CI runs, comment on PRs |
| Jira | File / triage bugs |
| The interactive prototype | Visual ground truth for what "looks right" means |

## Sample tickets you might pick up

- Write the e2e test "fleet manager signs in, sees Empty dashboard, lassos a 3×2 region, picks Trend line, sees configured widget" so the entire auth-to-configured-widget flow has at least one regression guard.
- Author the regression checklist for v1 covering the spec's three top-level screens and all six committed design decisions.
- Verify the dashboard's < 1.5 s first-paint target on staging with 12 widgets configured; file a Bug if measurements are off.
- Audit the auth screen for WCAG 2.1 AA contrast violations and surface them in a Discussion before opening tickets.

## Your first PR

**Goal:** add one Playwright test that exercises a flow without yet existing modules, and ship a follow-up commit that enables it once `/new-release` scaffolds the frontend.

1. Add a test scaffold at `src/frontend/tests/e2e/auth-signin.spec.ts` describing the test in a `test.skip(...)` block — once the module lands, you flip `skip` to `test`.
2. Branch from `main` as `feature/KAN-XXXX-e2e-signin-scaffold` and commit with `test: KAN-XXXX scaffold auth sign-in e2e test`.
3. Open the PR. With the no-workspace guard in `ci.yml`, the test job will be skipped until the module exists, but the file lives in the repo so the work isn't lost.

## Who to ask when stuck

- **Frontend Developer** — selector strategies, custom fixtures, page-object patterns for Playwright.
- **Backend Developer** — flaky e2e tests often have a backend timing bug; pair to diagnose.
- **UI/UX Designer** — visual-regression judgment calls.
- **Business Analyst** — when a ticket's acceptance criteria are too vague to test.
- **DevOps Engineer** — staging is misbehaving / a smoke test is failing.

If a question isn't urgent, [open a GitHub Discussion](https://github.com/sidious18/ai-template-reference/discussions) tagged `qa`.

## Your first week

**Day 1.** Read the spec end-to-end with a QA lens. Mark every claim that needs a test.

**Day 2.** Open the prototype. Click through every state. Write rough notes for the regression checklist.

**Day 3.** Set up Playwright locally. Run the existing test suite (when present). Open the dry-run PR from [`docs/onboarding.md`](../onboarding.md).

**Day 4.** Ship the scaffold PR above. Start the regression checklist as a doc PR.

**Day 5.** Read every Bug ticket in the KAN board's history (open + closed). Notice patterns. The patterns shape the regression checklist's priorities.

## Recommended reading

1. [`docs/project-summary.md`](../project-summary.md) — product context.
2. [`docs/requirements/fleet_operations_spec.md`](../requirements/fleet_operations_spec.md) — especially §6 (cross-cutting requirements).
3. [`docs/requirements/fleet_mockup.html`](../requirements/fleet_mockup.html) — visual + behavioral ground truth.
4. [`docs/code-review.md`](../code-review.md) — the per-area review checklist.
5. [`docs/onboarding.md`](../onboarding.md), [`docs/gitflow.md`](../gitflow.md).

## When you're ready to ship for real

1. The regression checklist exists and gets walked before every release.
2. You can spot a spec-vs-prototype mismatch and open the right ticket on it.
3. You've shipped at least one Playwright test that catches a real regression.
4. Engineers ask you before merging anything that touches the dashboard's hot path.
