# Welcome, Data Scientist

Welcome to Fleet Operations. You'll own the analytics inside the research workspace — four of the eleven tools are statistically substantial: *Trend & forecast* (Holt-Winters, linear regression, Prophet), *Anomaly detection* (z-score, IQR, seasonal), *Driver scoring* (4 weighted sub-metrics), and *Correlation matrix* (Pearson / Spearman). The math lives in your head; the Backend Developer wires it into HTTP. Day-two priority is reading Section 5 of the spec with a notebook open — the parameter spaces (forecast horizons, anomaly thresholds, scoring weights) are partly fixed and partly "configurable per workspace", and you'll be defining the defaults.

## What you own here

**You own the analytics modules' math and the data shapes they consume** — not a single module directory, but the analytics surfaces inside `src/backend/` and the dashboard widgets that depend on them. Concretely:

- The four analytics tools listed above: model choice, parameter defaults, validation strategy, edge-case behavior (what does *forecast* do for a workspace with three months of data and no seasonality? what does *anomaly detection* do during a known outage window?).
- The driver-scoring sub-metric thresholds — the spec marks these as *"configurable per workspace — pending a default set from the product team"*. You define the default set.
- The query shapes against the ClickHouse analytics tables (`trips`, `fuel`, `incidents`). You work closely with the DB Architect to make sure your queries hit the right partitions.
- The shape of the cohort analyses (HR/safety retention cohorts; analyst-driven custom cohorts in the *Cohorts* tool).
- Any model artifacts (rolling statistics, baselines, fit residuals) that get cached in Redis or persisted in Postgres for reuse.

Tickets labeled `analytics`, `forecast`, `anomaly`, `driver-scoring`, or `correlation` come to you. So do any reports of "the forecast looks wrong" or "the anomaly detection is too noisy" — those are tuning problems, not bugs in the usual sense.

## Tools you'll use

| Tool | What for |
|---|---|
| TypeScript (strict) | Source language. The analytics endpoints are wired in TypeScript; you'll write tests in TypeScript too. |
| Python (for exploration) | Most modeling work starts in a notebook. Pandas + statsmodels + Prophet are the usual reach. The notebooks stay in `src/backend/notebooks/` (gitignored beyond `.gitkeep`) and the conclusions land in code as fixed constants or fit parameters. |
| `vitest` | Unit + property-based tests on the analytics functions. |
| `clickhouse-client` | The analytics store. You'll write more queries than anyone except the DB Architect. |
| `pg` client | For driver scoring's weight overrides and any per-workspace tuning stored in Postgres. |
| Atlassian MCP | Documenting analytics decisions in Confluence (the same way the team documents architecture). |

Notebooks are exploration tools — never the source of truth. The shipped code in `src/backend/` is the truth.

## Sample tickets you might pick up

The Jira backlog for `KAN` is empty right now. Tickets that land on the Data Scientist's plate tend to look like:

> - "Implement the trend-and-forecast tool's three model variants (Holt-Winters / linear regression / Prophet). Pick the default per series shape; expose the override via the tool's UI."
> - "Define the default driver-scoring sub-metric thresholds. Document the choice in `docs/decisions/`, encode the defaults in code, expose overrides via the per-workspace settings table."
> - "Tune the anomaly-detection sensitivity for trip-duration outliers. Compare z-score / IQR / seasonal on three weeks of seed data; pick the algorithm and the threshold; back the choice with a notebook in PR review."
> - "Build the correlation-matrix endpoint: Pearson + Spearman over user-selected feature columns; degrade gracefully for series with insufficient samples; return a confidence-interval band per cell."

Three-or-four concrete tickets like these will appear in *To Do* as the first sprint plans. Ask the Tech Lead for a starter ticket — usually a self-contained pure-function model with no DB plumbing — so the gitflow is under your fingers before the bigger pieces.

## Your first PR

**Goal:** add a single pure-function `zScore(samples: number[], value: number)` to the analytics utility module, plus a Vitest table-driven test against a known fixture (NIST-style). It exercises the test runner, the type checker, the commit hook, and the PR template in one small change that's all in your wheelhouse.

1. Move your starter ticket (say `KAN-5 Add zScore utility`) to *In Progress* in Jira.
2. Branch off `main`:
   ```
   git switch main && git pull
   git switch -c feature/KAN-5-add-zscore-utility
   ```
3. Add the function in `src/backend/src/analytics/utils/zscore.ts` (or wherever the analytics util directory lives once it's scaffolded).
4. Add a Vitest table-driven test with at least one well-known fixture and one edge case (empty array, single sample).
5. Commit with `feat: KAN-5 add zScore analytics utility`.
6. Push. `pre-push` runs lint and typecheck. Fix anything.
7. Open the PR. Include the fixture source in *Test Plan* — reviewers want to see where the expected outputs came from.
8. One approval, squash-merge, delete the branch, move `KAN-5` to *Done*.

## Who to ask when stuck

- **DB Architect** → ask about query shape, partition selection, and cost. Their `EXPLAIN` and your `EXPLAIN ANALYZE` together close most performance gaps before they ship.
- **Backend Developer** → ask about how the analytics endpoint is wired into HTTP — error handling, request schema, response envelope, timeouts.
- **Frontend Developer** → ask about how the model's output should be visualized. They'll often have UI constraints (chart axis ranges, confidence-interval rendering) that change what you should return.
- **Tech Lead** → ask before adding a new external dependency (e.g. Prophet) — it's a build and ops decision as much as a modeling one.
- **UI/UX Designer** → ask about the visual semantics of "anomaly" vs "noteworthy" vs "normal." The thresholds you pick must map to the colors and badges they design.
- **QA Engineer** → ask about how an analytics tool gets regression-tested. Numeric outputs are slippery to assert on; you'll need fixtures and tolerances.

## Your first week

> **Day 1.** Get the local backend running. Connect to local ClickHouse with `clickhouse-client`. Run `SHOW TABLES` (empty on a fresh project — but learn the connection ritual now).

> **Day 2.** Read Section 5 of the spec end-to-end — every one of the eleven research-workspace tools, especially the four analytics-heavy ones. Bring up the prototype at `docs/requirements/fleet_mockup.html` and walk those four tools; you want the *user-facing* shape (charts, parameters, defaults) clear before you reach for the math.

> **Day 3.** Walk a dry-run PR end-to-end as described in `docs/onboarding.md`. Touch a file in the backend so the hooks fire on the right module.

> **Day 4.** Pick up your real starter ticket — likely a pure-function analytics utility. Write the function, the test, and a brief note about why the default parameters are what they are.

> **Day 5.** Open the PR; merge it. Skim *Driver scoring* in the spec and start sketching the default sub-metric thresholds — that's likely your next real ticket.

## Recommended reading

1. [`docs/project-summary.md`](../project-summary.md) — the product story; *Architecture Shape* and *Key Constraints* call out analytics-relevant performance budgets.
2. [`docs/requirements/fleet_operations_spec.md`](../requirements/fleet_operations_spec.md) — Section 5 is your home; read the rest for context.
3. [`docs/requirements/fleet_mockup.html`](../requirements/fleet_mockup.html) — the four analytics tools' UX shape; how the model's output will be presented.
4. [`docs/onboarding.md`](../onboarding.md) — environment + team rhythm.
5. [`docs/gitflow.md`](../gitflow.md) — PR shape.
6. [`docs/conventions/typescript.md`](../conventions/typescript.md) — for the analytics code you'll ship.
7. ClickHouse docs on aggregation functions and window queries — bookmark them.
8. `ai-instructions/guides/analytics-*` and `ai-instructions/guides/ml-llm-pipeline.md` — once populated by `/tmpl-bootstrap`, the AI guides for analytics pipelines and ML serving are here.

## When you're ready to ship for real

1. You've shipped at least one analytics utility with a fixture-backed test and one analytics endpoint that's actually called from a widget.
2. You can recite the four analytics tools the spec names and the model choices behind each one without looking it up.
3. The driver-scoring sub-metric defaults are documented and merged, ready for product to ratify.
4. You can read a ClickHouse query plan well enough to predict whether a new filter will hit one partition or fan out across the table.
5. You've made one tuning decision (e.g. picking IQR over z-score for a specific anomaly check) and you can defend it with the notebook that justified it.
