# Welcome, Data Engineer

You own the analytics half of fleet-operations — the ClickHouse schema that holds trips, telemetry, and derived metrics, the seasonality detector and metric metadata pipeline (powering "Suggested: Prophet" hints on seasonal metrics per spec §8.5), the sandbox dataset fixtures (per §8.4), and the ingestion path from operational events into the analytics store. The product's research surface is data-heavy (cohorts, forecasts, anomaly detection, correlation matrices) — your work is what makes those tools snappy enough to hit the perf budgets in §6.1. Your first few days are about understanding the Postgres ↔ ClickHouse split and the entities that live in each.

## What you own here

- **The ClickHouse schema** at `src/backend/src/analytics/schema/` (once `/new-release` scaffolds it). MergeTree-family tables for `trips`, `telemetry`, `derived_metrics`.
- **The Postgres ↔ ClickHouse boundary** — what's transactional (workspaces, layouts, schedules, audit log, users) vs analytical (events, time-series, computed metrics).
- **The sandbox dataset** — synthetic fixtures (50 vehicles, 60 days of trips, realistic distributions) that the SQL console targets for new workspaces. You maintain it.
- **The seasonality detector** — a batch job that tags each metric with a `seasonality_profile` field; the UI reads it for the Prophet auto-suggest in spec §8.5.
- **Metric metadata** — the static manifest describing each metric (id, label, unit, refresh cadence, applicable filters) that drives the dashboard widget pickers and research forms.

## Tools you'll use

| Tool | Purpose |
|---|---|
| `clickhouse-client` + `@clickhouse/client` (TS) | Query + ingestion |
| Postgres CLI + ORM (Drizzle/Prisma) | Cross-checks against the transactional store |
| BullMQ workers (`src/backend/src/queue/`) | Async ingestion + computed-metric refresh |
| dbt or hand-written migrations | Schema evolution — team picks at first `/new-release` |
| Python / Jupyter (optional, local) | Sanity-check forecast and anomaly logic before porting to TS |

## Sample tickets you might pick up

- Author the v1 ClickHouse migration creating `trips`, `telemetry`, and `derived_metrics` tables with sensible partition keys (per-day) and order keys (`(workspace_id, timestamp)`).
- Build the seasonality detector as a daily BullMQ worker job that writes `seasonality_profile` rows to a Postgres `metric_metadata` table.
- Refresh the sandbox dataset for a new metric the product introduces — write the fixture script, register it in the sandbox bootstrap workflow.
- Profile the cohort tool's queries against ClickHouse with 50 drivers × 12 cohort months × 24 months-since-hire; tune order keys or projections to hit the < 5 s target.

## Your first PR

**Goal:** open a small data-side PR — typically a schema TODO doc or a fixture-script scaffold.

1. Write a short `docs/data/clickhouse-schema.md` describing the table shapes you plan for `trips`, `telemetry`, and `derived_metrics`, citing the spec sections that motivate each column.
2. Branch from `main` as `feature/KAN-XXXX-clickhouse-schema-design` and commit with `docs: KAN-XXXX add v1 ClickHouse schema design`.
3. Open the PR. The Tech Lead reviews via CODEOWNERS.

## Who to ask when stuck

- **Backend Developer** — ingestion plumbing, BullMQ worker patterns, error handling at the queue boundary.
- **Tech Lead** — cross-cutting decisions about the Postgres ↔ ClickHouse split.
- **DevOps Engineer** — ClickHouse Cloud capacity, connection pooling, network policy.
- **Security Engineer** — PII in the analytics store (driver names, license numbers — should they even be there?).
- **Product Manager / Business Analyst** — what the metric *means* business-wise before you model it.

If a question isn't urgent, [open a GitHub Discussion](https://github.com/sidious18/ai-template-reference/discussions) tagged `data`.

## Your first week

**Day 1.** Read spec §1.3 (data domain), §4 (dashboard widgets — each is a query), §5.2 (Analyse tools), §8.4 (sandbox). Understand which surfaces hit analytics vs which hit Postgres.

**Day 2.** Sketch a v1 ClickHouse schema for `trips` and `telemetry` on paper. Discuss with the Backend Developer.

**Day 3.** Author the design doc PR above.

**Day 4.** Write the first fixture script that seeds 50 vehicles + 60 days of trips into a local ClickHouse instance — even before the real schema lands, you can iterate against it.

**Day 5.** Read the latest forecast / anomaly literature for fleet telemetry — most of the math is well-trodden; you want to pick safe defaults. Holt-Winters is already the project default (spec §8.5); know why.

## Recommended reading

1. [`docs/requirements/fleet_operations_spec.md`](../requirements/fleet_operations_spec.md) — §1.3, §4, §5.2, §6.1 (perf budgets), §8.4 (sandbox), §8.5 (forecast model).
2. [`docs/project-summary.md`](../project-summary.md) — the Stack section names ClickHouse + Postgres explicitly.
3. [`SECURITY.md`](../../SECURITY.md) — PII handling and audit-log expectations.
4. ClickHouse docs on partition/order keys, projections, MergeTree variants — these are your daily tools.
5. [`docs/onboarding.md`](../onboarding.md), [`docs/gitflow.md`](../gitflow.md).

## When you're ready to ship for real

1. The v1 ClickHouse schema is merged and ingestion is running on staging.
2. The sandbox dataset is in place and the SQL console runs against it for new workspaces.
3. You can answer "why does this widget query take 800 ms?" with a query plan, not a guess.
4. The PM / BA come to you when they want to know whether a new metric is feasible.
