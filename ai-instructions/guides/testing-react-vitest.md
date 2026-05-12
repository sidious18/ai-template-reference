# Testing Guide: Vitest + React Testing Library

Apply this guide when the project uses Vitest, React Testing Library, or a
similar frontend testing stack.

## Core Philosophy

Tests are the long-term memory of AI-assisted development.

Without tests, behavior drifts across sessions and refactors. Good tests also
shape better APIs because they force you to think from the consumer's point of
view before implementation exists.

Rule: tests are not optional for meaningful behavior changes.

## TDD Workflow

### RED

1. Read the requirement or acceptance criteria.
2. Write a test that describes the expected behavior.
3. Run it and confirm it fails.
4. Do not write implementation yet.

### GREEN

1. Write the minimum code needed to pass.
2. Do not add unrelated logic while making the test pass.
3. Run the tests and confirm the new behavior is green.

### REFACTOR

1. Clean up the implementation.
2. Run tests after each change.
3. Keep behavior stable unless the public contract changed intentionally.

## What To Test

Full coverage:

- Zustand stores
- Utilities with branching logic
- Custom hooks with behavior
- File operation hooks
- Shared UI components

Snapshot-oriented coverage:

- Widget layouts
- Page layouts

Minimal coverage:

- Pure presentational sub-components already covered through parents

Skip:

- CSS class names
- Purely visual details
- Implementation internals that are not part of the public contract
- Trivial one-liners with no meaningful branches

## Coverage Targets

Use targeted coverage, not vanity coverage:

- Full for shared UI, stores, hooks, and utilities
- Snapshots for widgets and pages
- Minimal for pure presentation

Target roughly **60 to 70 percent** line coverage through high-value
tests rather than chasing 80+ percent with low-signal assertions.
(Same range as the Jest guide — the test runner is interchangeable;
the coverage philosophy isn't.)

## Test Structure

File placement:

- Next to the source file, or
- Inside an adjacent `__tests__` folder

Naming:

- `[unit-name].test.ts`
- `[component-name].test.tsx`

Structure:

- `describe(unit)`
- `describe(method or scenario)`
- `it(behavior sentence)`

Use Arrange, Act, Assert in each test.

## Query And Interaction Rules

Preferred query order:

1. `getByRole`
2. `getByLabelText`
3. `getByText`
4. `getByTestId` as a last resort

Interaction rules:

- Use `userEvent`, not `fireEvent`
- Prefer accessible queries and names
- Use async assertions for async UI changes

## Mocking Rules

- Mock heavy libraries in unit tests
- Mock external boundaries rather than internal implementation details
- Do not import one test file from another
- Keep tests independent and free of shared mutable state

## Practical Rules

- Write readable test names
- Keep each test focused on one logical behavior
- Test consumer-visible behavior, not variable names or internal wiring
- Add regression coverage when fixing bugs

## Cost Guidance

Test code can become a significant portion of codebase cost. Avoid two expensive
failure modes:

1. Tests coupled to implementation details
2. Tests for trivial code that do not prevent real bugs

Targeted, behavior-focused coverage usually preserves most of the confidence at
far lower maintenance cost.
