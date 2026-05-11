# Welcome, Tech Lead

You own the technical direction of fleet operations. Two modules (`src/backend/` NestJS, `src/frontend/` React) plus the AWS topology (EC2 ASG + Aurora + ElastiCache + S3 + CloudFront + Secrets Manager), the CI / release pipeline, and the AI instruction pack under `ai-instructions/`. The first few days are about reading what `/configure` produced — the decision record at `ai-instructions/configure.json`, the Confluence space SD, the gitflow doc — and confirming the team's working with the right invariants. After that, you're the final reviewer on architecture-impacting PRs (auth, SQL console, audit log, multi-tenant schema, deploy workflows).

## What you own here

You own architectural decisions across both `src/backend/` and `src/frontend/`. Tickets labeled `architecture`, `infra`, `cross-module`, or carrying the `tech-lead` reviewer assignment land on your plate. You sign off on every PR touching `auth.module.ts`, `sql-console.module.ts`, `audit-log.module.ts`, the multi-tenant schema migrations, anything in `.github/workflows/`, and changes to `ai-plugins.json` or any file under `ai-instructions/commands/`.

The product invariants that matter most are: workspace isolation on every query and queue job (§6.5), sandbox-by-default SQL console (§8.4), Argon2id / bcrypt cost ≥ 12 (§3.6), audit log on every admin action (§6.5). These don't bend in code review.

## Tools you'll use

| Tool                    | Command                   | Notes                                                          |
| ----------------------- | ------------------------- | -------------------------------------------------------------- |
| Workspace orchestration | `npm run … --workspaces`  | Lint / typecheck / test / build run per workspace              |
| Plugin verification     | `/verify-plugins`         | Checks `ai-plugins.json` against the schema after edits        |
| AWS CLI                 | `aws …`                   | OIDC-only access; no long-lived keys                           |
| GitHub MCP              | tool calls in Claude Code | Branch protection (one gap, see below), PR creation, issue ops |
| Atlassian MCP           | tool calls in Claude Code | Jira KAN ops, Confluence SD page updates                       |

The full per-language conventions live in [`docs/conventions/typescript.md`](../conventions/typescript.md) — don't re-litigate style choices in PR comments; if you want a new rule, propose it there first.

## Sample tickets you might pick up

- "Audit Aurora schema for missing `workspace_id` columns on tables added since 1.0." Run the inventory query in `docs/code-review.md` against staging; open a Jira task per offender.
- "Reduce the `npm install` time on CI by switching from `npm ci` to `pnpm install --frozen-lockfile` across all workflows." Cross-module change; needs CODEOWNER coordination.
- "Migrate the AI PR review provider from Bedrock to direct Anthropic API." Edit `ai-pr-review.yml`, swap the secret name, document the cut-over in `docs/code-review.md`'s AI-review section.
- "Promote workspace `dev-acme` from sandbox to production data." One-time admin action — log via audit, confirm with the Data Scientist that the sandbox fixtures cover their open analyses.

## Your first PR

A good first PR for a new Tech Lead is a documentation update — small, high-leverage, exposes you to every gate.

> **Goal**: add yourself to `CONTRIBUTORS.md` and update the CODEOWNERS file's "Tech Lead" line if the existing owner is rotating off.
>
> 1. Confirm with the existing Tech Lead that the rotation is happening.
> 2. `git switch -c feature/KAN-XXX-tech-lead-rotation` (real ticket).
> 3. Edit `CONTRIBUTORS.md` and `.github/CODEOWNERS`.
> 4. Commit: `chore: KAN-XXX rotate tech lead to {Your Name}`.
> 5. Open the PR with title matching the commit. CODEOWNERS auto-assigns the _old_ tech lead as reviewer.
> 6. The existing tech lead reviews and merges. From this point you're CODEOWNER on the whole tree.

## Who to ask when stuck

- **Backend Developer** — implementation details inside `src/backend/`, NestJS module conventions.
- **Frontend Developer** — implementation details inside `src/frontend/`, Tailwind / React patterns.
- **DevOps Engineer** — AWS topology, CI workflow internals, IAM / OIDC trust relationships.
- **DB Architect** — multi-tenant Postgres specifics, RLS policies, migration strategy.
- **Security Engineer** — auth / audit / PII / rate-limit code paths and policy.

For anything else, [GitHub Issues](https://github.com/sidious18/ai-template-reference/issues) `question` tag.

## Your first week

> **Day 1.** Read `ai-instructions/configure.json` end-to-end. It's the authoritative record of every decision `/configure` captured. Confirm the modules, stack, integrations, branch-protection state, and team roles all match what the team actually agreed to. Note anything off — those are your day-2 tickets.

> **Day 2.** Apply branch protection manually (the GitHub MCP doesn't expose this — see the configure PR body for the exact `gh api` command). Verify the `pr-title-check` workflow runs on a Draft PR. Spot-check the role docs for the team members who'll join in the next two weeks — make sure the "Sample tickets" section pulls realistic tickets from the current KAN backlog.

> **Day 3.** Review the Confluence SD space pages (Project Overview, Requirements, Technologies, User Roles). Skim the spec at `docs/requirements/fleet_operations_spec.md` — pay attention to §6 (cross-cutting requirements) and §8 (locked design decisions). These are the invariants you'll enforce in review.

> **Day 4.** Run `/verify-plugins` and confirm `ai-plugins.json` is internally consistent. Read every command under `ai-instructions/commands/` so you know what `/new-release`, `/edit-release`, and `/finish-release` will do.

> **Day 5.** Walk a Backend Developer or Frontend Developer through their first ticket. Live-review their PR end-to-end so you both understand each other's expectations.

## Recommended reading

These are the docs you'll keep coming back to. Skim them in this order.

1. [`ai-instructions/configure.json`](../../ai-instructions/configure.json) — the decision record. Every later decision rests on this.
2. [`docs/project-summary.md`](../project-summary.md) — the product idea and the must-have features for v1.
3. [`docs/requirements/fleet_operations_spec.md`](../requirements/fleet_operations_spec.md) — full spec with the locked design decisions (§8).
4. [`docs/gitflow.md`](../gitflow.md) — branches, commits, PR lifecycle.
5. [`docs/code-review.md`](../code-review.md) — the checklist you'll apply to every PR you review.
6. [`docs/conventions/typescript.md`](../conventions/typescript.md) — formatter, linter, type rules.
7. Every file under `ai-instructions/commands/` — what the slash commands do and how they affect the project.

## When you're ready to ship for real

1. You can describe `src/backend/` and `src/frontend/` entry points and request flow in two sentences each.
2. Branch protection on `main` is fully applied (required checks include `lint`, `typecheck`, `test`, `build`, `pr-title-check`; CODEOWNER review required; conversations resolved; linear history).
3. You've reviewed at least one merged PR per teammate and given specific, non-stylistic feedback at least once.
4. You can confidently explain why the SQL console is sandbox-by-default and what an admin promotion involves — without consulting the spec.
5. The Confluence pages and `docs/` are in sync (no stale references to a feature or role that was renamed).
