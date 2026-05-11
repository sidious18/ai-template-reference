# Welcome, DB Architect

You own the Aurora Postgres schema, the RLS policies that enforce workspace isolation, the soft-delete + 30-day retention strategy, and the sandbox-vs-production data split for the SQL console. The schema models five core entities (vehicles, drivers, trips, incidents, schedules), an audit log, dashboard layouts, saved views, scheduled exports, and the multi-tenant `workspaces` + user-account tables that scope all of the above.

## What you own here

All migrations under `src/backend/migrations/` (location may evolve when `/new-release` scaffolds the module). The RLS policies on tenant tables — every workspace-scoped table must have one, and the test suite must verify it. The query plans for the analytics-heavy paths (cohorts, correlation, forecast). The cost-estimate logic for the SQL console (§5.1.4, §8.4) — `EXPLAIN`-based pre-flight that warns the user before scanning 10M+ rows. The sandbox dataset fixture (50 vehicles, 60 days of trips per §8.4) — co-owned with the Data Scientist.

## Tools you'll use

| Tool                          | Purpose                                                                |
| ----------------------------- | ---------------------------------------------------------------------- |
| `psql`                        | Direct DB access. Prefer this over admin UIs for migrations + EXPLAIN. |
| `pg_dump --schema-only`       | Schema diffs in PRs.                                                   |
| Aurora Performance Insights   | Production query plan investigation.                                   |
| `EXPLAIN (ANALYZE, BUFFERS)`  | Required in PR bodies for new indexes.                                 |
| Aurora point-in-time recovery | When something terrible happens.                                       |

## Sample tickets you might pick up

- "Add the `incidents.workspace_id` index — the new severity-filter on the issues feed widget is doing a sequential scan on staging."
- "Audit every table for missing RLS policies. Open one Jira task per offender."
- "Refresh the sandbox dataset's distribution of incidents — the current 3% rate produces too-clean correlation matrices for §5.2.4 demos."
- "Migrate `audit_log` from `text` actor field to a structured `actor_id` + `actor_type` pair so the GDPR data-export endpoint can scope by user."

## Your first PR

> **Goal**: add a `CHECK` constraint or a missing index, with the `EXPLAIN ANALYZE` in the PR body.
>
> 1. Run the staging Aurora `pg_stat_statements` (or local dev DB) and find a query without an index that probably should have one.
> 2. Write the migration. Include the rollback.
> 3. Run `EXPLAIN (ANALYZE, BUFFERS)` before + after locally. Capture both.
> 4. Branch: `feature/KAN-XXX-index-{table}-{column}` (real ticket).
> 5. Commit: `feat(db): KAN-XXX add index on {table}.{column}`.
> 6. PR Body Test Plan includes the before/after EXPLAIN output.

## Who to ask when stuck

- **Tech Lead** — when a schema change has multi-module implications.
- **Backend Developer** — query shape, repository layer, where the index will actually be used.
- **Data Scientist** — analytics-query plans, sandbox dataset content.
- **Security Engineer** — RLS policy design, audit-log retention.
- **DevOps Engineer** — Aurora upgrades, parameter group tuning, point-in-time recovery.

[GitHub Issues](https://github.com/sidious18/ai-template-reference/issues) `question` tag.

## Your first week

> **Day 1.** Read `src/backend/migrations/` end-to-end. (May not exist yet on day 1; if so, this is a heads-up to the Backend Developer that the first migration should land soon.)

> **Day 2.** Inventory the tables that are workspace-scoped. Confirm each has a `workspace_id` column + an RLS policy. List exceptions.

> **Day 3.** Read §5.1.4 + §8.4 — the SQL console security model. The DB role used by the SQL console is workspace-restricted; you set this up.

> **Day 4.** Read every analytics query in `src/backend/research/`. Run `EXPLAIN` on each against staging — note which would benefit from a different index.

> **Day 5.** Ship your first migration.

## Recommended reading

1. [`docs/requirements/fleet_operations_spec.md`](../requirements/fleet_operations_spec.md) §1.3 (Core data domain), §5.1 (Explore tools — query-shape implications), §6.4 (Data model — UTC + soft-delete), §6.5 (Security — workspace isolation, audit log), §8.4 (sandbox rationale).
2. [`docs/code-review.md`](../code-review.md) §11 (SQL / migrations).
3. PostgreSQL RLS documentation: <https://www.postgresql.org/docs/current/ddl-rowsecurity.html>
4. Aurora performance docs: <https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/MonitoringOverview.html>

## When you're ready to ship for real

1. Every workspace-scoped table has an RLS policy + a test that fails if the policy is removed.
2. The SQL console DB role is provably workspace-restricted (you can demonstrate it via `psql` from the role's session).
3. Soft-delete + 30-day retention sweep is implemented as a scheduled job; it logs to the audit table.
4. You can EXPLAIN any analytics query in the codebase from memory and predict whether it'll hit an index.
