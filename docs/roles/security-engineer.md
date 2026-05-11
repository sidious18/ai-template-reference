# Welcome, Security Engineer

You own the security posture of fleet operations. The product handles PII (driver names, license numbers, trip routes) and runs analytics workloads against multi-tenant data — both areas where a vulnerability has real impact. Five invariants in particular are yours to defend: workspace isolation (§6.5), Argon2id / bcrypt cost ≥ 12 (§3.6), audit log on every admin action (§6.5), rate-limit + cost-ceiling on the auth + SQL surfaces (§3.6, §5.1.4, §8.4), and PII export restricted to admin role (§6.5).

## What you own here

The auth code paths in `src/backend/auth/` (Argon2id verification, SAML 2.0 signature validation, OIDC id_token validation). The audit log in `src/backend/audit-log/` — every admin endpoint adds a log entry with actor / target / before / after. The rate-limit infrastructure (Redis `INCR` + TTL — both for auth attempts and for the SQL-console cost ceiling). The IP-rate-limit on sign-in (§3.6 — 5 attempts / 5 min per IP).

You also own the gitleaks ruleset (`.gitleaks.toml`) and the security-related GitHub Actions configuration. Where IaC lives (eventually), you'll review IAM policies, security-group rules, S3 bucket policies.

## Tools you'll use

| Tool                       | Purpose                                                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `gitleaks`                 | Pre-commit + CI secret scan. Falsely-flagged patterns go to `.gitleaks.toml`'s allowlist.                                |
| AWS Secrets Manager        | Where production secrets live; rotation policies are yours.                                                              |
| `axe-core`                 | Used by QA; you'll co-own the rules that flag security-adjacent UX (clear copy on session timeout, clear lock-out copy). |
| GitHub Security Advisories | Where private vulnerability reports come in — see [SECURITY.md](../../SECURITY.md).                                      |

## Sample tickets you might pick up

- "Implement the audit-log entry for `POST /api/admin/promote-workspace-to-production` (the SQL console sandbox → production gate per §8.4)."
- "Add a regression test that fails if the workspace-scoping guard is removed from `src/backend/dashboard/dashboard.controller.ts`."
- "Audit the SAML guard's signature-validation path against the recorded test fixture from `ai-instructions/requirements/` (when one is added)."
- "Review the new `payment_provider` integration in `src/backend/billing/` for PII exposure (out-of-scope today; comes online in v1.2)."

## Your first PR

> **Goal**: add or strengthen one rate-limit-related test.
>
> 1. From `src/backend/`, find `auth/rate-limit.service.ts` (or wherever the IP rate limit lives).
> 2. Add a test: 5 failed sign-ins within 5 minutes → 6th returns 429. After 5 minutes, the counter resets.
> 3. Branch: `feature/KAN-XXX-test-auth-rate-limit` (real ticket).
> 4. Commit: `test: KAN-XXX add IP rate-limit regression for §3.6 lockout`.
> 5. PR per the template.

## Who to ask when stuck

- **Tech Lead** — when a security invariant requires an architecture change.
- **Backend Developer** — implementation details where the auth / SQL / audit code lives.
- **DevOps Engineer** — IAM scoping, OIDC trust, secrets rotation.
- **DB Architect** — RLS policies, schema-level isolation enforcement.

[Private security advisory](https://github.com/sidious18/ai-template-reference/security/advisories/new) for inbound reports. [GitHub Issues](https://github.com/sidious18/ai-template-reference/issues) `question` tag for anything else.

## Your first week

> **Day 1.** Read [`SECURITY.md`](../../SECURITY.md) and [`docs/requirements/fleet_operations_spec.md`](../requirements/fleet_operations_spec.md) §3.6 + §6.5 + §8.4.

> **Day 2.** Walk the auth surfaces hands-on. Try sign-in with bad creds 5 times in a row from your dev environment — confirm the lockout fires.

> **Day 3.** Audit `.gitleaks.toml` allowlist entries. The current entries are for the fleet mockup HTML's placeholder credentials; confirm nothing legit is leaking through.

> **Day 4.** Walk the audit log surface — find every `@audit-required` annotation (or its equivalent). Note any admin endpoints without an audit entry.

> **Day 5.** First real ticket: a regression test or a policy doc.

## Recommended reading

1. [`SECURITY.md`](../../SECURITY.md).
2. [`docs/requirements/fleet_operations_spec.md`](../requirements/fleet_operations_spec.md) §3.6 (auth requirements), §5.1.4 (SQL console security), §6.5 (security), §8.4 (sandbox rationale).
3. [`docs/code-review.md`](../code-review.md) §2 (Workspace isolation) and §3 (Security).
4. SAML 2.0 spec (skim, refer when reviewing SAML code): <https://docs.oasis-open.org/security/saml/v2.0/saml-core-2.0-os.pdf>
5. OWASP ASVS Level 2 — the checklist this product is designed to clear.

## When you're ready to ship for real

1. Every admin endpoint has an audit-log entry; you can prove it via a test that fails if the entry is removed.
2. The rate-limit lockout fires under a load test, not just a unit test.
3. The `.gitleaks.toml` allowlist has zero entries you can't justify.
4. You can describe the workspace-scoping guard's enforcement points (controller-layer guard + repository-layer filter + Aurora RLS) in three bullets.
