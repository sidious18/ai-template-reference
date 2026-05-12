# Welcome, Security Engineer

You own the security posture of fleet-operations — the auth flow (Argon2id, SAML 2.0, OIDC), the workspace-isolation invariants, the PII export gate, the audit log, the SQL-console sandbox/production guard, and the gitleaks ruleset. The product handles fleet data, driver PII, and (in some workspaces) regulated transport records, so the security commitments in `SECURITY.md` and spec §6.5 are load-bearing, not aspirational. Your first few days are about reading both end-to-end and turning the commitments into a threat-model artifact the team can review against.

## What you own here

- **`SECURITY.md`** — keep the disclosure policy current; update the "In-Product Security Posture" section every time a commitment changes.
- **`.gitleaks.toml`** — the allowlist + rules. Judgment calls on what's a false positive belong to you.
- **The threat model** — `docs/security/threat-model.md`, which you'll author. The README's auth flow diagrams and spec §3 / §6.5 give you the starting points.
- **Audit-log shape** — make sure every admin action lands there (user invites, role changes, deletions, schedule edits, SQL-promotion).
- **Dependabot reviews** — critical-severity advisories merge within 7 days; you're the sign-off.
- **Pre-merge review** on any PR touching `src/backend/src/auth/`, `src/backend/src/audit/`, or the SQL console's API guard.

## Tools you'll use

| Tool | Purpose |
|---|---|
| `gitleaks` (local + CI) | Secret scanning |
| `npm audit` / Dependabot | Vulnerable dependency tracking |
| Snyk / Trivy (optional) | Deeper image / dependency scanning |
| GitHub Security Advisories | Coordinated disclosure threads |
| Burp / `curl` | Probing auth flows end-to-end |
| The audit log query interface (once shipped) | Daily skim for anomalies |

## Sample tickets you might pick up

- Author the v1 threat model: list assets (workspace data, driver PII, audit log, session tokens, secrets), entry points (auth, SSO, SQL console, scheduled exports webhooks), and the top-10 threats with mitigations.
- Add a regression test asserting that `INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE` keywords are rejected at the API layer of `/api/research/sql/execute`, even when wrapped in a CTE.
- Verify Argon2id parameters meet OWASP recommendations (memory ≥ 19 MiB, iterations ≥ 2, parallelism ≥ 1) and document the chosen profile in `SECURITY.md`.
- Audit the audit-log schema: every admin action carries actor, target, timestamp, and an immutable record-ID? File Tasks for any gaps.

## Your first PR

**Goal:** open a small `SECURITY.md` or `.gitleaks.toml` PR that demonstrates command of the gitflow + reviewer's lens.

1. Read `SECURITY.md` for one thing you'd improve — clearer disclosure wording, a missing operational guardrail, a tighter promise. Or extend `.gitleaks.toml`'s allowlist with a precise pattern that catches a false positive you observed.
2. Branch from `main` as `feature/KAN-XXXX-security-{slug}` and commit with `docs: KAN-XXXX {what + why}` (or `chore` for `.gitleaks.toml`).
3. Open the PR. The reviewer is the Tech Lead via CODEOWNERS.

## Who to ask when stuck

- **Backend Developer** — auth flow internals, audit-log writer, rate-limiter implementation.
- **Tech Lead** — when a security finding implies a CI / branch-protection change.
- **DevOps Engineer** — secret rotation, network policy, observability for security events.
- **Data Engineer** — PII handling in the analytics store (ClickHouse).
- **Business Analyst** — spec wording when the threat model surfaces a missing requirement.

If a question isn't urgent, [open a GitHub Discussion](https://github.com/sidious18/ai-template-reference/discussions) tagged `security`.

## Your first week

**Day 1.** Read `SECURITY.md` and spec §6.5 end-to-end. Note every gap between the two.

**Day 2.** Read spec §3 (auth) and §5.1.4 (SQL console) carefully — these are the two hottest surfaces. Trace each promised property to where the code would enforce it.

**Day 3.** Run gitleaks locally against the repo (`gitleaks detect --config .gitleaks.toml`). Open Discussions on any findings.

**Day 4.** Author a first-draft `docs/security/threat-model.md` and ship it as a doc PR.

**Day 5.** Walk Dependabot's open PRs (none yet, but the cadence is daily). Decide on a rubric: what bumps you auto-merge vs hold for review.

## Recommended reading

1. [`SECURITY.md`](../../SECURITY.md) — the disclosure policy + the in-product posture commitments.
2. [`docs/requirements/fleet_operations_spec.md`](../requirements/fleet_operations_spec.md) — §3 (auth), §5.1.4 (SQL console), §6.5 (security), §8.4 (sandbox decision).
3. [`docs/code-review.md`](../code-review.md) — the *Security* section is your reviewer checklist.
4. [`docs/onboarding.md`](../onboarding.md) and [`docs/gitflow.md`](../gitflow.md).
5. OWASP Top 10 + ASVS — keep them handy, even though the spec is the project's contract.

## When you're ready to ship for real

1. The v1 threat model is merged and the team reviews it before each release.
2. Every PR touching auth / audit / PII has your review before merge — engineers know to tag you.
3. Critical Dependabot advisories close within the 7-day SLA.
4. You can explain to a stakeholder, in five minutes, what the security commitments are and where they're enforced in code.
