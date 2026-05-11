# Welcome, DevOps Engineer

You own the AWS topology, the CI / CD pipeline, and the secrets management. The compute layer is EC2 + Auto Scaling Group; the data layer is Aurora Postgres + ElastiCache Redis + S3 + CloudFront + Secrets Manager. CI runs on GitHub Actions. Production deploys via CodeDeploy after a manual approval gate; staging deploys on every merge to main. AWS access from CI is OIDC-only — no long-lived keys live in repo secrets.

## What you own here

`.github/workflows/` for CI + deploy workflows. The IAM trust relationships and Workload Identity Federation setup for the OIDC roles (`AWS_DEPLOY_ROLE_ARN_STAGING`, `AWS_DEPLOY_ROLE_ARN_PRODUCTION`, `AI_REVIEW_AWS_ROLE_ARN`). The CodeDeploy applications + deployment groups for backend (`ai-template-reference-{env}` → `backend-asg`). The S3 buckets fronting the frontend + the CloudFront distributions in front of them. The ElastiCache cluster (used by the NestJS backend for both caching and as the BullMQ broker). Secrets Manager rotation policies for Aurora credentials and SAML signing certs.

When `/new-release` writes the first Terraform / Pulumi / CDK module under `iac/` or `terraform/`, the IaC tree is also yours.

## Tools you'll use

| Tool                    | Command / Where                                                                                       |
| ----------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| AWS CLI                 | `aws …` (assume role per environment)                                                                 |
| ECR push                | `aws ecr get-login-password ...                                                                       | docker login` (used by the deploy workflows) |
| CodeDeploy              | `aws deploy create-deployment ...` (called from the deploy workflows)                                 |
| CloudFront invalidation | `aws cloudfront create-invalidation ...`                                                              |
| Secrets rotation        | AWS console + Secrets Manager rotation Lambdas                                                        |
| GitHub MCP              | (limited — branch-protection is the gap; you'll set that via the web UI or `gh api` manually for now) |

## Sample tickets you might pick up

- "Apply branch protection rules to `main` per `configure.json.integrations.github.branch_protection`." This is the deferred Step 5i — first ticket after the configure PR merges. The exact `gh api` call is in the configure PR body.
- "Set the manual approval reviewers on the `production` environment in GitHub Settings → Environments → production." Add the Tech Lead + Backend Developer.
- "Replace the `npm ci` step in CI with a cache-warm step that survives Node minor bumps." Cuts ~40 s off every job.
- "Investigate why `deploy-staging.yml` healthz wait sometimes times out at minute 4 instead of completing at minute 1." Likely ALB target-registration latency; needs CloudWatch dive.

## Your first PR

> **Goal**: edit `deploy-staging.yml` to add a `cache: 'npm'` annotation on `actions/setup-node` (already there) and document the manual fallback if the cache misses. Or, equivalently, fix a small documentation gap in `SECURITY.md`.
>
> 1. Branch off a real ticket (`feature/KAN-XXX-…`).
> 2. Small change. Run `actionlint` locally if you have it (`brew install actionlint`) — the CI doesn't lint workflow YAML, so you're the gate.
> 3. Commit + PR. The deploy workflows don't run on PR (only on merge to main + workflow_dispatch), so you don't accidentally deploy from a branch.

## Who to ask when stuck

- **Tech Lead** — when a topology change affects the application code (e.g., switching from EC2 ASG to ECS Fargate).
- **Backend Developer** — when a deploy workflow needs a new env var or secret.
- **Security Engineer** — IAM policy scoping, OIDC trust changes, audit-log retention.
- **DB Architect** — Aurora upgrades, RLS migrations, point-in-time recovery configuration.

[GitHub Issues](https://github.com/sidious18/ai-template-reference/issues) `question` tag.

## Your first week

> **Day 1.** Read every workflow file under `.github/workflows/`. Note which use OIDC vs. plain secrets — only `ai-pr-review.yml` and the two `deploy-*` workflows should use OIDC.

> **Day 2.** Set up the three OIDC IAM roles in AWS (deploy staging, deploy production, AI review). Add the corresponding repo secrets via the GitHub web UI or `gh secret set …`. Watch `ai-pr-review.yml` succeed on a small Draft PR.

> **Day 3.** Apply branch protection (the deferred Step 5i). Verify required-checks list includes `lint`, `typecheck`, `test`, `build`, `pr-title-check`. Conversations resolved + linear history + 1 CODEOWNER review enforced.

> **Day 4.** Set the manual approval gate on the `production` environment (Settings → Environments). Walk a manual `workflow_dispatch` of `deploy-staging.yml` to confirm it deploys.

> **Day 5.** Document anything unusual you encountered in `docs/roles/devops-engineer.md` (this file) as follow-up PRs. Your first real ticket can be a small CI improvement.

## Recommended reading

1. [`docs/project-summary.md`](../project-summary.md) — see the Stack and Deployment sections.
2. [`SECURITY.md`](../../SECURITY.md) — what you're protecting and how.
3. [`.github/workflows/`](../../.github/workflows/) — read all of them.
4. AWS OIDC + GitHub Actions: <https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html>
5. `release-please-config.json` + `.github/workflows/release-please.yml` — how versions and tags get cut.

## When you're ready to ship for real

1. Branch protection is fully applied; you can describe the required-checks list without looking it up.
2. The three OIDC roles + their trust relationships are documented in the repo (either in `.github/README.md` or a new `docs/deployment.md`).
3. A `workflow_dispatch` of `deploy-production.yml` works end-to-end against a real prod environment (after the manual approval).
4. You can rotate the Aurora password via Secrets Manager without app downtime.
