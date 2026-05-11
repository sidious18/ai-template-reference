Testing Guidelines (Claude / LLM)
Vitest | React Testing Library | TDD | Coverage strategy

These guidelines define the testing philosophy, workflow, and coverage strategy
for AI-assisted frontend development.

---

## Core philosophy

Tests are the AI's long-term memory.

When an AI refactors a component across sessions, it has no memory of previous decisions.
Tests are the only record of "this behaviour must be preserved." Without tests, a change
that breaks an existing feature produces no signal — the AI cannot know it broke something.

Tests also shape better interfaces. Writing a test before the implementation forces the
AI to think about the public API from the consumer's perspective. Awkward APIs are caught
before they are implemented.

Rule: tests are not optional, not an afterthought. The QA role runs alongside
the developer role on every feature — not after.

---

## TDD workflow — RED -> GREEN -> REFACTOR

### RED: write a failing test first

1. Read the requirements or acceptance criteria for the unit
2. Write a test that describes the expected behaviour
3. Run the test — confirm it fails (RED)
4. Do not write implementation code yet

### GREEN: write minimum code to pass

1. Implement the minimum code required to pass the failing test
2. Do not add untested logic while making the test green
3. Run tests — confirm the new test passes (GREEN)
4. Do not refactor yet

### REFACTOR: improve without breaking

1. Refactor the implementation for readability and structure
2. Run tests after every change — all must remain green
3. Do not change test expectations during refactor unless the interface itself changed

---

## What to test and how

### Full unit coverage — test everything

Apply to:
* State stores — all actions, selectors, and state transitions
* Pure utility functions — all branches, edge cases, and error paths
* Custom hooks with logic — all state transitions and handler behaviour
* Parser / serializer — full round-trip coverage
* File operation hooks — success path, error path, cancellation

These areas have high failure density and are cheap to test in isolation.

### Full component coverage

Apply to:
* Shared UI library components (Button, Input, Card, Modal, etc.)
* These are used everywhere — one regression affects the entire app

Test:
* Renders correctly with required props
* Renders all visual variants (primary, secondary, disabled, error)
* Responds to user interactions (click, focus, keyboard)
* Accessibility: aria attributes, role, keyboard navigation

### Snapshot tests

Apply to:
* Widget-level layout components
* Page-level structural layout

Snapshots catch unexpected structural regressions without specifying internals.
Update snapshots intentionally and review the diff in code review.

### Minimal tests

Apply to:
* Pure presentational sub-components with no logic
* Components that are fully covered by their parent's test

### Skip tests

* CSS class names and visual details — breaks on every CSS refactor with no confidence signal
* Implementation internals that are not part of the public API
* Trivial one-liners with no branching

---

## Coverage targets

| Area                     | Target     | Rationale                                      |
|--------------------------|------------|------------------------------------------------|
| Shared UI components     | Full       | Used everywhere, high regression surface       |
| State stores             | Full       | Core logic, expensive to debug                 |
| File operation hooks     | Full       | External APIs, complex branching               |
| Pure utilities           | Full       | Deterministic, fast, high regression risk      |
| Custom hooks with logic  | Full       | Business logic lives here                      |
| Widget layouts           | Snapshots  | Guards structure without specifying internals  |
| Page layouts             | Snapshots  | Guards structural changes                      |
| Pure presentational      | Minimal    | No logic to test                               |
| CSS / className details  | Skip       | Zero confidence signal                         |

Overall target: **60-70% line coverage** from a targeted strategy
(matches the per-runner Jest and Vitest guides — the test runner is
interchangeable; the coverage philosophy isn't). Do not chase 80%+ —
the last 20% costs disproportionate effort for minimal confidence gain.

---

## Naming conventions

### File naming

Test files live next to source files or in a `__tests__` subfolder:

    shared/store/documentStore.ts
    shared/store/__tests__/documentStore.test.ts

    features/FormEditor/FormEditor.tsx
    features/FormEditor/__tests__/FormEditor.test.tsx

### Describe / it structure

Use nested describe blocks to group related behaviour:

    describe('documentStore', () => {
      describe('loadFromXML', () => {
        it('parses a valid document and sets the state', () => { ... });
        it('sets error state when input is invalid', () => { ... });
        it('clears the previous document when loading a new one', () => { ... });
      });
    });

### Arrange-Act-Assert pattern

Structure every test as three sections:

    it('saves the document and clears dirty state', async () => {
      // Arrange
      const store = createTestStore();
      store.loadDocument(SAMPLE_INPUT);
      store.updateDocument((doc) => ({ ...doc, title: 'Updated' }));
      expect(store.getState().hasUnsavedChanges).toBe(true);

      // Act
      store.saveToFile();

      // Assert
      expect(store.getState().hasUnsavedChanges).toBe(false);
    });

---

## React Testing Library — rules

### Query priority (use in this order)

1. `getByRole`       — accessible role + name (best)
2. `getByLabelText`  — form labels
3. `getByText`       — visible text
4. `getByTestId`     — last resort only, when no semantic query exists

### User interactions

Use `userEvent` from `@testing-library/user-event`, not `fireEvent`:

    import userEvent from '@testing-library/user-event';

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await user.type(screen.getByLabelText('Title'), 'New feature');

### Async assertions

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Saved');
    });

### Component rendering

Wrap in a test helper that provides all required providers:

    function renderWithProviders(ui: ReactElement) {
      return render(ui, { wrapper: AppProviders });
    }

---

## Vitest configuration

### Setup file

    // vitest.setup.ts
    import '@testing-library/jest-dom';
    import { cleanup } from '@testing-library/react';
    import { afterEach } from 'vitest';

    afterEach(() => {
      cleanup();
    });

### Mocking stores in component tests

Do not use the real store in component tests — mock the hooks:

    vi.mock('../store/documentStore', () => ({
      useDocumentStore: vi.fn(() => ({
        document: mockDocument,
        hasUnsavedChanges: false,
        saveToFile: vi.fn(),
      })),
    }));

### Mocking heavy dependencies

Always mock heavy libraries in unit tests:

    vi.mock('some-heavy-library', () => ({
      HeavyComponent: ({ children }: { children: () => ReactNode }) =>
        children({ loading: false, url: 'mock-url' }),
    }));

---

## The cost problem — and why it matters

Test files can become a significant portion of the codebase and AI session cost.
Every test file is loaded into the AI's context on every request.

Two failure patterns that inflate cost without adding confidence:

1. Tests coupled to implementation details break on every refactor.
   Test behaviour, not implementation. If a test breaks when you rename an internal
   variable, the test is testing the wrong thing.

2. Testing trivial code (getters, pure renderers with no logic) adds lines
   without protecting against real bugs.

The targeted coverage strategy above preserves most of the regression-prevention
benefit at roughly half the token cost.

---

## Self-check before finishing

1. **TDD respected** — failing test written before implementation; tests
   describe behaviour, not implementation details
2. **Coverage targeted, not vanity** — full coverage on shared UI / stores /
   hooks / utilities; snapshots for widgets and pages; minimal for pure
   presentation
3. **Query priority honoured** — `getByRole` / `getByLabelText` /
   `getByText` preferred over `getByTestId`; `findBy*` used for async
4. **Mocks live at boundaries** — network, time, randomness mocked; internal
   modules and React's own behaviour never mocked
5. **Async tests await actual conditions** — `await waitFor(...)` rather
   than `setTimeout`; no manual `act()` wrapping unless RTL says so
6. **No console noise** — `console.error` from React warnings must fail the
   test (configure `jest.setup.ts` / `vitest.setup.ts` to throw on it)
7. **Snapshot churn under control** — every snapshot diff justified in the
   PR; no auto-update commits without review
8. **Token cost considered** — no test files repeating fixtures verbatim;
   shared setup factored to fixtures or builders; trivial getters not tested
