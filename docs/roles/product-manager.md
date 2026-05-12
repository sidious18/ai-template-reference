# Welcome, Product Manager

You own the roadmap, the prioritization, and the stakeholder conversation for fleet-operations. The spec is detailed and the v1 scope is well-defined (spec §7 lists what's deliberately deferred), but every product evolves — you're the person who decides when something graduates from "v2" to "this release" and who keeps the team focused on outcomes for the four user personas in §1.2. Your first few days are about reading what's been decided, meeting each role, and understanding the rhythms (Release Please cadence, weekly stakeholder updates) the team will rely on.

## What you own here

- **The roadmap** — what's in v1, what's in v2, what's parked. You and the Business Analyst jointly own the line between spec and backlog.
- **Prioritization** — which Jira tickets in `KAN` move up the board.
- **Stakeholder communication** — Confluence Project Overview page, release announcements, the executive summary that goes out after each release tag.
- **KPIs and success metrics** — defining what "good" looks like for each release (adoption, latency, satisfaction).
- **Customer feedback loop** — collecting it, triaging it into tickets or Discussions, deciding what becomes scope.

## Tools you'll use

| Tool | Purpose |
|---|---|
| Jira (project `KAN`) | Tickets, backlog, sprint planning |
| Confluence (space `SD`) | Stakeholder-facing pages |
| GitHub Discussions | Feedback intake |
| Release Please's open release PR | Live view of what's shipping in the next release |
| The interactive prototype | When discussing a feature with stakeholders, show this — they understand pixels faster than spec text |

## Sample tickets you might pick up

- Author the v1 launch plan: which customer personas are targeted first, what onboarding looks like for them, what the first 10 customers should feel.
- Define KPIs for v1: dashboard adoption (% of workspaces with ≥ 3 widgets configured), research-tool adoption (% of workspaces with ≥ 1 saved view), SQL-console safety (zero production incidents from runaway queries).
- Decide whether the "Custom widgets" feature (deferred per spec §7) should move into v1.5 or v2 based on the design data the team gathers (see spec §8.1 implication).
- Triage the top-10 user-feedback themes from the first month of staging and turn them into either v2 backlog or `feat:` tickets.

## Your first PR

**Goal:** open a small product PR — typically a Confluence sync update or a small spec clarification.

1. Read the Confluence Project Overview page (in space `SD`). Find one place where stakeholder framing could be sharper.
2. Update `docs/project-summary.md` with the improved framing (Confluence auto-syncs from `docs/`).
3. Branch from `main` as `feature/KAN-XXXX-project-summary-{slug}` and commit with `docs: KAN-XXXX sharpen {section} of project summary`.
4. Open the PR. The Tech Lead and Business Analyst review via CODEOWNERS.

## Who to ask when stuck

- **Business Analyst** — for spec interpretation and acceptance-criteria framing.
- **Tech Lead** — for engineering-cost estimates and feasibility.
- **UI/UX Designer** — for visual-feasibility estimates and design-debt tradeoffs.
- **QA Engineer** — for risk assessment on a release.
- **DevOps Engineer** — for deploy / runtime risk.

If a question isn't urgent, [open a GitHub Discussion](https://github.com/sidious18/ai-template-reference/discussions) tagged `product`.

## Your first week

**Day 1.** Read [`docs/project-summary.md`](../project-summary.md) and the full spec. Note every assumption that surprises you.

**Day 2.** Read spec §7 (out of scope) and §8 (six committed decisions). These shape every roadmap conversation you'll have for the first six months.

**Day 3.** 1:1 with the Tech Lead. Walk through the Confluence pages together (Project Overview, Requirements, Technologies, User Roles). Calibrate on what "v1 done" means.

**Day 4.** Open the small Confluence-sync PR above.

**Day 5.** Author the v1 KPI doc as a draft Discussion. Iterate with the team.

## Recommended reading

1. [`docs/project-summary.md`](../project-summary.md).
2. [`docs/requirements/fleet_operations_spec.md`](../requirements/fleet_operations_spec.md) — especially §1.2 (target users), §7 (out of scope), §8 (decisions), §9 (decision summary).
3. The Confluence Project Overview + Requirements pages in space `SD`.
4. The KAN board's filtered views: "Open Bugs by severity" and "Open Features by priority".
5. [`docs/onboarding.md`](../onboarding.md) — so you can speak the engineers' language during planning.

## When you're ready to ship for real

1. Stakeholders ask you (not anyone else) what's in the next release and what's deferred.
2. The KAN board's prioritization reflects the roadmap you've defined — not just the loudest customer.
3. Every release tag comes with a stakeholder-facing summary in Confluence.
4. You can explain the six v1 design decisions (spec §8) to a non-engineer in two sentences each.
