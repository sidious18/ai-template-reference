---
description: Cut a tagged release of this template — bump VERSION, write CHANGELOG, tag, push
argument-hint: "[patch|minor|major|X.Y.Z]"
---

Read `ai-instructions/commands/tmpl-version-bump.md` from the project root and
follow every step in order. Do not skip steps.

`/tmpl-version-bump` is the **template-maintainer** command for this repo. It
bumps `VERSION`, writes a CHANGELOG entry from the commits since the
last tag, commits the bump, tags `vX.Y.Z`, and pushes both. The
`.github/workflows/release.yml` workflow then auto-creates the
GitHub release.

This is **not** the same as `/tmpl-release-finish` — that command finishes
a feature release of a project bootstrapped from this template.
`/tmpl-version-bump` is for cutting a new version of the template itself.

If an argument is supplied, it picks the bump:
- `patch`, `minor`, `major` — semver bump from the current `VERSION`
- `X.Y.Z` — explicit semver string (e.g., `1.0.0`)
- empty — the command suggests a bump kind from the Conventional
  Commits log since the previous tag and asks you to confirm

Requested bump (may be empty): $ARGUMENTS
