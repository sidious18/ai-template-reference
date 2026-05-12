<!--
PR title must match: <type>(scope?)!?: KAN-NNN <summary>
Allowed types: feat, fix, chore, docs, refactor, test, perf, build, ci, style, revert.
Release-please PRs (chore: release X.Y.Z) are also accepted.
-->

## Summary

One paragraph: why this change exists. What user-visible (or system-visible)
behavior changes, and what motivated it.

## Changes

A bulleted list of structural changes — files added/moved/renamed, public
contracts changed, new dependencies. Reviewers read this first.

- …
- …

## Test Plan

The commands and scenarios you ran locally to verify this change. Include the
unhappy path. CI will re-run the suite, but humans want to know what *you* did.

- [ ] `( cd src/backend && npm test )`
- [ ] `( cd src/frontend && npm test )`
- [ ] `( cd src/frontend && npm run test:e2e )` _(if applicable)_
- [ ] Manual: …

## Linked Ticket

Closes: KAN-NNN

<!--
Reviewer reminder:
- Verify the four sections above are filled in (not left as template prose).
- Check `docs/code-review.md` for the per-area checklist.
- CI checks must pass: lint, typecheck, test, build, secret-scan, pr-title-check.
- At least one CODEOWNERS approval + all conversations resolved before merge.
-->
