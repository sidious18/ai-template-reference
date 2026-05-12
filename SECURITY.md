# Security Policy

## Reporting a Vulnerability

If you believe you have found a security vulnerability in **fleet-operations**, please report it privately. Do **not** open a public GitHub issue or discussion.

- **Preferred channel**: open a [private vulnerability report on GitHub](https://github.com/sidious18/ai-template-reference/security/advisories/new). This opens a coordinated-disclosure thread visible only to maintainers and you.
- **Backup channel**: email the Security Engineer (the team can name a specific person; default contact is the Tech Lead listed in `ai-instructions/configure.json`). Subject line: `fleet-operations security report — {one-line summary}`.

Please include:

1. A clear description of the vulnerability and its impact.
2. Reproduction steps (proof-of-concept code is welcome).
3. The version, commit SHA, or deployment environment where you observed it.
4. Any relevant logs, request/response captures, or screenshots.

We aim to acknowledge new reports within **2 business days** and to issue an initial impact assessment within **7 calendar days**. The disclosure timeline depends on severity; critical issues are coordinated with you and patched as soon as a fix is verified.

## Supported Versions

The project is pre-1.0. Only the latest release on `main` is supported with security fixes. Once 1.0 ships, the most recent two minor versions will receive backports for at least 6 months.

| Version | Supported |
|---|---|
| `0.x` (pre-1.0) | ✅ latest tagged release only |

## Disclosure Policy

We follow **coordinated disclosure** with a default 90-day public-disclosure deadline from the date of acknowledged report, extendable by mutual agreement when a fix is in progress. The advisory will credit the reporter unless you ask to remain anonymous.

We will **not** pursue legal action against good-faith security researchers who:

- Avoid violating user privacy or destroying data,
- Avoid degrading service availability for other users,
- Give us a reasonable window to remediate before publishing,
- Do not exploit the issue beyond what is necessary to demonstrate it.

## In-Product Security Posture

These are the security properties the team commits to maintain. Reviewers and the security-engineer role check each PR against them; report any regression.

### Authentication & sessions

- Passwords hashed with **Argon2id** (or bcrypt with cost ≥ 12) — never reversible, never logged.
- Session tokens expire after **30 days** of inactivity with "Stay signed in", **8 hours** otherwise.
- Failed sign-ins **rate-limit per IP** after 5 attempts in 5 minutes (HTTP 429).
- SSO supports **SAML 2.0** and **OpenID Connect**. Workspace slugs are 3–32 chars, lowercase ASCII + hyphens, and validated at creation time.
- All form submissions are over **HTTPS only**. HSTS is set with `includeSubDomains; preload`.

### Authorization

- Workspace data is fully isolated; every database query is scoped by `workspace_id` and enforced at the API layer (no client trust).
- In-product roles (Admin / Analyst / Manager / Viewer) gate access per the matrix in `docs/requirements/fleet_operations_spec.md` §6.6. The matrix is the source of truth; backend permission checks reference it.
- The SQL console is **read-only**. `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, and `TRUNCATE` are blocked at the API layer before reaching ClickHouse — not via a database role grant alone.
- New workspaces start in **sandbox mode**. Promotion to production data is an admin-only, irreversible action.

### Data handling

- **PII** (driver names, license numbers) is export-restricted to the Admin role. Exports are logged in the audit log with the requesting user, time, and row count.
- Soft deletes with a **30-day retention** before hard delete. The retention window is enforced by a scheduled job; admins can extend per-record on legal hold.
- All times stored as UTC; display in user's workspace timezone.
- All admin actions (user invites, role changes, deletions, schedule edits) are written to the audit log with actor, target, and timestamp.

### Operational guardrails

- Secrets never live in the repo. **gitleaks** runs as a pre-commit hook and in CI (workflow `secret-scan` in `.github/workflows/ci.yml`). False positives are added to `.gitleaks.toml`'s allowlist with a comment.
- Dependabot opens daily PRs for `src/backend/`, `src/frontend/`, and `.github/`. Critical-severity advisories are merged within 7 days.
- Production deploys require an Admin's manual approval via the GitHub `environment: production` gate.
- The SQL console kills queries at **30 s** wall time and truncates result sets above **100k rows** with a banner.

If you spot a place where these promises are not kept by the code, that's a bug — please report it.
