# Security Policy

We take security seriously. The fleet operations product handles PII (driver names, license numbers, trip routes) and runs analytics workloads against multi-tenant data — both areas where a vulnerability has real impact. This document tells you how to report something privately, what we support, and how we'll respond.

## Reporting a vulnerability

**Do not file a public GitHub Issue or Discussion.** Instead:

1. Open a [private security advisory](https://github.com/sidious18/ai-template-reference/security/advisories/new) on this repo. GitHub gives us a private channel and you a tracking number.
2. Or, if you cannot use GitHub's advisory flow, email the Tech Lead directly via the address on the repo's main page (Tech Lead: **sidious18**). Use the subject line `[security] {one-line summary}`.

In your report, please include:

- The component affected (`src/backend`, `src/frontend`, a workflow file, an infra component).
- Reproduction steps — minimal, ideally a curl or a small script.
- The impact you observed (data exposure, auth bypass, denial of service, etc.).
- Any context that helps us reproduce (workspace ID if applicable, the role you were authenticated as, the browser).
- Whether you'd like to be credited in the fix advisory.

**Please do not exploit the issue beyond what's needed for the proof of concept.** Don't access other workspaces' data, don't run destructive queries against production, and don't share the issue publicly until we've shipped the fix.

## What we support

| Surface                          | Supported versions | Notes                                                                                                              |
| -------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `main` branch                    | Always             | Every merged PR runs the CI security checks.                                                                       |
| Latest tagged release (`vX.Y.Z`) | Always             | Patch updates land on the latest minor.                                                                            |
| Older minors                     | Best-effort        | We'll backport critical security fixes for the most recent minor; older minors may not get fixes. Upgrade-or-fork. |
| Forks                            | Out of scope       | We can advise but don't ship patches to forks.                                                                     |

We follow [semantic versioning](https://semver.org/) once we hit 1.0. Until then, `feat:` bumps the minor and `fix:` bumps the patch — including security fixes.

## Response timeline

| Step                                 | Target time                                                 |
| ------------------------------------ | ----------------------------------------------------------- |
| Acknowledge the report               | within 2 business days                                      |
| Initial triage + severity assessment | within 5 business days                                      |
| Patch on `main` (Critical / High)    | within 14 days of confirmation                              |
| Patch on `main` (Medium / Low)       | within 60 days                                              |
| Disclosure                           | once a patched release is tagged AND deployed to production |

We use [CVSS 3.1](https://www.first.org/cvss/v3.1/specification-document) to rate severity. Critical = remote code execution, auth bypass, mass data exposure. High = single-workspace data exposure, privilege escalation. Medium = limited data exposure with attacker-controlled prerequisites. Low = self-only DoS, missing security header without exploitable impact.

## What's in scope

In scope for vulnerability reports:

- **Auth and session management** — sign-in, create-account, SSO flows (`§3.3`–`§3.5` of the spec). Argon2id/bcrypt with cost ≥ 12 is required; flag anything weaker.
- **Workspace isolation** — any query, API call, or queue job that crosses workspace boundaries (`§6.5`). The SQL console is the highest-risk surface here — promotion to production data should require admin role; sandbox-by-default is enforced by `§8.4`.
- **Rate limiting / cost ceilings** — auth (5 attempts / 5 min per IP, `§3.6`), SQL console (30 s wall time, 100 k row truncation, 10 M row cost-estimate, `§8.4`), exports (50 recipients per schedule, `§5.3.2`).
- **PII handling** — driver names, license numbers, trip routes. Export restricted to admin role; audit log on every admin action (`§6.5`).
- **Dependency vulnerabilities** — flagged automatically by Dependabot but secondary reports welcome.
- **CI / secrets** — anything that could leak `AI_REVIEW_AWS_ROLE_ARN`, `ANTHROPIC_API_KEY`, the Aurora password, or any other repo secret. The OIDC trust relationship on the Bedrock review role is critical.
- **Infrastructure** — IAM policies, security groups, S3 bucket policies, CloudFront cache rules. The `iac` module isn't a separate path in this repo yet, but infra-as-code lives in the deploy workflows (`.github/workflows/deploy-*.yml`).

Out of scope:

- Issues that require physical access to a developer's machine.
- Spam / phishing / social-engineering reports against team members.
- Findings that depend on an outdated browser (the support matrix is the last two stable majors of Chrome, Edge, Firefox, Safari).
- Self-XSS that requires the victim to paste attacker-supplied JavaScript into devtools.
- Theoretical attacks without a proof of concept.

## Coordinated disclosure

Once a patch is merged, tagged, and deployed:

1. We open a public [GitHub Security Advisory](https://github.com/sidious18/ai-template-reference/security/advisories) summarizing the vulnerability, the affected versions, the patched versions, and credit to the reporter (if requested).
2. The fix's commit + PR are linked from the advisory.
3. For Critical-severity issues, we also send a notice through the project's release-notes feed.

We do not request CVE IDs unless the issue is broadly applicable (e.g., a public dependency we maintain). Internal-only fixes ship without a CVE.

## Security tooling already in the repo

- **gitleaks** — secret scanning on every commit (`.husky/pre-commit`) and CI run.
- **Dependabot** — daily dependency updates for npm; PRs auto-open with the vulnerability advisory attached.
- **`pr-title-check`** — every PR has a traceable ticket id (`KAN-\d+`), so post-incident audits can trace any change back to a Jira record.
- **Branch protection on `main`** — 1 review minimum, dismiss stale reviews, conversations resolved before merge, linear history. No direct pushes.
- **AI PR review (Bedrock + Sonnet 4.6)** — Claude posts a sticky review comment with findings grouped by Correctness / Security / Performance / Maintainability. Treat as advisory but read it.
- **OIDC-only AWS access from CI** — no long-lived AWS keys live in repo secrets. Bedrock + deploy workflows assume IAM roles via GitHub's `id-token: write`.

## Hall of thanks

We list confirmed reporters here once their advisory is published. (Empty for now — be the first.)
