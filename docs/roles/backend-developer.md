# Welcome, Backend Developer

You own the `src/backend/` module — NestJS, TypeScript, talking to Aurora Postgres and ElastiCache Redis. The API surfaces auth (sign in / create account / SSO), the dashboard's batched widget-data endpoint, the eleven research-tool endpoints, the audit log, and the BullMQ-backed scheduled-export pipeline. The first ticket you pick up will probably involve workspace isolation in some form — that invariant lives in your module, and we enforce it on every query and job.

## What you own here

You own everything under `src/backend/`. Tickets labeled `backend` or assigned to the Backend component on the Jira board are yours. The hot zones inside the module: `auth/` (Argon2id + SAML 2.0 + OIDC), `sql-console/` (sandbox-by-default per §8.4, with 30 s timeout + 100 k row truncation + 10 M row cost-estimate), `audit-log/` (one entry per admin action), `dashboard/` (the batched widget data endpoint that the SPA hits on layout load), `research/` (the eleven tool endpoints), `queues/` (BullMQ producers + consumers for scheduled exports and webhook delivery), and `tenancy/` (the workspace-scoping guard that every request flows through).

Public functions live at module index files; helpers stay file-local. Naming: `driver-scoring.service.ts`, `cohort.repository.ts` — lowercase-hyphen, domain-named, not layer-named.

## Tools you'll use

| Tool                     | Command                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------ |
| Run dev server           | `npm run start:dev --workspace src/backend`                                                      |
| Run tests                | `npm run test --workspace src/backend`                                                           |
| Lint                     | `npm run lint --workspace src/backend`                                                           |
| Typecheck                | `npm run typecheck --workspace src/backend`                                                      |
| Migrate DB               | `npm run migrate --workspace src/backend` (added by `/new-release` once it scaffolds the module) |
| Lint + format pre-commit | runs automatically via `.husky/pre-commit` (lint-staged)                                         |

Full conventions: [`docs/conventions/typescript.md`](../conventions/typescript.md).

## Sample tickets you might pick up

- "Add `idempotency_key` support to `POST /api/exports/schedule` so the same `Run now` action can't double-queue a delivery." Touches `queues/scheduled-exports.service.ts` and the audit log.
- "Reject SAML `Response` elements where the signature's `Reference` URI doesn't match the asserted `Subject`." Touches `auth/saml.guard.ts`; needs a regression test against the recorded test fixture.
- "Investigate the spike in 503s on `POST /api/sql/run` after the 3 pm staging deploy." Likely a cost-estimate timeout regression — start with the staging CloudWatch logs and the audit-log entries.
- "Wire the new `payment_provider` env var into the `billing-adapter` module." (Anticipated next-quarter ticket.)

For your first few tickets, ask the Tech Lead to pin tickets that don't cross the sensitive surfaces (auth, sql-console, audit-log) so you can build context first.

## Your first PR

> **Goal**: add a Vitest unit test for one existing untested service in `src/backend/`. Small change, exposes you to the test runner, the lint hooks, the PR template, and the AI reviewer.
>
> 1. From `src/backend/`, run `npm test -- --reporter=verbose` and grep the output for services without coverage.
> 2. Pick the smallest one. Write a single `describe` block with two or three `it` cases covering the happy path + one edge case.
> 3. Branch: `git switch -c feature/KAN-XXX-test-driver-scoring-service` (real ticket, ask the Tech Lead).
> 4. Commit: `test: KAN-XXX add unit test for {ServiceName}`.
> 5. PR title matches the commit. Body fills the Summary / Changes / Test Plan / Linked Ticket sections. Run `npm run test --workspace src/backend` locally — paste the passing summary into Test Plan.
> 6. AI reviewer will post within a minute. Address any legitimate findings (it might suggest adding a workspace-isolation check; resist scope creep if your test doesn't touch the data path).

## Who to ask when stuck

- **DB Architect** — schema, RLS, migration strategy. Anything involving a new table or a query plan.
- **Security Engineer** — auth flows, audit log expectations, PII handling, rate-limit code paths.
- **Tech Lead** — architecture-impacting choices (a new module boundary, a new shared abstraction).
- **Frontend Developer** — when an API contract change is on the table.

[GitHub Issues](https://github.com/sidious18/ai-template-reference/issues) `question` tag for everything else.

## Your first week

> **Day 1.** Environment up. Walk the auth flow in your browser (sign-in → dashboard) and read the request in `auth.controller.ts`. Note how `workspace_id` flows from the session to every downstream call.

> **Day 2.** Dry-run PR per the gitflow. Read the spec's §3 (Auth) + §6.5 (Security) end-to-end.

> **Day 3.** Read every `.service.ts` in `src/backend/sql-console/`. Understand the sandbox / production split before you touch the SQL surface.

> **Day 4.** Start your first ticket. Aim for ≤ 200 lines, focused on a service-internal change.

> **Day 5.** Merge your first PR. Watch staging deploy fire.

## Recommended reading

1. [`docs/project-summary.md`](../project-summary.md) — product context.
2. [`docs/conventions/typescript.md`](../conventions/typescript.md) — your style guide.
3. [`docs/code-review.md`](../code-review.md) — what the team looks for in your PRs.
4. [`docs/requirements/fleet_operations_spec.md`](../requirements/fleet_operations_spec.md) sections §3 (Auth), §5 (Research, especially §5.1.4 SQL console), §6 (cross-cutting), §8.4 (sandbox-by-default rationale).
5. NestJS Fundamentals (official docs) — only if you're new to NestJS.

## When you're ready to ship for real

1. You've shipped a small real ticket without needing a hand-holding review.
2. You can describe `src/backend/`'s entry point, request flow (auth guard → workspace scope → controller → service → repository), and which external dependencies it has, in two sentences.
3. You know which CI job catches which mistake — `lint` is style, `typecheck` is types, `test` is correctness, `build` is the actual NestJS compile, `pr-title-check` is title regex, `gitleaks` is secrets.
4. You can pull a fresh Aurora password from Secrets Manager via the local dev script without a copy-paste from the AWS console.
