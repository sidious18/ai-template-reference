# Welcome, Backend Developer

You own `src/backend/` — the Node + Express + TypeScript service that runs every API call, persists every layout and audit-log entry, and runs every background job for fleet-operations. Auth (Argon2id, SAML 2.0, OIDC), the Postgres + ClickHouse split, the BullMQ-backed worker pool, the SQL-console sandbox guard — they all live in your tree. Your first few days are about getting comfortable with the request lifecycle and the workspace-isolation model; nobody expects PRs on day one.

## What you own here

**You own the `backend` module at `src/backend/`** — TypeScript on Node 22, Express on the HTTP boundary, BullMQ for the job queue, Drizzle (or Prisma — whichever the team standardizes on at the first `/new-release`) for Postgres, and `@clickhouse/client` for the analytics store. Tickets labeled `backend` or in Jira's Backend component land on your plate. Most cross-cutting work (auth changes, audit-log additions, new API endpoints, new worker jobs) starts with you.

## Tools you'll use

| Tool | Purpose | Where it's configured |
|---|---|---|
| TypeScript (strict) | Type checking | `src/backend/tsconfig.json` — see [`docs/conventions/typescript.md`](../conventions/typescript.md) |
| Express | HTTP routing + middleware | `src/backend/src/app.ts` once `/new-release` scaffolds it |
| Drizzle / Prisma | Postgres ORM (choose at first /new-release) | `src/backend/src/db/` |
| `@clickhouse/client` | ClickHouse access | `src/backend/src/analytics/` |
| BullMQ | Redis-backed job queue | `src/backend/src/queue/` |
| vitest + supertest | Test runner + HTTP test client | `src/backend/tests/` |
| Prettier + ESLint | Formatting + lint | shared base in `docs/conventions/typescript.md` |

## Sample tickets you might pick up

- Add idempotency keys to the workspace-creation endpoint so retried sign-ups don't create duplicate tenants.
- Investigate a spike in 503s on `/api/dashboard/layouts/{id}` after the latest deploy and patch the underlying cause.
- Wire up the `PASSWORD_HASH_PEPPER` env var into the Argon2id flow so it's read from Secrets Manager, not the repo's `.env`.
- Add a guard rejecting `INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE` keywords in `POST /api/research/sql/execute` so sandbox/production isolation holds even if a CTE tries to be clever.

## Your first PR

**Goal:** add a single integration test for an existing endpoint, so you exercise the test runner, the pre-commit hooks, the PR template, and a real database round-trip before tackling a feature ticket.

1. Pick the smallest read-only endpoint that's currently untested (look for routes without a matching `*.spec.ts` file in `src/backend/tests/integration/`).
2. Write a single supertest case using a Testcontainers-backed Postgres instance, asserting both the happy path and a 401 when no session cookie is sent.
3. Branch from `main` as `feature/KAN-XXXX-add-integration-test-for-{endpoint-slug}` and commit with `test: KAN-XXXX add integration test for {endpoint}`.
4. Open the PR titled `test: KAN-XXXX add integration test for {endpoint}` and fill the four template sections. Confirm `lint`, `typecheck`, `test`, `build`, `secret-scan`, and `pr-title-check` all go green.

## Who to ask when stuck

- **Frontend Developer** — when your API change might break a screen. Pair on the request/response shape before merging.
- **Data Engineer** — for ClickHouse schema changes, fixture maintenance for sandbox mode, and forecast-pipeline metadata.
- **Security Engineer** — anything touching auth, sessions, PII export paths, audit-log writes, or rate limiting.
- **DevOps Engineer** — secrets, env vars across Vercel/Render, BullMQ worker configuration, observability instrumentation.
- **Tech Lead** — cross-module wire-format decisions, ORM migration shape, performance-target reviews.

If a question isn't urgent, [open a GitHub Discussion](https://github.com/sidious18/ai-template-reference/discussions) tagged `backend`.

## Your first week

**Day 1.** Get the stack running (`./setup.sh` → `./run.sh`). Read [`docs/project-summary.md`](../project-summary.md) and the spec section §1–§3 (overview + auth screen). Skim `src/backend/src/app.ts` once it exists.

**Day 2.** Read spec §6 (cross-cutting requirements) and `SECURITY.md`. Trace the sign-in flow in code — controller → service → repository → Postgres — and write a one-pager for yourself describing the journey.

**Day 3.** Open the dry-run PR from [`docs/onboarding.md`](../onboarding.md). Add the integration test described above on a real ticket.

**Day 4.** Pick a real `backend`-labeled ticket from the KAN board. Branch, write, open a PR, ship. Aim for a small change.

**Day 5.** Read every conventions doc that applies (`docs/conventions/typescript.md` + any SQL/ORM convention added by the team), and the latest five merged PRs touching `src/backend/`. The merged history teaches review culture faster than any doc.

## Recommended reading

These are the docs you'll keep coming back to. Skim them in this order.

1. [`docs/project-summary.md`](../project-summary.md) — the product idea and the must-have features for the first release.
2. [`docs/onboarding.md`](../onboarding.md) — environment setup and how the team runs day to day.
3. [`docs/gitflow.md`](../gitflow.md) — branches, commits, PR lifecycle.
4. [`docs/conventions/typescript.md`](../conventions/typescript.md) — formatter, linter, idioms you'll be held to in code review.
5. [`docs/code-review.md`](../code-review.md) — the per-area checklist reviewers use on your PRs.
6. [`docs/requirements/fleet_operations_spec.md`](../requirements/fleet_operations_spec.md) — the canonical spec; §6 (cross-cutting requirements) is the part you'll re-read most.
7. [`SECURITY.md`](../../SECURITY.md) — the security properties the backend must maintain.

## When you're ready to ship for real

1. You've picked up a small real ticket and shipped it without needing a hand-holding review.
2. You can describe the request lifecycle for a typical API call in three sentences — controller → service → repository → Postgres, including where workspace isolation gets enforced.
3. The CI failures you're most likely to hit on a PR don't surprise you — you know which job catches which mistake.
4. You're comfortable opening a follow-up PR when a review surfaces something that's out of scope for the current change.
