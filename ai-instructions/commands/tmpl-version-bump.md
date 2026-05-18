# Command: /tmpl-version-bump [patch|minor|major|X.Y.Z]

Cuts a new tagged release of **this template repo**. Bumps `VERSION`,
writes a CHANGELOG entry generated from the Conventional Commits log
since the previous tag, commits the bump, tags `vX.Y.Z`, and pushes
both. The `.github/workflows/release.yml` workflow then verifies the
tag against `VERSION` + `CHANGELOG.md` and creates the GitHub release
with auto-generated notes.

**This is not `/tmpl-release-finish`.** `/tmpl-release-finish` finishes a
feature release of a downstream project bootstrapped from this
template; `/tmpl-version-bump` cuts a new version of the template itself.

Tag pushing affects shared state. Step 5's confirmation gate fires
**regardless of `approval_rate`** — the user must explicitly approve
the bump + commit + tag + push as a single batch before any of it
runs. There is no `auto` path that bypasses this gate.

---

## Step 0: Pre-flight checks

Run all checks; halt on the first failure with a one-line cause.

1. **Working tree** — `git status --porcelain` must be empty. Halt
   if dirty: "Uncommitted changes — commit or stash first."
2. **Branch** — `git rev-parse --abbrev-ref HEAD` must be `main`.
   Halt otherwise: "/tmpl-version-bump runs from main only. Switch and rerun."
3. **Up to date with origin** — `git fetch origin main`, then
   compare `git rev-list HEAD..origin/main` and the reverse. Halt
   when behind: "Local main is behind origin — pull first." Halt
   when diverged: "Local main has diverged from origin — resolve
   first."
4. **Files exist** — `VERSION` and `CHANGELOG.md` are present at
   the repo root. Halt with the exact missing-file path otherwise.
5. **Workflow file present** — `.github/workflows/release.yml`
   exists. If missing, warn but continue: "Release workflow file is
   missing; the GitHub release will not be auto-created. Re-add the
   workflow before pushing the tag if you want automated releases."

---

## Step 1: Determine the next version

Read the **current version** from `VERSION` (strip whitespace).

Find the **previous tag** with `git tag -l 'v*.*.*' --sort=-v:refname
| head -n 1`. When no tag exists yet, the previous tag is `null` and
the commit-range below uses the entire history.

### 1a. Suggest a bump kind from the commit log

Run `git log {prev-tag}..HEAD --pretty=%s%n%b%n---END---` (or full
log when no prev-tag). Scan the output:

- Any `BREAKING CHANGE:` footer or `!:` after the type
  (`feat!:`, `fix(scope)!:`) → suggest **major**.
- Any `feat:` or `feat({scope}):` commit → suggest **minor**.
- Otherwise → suggest **patch**.

Cap the suggestion: when the current version is `0.x.y`, even
breaking changes are typically a **minor** bump (per semver
convention for `0.y.z` versions). Tell the user: "Pre-1.0
convention: breaking changes are minor bumps until you reach 1.0.
Suggested: minor."

### 1b. Resolve the user's choice

- If the argument is `patch`, `minor`, or `major`, apply that bump
  to the current version.
- If the argument matches `^\d+\.\d+\.\d+$`, use it verbatim as the
  new version. Validate it is greater than the current version
  (lexicographic semver). Halt otherwise: "Explicit version X.Y.Z
  is not greater than current Y.Y.Y. Use a higher version."
- If the argument is empty, present the suggested bump and the
  three concrete versions:

  > Current version: **0.1.0**. Previous tag: **none**.
  >
  > Based on the commit log since {prev-tag-or-init}, I suggest a
  > **{kind}** bump.
  >
  > - patch → 0.1.1
  > - minor → 0.2.0
  > - major → 1.0.0
  >
  > Reply: **patch** / **minor** / **major** / **X.Y.Z** (explicit) /
  > **abort**.

Save the resolved new version as `NEW_VERSION` (e.g., `0.2.0`) and
the tag as `NEW_TAG` (e.g., `v0.2.0`).

---

## Step 2: Generate the CHANGELOG entry

Read every commit between the previous tag and `HEAD`:

    git log {prev-tag}..HEAD --pretty=format:'%H%x09%s%x09%b%x1e' --reverse

(When no prev-tag, omit the `{prev-tag}..` range.)

Group commits by Conventional-Commits type into Keep-a-Changelog
sections. The mapping:

| Commit type | CHANGELOG section |
|---|---|
| `feat:` / `feat(...)` | **Added** |
| `fix:` / `fix(...)` | **Fixed** |
| `refactor:` / `perf:` / `style:` | **Changed** |
| `revert:` | **Removed** (or **Changed** when the revert is partial) |
| `BREAKING CHANGE:` footer or `!:` after type | Pin to the top of the relevant section, prefixed `**BREAKING:**` |
| `docs:` | **Documentation** (skip when the only docs commits are CHANGELOG bumps themselves) |
| `chore:` / `test:` / `ci:` / `build:` | Skip from CHANGELOG (internal noise) — surface in a bullet only when the change is user-visible (e.g., a CI workflow added that reviewers can use) |

For each non-skipped commit:

- Strip the `type(scope):` prefix from the subject.
- Take the body's first non-empty line as the bullet's description
  when the subject is too terse (less than ~6 words). Otherwise
  use the cleaned subject.
- Convert the bullet to past-tense, neutral phrasing: "Add X" →
  "Add X" (Keep-a-Changelog convention is imperative — keep as is).
- When the message contains a path or symbol that the reader will
  recognize (e.g., `Step 4.5`, `docs/onboarding.md`), keep it
  inline.

When a section has no entries, **omit it entirely** — no empty
**Added** heading.

The proposed entry shape:

    ## [{NEW_VERSION}] — {YYYY-MM-DD}

    {Optional: one-paragraph release-summary lead, generated when
    the commit log spans more than ~10 commits or contains any
    BREAKING change. Otherwise omit.}

    ### Added
    - {bullet}
    - …

    ### Changed
    - …

    ### Fixed
    - …

    ### Removed
    - …

    ### Documentation
    - …

The date is **today's date** in the user's local timezone, ISO
format. Read it from `date +%Y-%m-%d`.

---

## Step 3: Show the proposed changes for review

Stage the proposed updates **without writing them yet**:

1. **`VERSION`** — single line, the new version string + trailing
   newline.
2. **`CHANGELOG.md`** — three changes:
   - The `## [Unreleased]` header stays in place (and stays empty
     until the next bump fills it).
   - Insert the new `## [{NEW_VERSION}] — {date}` section
     immediately below `## [Unreleased]`.
   - Append two new link references at the bottom:
     - `[Unreleased]: …compare/v{NEW_VERSION}...HEAD`
     - `[{NEW_VERSION}]: …releases/tag/v{NEW_VERSION}`
     - The previous version's link reference stays untouched.
     - The previous `[Unreleased]: …compare/v{PREV}...HEAD` is
       updated in place (its endpoint changes from the old prev
       tag to NEW_VERSION).

Use the staged-tabs review pattern from
`commands/tmpl-setup.md` Step 5 ("How files are presented for
review"): write proposed content to
`/tmp/claude-tmpl-version-bump-{run-id}/{relative-path}`, open `VERSION` as
a regular tab and `CHANGELOG.md` as `code --diff` (it has prior
content), and present the proposal block:

> About to release **{NEW_TAG}**:
>
> 1. Bump `VERSION` from {OLD_VERSION} to {NEW_VERSION}
> 2. Add the following CHANGELOG entry (see open editor tab for
>    the full diff):
>
>     ## [{NEW_VERSION}] — {date}
>     {first 5–8 lines of the new section as a teaser}
>
> 3. Commit:
>     git add VERSION CHANGELOG.md
>     git commit -m "chore(release): bump to {NEW_VERSION}"
>
> 4. Tag:
>     git tag {NEW_TAG}
>
> 5. Push (this is the side-effect step):
>     git push origin main
>     git push origin {NEW_TAG}
>
> Reply: **approve** (run all five), **edit** (you'll modify the
> staged CHANGELOG entry in the editor and reply 'done' when
> ready), **abort**.

When the user picks `edit`, wait for `done`, re-read the staged
`CHANGELOG.md`, optionally re-show the teaser, then re-prompt
once. The user can iterate.

---

## Step 4: Side-effect gate (always fires)

After `approve`, run the gate one more time with **the exact
commands** about to execute. This is non-negotiable — tag pushes
to a shared remote are hard to undo (they propagate to clones,
trigger workflows, may cut releases on read-replicas).

> About to run:
>
>     git add VERSION CHANGELOG.md
>     git commit -m "chore(release): bump to {NEW_VERSION}"
>     git tag {NEW_TAG}
>     git push origin main
>     git push origin {NEW_TAG}
>
> Reply: **yes, run** / **abort**.

---

## Step 5: Execute

After `yes, run`:

1. Move `VERSION` and `CHANGELOG.md` from staging into place.
2. `git add VERSION CHANGELOG.md`
3. `git commit -m "chore(release): bump to {NEW_VERSION}"` — do
   not add any other files; the bump commit is intentionally
   minimal so reverting it is cheap.
4. `git tag {NEW_TAG}` — annotated tag is fine, lightweight is
   simpler. Use lightweight (`git tag {NEW_TAG}` with no `-a`).
5. `git push origin main`
6. `git push origin {NEW_TAG}`

If any step fails, **stop and surface the error**. Do not retry
silently. The most common failure modes:

- `git push origin main` rejected (someone else pushed first) →
  halt; tell the user to pull and re-run `/tmpl-version-bump`. The local
  bump commit is left in place; the tag was not pushed yet, so
  there's no remote inconsistency to clean up.
- `git push origin {NEW_TAG}` rejected (tag already exists on
  remote) → halt; surface the conflict. The local bump commit is
  on remote main; the user can either delete the remote tag
  manually and re-push, or pick a higher version and re-run.

Clean up the staging dir at `/tmp/claude-tmpl-version-bump-{run-id}/`.

---

## Step 6: Verify the release workflow

After both pushes succeed, print the expected release URL and a
nudge to verify the workflow ran:

> Pushed **{NEW_TAG}**. The GitHub Actions release workflow
> (`.github/workflows/release.yml`) should now create the GitHub
> release with auto-generated notes.
>
> Verify:
>     gh run list --workflow=release.yml --limit 3
>     gh release view {NEW_TAG} --repo {origin-repo}
>
> Or open the release page:
>     {derived URL: github.com/{owner}/{repo}/releases/tag/{NEW_TAG}}

If the workflow file is missing (Step 0 surfaced this earlier),
fall back to a manual creation:

> Run this once to create the release manually:
>     gh release create {NEW_TAG} --generate-notes --verify-tag

Done.

---

## What `/tmpl-version-bump` does **not** do

- Does **not** edit `## [Unreleased]` content during the bump —
  the next release fills that section. If the user wants
  highlighted "what's coming" content under [Unreleased] before a
  release, they edit `CHANGELOG.md` by hand.
- Does **not** create release branches or hotfix branches — this
  is a trunk-based, tag-from-main workflow.
- Does **not** publish to package registries — this template
  ships markdown instructions, not a package. Add a publish step
  to `.github/workflows/release.yml` if a registry target is
  added later.
- Does **not** delete or move tags — tag-rewriting is destructive
  and out of scope. If a tag was pushed in error, the user runs
  `git push --delete origin {tag}` + `git tag -d {tag}` manually
  and accepts that anyone who fetched in the meantime keeps the
  bad tag.
