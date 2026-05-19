# Welcome, DB Architect

Welcome to Fleet Operations. You're the steward of a deliberately split data layer — PostgreSQL handles OLTP (auth, users, schedules, workspaces, audit log), ClickHouse handles OLAP (trips, fuel, anomaly detection). Anywhere a query touches more than a few thousand rows, anywhere a migration touches a hot table, anywhere a join crosses the boundary — those land on your plate. Day-two priority is reading the spec's *Architecture Shape* and *Key Constraints* sections with the schema implications in mind; the constraints (workspace isolation, SQL-console safeguards, performance budgets) shape the schema as much as the requirements do.

## What you own here

**You own the dual-store data layer** — Postgres for OLTP, ClickHouse for OLAP — plus the migration discipline that keeps both safe to roll forward and back. You don't own a module directory the way the developers do; instead you own:

- The schemas in both stores — every `CREATE TABLE`, every index, every partition key.
- Migration safety. No `DROP COLUMN` or destructive rename ships in the same release as the code that stops using it; that's a Tech Lead enforceable rule but you're the one who'll catch it on review.
- The read-replica routing for the SQL console — the spec requires SQL-console queries to hit a read-only ClickHouse replica with a 30s wall-time limit, 100k row truncation, and a cost estimator before scans over 10M rows. The wiring crosses stores.
- The partition strategy on the largest analytics tables (trips, fuel, incidents). Picking partitions wrong is the #1 way to blow the performance budgets.
- The query-cost review for any new analytics endpoint that the Data Scientist designs.

Tickets labeled `database`, `migration`, `schema`, or `performance` come to you. So does any incident whose root cause sits in a query plan.

## Tools you'll use

| Tool | What for |
|---|---|
| `psql` | Postgres CLI — schema inspection, ad-hoc queries, `EXPLAIN ANALYZE`. |
| `clickhouse-client` | ClickHouse CLI — same role for the OLAP store. |
| Migration framework | The team's chosen migration tool (likely `node-pg-migrate` or `prisma migrate` for Postgres; raw `clickhouse-client` for ClickHouse). Confirm on day one which one is in `src/backend/`. |
| `pg_stat_statements`, `pg_stat_user_tables` | Postgres performance triage. |
| ClickHouse `system.query_log`, `system.parts` | ClickHouse performance triage. |
| Atlassian MCP (Jira + Confluence) | For schema decisions worth documenting and tickets that span backend + DB work. |

## Sample tickets you might pick up

The Jira backlog for `KAN` is empty right now. Tickets in your area tend to look like:

> - "Design the partition strategy for the `trips` table — partition by month + workspace_id; backfill plan for historical data; document the choice in `docs/decisions/`."
> - "Add the audit-log table in Postgres with retention 1y and a hot/cold tiering plan for older rows."
> - "Wire the read-only replica for the SQL console — connection string in the backend's `clickhouse` config; reject any query whose parsed AST contains DDL/DML at the API layer before reaching the replica."
> - "Migration: add `workspace_id` to every analytics table that's missing it, with a backfill query that fits the per-month partitions. Two-phase: column nullable + backfill + NOT NULL + index, each in its own release."

Three or four concrete tickets like these will appear in *To Do* as the team plans the first sprint. Ask the Tech Lead for a small starter ticket — usually adding a small Postgres table or a non-load-bearing index — so you walk the gitflow before tackling a partition redesign.

## Your first PR

**Goal:** add an initial Postgres migration that creates the `workspaces` table — the root of the entire data model. The PR exercises the migration framework, the schema-review process, the commit hook, and the PR template in one small change.

1. Move your starter ticket (say `KAN-4 Create workspaces table`) to *In Progress* in Jira.
2. Branch off `main`:
   ```
   git switch main && git pull
   git switch -c feature/KAN-4-create-workspaces-table
   ```
3. Add a migration file: `src/backend/migrations/{timestamp}_create_workspaces.sql` (or the equivalent for the chosen framework). Include the table, a `created_at` / `updated_at`, the timezone column (the spec stores times UTC and displays in workspace timezone), and a clear primary key.
4. Add a corresponding rollback. Test both forward and rollback locally.
5. Commit with `feat: KAN-4 add workspaces table migration`.
6. Push. `pre-push` runs lint and typecheck on `src/backend/`. Fix anything.
7. Open the PR. Tag the Backend Developer for review as well — any schema change should have eyes from someone who reads the table.
8. One approval, squash-merge, delete the branch, move `KAN-4` to *Done*.

## Who to ask when stuck

- **Backend Developer** → ask about the application code that reads or writes the schema you're changing. They're the consumer; you should design the migration plan with their consent.
- **Tech Lead** → ask before any change that could affect production downtime (long migration, index build on a hot table, repartitioning). The Tech Lead arbitrates the rollout window.
- **Data Scientist** → ask before changing analytics-side schemas. They're the heaviest consumer of ClickHouse and they may have queries that depend on column types you're tempted to widen or narrow.
- **QA Engineer** → ask about how a migration is rehearsed in the test environment. They own the seed data and the CI integration test suite.
- **Frontend Developer** → mostly indirect, but they care if a list response gets slower because of a missing index.
- **UI/UX Designer** → almost never, unless a schema decision exposes a constraint that affects what the UI can show (e.g. "we can't sort by this column without an index, so the dropdown order must change").

## Your first week

> **Day 1.** Connect to local Postgres and ClickHouse. Run `\dt` in `psql` and `SHOW TABLES` in `clickhouse-client` to see whatever's already there (will be empty on a fresh project). Skim `src/backend/`'s persistence directory to find the migration framework.

> **Day 2.** Read the spec's *Core Data Model* and *Architecture Shape* sections, and the SQL-console sandbox safeguards in Section 5. The constraints on workspace isolation and SQL-console behavior are schema-shaped, not application-shaped — you're the one who enforces them.

> **Day 3.** Walk a dry-run PR end-to-end as described in `docs/onboarding.md`. Make the change in the backend directory so the hooks fire there.

> **Day 4.** Take your starter ticket. Write the migration plus its rollback. Test both locally.

> **Day 5.** Open the PR; merge it. Read the spec's analytics sections again with the partition strategy on `trips` in the back of your mind. Sketch the partition scheme; bring it to the Tech Lead next week.

## Recommended reading

1. [`docs/project-summary.md`](../project-summary.md) — *Core Data Model* and *Architecture Shape*.
2. [`docs/requirements/fleet_operations_spec.md`](../requirements/fleet_operations_spec.md) — Sections 4–7 (dashboard, research workspace, RBAC, audit log) all imply schema.
3. [`docs/gitflow.md`](../gitflow.md) — the PR shape you'll use for every migration.
4. [`docs/conventions/typescript.md`](../conventions/typescript.md) — for the migration helper code itself.
5. ClickHouse docs on partition keys and `system.parts` — bookmark these.
6. `ai-instructions/guides/database-*` — once populated by `/tmpl-bootstrap`, the AI guides for Postgres / ClickHouse / migrations are here.

## When you're ready to ship for real

1. You've shipped one Postgres migration and one ClickHouse schema change, each with a tested rollback.
2. You can articulate, in one breath, why a given query lives in Postgres vs ClickHouse — and you've caught a query that lived in the wrong store.
3. You understand the partition scheme on `trips` (once it's decided) well enough to predict whether a new filter will hit one partition or all of them.
4. You've reviewed a Backend Developer's PR that touched a hot query and proposed an index change that landed.
5. You can describe the SQL-console safeguards (sandbox replica, 30s timeout, 100k row truncate, 10M-row cost estimator) without looking at the spec.
