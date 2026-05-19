# Welcome, Tech Lead

Welcome — you're the technical owner of Fleet Operations. The team looks to you for cross-module decisions (anything that touches both `src/backend/` and `src/frontend/`), architectural sign-off on schema and integration changes, and the rhythm of the release cycle. You're also the human gate on the AI instruction pack: every later command (`/tmpl-bootstrap`, `/tmpl-release-new`, `/tmpl-release-finish`) reads `ai-instructions/configure.json` and `ai-instructions/` content as gospel, so if anything in there drifts, the whole automation pipeline drifts with it. On day one, run `/tmpl-verify` to confirm the AI pack is healthy and skim every section of `ai-instructions/configure.json` so you know what decisions you'll be defending later.

## What you own here

**You own the project's architecture, the AI instruction pack, and the release rhythm** — not a single module, but the seams between them. Concretely:

- The decision record at [`ai-instructions/configure.json`](../../ai-instructions/configure.json) — stack, gitflow, integrations, team roles, scope. You're the only person who should be running `/tmpl-reconfigure`.
- Every CI workflow under `.github/workflows/` (once Full scope or `/tmpl-reconfigure` adds them).
- Branch protection on `main` — the rules at `integrations.github.branch_protection`. Right now `apply: false, pending: true` because GitHub MCP can't apply protection programmatically; you'll set it manually in the repo UI before merging the first real ticket.
- Release Please (when Full scope is enabled) — the cadence, the version-bump rules, the changelog shape.
- Every PR's *Tech Lead Review* — the configure PR opened by `/tmpl-setup` Step 5n is reviewed by you first; the per-role onboarding tickets created in Step 5o are assigned by you as people join.

Tickets labeled `architecture`, `tech-debt`, or anything tagged across multiple module components come to you. You're also the escalation path for unblockable disagreements between the Backend Developer and the Frontend Developer (rare in a healthy team — but they happen).

## Tools you'll use

| Tool | What for |
|---|---|
| `/tmpl-verify` | Audit the AI pack health. Run after any `/tmpl-reconfigure` or before a release. |
| `/tmpl-reconfigure` | The only safe way to change the decision record after `/tmpl-setup` finishes. |
| `/tmpl-release-new`, `/tmpl-release-edit`, `/tmpl-release-finish` | The release lifecycle. You drive them. |
| GitHub MCP (`mcp__github__*`) | Branch protection probes, repo settings, PR review automation. |
| Atlassian MCP (`mcp__atlassian__*`) | Jira project audit, Confluence page updates when the spec moves. |
| `gh` CLI | Power tools for what the MCP can't do (e.g. some branch-protection updates need raw API). |
| Everything every other role uses | You don't need to be the strongest at any one tool, but you need to be able to debug each role's environment when it breaks. |

## Sample tickets you might pick up

The Jira backlog for `KAN` is empty right now. Tickets that land on the Tech Lead's plate tend to look like:

> - "Audit and apply branch protection on `main`: required checks = `lint`, `typecheck`, `test`, `build`; linear history; 1 review required; dismiss stale reviews."
> - "Bump scope from `core` to `full` via `/tmpl-reconfigure` and verify CI, Release Please, and AI PR review all land cleanly on the resulting PR."
> - "Decide read-replica routing for the SQL console — direct ClickHouse client connection vs API-layer middleware. Document the call in `docs/decisions/` and update the spec."
> - "Onboarding ticket for a new joiner: assign role-specific KAN task created in `/tmpl-setup` Step 5o, walk them through the first PR, schedule a 1:1 by end of week one."

You're also the person who creates the *next-three-tickets* synthetic backlog when the project starts — most of the first sprint's tickets are bootstrapped by you from the spec.

## Your first PR (or your first review)

The first PR you'll see is the configure PR — opened automatically by `/tmpl-setup` Step 5n, containing every artifact generated in Step 5 (this doc included). Your job on day one is to review it.

1. Read every file in the PR diff. The big ones to spot-check:
   - `ai-instructions/configure.json` — is every section's value what you'd have answered?
   - `docs/onboarding.md` and the seven `docs/roles/*.md` — do they reflect *this* team and *this* project, or do they sound generic?
   - `.husky/*` + `.commitlintrc.json` + `.gitleaks.toml` — do the hooks actually enforce what you want?
   - `README.md` — Confluence URLs filled in? Tracker link to the right project?
2. Run `/tmpl-verify` locally on the PR branch. If it complains, post the output as a PR comment and fix in the same branch (this is the one PR where amending and force-pushing is normal).
3. Approve when you're happy; squash-merge. The Jira review ticket from Step 5n auto-closes on merge once a Smart Commit reference lands in the squash commit body.

When you do start opening your own PRs, the shape is the same as everyone else's — branch off `main` with `chore/KAN-{N}-{slug}`, commit, push, open with the conventional-commit title, one approval (or self-approve for trivial config-only changes if branch protection allows), squash-merge.

## Who to ask when stuck

You're usually the person being asked, but it does happen:

- **Backend Developer** → ask about the API surface in depth — endpoint shapes, error responses, runtime invariants.
- **Frontend Developer** → ask about user-visible feasibility (can we hit this budget? does this state machine cover every reachable transition?).
- **DB Architect** → ask before approving any migration; before changing the OLTP / OLAP split; before adding a new index.
- **Data Scientist** → ask about the analytics modules' math before sign-off. You don't need to derive Holt-Winters, but you do need to know which knobs change behavior visibly.
- **UI/UX Designer** → ask before approving any visual change that the spec doesn't pin down word-for-word.
- **QA Engineer** → ask about test infrastructure and flake rates. They have the clearest read on which areas of the product are most likely to ship broken.
- **External — Anthropic Claude Code support** → for AI-pack regressions you can't explain (the AI generates something unexpected from `/tmpl-release-new`). The pack ships with `AI_INSTRUCTIONS.md` documenting how to file a useful bug report.

## Your first week

> **Day 1.** Review and approve the configure PR. Run `/tmpl-verify`. Audit `ai-instructions/configure.json` line by line. Set branch protection on `main` in the GitHub repo UI (Settings → Branches → Add rule). Confirm Jira KAN is set up the way the team will use it — workflows, issue types, components.

> **Day 2.** Read every doc that landed in Step 5: `docs/project-summary.md`, `docs/onboarding.md`, every `docs/roles/*.md`, `docs/conventions/typescript.md`, `docs/gitflow.md`. You'll be referencing them all week and beyond.

> **Day 3.** Walk a dry-run PR end-to-end yourself as described in `docs/onboarding.md`. You want the hooks under your fingernails so you can debug other people's hook problems by reflex.

> **Day 4.** Plan the first sprint. Open ~8–12 KAN tickets from the spec — at least one starter ticket per role for the team's first PR. Assign them. The seven per-role onboarding tasks created in Step 5o are the seed; this is the next layer.

> **Day 5.** Pair with one of the developers on their first real ticket. Pair-programming a first ticket is the cheapest way to surface assumptions the docs missed.

## Recommended reading

These are the docs you'll keep coming back to:

1. [`ai-instructions/configure.json`](../../ai-instructions/configure.json) — the decision record. Every later command reads this.
2. [`ai-instructions/AI_INSTRUCTIONS.md`](../../ai-instructions/AI_INSTRUCTIONS.md) — how the AI pack works end-to-end.
3. [`ai-instructions/AGENTS.md`](../../ai-instructions/AGENTS.md) — the agent definitions used by the release commands.
4. [`docs/project-summary.md`](../project-summary.md) — the product story.
5. [`docs/requirements/fleet_operations_spec.md`](../requirements/fleet_operations_spec.md) — the spec in full.
6. Every `docs/conventions/*.md` — the bar on PR review.
7. Every `docs/roles/*.md` — what each teammate expects from you and from each other.
8. [`docs/gitflow.md`](../gitflow.md) — the workflow contract the hooks and CI enforce.

## When you're ready to ship for real

1. Branch protection on `main` is applied and matches the recorded settings in `configure.json`.
2. The configure PR is merged and the per-role onboarding KAN tickets are assigned.
3. You've run `/tmpl-verify` and it returns clean — no warnings, no manual TODOs lingering in the pack.
4. The first three real KAN tickets are open, one for each of the developer roles, and each is sized so the PR fits in a day.
5. You can recite the four CI checks (`lint`, `typecheck`, `test`, `build`) and explain in one breath what each catches that the others don't.
