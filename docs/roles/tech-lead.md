# Welcome, Tech Lead

You own the technical coherence of fleet-operations across both modules — the AI pack at `ai-instructions/`, the CI workflows under `.github/`, the gitflow rules, the cross-team architecture decisions (Postgres + ClickHouse split, BullMQ-on-Redis, hybrid Vercel + Render deployment). The configure record at `ai-instructions/configure.json` is your control panel; when something about how the team works needs to change, you change it there and re-run `/edit-config`. Your first few days are about reading what `/configure` produced and noticing every place where the project's current shape is captured.

## What you own here

- **`ai-instructions/configure.json`** — the decision record. Anyone editing this file is changing how the team works, so it lives under your purview.
- **Cross-module architecture** — anything that crosses `src/backend/` ↔ `src/frontend/` (wire formats, auth contracts, shared types when introduced).
- **CI** — `.github/workflows/ci.yml`, `pr-title-check.yml`, `labeler.yml`, `release-please.yml`, `deploy-staging.yml`, `deploy-production.yml`, `ai-pr-review.yml`. New workflows or required-check changes go through you.
- **Branch protection** — applied via the GitHub MCP during `/configure` and `/edit-config`. Review periodically; it's load-bearing.
- **The conventions docs** in `docs/conventions/` — keep them consistent with what the code actually does.
- **Release automation** — Release Please's config, the manifest, the v1.0 cutover plan.
- **The Tech Lead review** on the initial `/configure` PR (currently pending after you approve and merge).

## Tools you'll use

| Tool | Purpose |
|---|---|
| `/configure`, `/edit-config` | Slash commands that modify the configure record + re-emit artifacts |
| `/verify-plugins` | Audits `ai-plugins.json` for drift after `/bootstrap` |
| GitHub MCP | Branch protection, required checks, repo settings |
| Jira board | Roadmap visibility (`KAN`) — even though scope owners are PM/BA, you watch for technical-debt themes |
| `gh` CLI | Fast PR / issue / workflow inspection from the terminal |

## Sample tickets you might pick up

- Promote `ai-pr-review` from advisory to a required status check once the team's seen it run for two weeks and is comfortable with its false-positive rate.
- Introduce a shared `src/shared/` module for cross-cutting types (workspace IDs, error shapes) — pair with both module owners.
- Audit the `required_checks` array in `branch_protection`: today it lists `lint`, `typecheck`, `test`, `build` (aliases for the matrix job), plus `secret-scan` and `pr-title-check`. Verify each is firing as expected.
- Cut over to Release Please's `node` release-type once both modules have stable `package.json` versions.

## Your first PR

**Goal:** open a small, real PR that demonstrates command of the gitflow + CI shape — typically a tweak to a CI workflow or a conventions doc.

1. Look at `ci.yml` and find one thing you'd improve (e.g., add a `concurrency` group key to the secret-scan job, bump an action version, tighten the no-workspace guard).
2. Branch from `main` as `feature/KAN-XXXX-ci-{slug}` and commit with `ci: KAN-XXXX {what + why}`.
3. Open the PR. Confirm CI re-runs go green with your change.

## Who to ask when stuck

The Tech Lead is usually the asker, not the asked. When you do need someone:

- **Backend / Frontend Developer** — for module-specific shape questions.
- **DevOps Engineer** — Vercel + Render specifics, secret rotation, observability.
- **Security Engineer** — gitleaks-allowlist judgment calls, threat-model reviews.
- **Product Manager** — when a CI or release-process change has scope-cost implications.

If a question isn't urgent, [open a GitHub Discussion](https://github.com/sidious18/ai-template-reference/discussions) tagged `architecture`.

## Your first week

**Day 1.** Approve and merge the initial `/configure` PR. That's the gate that lets every other role's onboarding tickets start.

**Day 2.** Read `ai-instructions/configure.json` end-to-end. Open each file it references in your editor — `.github/workflows/`, `docs/`, `release-please-config.json`. The record is your control panel; know what each row maps to.

**Day 3.** Read every conventions doc. Read [`docs/code-review.md`](../code-review.md). These are the rules your reviews enforce.

**Day 4.** Run `/bootstrap` if it hasn't been run yet. Walk the resulting `ai-plugins.json` and the roles / guides / refactoring directories it produces. That's the AI-side of the pack — every release command reads from there.

**Day 5.** Review the last 10 PRs in this repo. Notice the patterns. If review culture is shaping up the wrong way, push back early with a Discussion or a doc PR.

## Recommended reading

1. [`ai-instructions/configure.json`](../../ai-instructions/configure.json) — your control panel.
2. [`docs/project-summary.md`](../project-summary.md) and [`docs/requirements/fleet_operations_spec.md`](../requirements/fleet_operations_spec.md) — product context.
3. [`docs/onboarding.md`](../onboarding.md), [`docs/gitflow.md`](../gitflow.md), [`docs/code-review.md`](../code-review.md) — the team-facing rules.
4. [`docs/conventions/typescript.md`](../conventions/typescript.md) — the language-specific rules.
5. Every workflow in `.github/workflows/`.
6. `ai-instructions/commands/` — the slash commands that govern the AI pack.

## When you're ready to ship for real

1. You've approved + merged the initial `/configure` PR and the team's per-role onboarding tickets are progressing.
2. You can describe what each required CI check is for and why it's required.
3. The team brings cross-cutting decisions to you before implementing them, not after.
4. `/edit-config` and `/edit-release` feel like normal tools, not magic.
