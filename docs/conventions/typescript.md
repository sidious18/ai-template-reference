# TypeScript Conventions

These are the rules every TypeScript file in this repo is held to in review. The pre-commit hook runs Prettier + ESLint on staged files; the pre-push hook runs the full lint + typecheck across both workspaces. CI runs the same. Read this before your first PR.

## Tooling

| Tool                     | What it does   | Command                                                      |
| ------------------------ | -------------- | ------------------------------------------------------------ |
| Formatter                | Prettier       | `npm run format` (auto-fix), `npm run format:check` (verify) |
| Linter                   | ESLint         | `npm run lint --workspace src/{backend,frontend}`            |
| Type checker             | `tsc --noEmit` | `npm run typecheck --workspace src/{backend,frontend}`       |
| Unit + integration tests | Vitest         | `npm run test --workspace src/{backend,frontend}`            |
| End-to-end tests         | Playwright     | `npm run test:e2e --workspace src/frontend`                  |

Every tool is runnable locally and from the pre-commit hook (`.husky/pre-commit` → lint-staged). If a tool runs only in CI, it's a bug — open a Jira ticket.

## tsconfig settings (both workspaces)

- `strict: true`
- `noUncheckedIndexedAccess: true`
- `exactOptionalPropertyTypes: true`
- `noImplicitOverride: true`
- `noFallthroughCasesInSwitch: true`
- `useDefineForClassFields: true`

These match the template defaults. Anything looser requires a Tech Lead approval and a comment explaining why.

## Naming

- **Files and directories** — lowercase, alphanumeric + hyphen. `driver-scoring.service.ts`, `cohort-grid/`, not `DriverScoring.ts` or `cohortGrid/`. No `Utils.ts` or `helpers/` — name the file for _what it does_.
- **Types and interfaces** — PascalCase. `Driver`, `WidgetMinSize`, `ForecastModel`.
- **Constants** — `SCREAMING_SNAKE_CASE` for true module-level constants; `camelCase` for everything else. Module-level `export const apiBase = '/api'` is `apiBase`, not `API_BASE` (it's an exported value, not a magic-number constant).
- **Variables and functions** — `camelCase`. Boolean variables and functions start with `is`, `has`, `can`, `should` — `isSandbox`, `hasAdminRole`, `canPromoteWorkspace`.
- **React components** — PascalCase file name + default export. `DashboardEmptyState.tsx` exports `DashboardEmptyState`.
- **Enums** — avoid; prefer string-literal unions (`type WidgetKind = 'kpi' | 'trend' | 'bar' | …`). When you must use an enum, prefer `const enum` for performance unless you need runtime introspection.

## Error handling

- Errors propagate. Don't swallow with `catch (e) {}`.
- Throw `Error` subclasses with a meaningful message. In `src/backend/`, use NestJS's exception filter via `throw new NotFoundException(...)`, `BadRequestException(...)`, etc.
- Domain-specific errors get their own class: `WorkspaceMismatchError`, `SandboxRequiredError`, `RateLimitedError`.
- Never log PII. Log `workspace_id` and operation, not driver names or license numbers.
- Use the project logger (`@nestjs/common`'s `Logger` on the backend; a shared `logger` module on the frontend). No `console.log` in production code.

## Workspace isolation

The single most important rule. Every query and every queue job is scoped to a workspace id.

- Repository methods take `workspaceId: WorkspaceId` as the first parameter, not the last.
- The workspace id comes from the authenticated session, never from a request body field. (The session-bound workspace id is the source of truth; a body-supplied id is an attack vector.)
- SQL strings never interpolate the workspace id; they use parameterized queries.
- BullMQ jobs receive `workspaceId` in the payload AND the consumer verifies it against the producer's stored workspace context.
- Where possible, enforce isolation at the schema layer (Postgres RLS). The application-layer scoping is a belt; RLS is the suspenders.

## Testing

- New code has unit tests in Vitest. New components have at minimum a render test.
- Bug fixes ship with a regression test that fails before the fix.
- E2E tests live in `src/frontend/tests/e2e/` and run with Playwright against a built backend + frontend.
- Coverage target: 80% lines on `src/backend/`, 70% on `src/frontend/` (looser on the frontend because UI tests via Playwright cover behavior, not lines).
- Test file naming: `{name}.test.ts` for unit, `{name}.spec.ts` for e2e.
- Use `vi.setSystemTime(...)` for any test that compares dates — CI runs in UTC; your local machine probably doesn't.
- Mocks: use `vi.fn()` for one-off mocks; use a dedicated `__mocks__/` only for cross-test shared mocks (e.g., a fake AuthGuard for backend module tests).

## Patterns to prefer

- **Discriminated unions over optional fields.** When a shape varies by case, model it explicitly:

      type DashboardState =
        | { kind: 'empty' }
        | { kind: 'selecting'; rect: GridRect; pickerOpen: boolean }
        | { kind: 'configured'; widgets: Widget[] };

  Beats a single object with all-optional `rect?`, `pickerOpen?`, `widgets?` fields.

- **Branded types for ids.** `type WorkspaceId = string & { readonly __brand: 'WorkspaceId' };` so a `DriverId` can't be passed where a `WorkspaceId` is expected.

- **Explicit return types on exported functions.** Inferred return types are great inside a module; on the public surface they make refactoring safer.

- **Small functions over comments.** If you'd write `// step 1: do X`, extract `doX()` instead.

- **Zod or class-validator at controller boundaries.** Trust internal callers; validate user input on the way in.

- **`const` over `let`.** `let` is a smell; mutation is a smell; refactoring around them is usually free.

## Anti-patterns (don't do this)

- `any` — never. Use `unknown` if you genuinely don't know the type, and narrow before use.
- `as unknown as Foo` — almost never. Document why if you must.
- Optional chaining as a way to dodge null-checking. `a?.b?.c?.d` masks where the optional really comes from.
- `useEffect` for derived state on the frontend. Use `useMemo` or hoist the logic out of state entirely.
- Comments that describe _what_ the code does. `// loop over drivers` adds nothing — your variable names should already say that. Comments are for _why_ (a hidden constraint, a workaround for a bug).
- Re-exports across module boundaries when not needed. Each module exports from its `index.ts`; consumers import from `'@/auth'`, not `'@/auth/services/auth.service'`.

## PR Checklist for TS files

- [ ] Formatter (`prettier`) clean — no manual formatting decisions.
- [ ] Linter (`eslint`) clean.
- [ ] Types are strict — no `any`, no unsafe casts.
- [ ] Tests added or updated; bug fixes include a regression test.
- [ ] Public functions have explicit return types.
- [ ] Workspace-scoped queries take `workspaceId` first.
- [ ] No PII in logs.
- [ ] No `console.log` in production code.
- [ ] Naming follows the rules above — lowercase-hyphen files, PascalCase types.
- [ ] No new dependency over 50 kB min+gzip without PR justification.
