# Welcome, Data Scientist

You own the analytics math — the Holt-Winters / linear regression / Prophet forecaster (§5.2.1, default locked in §8.5), the z-score / IQR / seasonal-decomposition anomaly detector (§5.2.2), the four-sub-metric driver scoring model with adjustable weights (§5.2.3), the Pearson / Spearman correlation matrix (§5.2.4), and the cohort retention math (§5.1.3). The SQL console (§5.1.4) is your power-user surface; the sandbox dataset (§8.4) is your domain.

## What you own here

The forecast / anomaly / scoring / correlation modules under `src/backend/research/`. The sandbox dataset generators (50 vehicles, 60 days of trips, realistic distributions per §8.4) — when the schema grows or fields are added, you author the new fixtures. The seasonality detector that backs §8.5 (Prophet auto-suggest). The scoring formula audit-export (§5.2.3 requires the formula + current weights to be exportable for audit).

Where the math lives matters: production analytics runs in the NestJS backend; if Prophet (Python-only) is needed, it runs as a sidecar or Lambda, not in-process.

## Tools you'll use

| Tool                                               | Purpose                                                                              |
| -------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `npm run test --workspace src/backend -- research` | Run the analytics unit tests.                                                        |
| SQL console (in-product)                           | Test queries against the sandbox dataset.                                            |
| `axios` / `fetch` against staging                  | Compare your local forecast output to staging's.                                     |
| Jupyter / pandas                                   | Cross-check math externally (recommended; not in the repo).                          |
| `/new-release` for the data sidecar                | When Prophet lands, `/new-release` will scaffold a `data-services/forecast/` module. |

## Sample tickets you might pick up

- "Add weekly-seasonality auto-detection to the metric metadata pipeline per §8.5 so the Prophet suggestion fires correctly."
- "Audit the driver-scoring weights against a real 30-day window of fleet data. Verify the 90/70 thresholds match the design intent in §5.2.3."
- "Investigate why the correlation matrix shows -0.71 for `driver_score ↔ issues` — reasonable but worth confirming with a hand calculation on the sandbox dataset."
- "Refresh the sandbox dataset for v1.2 — add the new `incident_severity_index` field with a realistic distribution."

## Your first PR

> **Goal**: add a unit test that compares your hand-computed forecast value against the implementation output.
>
> 1. From `src/backend/`, find the forecast test file (`research/trend-forecast.service.test.ts`).
> 2. Add a new `it` case: feed in a small synthetic series (12 weeks of weekly miles, mild upward trend, no seasonality), assert the Holt-Winters output matches what you computed by hand.
> 3. Branch: `feature/KAN-XXX-test-forecast-hand-calculation` (real ticket).
> 4. Commit: `test: KAN-XXX add hand-calculation regression for Holt-Winters baseline`.
> 5. PR. The Test Plan should include the hand-calculation steps so reviewers can reproduce.

## Who to ask when stuck

- **Backend Developer** — service composition, where to put a new module.
- **DB Architect** — query plans for SQL-console power queries, sandbox dataset generation.
- **Tech Lead** — when the math implies a new module / sidecar architecturally.
- **Business Analyst** — when a spec section is ambiguous (especially the §5.2 sections).

[GitHub Issues](https://github.com/sidious18/ai-template-reference/issues) `question` tag.

## Your first week

> **Day 1.** Read §5 of the spec. Pay particular attention to §5.1.3 (Cohorts), §5.2 (the four Analyse tools), and §8.4 / §8.5 (sandbox-by-default and the Holt-Winters default).

> **Day 2.** Explore the sandbox dataset via the SQL console (in-product) — run the queries from §5.1.4 to feel the cost-estimate gates.

> **Day 3.** Read the existing analytics implementations in `src/backend/research/` (these may not exist yet — `/new-release` scaffolds them). If they don't exist, this is a great first-week ticket: scaffold the simplest one (the KPI sums for the Miles widget).

> **Day 4.** Author your first hand-calculation test for whichever analytics module exists.

> **Day 5.** Merge it. Discuss with the Tech Lead what the second priority should be (Prophet sidecar? anomaly detector? cohort retention math?).

## Recommended reading

1. [`docs/requirements/fleet_operations_spec.md`](../requirements/fleet_operations_spec.md) §5 + §8.4 + §8.5.
2. [`docs/project-summary.md`](../project-summary.md) Open Questions — the Prophet sidecar question is yours to drive.
3. Holt-Winters background: <https://otexts.com/fpp3/holt-winters.html>
4. Prophet docs: <https://facebook.github.io/prophet/docs/quick_start.html>
5. `axe-core` for accessibility on chart components (severity dots, anomaly markers, correlation cells) — §6.2 requires color-as-redundant-signal.

## When you're ready to ship for real

1. You can defend the Holt-Winters-as-default decision (§8.5) to a stakeholder asking for Prophet everywhere.
2. The sandbox dataset reflects current schema; new fields have fixtures.
3. At least one analytics module has hand-calculation regression tests.
4. The scoring formula exports as JSON with the weights — audit-friendly per §5.2.3.
