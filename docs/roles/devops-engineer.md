# Welcome, DevOps Engineer

You own how fleet-operations gets from a green CI run to a happy production. The deployment topology is **hybrid** — Vercel for the frontend, Render for the backend, ClickHouse Cloud for analytics, and a managed Redis (Upstash / Render / Fly) for sessions + BullMQ. Two environments: staging (every merge to `main`) and production (manual approval after a Release Please tag). Your job is to keep this pipeline boring — green for the team, secrets rotated, observability live, and rollback documented. Your first few days are about reading the deploy workflows and bringing every secret into the repo's environments.

## What you own here

- **`.github/workflows/deploy-staging.yml`** and **`.github/workflows/deploy-production.yml`** — the two-environment pipeline.
- **GitHub `environment` settings** — `staging` (auto-deploy on `main`) and `production` (manual approval required, reviewer = Tech Lead + you).
- **Secrets** — `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID_FRONTEND`, `RENDER_DEPLOY_HOOK_STAGING`, `RENDER_DEPLOY_HOOK_PRODUCTION`. Plus repository vars: `BACKEND_STAGING_HEALTHZ_URL`, `BACKEND_PRODUCTION_HEALTHZ_URL`.
- **Vercel + Render projects** — keeping the two providers' settings (build commands, env vars, custom domains, branch deploys) in sync with `ai-instructions/configure.json.integrations.deployment`.
- **ClickHouse Cloud + managed Redis instances** — capacity planning, backups, network policy.
- **Observability** — log shipping, error tracking, uptime checks, runbooks. The team picks the specific tools at the first `/new-release`; you own the integration.

## Tools you'll use

| Tool | Purpose |
|---|---|
| Vercel CLI | Frontend deploys + env management |
| Render dashboard + deploy hooks | Backend deploys |
| ClickHouse Cloud console | Analytics store ops |
| Upstash / Render Redis dashboard | Session + queue ops |
| GitHub Actions logs + the `gh` CLI | Pipeline diagnosis |
| `dependabot.yml` | Dependency hygiene cadence |

## Sample tickets you might pick up

- Set the repository secrets and environment-level secrets for staging + production; document the rotation cadence in `docs/runbooks/secrets.md`.
- Configure the GitHub `environment: production` to require a manual reviewer (Tech Lead + you) before `deploy-production` fires.
- Add an uptime check on the backend's `/healthz` endpoint for staging and production; wire to the team's preferred alerting channel.
- Write the rollback runbook: how to revert a Vercel production deploy (one command) and a Render production deploy (manual in the dashboard, per the workflow's `::warning::` note).

## Your first PR

**Goal:** open one small CI / infra PR — typically tightening the deploy workflow or adding a missing concurrency / timeout guard.

1. Look at `deploy-staging.yml` and `deploy-production.yml`. Spot one improvement (e.g., add a `timeout-minutes`, tighten the no-workspace guard's grep pattern, add a step that pings the team channel on failure).
2. Branch from `main` as `feature/KAN-XXXX-deploy-{slug}` and commit with `ci: KAN-XXXX {what + why}`.
3. Open the PR. CI re-runs go green; the deploy workflows themselves don't fire on PRs (only `main`), so it's safe to iterate.

## Who to ask when stuck

- **Tech Lead** — anything that adds a required CI check or changes branch protection.
- **Backend Developer** — what env vars the backend really needs, what `/healthz` actually checks.
- **Frontend Developer** — Vercel preview deploys, env vars for client-side code.
- **Security Engineer** — secret rotation, network policy, audit-log shipping.
- **Data Engineer** — ClickHouse capacity decisions.

If a question isn't urgent, [open a GitHub Discussion](https://github.com/sidious18/ai-template-reference/discussions) tagged `devops`.

## Your first week

**Day 1.** Read `.github/workflows/ci.yml`, `deploy-staging.yml`, `deploy-production.yml`, `release-please.yml`, `pr-title-check.yml`, `labeler.yml`, `ai-pr-review.yml`. Note what's missing for production-readiness.

**Day 2.** Create the Vercel and Render projects (use the project slug `fleet-operations`). Capture every URL and ID — you'll set them as repo secrets next.

**Day 3.** Set the secrets via `gh secret set`. Set the repository vars. Confirm `deploy-staging.yml` would work end-to-end (you can manually run it via `workflow_dispatch` if you add a temporary `workflow_dispatch:` trigger).

**Day 4.** Configure GitHub `environment: staging` and `environment: production` settings (reviewers, wait timer, deployment branches). Document the rules in `docs/runbooks/`.

**Day 5.** Write the rollback runbook. This is the doc the on-call person reads at 3am — make it short and tested.

## Recommended reading

1. [`ai-instructions/configure.json`](../../ai-instructions/configure.json) `integrations.deployment` — the topology in one place.
2. [`docs/project-summary.md`](../project-summary.md) — the Stack section.
3. [`docs/onboarding.md`](../onboarding.md) — what new hires should see locally.
4. Every workflow in [`.github/workflows/`](../../.github/workflows/).
5. Vercel + Render docs for the project-specific quirks (Vercel: prebuilt deploys, Render: deploy hooks vs API).
6. [`SECURITY.md`](../../SECURITY.md) — the operational guardrails section is yours.

## When you're ready to ship for real

1. A merge to `main` results in a green staging deploy without anyone touching anything.
2. The rollback runbook is short enough that on-call can execute it without re-reading the docs.
3. Secrets rotation is on the calendar, not in someone's head.
4. The team trusts the pipeline — green CI means shippable.
