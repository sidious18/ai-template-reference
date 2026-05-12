# Code Review Checklist

This is the reviewer's working checklist for a fleet-operations PR. It's not a substitute for engineering judgment — it's what to scan for first so the discussion stays on substance.

The author should have run all of this against their own diff before requesting review. Reviewers, if you find something here that the author missed, point at the relevant section so the next PR doesn't repeat the gap.

## 1. Correctness

- The PR description's *Test Plan* actually exercises the changed code paths, including the unhappy path.
- New tests cover the change. If the only test is "the existing suite still passes", ask why a new test wasn't needed.
- Integration tests use a real database wherever the production code does (vitest + Testcontainers for Postgres, ClickHouse running locally). Avoid mocked database round-trips for anything beyond pure unit work.
- The change doesn't silently widen contracts. If an API response shape grows, the consumer in `src/frontend/` is updated in the same PR or a follow-up commit on the same branch.

## 2. TypeScript

- No new `any` anywhere — production code or test code. `unknown` + narrowing is the right reach when typing is genuinely uncertain.
- Strict-mode-friendly: no `// @ts-ignore`, no `// @ts-expect-error` without a `TODO(KAN-N)` comment naming the follow-up ticket.
- Public exports have explicit return types. Inference inside function bodies is fine; at the API surface, write the type out.
- Discriminated unions used where they replace deeply-nested `if`/`else`. The codebase prefers exhaustive `switch` over runtime type checks.

See [`docs/conventions/typescript.md`](conventions/typescript.md) for the full set.

## 3. React (frontend)

- Components stay small. A component over ~200 lines is a smell — usually the JSX wants to split into a sub-component and the state wants to move to a hook.
- Hooks follow the rules: declared at the top level, not inside conditionals or loops; dependency arrays are honest.
- Styling is **CSS Modules colocated** next to the component (`Foo.module.css` next to `Foo.tsx`). No new global classes; no inline `style={}` for anything that could be a class.
- Design tokens live in the shared `tokens.css` (light variant of the variables already in the mockup). Re-using them keeps the dashboard / research surfaces visually consistent.
- Accessibility holds: every interactive element is keyboard-reachable, color is never the only signal (anomaly markers, severity dots, correlation cells all carry text or shape redundancy), and labels are associated with their inputs (`<label htmlFor>`).

## 4. Express + Node (backend)

- Every handler is wrapped by the shared error middleware. Don't write `try / catch` blocks that swallow into a 500 response; throw a typed error and let the middleware translate.
- Inputs are validated with the project's schema library (zod or io-ts — see what the module's existing handlers use) **at the route boundary**, not deep inside business logic.
- Database access goes through the repository layer. Routes don't reach into Drizzle / Prisma / pg directly.
- Every query is scoped by `workspace_id`. Reviewers, ask "where does workspace isolation come from?" on every query you see.
- Logs use the structured logger; no `console.log` in production code paths.

## 5. SQL

- Migrations are reversible (`up` and `down`). New columns are nullable or default-valued so they roll out without downtime. New indexes use `CONCURRENTLY` where the database supports it.
- ClickHouse changes consider write amplification — adding an index on a large `MergeTree` is expensive.
- Read-only SQL surfaces (the SQL console) never expose `INSERT`/`UPDATE`/`DELETE`/`DROP`/`ALTER`/`TRUNCATE` — even via cleverly-constructed CTEs. Confirm the API-layer guard is in place for any new endpoint that takes a SQL string.

## 6. Security

- No secrets in the diff (gitleaks runs in pre-commit and CI, but the human eye catches things rules miss — like a token in a test fixture).
- Auth flow changes touch the `SECURITY.md` promises — read it before approving. Argon2id/bcrypt, rate-limit per IP, session TTLs, SAML/OIDC behaviour.
- PII (driver names, license numbers) flowing into a new export path needs role gating + audit-log entry.
- HTTP responses don't leak server internals (stack traces, raw DB errors, internal IDs unmasked).

## 7. Performance

- Touching anything in the dashboard render path? Confirm the dashboard still hits the *< 1.5 s first-paint with 12 widgets* target. Check the existing perf test; add one if the area has none.
- Touching a research tool? The relevant target from spec §6.1 applies — *< 2 s* preview, *< 5 s* forecast/correlation, *< 30 s* SQL console timeout with progress UI.
- Network: widget data is **batched** (one request returns all data for a layout). New widgets must hook into the same batch, not open their own request.

## 8. Compatibility

- Browser matrix: Chrome, Edge, Firefox, Safari — last two stable majors. No new use of features that fail in any of them. Polyfills via the build tool, not hand-written shims.
- Mobile viewports ≥ 375 px render the read-only dashboard. Editing surfaces are desktop-only — confirm the change respects that and doesn't accidentally enable an editing UI on small screens.

## 9. i18n

- All new UI strings go through the project's translation framework — no hard-coded English. Initial locale set: `en-US`, `en-GB`, `de`, `fr`, `es`.
- Numbers, dates, and currency render through the locale formatter, not `toString()` with hand-formatted separators.

## 10. Observability

- Logs at the right level — `info` for business events, `warn` for recoverable degradations, `error` for unexpected failures. No `debug` left over from local development.
- New metrics use the existing instrumentation library; metric names follow the `{module}_{feature}_{verb}` convention.
- Tracing spans cover any new external call (ClickHouse query, Redis op, SAML/OIDC round-trip).

## 11. Docs

- `docs/onboarding.md`, `docs/gitflow.md`, `docs/conventions/*.md` reflect the new behavior if it changes the developer workflow.
- The relevant Confluence page (Project Overview / Requirements / Technologies / User Roles) is updated. The `/edit-config` command can sync these automatically — use it when the change touches the public-facing spec.
- The CHANGELOG entry will be auto-generated from the commit message — make sure the message reads as user-facing prose, not internal jargon.

## When to escalate

Bring the Tech Lead into the review when:

- The change spans more than one module *and* changes the wire format between them.
- The change touches auth, the SQL sandbox/production guard, the audit log, or any code path that handles PII.
- The change adds a new external service dependency (a new third-party API, a new managed service).
- You disagree with the author about whether something is in scope for v1.

For everything else, normal CODEOWNERS approval is sufficient.
