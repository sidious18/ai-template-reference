# TypeScript Conventions

Applies to both `src/backend/` (Node + Express) and `src/frontend/` (React). Anything beyond what's here is reviewer discretion.

## Tooling

| Tool | Purpose | How to run |
|---|---|---|
| **Prettier** | Formatting | `npm run format` (write) / `npm run format:check` (CI) |
| **ESLint** | Linting + safety rules | `npm run lint` / `npm run lint:fix` |
| **tsc --noEmit** | Type checking | `npm run typecheck` |
| **vitest** | Unit + integration tests | `npm test` |
| **supertest** | HTTP integration tests (backend) | invoked from vitest |
| **Playwright** | End-to-end (frontend) | `npm run test:e2e` |

Every tool is runnable both locally and from the pre-commit / pre-push hooks. CI runs the same commands — no special CI-only flags.

## tsconfig.json

Both modules extend a strict baseline:

```jsonc
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "useUnknownInCatchVariables": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "moduleResolution": "bundler"
  }
}
```

`exactOptionalPropertyTypes` and `noUncheckedIndexedAccess` catch real bugs; do not weaken them. If you need to opt out for a single line, comment-narrow rather than disabling globally.

## Naming

| Thing | Convention | Example |
|---|---|---|
| Files (modules) | `kebab-case.ts` | `driver-scoring.ts` |
| React components | `PascalCase.tsx` + colocated `PascalCase.module.css` | `WidgetPicker.tsx` |
| Hooks | `useThing.ts` | `useDashboardLayout.ts` |
| Types & interfaces | `PascalCase`, no `I` prefix | `WidgetSpec`, not `IWidgetSpec` |
| Classes | `PascalCase` | `DashboardLayoutStore` |
| Functions | `camelCase` | `computeDriverScore` |
| Constants (true constants) | `SCREAMING_SNAKE_CASE` | `MAX_LAYOUT_NAME_LENGTH` |
| CSS variables | `--kebab-case` (matches mockup) | `--text-info` |
| Test files | `*.test.ts` (unit), `*.spec.ts` (integration), `*.e2e.ts` (Playwright) | `driver-scoring.test.ts` |

## Imports

- Absolute imports from `@/` (configured per module). No `../../../` chains.
- Group order: built-in / external / internal / relative — Prettier's import-sort plugin enforces this.
- Type-only imports use `import type { ... }` to keep build output small.

## Error handling

- Errors propagate by **throwing** typed error classes, not by returning `Result` tuples. The Express error-middleware (backend) and the React error-boundary (frontend) catch and translate.
- The shared error hierarchy lives at `src/backend/src/errors/` for the API and `src/frontend/src/errors/` for the UI. Each error class carries the HTTP status (backend) or the user-facing recovery action (frontend).
- **Never catch silently.** Every `catch` must either re-throw, log with the structured logger, or return a user-visible recovery state. A bare `catch (e) {}` blocks fail review.
- `console.error` is for emergencies before the logger is initialized; everywhere else, use the logger (`src/backend/src/logger.ts` / `src/frontend/src/logger.ts`).

## Async patterns

- `async`/`await` everywhere — no raw promise chains in production code.
- Concurrent independent work uses `Promise.all` or `Promise.allSettled`; never await in a `for` loop unless the order matters.
- Abortable network operations pass an `AbortSignal`. The frontend's fetch wrapper threads the signal through automatically; backend HTTP clients accept it as the last argument.

## Testing

- **Unit tests** colocated next to source (`foo.ts` ⇄ `foo.test.ts`).
- **Integration tests** under `src/{backend|frontend}/tests/integration/`.
- **End-to-end** under `src/frontend/tests/e2e/` (Playwright). Only the frontend module owns e2e — the backend is exercised through the running app.
- **Coverage target**: ≥ 80% on changed files. CI reports per-PR delta.
- Tests use real adapters for I/O (`supertest` for HTTP, Testcontainers for Postgres, the running ClickHouse instance for analytics queries). Mocks are reserved for time, randomness, and external paid APIs.
- The describe-block layout: `describe('SomethingUnderTest', () => { describe('when <condition>', () => { it('<does the thing>', () => { ... }) }) })`.

## Patterns to prefer

- **Discriminated unions over runtime type checks.** `type Result = { kind: 'ok'; value: T } | { kind: 'err'; error: E }` — switch on `kind` and TypeScript exhaustiveness checks the rest.
- **Brand types** for IDs that should not be interchangeable: `type WorkspaceId = string & { readonly __brand: 'WorkspaceId' }`. Catches the "passed a `driverId` where a `workspaceId` was expected" bug at compile time.
- **Zod schemas at every boundary** (HTTP request bodies, message payloads, env-var loading). Parsing happens at the edge; internal code receives narrowed types.
- **Pure functions for business logic.** Side effects (database, network, time) belong in thin adapters at the edge of the module. Test the pure core with vitest's snapshot or table tests.
- **Const assertions** for enum-like sets that should be exhaustive: `const widgetMinSizes = { ... } as const`.

## Anti-patterns (don't do this)

- **`any`** in production code. Use `unknown` and narrow.
- **`as` casts** that aren't backed by a runtime check (e.g., `parsed as User` when `parsed` is a JSON of unknown shape). The exception is the result of a zod `.parse()` — that's safe.
- **Mutating function arguments.** Treat parameters as immutable; return a new value if you need to "change" something.
- **Default exports** for anything that isn't a React component. Named exports survive renames and grep better.
- **Magic numbers** in business logic. Pull constants up to a `const` with a name.
- **Long parameter lists.** > 4 positional parameters → wrap them in an options object.
- **Generic abstractions for one caller.** Resist the urge to make something configurable "for the next time we need it" — that next time often never comes. Three concrete copies beat a premature abstraction.

## PR checklist for TypeScript changes

- [ ] Prettier + ESLint clean (`npm run format:check && npm run lint`).
- [ ] `npm run typecheck` passes — no `// @ts-ignore` / `// @ts-expect-error` without a `TODO(KAN-N)` ticket comment.
- [ ] New or changed code is tested. Coverage delta on the PR is not negative.
- [ ] No new `any`. Zod schemas in place at the API boundary if a new endpoint or worker was added.
- [ ] Public exports have explicit return types.
- [ ] If touching the dashboard render path: re-confirmed the first-paint perf target locally.
- [ ] If touching auth / PII / audit-log: cross-checked the SECURITY.md promises.
