# Welcome, Business Analyst

You own the requirements as a living artifact. The spec at `docs/requirements/fleet_operations_spec.md` is a 25 KB structured document with sections §1–§9 and six locked design decisions in §8. As features ship, deferred items move from §7 (out of scope) into the spec proper; as v2 conversations land, §8 grows. You're also the cross-link between Jira tickets and spec sections — the per-screen requirement codes that show up in `docs/project-summary.md`'s Screens table come from your maintenance.

## What you own here

`docs/requirements/fleet_operations_spec.md` and `docs/requirements/README.md`. The Confluence Requirements page at <https://maksymleb18.atlassian.net/wiki/spaces/SD> (sync_on_edit is on — re-runs of `/configure` regenerate it from the markdown). The `linked_requirements` arrays in `configure.json.docs_media[]` for the 17 screen renders — these surface in the Screens table and let reviewers jump from a code in the spec to a screen image.

You don't own ticket creation in Jira — the role-owner does. You own the spec text those tickets reference.

## Tools you'll use

| Tool                                    | Purpose                                                                                                    |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Markdown + an editor                    | Spec edits — keep section headings stable; section numbers are referenced from `linked_requirements`.      |
| Atlassian MCP                           | View Jira KAN tickets, push spec text to the Confluence Requirements page when a `/configure` re-run runs. |
| `/edit-config "sync requirements page"` | Regenerate just the Confluence Requirements page after a spec change.                                      |
| GitHub MCP                              | Watch incoming PRs in `docs/requirements/` so you know what's about to change.                             |

## Sample tickets you might pick up

- "Resolve the §3.6 ambiguity on rate-limit scope — is it per-IP, per-account, or both? Confirm with Security Engineer, update spec, regenerate Confluence."
- "Move `Real-time GPS tracking` from §7 (out of scope) into the §5 Research workspace as a new tool, now that v1.2 prioritized it." Involves renumbering implications.
- "Add acceptance criteria to §4.6 Dashboard for the keyboard alternative to drag-to-select."
- "Migrate one of the §8 design decisions to a new format that includes 'usage data' once we have first-quarter analytics."

## Your first PR

> **Goal**: edit one ambiguous sentence in the spec and re-export the Confluence Requirements page.
>
> 1. Find a sentence in `docs/requirements/fleet_operations_spec.md` that has a vague pronoun or unclear scope. Discuss with the Tech Lead or PM before editing.
> 2. Branch: `feature/KAN-XXX-clarify-spec-section-N` (real ticket).
> 3. Edit. Keep section numbers stable.
> 4. Run `/edit-config "sync requirements page"` (or include the regeneration in your commit message and let the Tech Lead apply it on merge).
> 5. Commit: `docs: KAN-XXX clarify §N — {what was ambiguous}`.
> 6. PR per the template. Test Plan: "Read the section out loud; the new wording is unambiguous."

## Who to ask when stuck

- **Product Manager** — scope questions ("should this feature be in v1 or v2?").
- **Tech Lead** — feasibility questions ("can we build this in NestJS without a sidecar?").
- **UI/UX Designer** — visual implications of a spec change.
- **Security Engineer** — when a requirement touches auth / PII / audit / rate-limit policy.
- **Data Scientist** — when a requirement touches the analytics math.

[GitHub Issues](https://github.com/sidious18/ai-template-reference/issues) `question` tag.

## Your first week

> **Day 1.** Read `docs/requirements/fleet_operations_spec.md` end-to-end. Note questions in the margin.

> **Day 2.** Sit with the Product Manager and resolve as many margin notes as possible.

> **Day 3.** Read `docs/project-summary.md` and check that every `linked_requirements` code in the Screens table actually exists in the spec. (They should — `/configure` linked them at Step 4.5b — but verify.)

> **Day 4.** Walk every Jira KAN ticket in the backlog. For each, confirm the description references a spec section. Open follow-ups for tickets without anchors.

> **Day 5.** Update one spec section that came up in Day 2 discussion. Open the PR.

## Recommended reading

1. [`docs/requirements/fleet_operations_spec.md`](../requirements/fleet_operations_spec.md) — your primary artifact.
2. [`docs/project-summary.md`](../project-summary.md) — the Screens table maps spec codes to renders.
3. [`docs/requirements/README.md`](../requirements/README.md) — meta on the bundle.
4. Confluence SD space — your published mirror.
5. Jira KAN — the ticket backlog. Walk every ticket once.

## When you're ready to ship for real

1. Every Jira KAN ticket in the backlog references a spec section. Untracked tickets have follow-ups.
2. The Confluence Requirements page is in sync with `docs/requirements/fleet_operations_spec.md`.
3. You can answer "where is X documented?" for any concept in the product without searching.
4. You've shipped at least one spec clarification PR end-to-end.
