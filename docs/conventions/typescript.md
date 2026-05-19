# TypeScript Conventions

This document is the human-readable bar for TypeScript on Fleet Operations. The AI guides under `ai-instructions/guides/` go deeper; this page is what to skim before opening a PR. Both `src/backend/` and `src/frontend/` are TypeScript in strict mode — the rules below apply to both unless explicitly scoped.

## Tooling

| Concern | Tool | Local command | When it runs in CI |
|---|---|---|---|
| Formatter | Prettier | `npm run format` (repo root, formats every TS/Svelte/JSON/MD/YAML file) | Staged files via lint-staged on `pre-commit` |
| Linter | ESLint | `npm --prefix src/backend run lint` / `npm --prefix src/frontend run lint` (or `npm run lint` from the root to run both via workspaces) | `lint` job on every PR; same command as locally |
| Type checker | `tsc --noEmit` (and `svelte-check` on the frontend) | `npm --prefix src/backend run typecheck` / `npm --prefix src/frontend run typecheck` (or `npm run typecheck` from the root) | `typecheck` job on every PR; runs on `pre-push` against changed files only |
| Test runner — unit | Vitest | `npm --prefix src/backend test` / `npm --prefix src/frontend test` (or `npm test` from the root) | `test` job on every PR |
| Test runner — e2e | Playwright | `npm --prefix src/frontend run test:e2e` (after `npx playwright install chromium` once) | `test` job on every PR (or split into its own `e2e` job once the suite warrants it) |

Every tool above is runnable both locally and from the pre-commit / pre-push hook. If a tool runs in CI but not locally — or vice versa — that's a bug to file.

## Naming

- **Files and directories** — lowercase-hyphen. `user-profile.ts`, `dashboard-grid/`. Never `userProfile.ts` or `UserProfile/`.
- **Modules** — the entry path uses the directory name (e.g. `src/backend/src/analytics/`). One default export per file is fine when the file *is* the thing it exports; otherwise prefer named exports.
- **Classes / Types / Interfaces** — `PascalCase`. `WorkspaceMember`, `WidgetConfig`, `SqlConsoleQueryResult`. Don't prefix interfaces with `I` (`IUser` is banned).
- **Functions / variables / parameters** — `camelCase`. `getActiveWorkspace`, `parseWidgetLayout`. Boolean variables and predicates start with `is` / `has` / `should` / `can`: `isAdmin`, `hasUnsavedChanges`, `shouldRetry`.
- **Constants** — `SCREAMING_SNAKE` only for module-scope literal constants whose meaning is the value (`MAX_WIDGETS_PER_LAYOUT = 12`). `camelCase` is fine for configured values read once at boot.
- **Type vs interface** — prefer `type` for unions, intersections, and shape-only aliases; reach for `interface` only when you need declaration merging (rare).
- **Test files** — colocate as `{module}.test.ts` next to the source. Playwright e2e specs live under `src/frontend/tests/e2e/` as `{flow}.spec.ts`.

## Error Handling

- **Errors propagate**. Don't catch unless you have something specific and correct to do — log + rethrow is rarely the answer. The default at the framework boundary (Express error handler / SvelteKit `handleError`) is to log and return a sanitized response.
- **Never catch silently.** `catch (e) {}` and `catch (_) { return null }` fail review. If you need to ignore an error, document *which* error and *why* in one line.
- **Use error subclasses for domain failures.** A `WorkspaceIsolationError`, a `RateLimitedError`, a `SqlConsoleSandboxViolation` — each one carries the failure semantics in its type and can be caught precisely upstream. Don't throw bare `Error("...")` for anything an HTTP handler will need to map to a specific status.
- **No `any` in caught errors.** TypeScript types caught errors as `unknown`. Narrow before reading: `if (error instanceof Error) ...` or a tagged guard.
- **Logging pattern.** One structured log per error at the place that catches it — never a chain of logs along the call stack. Log shape: `{ level, msg, error: { name, message, stack }, context: {...} }`. Use `pino` on the backend.
- **Promises and async.** Every `await` is in a function where the caller will surface the failure. Bare unawaited promises (`fireAndForget()` without `void`) are banned — either `await`, or `void fn()` with an inline comment explaining why ignoring the outcome is safe.

## Testing

- **What to test.** Unit tests cover pure logic (analytics utilities, parsers, validators, reducers). Integration tests cover the boundaries (HTTP routes against an in-process server with a real Postgres test instance and a Redis flush between tests). E2e tests cover golden-path user flows in Playwright (auth, dashboard grid composition, one tool per research-workspace category).
- **Coverage target.** No fixed line-coverage gate — coverage is reported, regressions reviewed. The QA Engineer can introduce a gate once the baseline stabilizes; until then, *cover the constraints* in the spec's *Key Constraints* section (workspace isolation, rate limits, SQL-console sandbox, performance budgets) rather than chasing a percentage.
- **Naming and layout.** Test files live next to source: `parser.ts` + `parser.test.ts`. Inside the file, group related cases under `describe`; use `it.each` for table-driven tests. Use Playwright's `test.describe` blocks similarly for e2e.
- **Fixtures.** Prefer typed factory functions (`makeWorkspace({ overrides })`) over flat JSON fixtures — they survive type changes without ceremony. Numeric fixtures for analytics tests should cite their source (NIST, textbook page, paper) in a comment.
- **Flake.** Flaky tests are bugs, not noise. Don't `retry: 3` your way around a race. The QA Engineer owns flake triage; flag flakes via a `qa-flake` Jira label.

## Patterns to Prefer

- **`const` over `let`.** Reassignment is rare; `let` is a signal to the reader that this variable changes — make it true.
- **Tagged unions over enums** for finite domain states (`type WidgetState = { kind: 'empty' } | { kind: 'selecting'; cells: CellRange } | { kind: 'configured'; widget: WidgetConfig }`). Enums in TypeScript are weirder than they look; tagged unions exhaust nicely under `switch`.
- **Exhaustive `switch`** with `assertNever(x: never): never` in the default branch. The compiler will flag any unhandled case at the source of truth.
- **`readonly` everywhere it's true.** Function parameters that the function shouldn't mutate are `readonly T[]` / `Readonly<T>`. Internal state that the runtime won't change is `readonly`.
- **Branded types** for IDs that travel as strings — `type WorkspaceId = string & { readonly __brand: 'WorkspaceId' }`. Catches "passed the user ID where the workspace ID was expected" at compile time.
- **`zod` (or similar) for runtime validation at boundaries.** API request bodies, env vars, parsed query strings — anything entering the program from the outside is parsed through a schema. Inside the program, trust your types.
- **Pure functions where you can.** Analytics utilities, parsers, reducers — keep them free of `Date.now()`, `Math.random()`, `process.env`. Injection at the boundary makes tests trivial.
- **One reason to change per file.** A file that does HTTP routing and database access and validation and rendering is a refactor in waiting.

## Anti-Patterns (these fail review)

- **`any`.** Including implicit `any` (no annotation on an untyped value). Pull the type from the source, write the type yourself, or use `unknown` and narrow.
- **`@ts-ignore` / `@ts-expect-error` without a one-line reason.** And `@ts-ignore` without a follow-up ticket linked is grounds for a request-changes review. Use `@ts-expect-error` over `@ts-ignore` — it fails when the underlying issue is fixed, reminding you to delete it.
- **Type assertions over actual typing.** `as Foo` is a last resort, not a workaround. Especially banned: `as any`, `as unknown as Foo`.
- **Mutating function parameters.** Even when the type system allows it, mutate a copy.
- **Untyped catch blocks** that read `e.message` without narrowing.
- **Console.log / console.error in shipped code.** Use the project logger; `console.*` slips past structured-logging pipelines.
- **Side effects in module top-level.** No `someClient.connect()` at import time. Construct lazily; initialize from an explicit entry point.
- **Duplicated literal strings** for things the type system should track. Status codes, event names, table names — put them in a single source.
- **A test that has to be retried to pass.** Fix the race; don't paper over it.
- **A function returning `Promise<void>` that's invoked without `await` or `void`.** ESLint rules flag this; don't disable the rule.

## PR Checklist for this Language

Before opening or approving a TypeScript PR, confirm:

- [ ] `npm run format` produces no diff.
- [ ] `npm run lint` is clean (no warnings, no rule-disable comments without a one-line reason and a follow-up ticket).
- [ ] `npm run typecheck` is clean — no implicit `any`, no `@ts-ignore` without justification.
- [ ] Unit tests added / updated for the logic that changed. New analytics utilities have at least one fixture-backed test.
- [ ] No new `any`. Audit `as` casts the diff introduces.
- [ ] Public functions exported from a module are documented (one-line JSDoc with the *why*, not the *what* — the type already says what).
- [ ] If the change touches a constraint from the spec (workspace isolation, rate limit, SQL-console sandbox, performance budget), there's a regression test that would have caught the broken version.
