# Welcome, Product Manager

You own the v1 scope, the v2 backlog, and the stakeholder cadence around both. The product spec at `docs/requirements/fleet_operations_spec.md` is structured exactly so a PM can reason about scope — §7 (out of scope for v1) lists what's deferred, §8 has six locked design decisions with rationale + implication. Your job is to keep §7 accurate as features land and to refresh §8 as v2 conversations crystallize.

## What you own here

The roadmap (lives outside the repo — Jira KAN epics, the team's preferred PM tool). The §7 (Out of scope) section as a living artifact. The decisions in §8 — when v2 work changes a decision, you and the Business Analyst co-author the spec edit. The "Open Questions" section in `docs/project-summary.md` — these are the items currently lacking an owner.

You don't write code. You write tickets, and you accept (or reject) features on behalf of stakeholders. The Tech Lead enforces engineering invariants; you enforce product invariants.

## Tools you'll use

| Tool                                                              | Purpose                                                                       |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| [Jira KAN](https://maksymleb18.atlassian.net/browse/KAN)          | Ticket creation + prioritization.                                             |
| [Confluence SD](https://maksymleb18.atlassian.net/wiki/spaces/SD) | Stakeholder-facing project overview, requirements, technologies, user roles.  |
| GitHub releases page                                              | Release notes that ship to stakeholders.                                      |
| `/edit-config "sync project overview"`                            | Regenerate just the Confluence Project Overview after a project-summary edit. |

## Sample tickets you might pick up

- "Prioritize the v1.2 backlog. Top three candidates from §7: real-time GPS tracking, in-app messaging, maintenance calendar. Pick one."
- "Resolve the 'per-workspace branding on auth screen' open question with marketing — current spec says no branding in v1; confirm before SSO launch."
- "Draft the release notes for v1.0.0 from the CHANGELOG.md that release-please generated."
- "Sit with the Data Scientist to scope a §5.2.5 'Custom KPI builder' as a v2 design decision (currently not in §8)."

## Your first PR

You may not author many PRs — most PM work is in Jira and Confluence. But understanding the gitflow makes you a better partner. Your first PR should be a small content edit.

> **Goal**: add or revise the "Open Questions" list in `docs/project-summary.md` based on the latest team discussion.
>
> 1. Branch: `feature/KAN-XXX-refresh-open-questions` (real ticket).
> 2. Edit `docs/project-summary.md`'s `## Open Questions` section.
> 3. Commit: `docs: KAN-XXX refresh open questions for {context}`.
> 4. PR per the template. Tech Lead reviews; merge.

## Who to ask when stuck

- **Tech Lead** — feasibility, sequencing, when a stakeholder ask is technically infeasible.
- **Business Analyst** — when a spec section needs updating to match an in-flight decision.
- **UI/UX Designer** — when a stakeholder ask requires new visual design.
- **Data Scientist** — when analytics scope is in question.

[GitHub Issues](https://github.com/sidious18/ai-template-reference/issues) `question` tag.

## Your first week

> **Day 1.** Read `docs/project-summary.md` and `docs/requirements/fleet_operations_spec.md` end-to-end. Note any internal contradictions and surface them to the BA.

> **Day 2.** Walk every Jira KAN ticket. Confirm each has a spec section reference and an estimate. Open follow-ups for tickets without.

> **Day 3.** Sit with the Tech Lead and confirm the v1 timeline. Stakeholder commitments hang on this.

> **Day 4.** Walk the Confluence pages (Project Overview, Requirements, Technologies, User Roles). Confirm what stakeholders see is accurate.

> **Day 5.** Draft v1 release notes.

## Recommended reading

1. [`docs/project-summary.md`](../project-summary.md) — your primary stakeholder-facing artifact.
2. [`docs/requirements/fleet_operations_spec.md`](../requirements/fleet_operations_spec.md) — full spec, especially §7 and §8.
3. Confluence SD space — the stakeholder mirror.
4. Jira KAN — the engineering execution view.

## When you're ready to ship for real

1. Every Jira KAN ticket in the in-progress + ready columns has a spec section reference and an estimate.
2. The §7 (Out of scope) list reflects current reality — items that have shipped have been moved into the spec proper.
3. Release notes for the latest release exist as a GitHub Release plus a Confluence post.
4. You can name the top three v2 priorities and the rationale for each.
