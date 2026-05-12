# Testing Guide: Jest

Use this guide for JavaScript/TypeScript testing with Jest.

## Stack Assumptions

- Jest 29+
- TypeScript with ts-jest or @swc/jest
- Testing Library for DOM testing (if applicable)
- MSW for HTTP mocking (if applicable)

## Structure Rules

- Test files co-located with source: `module.test.ts` next to `module.ts`
- Or in `__tests__/` subdirectory: `__tests__/module.test.ts`
- Describe blocks group related tests by function or behavior
- Test names use `it('should ... when ...')` pattern
- Arrange-Act-Assert structure in every test

## Describe / It Structure

    describe('OrderService', () => {
      describe('createOrder', () => {
        it('should create order with valid items', () => { ... });
        it('should throw when items array is empty', () => { ... });
        it('should calculate total from item prices', () => { ... });
      });
    });

- Nest `describe` blocks for grouping — max 2 levels deep
- Each `it` block tests one behavior
- Avoid logic (if/for) inside tests — separate into parametrized cases

## Mock Rules

- Mock external dependencies (HTTP, database, file system) — not internal modules
- Use `jest.mock()` for module-level mocking
- Use `jest.spyOn()` for partial mocking
- Clear mocks between tests: `afterEach(() => jest.restoreAllMocks())`
- Prefer dependency injection over `jest.mock()` when possible
- Type mocks properly: `jest.mocked(dependency)` for TypeScript

## Async Rules

- Use `async/await` in tests — not callbacks or `.then()`
- Test rejected promises with `await expect(...).rejects.toThrow()`
- Use `jest.useFakeTimers()` for time-dependent tests
- Advance timers explicitly: `jest.advanceTimersByTime(1000)`
- Restore real timers in `afterEach`

## Snapshot Rules

- Use snapshots for structural output (rendered HTML, serialized data)
- Review snapshot diffs in code review — do not blindly update
- Keep snapshots small — snapshot a component subtree, not the entire page
- Prefer inline snapshots (`toMatchInlineSnapshot()`) for small values
- Do not snapshot dynamic data (timestamps, random IDs) — it causes false failures

## Coverage Rules

- Target 60-70% line coverage from targeted strategy — not 100%
- Cover: business logic, utilities, error paths, edge cases
- Skip: trivial getters, configuration, type-only files
- Use `--collectCoverageFrom` to focus on source, not test files

## Workflow

1. Write a failing test
2. Implement the minimum code to pass
3. Refactor
4. Run `jest --watch` during development
5. Run full suite before committing

## Self-Check

1. Tests describe behavior, not implementation
2. External dependencies mocked — internal modules tested through public API
3. Async tests use async/await — no unhandled promises
4. Mocks restored between tests
5. Snapshots are small and reviewed
6. No logic (if/for) inside test bodies
