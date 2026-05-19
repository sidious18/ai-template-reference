# Welcome, Backend Developer

Welcome to Fleet Operations. You'll own the server side of the product — the API that backs the 8×8 dashboard grid, the eleven research-workspace tools, and the scheduled-exports queue. Most tickets that touch HTTP routing, persistence, the SQL-console safeguards, or the analytics pipelines land on your plate. Your day-two priorities are reading `src/backend/`'s entry point, getting the local test suite green, and skimming the spec's *Architecture Shape* and *Key Constraints* sections — both performance budgets and the sandbox safeguards are non-negotiable design decisions, not nice-to-haves.

## What you own here

**You own the `backend` module at [`src/backend/`](../../src/backend/)** — Node.js + Express in TypeScript, strict mode, tested with Vitest. Persistence is split: PostgreSQL is the OLTP store (auth, users, schedules, workspaces, audit log), ClickHouse is the OLAP store (trips, fuel, anomalies — the analytics tables). Redis sits in front for widget caching, session storage, rate-limit counters, and the scheduled-exports queue.

Tickets labeled `backend` (or assigned to the Backend component in Jira once components are wired up) come to you. You're also the first responder for any production-shape incident on the API — 5xx spikes, queue backlog, slow widget batch fetches — because they're almost always rooted in something the API layer is doing.

## Tools you'll use

| Tool | What for |
|---|---|
| TypeScript (strict) | Source language. Strict mode is enforced — no implicit `any`, no unchecked indexed access. |
| Express | HTTP routing, middleware, error handling. |
| `prettier` | Formatter. `npm --prefix src/backend run format`. Also runs on staged files via lint-staged. |
| `eslint` | Linter. `npm --prefix src/backend run lint`. Also runs via the `pre-push` hook. |
| `tsc --noEmit` | Type checker. `npm --prefix src/backend run typecheck`. Runs via `pre-push`. |
| `vitest` | Unit + integration tests. `npm --prefix src/backend test`. |
| `pg` / `clickhouse` clients | Persistence. The repository layer wraps both. |
| `ioredis` | Redis client. Cache, queue, rate-limit. |

Conventions for this language are in [`docs/conventions/typescript.md`](../conventions/typescript.md) — read it before opening a PR.

## Sample tickets you might pick up

The Jira backlog for `KAN` is empty right now (greenfield project), so here are realistic shapes drawn from the spec — the kind of work you'll see once the backlog fills:

> - "Wire IP-based rate-limit (5 attempts / 5 min) into the sign-in endpoint, backed by Redis with a sliding window."
> - "Add the workspace-isolation guard to the `/api/research/sql` endpoint: reject any query whose parsed AST references a table the caller's workspace can't see."
> - "Implement the batch widget-data endpoint — one POST returns data for every widget on a saved layout, hitting the <1.5s budget for 12 widgets."
> - "Move the scheduled-exports runner from in-process timers to a Redis queue with `BLPOP`-based workers, so multiple API instances don't double-fire."

Three-or-four concrete tickets like these will appear under Jira's *To Do* column as the team plans the first sprint. When you start, ask your tech lead for a small starter ticket — usually a doc or test fix in the backend area — to walk the gitflow end-to-end before tackling the bigger ones.

## Your first PR

**Goal:** add a `/healthz` endpoint to the backend so deployment smoke-tests have something to hit. It exercises Express routing, a Vitest test, the `pre-push` hook, the PR template, and the commit hook in one small change.

1. Move your starter ticket (say `KAN-2 Add /healthz endpoint`) to *In Progress* in Jira.
2. Branch off `main`:
   ```
   git switch main && git pull
   git switch -c feature/KAN-2-add-healthz-endpoint
   ```
3. Add the route in `src/backend/src/app.ts` (or wherever the router lives once `/tmpl-release-new` has scaffolded it):
   ```ts
   app.get('/healthz', (_req, res) => res.json({ status: 'ok' }));
   ```
4. Add a Vitest test next to it that asserts the JSON body and 200 status.
5. Commit with `feat: KAN-2 add /healthz endpoint for deployment smoke tests`.
6. Push. `pre-push` runs `lint` and `typecheck`. Fix anything it flags.
7. Open the PR with title `feat: KAN-2 add /healthz endpoint for deployment smoke tests`. Fill the four template sections.
8. Get one approval, squash-merge, delete the branch, move `KAN-2` to *Done*.

## Who to ask when stuck

- **Tech Lead** → ask about architecture decisions, cross-module contracts, anything that smells like it needs a design discussion before code.
- **DB Architect** → ask about schema changes (any migration needs their sign-off), the Postgres/ClickHouse split, partition strategies on the trips table, query plans that look off.
- **Data Scientist** → ask about the analytics endpoints' math (forecast, anomaly detection, driver scoring, correlation matrix). The model lives in their head; you're the one wiring it into HTTP.
- **Frontend Developer** → ask about API ergonomics — they're the primary consumer of every endpoint you write.
- **QA Engineer** → ask about reproduction of a flaky test or a CI-only failure; they own the test infrastructure.
- **UI/UX Designer** → ask before changing any user-visible behavior the spec doesn't pin down (error message wording, redirect targets, polling cadences).

## Your first week

> **Day 1.** Get the backend running locally. Read `src/backend/`'s entry point, then this doc and `docs/onboarding.md`'s glossary so domain terms feel familiar.

> **Day 2.** Read `docs/project-summary.md`'s *Architecture Shape* and *Key Constraints* sections, then the spec's auth and dashboard chapters in `docs/requirements/fleet_operations_spec.md`. Pay close attention to the rate-limit numbers, the password hash parameters, and the widget batch-fetch budget.

> **Day 3.** Walk a dry-run PR end-to-end as described in `docs/onboarding.md`. Touch the backend code (a one-line edit) so the hooks fire on the right module.

> **Day 4.** Pick up your real starter ticket. Branch, commit, get the test passing, push.

> **Day 5.** Continue the ticket. Get an approval and squash-merge. Read `docs/conventions/typescript.md` with the code you've just touched in mind — the rules will mean more than they did when the file was abstract.

## Recommended reading

These are the docs you'll keep coming back to. Skim them in this order:

1. [`docs/project-summary.md`](../project-summary.md) — the product idea and the must-have features for the first release.
2. [`docs/onboarding.md`](../onboarding.md) — environment setup and how the team runs day to day.
3. [`docs/gitflow.md`](../gitflow.md) — branches, commits, PR lifecycle on this project.
4. [`docs/conventions/typescript.md`](../conventions/typescript.md) — formatter, linter, and idioms you'll be held to in code review.
5. [`docs/requirements/fleet_operations_spec.md`](../requirements/fleet_operations_spec.md) — the source spec. Section 3 (auth), Section 4 (dashboard), Section 5 (research workspace) are your home turf.
6. `ai-instructions/guides/backend-*` — once they're populated by `/tmpl-bootstrap`, the AI guides for Express + TypeScript + Postgres + ClickHouse + Redis are here. The patterns you'll be asked to follow on PR review come straight from these.

Frame this list as "recommended"; the order is the order people most often want them.

## When you're ready to ship for real

1. You've shipped at least one real KAN ticket without needing a hand-holding review.
2. You can describe `src/backend/`'s entry point, request flow, and the Postgres-vs-ClickHouse split in two sentences each.
3. The CI failures you're most likely to hit don't surprise you — you know which job catches which mistake (lint vs typecheck vs test vs build), and which to run locally first.
4. You've made a schema change (or watched someone make one) and you understand the migration discipline: never `DROP COLUMN` in the same release as the code that stops reading it.
5. You've handled one bug labeled `backend` end-to-end — from the failing case in a Vitest, through the PR, to the merged fix.
