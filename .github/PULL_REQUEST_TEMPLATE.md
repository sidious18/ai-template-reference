<!--
  PR title rule: `<type>(<scope>): KAN-{NUMBER} <imperative summary>`
  Examples:
    feat(dashboard): KAN-42 add empty-state CTA
    fix(sql-console): KAN-118 truncate result set above 100k rows
  Release-please bot is the only allowed exception (chore: release X.Y.Z).
  See docs/gitflow.md and CONTRIBUTING.md.
-->

## Summary

<!-- One paragraph: what changes and why. Keep it short — the reviewer needs context, not a re-explanation of the diff. -->

## Changes

<!-- Bullets per module touched. Describe behavior, not the diff. -->

- src/backend: …
- src/frontend: …
- docs: …

## Test Plan

<!--
  How did you verify this locally?
  - Unit / integration tests added or updated (mention the path).
  - Manual verification steps (e.g., "ran `npm run start:dev` in src/backend, hit /api/healthz, confirmed 200").
  - Screenshots / GIFs for UI changes — before and after.
  - The CI jobs you watched go green.
-->

- [ ] Unit tests added / updated
- [ ] Manual verification (steps below)
- [ ] CI green (lint · typecheck · test · build · pr-title-check)
- [ ] For UI changes: WCAG 2.1 AA verified (keyboard nav, contrast, focus rings)
- [ ] For security-adjacent changes: SECURITY.md reviewed; audit-log entries added if needed

<!-- Manual verification steps: -->

## Linked Ticket

Closes KAN-XXX

<!--
  The Closes line auto-links via the Jira GitHub integration and transitions
  the ticket to Done on merge. Use a real ticket key — the pr-title-check
  workflow also expects KAN-{NUMBER} in the title.
-->

<!-- ===== Reviewer checklist (do not edit; see docs/code-review.md) ===== -->
<!-- - Workspace isolation preserved on every query / job -->
<!-- - Strict TypeScript; no new `any` -->
<!-- - Audit log entries for new admin actions -->
<!-- - Tests are present AND meaningful -->
<!-- - AI review findings (Sonnet 4.6) addressed where legitimate -->
