# Gitflow

This project runs **trunk-based development** off `main`. Short-lived feature branches, squash-merge, every change links to a Jira ticket in the **KAN** project.

## Branching model

```mermaid
flowchart LR
    K["Jira ticket<br/>(KAN-123)"] -->|pick up| B["feature/KAN-123-slug"]
    M["main"] -->|branch off| B
    B -->|commits<br/>(Conventional Commits + KAN-123)| B
    B -->|PR opened| PR["Pull request<br/>(title: 'feat: KAN-123 …')"]
    PR -->|CI passes<br/>(lint · typecheck · test · build · pr-title-check)| RV["Review<br/>(CODEOWNERS + 1 approval)"]
    RV -->|approved| SQ["Squash merge"]
    SQ --> M
    M -->|on merge| RP["release-please tracks commits"]
    RP -->|when ready| REL["release PR<br/>(chore: release X.Y.Z)"]
    REL -->|merged| TAG["git tag vX.Y.Z + GitHub Release"]
    TAG -->|on:release published| DEP["deploy-production.yml"]
    M -->|on push to main| STG["deploy-staging.yml"]
```

## Branches

- **`main`** is the only long-lived branch. It is protected — direct pushes are rejected; every change lands via PR. CI must pass (`lint`, `typecheck`, `test`, `build`, `pr-title-check`). One review from a CODEOWNER is required. Stale reviews are dismissed when new commits arrive. Linear history is enforced (squash only — no merge commits).
- **`feature/KAN-{NUMBER}-{slug}`** is the convention for feature branches. Examples:

  ```
  feature/KAN-42-dashboard-empty-state
  feature/KAN-118-sql-console-sandbox
  feature/KAN-203-fix-cohort-month-rollover
  ```

  `slug` is lowercase, alphanumeric, hyphen-separated, ≤ 50 chars.

- **`release/x.y`** (only if you need a stabilization branch) — cut from `main` at the start of a release cycle, only critical fixes land. Most releases skip this and rely on Release Please to manage version PRs straight off `main`.

## Picking up a Jira ticket

1. Open the ticket in [Jira KAN](https://maksymleb18.atlassian.net/browse/KAN). Note the key (`KAN-123`).
2. Make sure the ticket is in the right state (Todo → In Progress) and assigned to you.
3. From up-to-date `main`:

   ```sh
   git switch main
   git pull --ff-only
   git switch -c feature/KAN-123-short-description
   ```

4. Start work. Commits will carry the ticket id via the message convention below.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/) and include `KAN-{NUMBER}` in the subject. `commitlint` enforces both via `.husky/commit-msg`.

```text
<type>(<optional scope>): KAN-{NUMBER} <imperative summary>

<optional body>

<optional footer>
```

**Real examples:**

```text
feat(dashboard): KAN-42 add empty-state CTA and starter templates
fix(sql-console): KAN-118 truncate result set above 100k rows
refactor(query-builder): KAN-203 extract filter row into its own component
chore: KAN-301 bump nestjs to 10.4.0
docs: KAN-304 update onboarding for the new dashboard widget picker
```

**Types** — `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`.

**Special case** — Release Please's auto-generated release PR uses `chore: release X.Y.Z` with no ticket. This is allowed by both the commit-msg hook and the `pr-title-check` CI workflow.

## Pull request lifecycle

1. **Open the PR.** The title must match the commit-message regex (Conventional Commit + `KAN-\d+` or `chore: release X.Y.Z`). The PR template asks for:
   - **Summary** — what changed, in one paragraph.
   - **Changes** — bullets per touched module.
   - **Test Plan** — how you verified locally, the CI jobs you watched, screenshots for UI changes.
   - **Linked Ticket** — `Closes KAN-123` so Jira's GitHub integration auto-links.

2. **CI runs** automatically:
   - `ci.yml` — lint + typecheck + test + build (matrix per workspace).
   - `pr-title-check.yml` — validates the title regex.
   - `labeler.yml` — auto-labels by changed paths (`backend`, `frontend`, `docs`, `ci`).
   - `ai-pr-review.yml` — Claude posts a single sticky review comment (advisory; not a required check).

3. **CODEOWNERS** are auto-assigned as reviewers when the workflow yes from #48 was set. One approval is required to merge.

4. **Conversations must be resolved** before merge. Stale reviews are dismissed when you push new commits.

5. **Merge via squash.** The squash commit message inherits the PR title — keep it in convention.

6. **Branch is deleted** automatically after merge. Re-create from the next ticket.

## Merge strategy — why squash

- One commit per PR keeps `main`'s history readable (`git log --oneline` is a list of features, not a list of intermediate "wip" / "fix typo" commits).
- Release Please walks `main`'s commits to compute the version bump. Squash means each merged PR is exactly one Conventional Commit entry in the CHANGELOG.
- Conflict resolution is simpler — rebase your feature branch onto `main` before merging, then squash.

Rebase merges and plain merge commits are disabled in branch protection.

## Tags + releases

- **Release Please** runs on every push to `main`. It tracks Conventional Commits and proposes a "release PR" whenever there are unreleased changes. Merging that PR:
  - bumps the version in `release-please-config.json` / `.release-please-manifest.json`,
  - writes a new section to `CHANGELOG.md`,
  - creates a Git tag `vX.Y.Z`,
  - cuts a GitHub Release.
- The release tag triggers `deploy-production.yml` (with a manual approval gate via the GitHub `environment: production` rule).
- Pre-1.0, `bump-minor-pre-major: true` is set — `feat:` bumps the minor, `fix:` bumps the patch. Once 1.0 ships, this flips so breaking changes bump the major.

## Hotfixes

Treat hotfixes the same as features — branch from `main`, ticket prefix, PR, squash. If a hotfix needs to ship faster than the normal release cadence:

1. Open a PR labeled `hotfix` (the `pr-title-check` still applies).
2. Tech Lead approves with the standard one-review requirement.
3. After merge, manually trigger the Release Please workflow or run it locally:

   ```sh
   gh workflow run release-please.yml --ref main
   ```

4. Merge the release PR; the production deploy fires on the tag.

## Quick reference

| Action               | Command                                                               |
| -------------------- | --------------------------------------------------------------------- |
| Update local main    | `git switch main && git pull --ff-only`                               |
| Start a feature      | `git switch -c feature/KAN-123-slug`                                  |
| Commit               | `git commit -m "feat(scope): KAN-123 short summary"`                  |
| Pre-push checks      | `npm run lint && npm run typecheck` (also runs via `.husky/pre-push`) |
| Open PR              | `gh pr create --fill --base main`                                     |
| Trigger release      | merge the `chore: release X.Y.Z` PR opened by release-please          |
| Deploy prod (manual) | `gh workflow run deploy-production.yml --ref main`                    |

## Related docs

- [docs/onboarding.md](onboarding.md) — first-day walkthrough
- [docs/code-review.md](code-review.md) — what reviewers look for
- [docs/conventions/typescript.md](conventions/typescript.md) — formatter / linter / type checker rules
- [CONTRIBUTING.md](../CONTRIBUTING.md) — outside-contributor flow
- [SECURITY.md](../SECURITY.md) — disclosure policy
