# Welcome, Business Analyst

You own the bridge between what stakeholders ask for and what the team commits to build. The spec at [`docs/requirements/fleet_operations_spec.md`](../requirements/fleet_operations_spec.md) is the canonical product contract — you'll keep it accurate as the product changes, write acceptance criteria that reviewers can actually verify, and make sure every Jira ticket maps back to a numbered section of that spec. Your first few days are about reading the spec end-to-end and learning the gitflow well enough to push doc changes confidently.

## What you own here

- **The spec** at `docs/requirements/fleet_operations_spec.md` — every change to product behavior is also a change here.
- **Acceptance criteria** on every Feature, Task, and Bug ticket in [project KAN](https://maksymleb18.atlassian.net/jira/software/projects/KAN/boards). The issue templates already require an *Acceptance criteria* field; your job is to ensure those criteria are observable, specific, and unambiguous.
- **The decision log** — when the team commits to a non-obvious design choice (six are already recorded in spec §8), you write it up with the decision, the reasoning, and the implementation implication.
- **The Confluence Requirements page** (live in space `SD`) — `/configure` and `/edit-config` keep this in sync with the spec.

## Tools you'll use

| Tool | Purpose |
|---|---|
| The spec markdown | Source of product truth |
| Jira (project `KAN`) | Tickets, components, acceptance criteria |
| Confluence (space `SD`) | Stakeholder-facing summaries; auto-synced from `docs/` |
| The interactive prototype | When wording is ambiguous, the prototype is the tiebreaker |
| GitHub PRs | All spec changes go through normal review |

## Sample tickets you might pick up

- Clarify spec §3.4 to say whether company-name uniqueness is case-sensitive (today the text is ambiguous; engineers are asking).
- Add acceptance criteria to KAN-204 ("Driver scoring weight export") — the existing description names the feature but doesn't say what "exportable for audit" means.
- Update spec §8 with a seventh decision: behaviour when a saved view's pinned status changes after it's been promoted to a dashboard widget.
- Author a Confluence page summarizing the v1 vs v2 split for tile resizing (spec §8.1 + §8.3) so stakeholders stop asking when resize ships.

## Your first PR

**Goal:** open a small, real spec PR. The exercise teaches you the gitflow without needing engineering review depth.

1. Find a sentence in the spec that's ambiguous or out-of-date (almost any week-old spec has one). Pick the smallest possible clarification.
2. Branch from `main` as `feature/KAN-XXXX-clarify-spec-{slug}` and commit with `docs: KAN-XXXX clarify {section}`.
3. Open the PR titled the same and fill the four template sections. The reviewer will be the Tech Lead via CODEOWNERS.

## Who to ask when stuck

- **Tech Lead** — when a spec change has cost / scope implications beyond a wording fix.
- **Product Manager** — when stakeholders want something not in v1; you and PM jointly decide whether to defer or pull in.
- **UI/UX Designer** — when the spec text and the prototype disagree.
- **Backend / Frontend Developer** — when you're not sure something is implementable as described.

If a question isn't urgent, [open a GitHub Discussion](https://github.com/sidious18/ai-template-reference/discussions) tagged `requirements`.

## Your first week

**Day 1.** Read the spec end-to-end. Mark every section where you have a question. Open the prototype side by side.

**Day 2.** Read the six design decisions in spec §8 closely — these are the kind of decisions you'll write next. Notice the *decision / why / implication* shape.

**Day 3.** Walk the KAN board. Look at the three oldest open tickets and judge whether their acceptance criteria pass the "could a reviewer verify this on staging?" test. Open Discussions on the ones that don't.

**Day 4.** Open your first spec clarification PR (the exercise above).

**Day 5.** Author a short Confluence summary for the team's next stakeholder meeting. Use whatever template feels natural — there's no fixed format, just clear prose.

## Recommended reading

1. [`docs/requirements/fleet_operations_spec.md`](../requirements/fleet_operations_spec.md) — top-to-bottom.
2. [`docs/project-summary.md`](../project-summary.md) — concise version of the spec.
3. [`docs/onboarding.md`](../onboarding.md) — team workflow.
4. [`docs/gitflow.md`](../gitflow.md) — branches, commits, PR lifecycle.
5. The Confluence Requirements page in space `SD` (linked from the repo's README).

## When you're ready to ship for real

1. You can quote the spec section that covers any given behavior question without searching.
2. Every ticket you touch has acceptance criteria a reviewer can verify on staging.
3. You've authored at least one new design-decision entry in spec §8 end-to-end.
4. Stakeholders ask you (not the Tech Lead) when they want to know what's in v1 vs v2.
