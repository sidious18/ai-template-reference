AI React Guidelines (Claude / LLM)
React 18+ | TypeScript strict | Feature-Sliced Design | TDD | Readable | Maintainable

These guidelines are loaded by an AI (Claude or other LLM) when generating or refactoring React code.
Goal: consistent FSD architecture, no mega-files, clear separation of concerns, human-readable output.

---

0. Defaults (assume unless task says otherwise)

* React 18+ (functional components only)
* TypeScript strict mode enabled
* No any
* Prefer named exports
* Prefer composition over inheritance
* Prefer small, focused modules over "god components"
* Zustand for shared state, not React Context
* Vitest + React Testing Library for tests

---

1. Component layering — Feature-Sliced Design (4 layers)

Use the FSD model. No upward imports. No cross-feature imports.

1. Pages (route-level)
   Responsibility: routing and composition only.

   * Compose widgets and features.
   * Keep side effects minimal and page-level only.
   * Do not embed business logic or data transformations.
   * Maximum 80 lines. Extract controller hook if state is needed.

2. Widgets (large page sections)
   Responsibility: large reusable sections of a page.

   * May own local UI state.
   * Compose features and shared UI components.
   * Must not hardcode API calls directly.

3. Features (user interactions)
   Responsibility: a complete user interaction or flow.

   * Own state, effects, validations, controllers.
   * Separate logic from view when complexity grows.
   * Expose a clear public API (via index file if applicable).

4. Shared (reusable building blocks)
   Responsibility: UI primitives, hooks, utilities, stores, config.

   * shared/ui     — pure presentational components
   * shared/lib    — utilities, predicates, helpers, custom hooks
   * shared/store  — Zustand stores
   * shared/api    — API client and DTOs
   * shared/config — constants and configuration

   Shared UI components:
   * Driven only by props.
   * No knowledge of business domain or API shapes.
   * Minimal internal UI-only state.
   * No direct store access.

Layer import rules (strict):
   pages      -> widgets, features, entities, shared
   widgets    -> features, entities, shared
   features   -> entities, shared
   entities   -> shared
   shared     -> (nothing from above layers)

---

2. Recommended folder structure

src/
  app/                   app initialization, providers, router
  pages/                 route-level screens (80 lines max)
  widgets/               large page sections
  features/              user interaction flows
  entities/              domain entities and related UI/model
  shared/
    ui/                reusable UI components
    lib/               utilities, predicates, hooks
    store/             Zustand stores
    api/               API client and DTOs
    config/            constants and configuration

Use index files as public API boundaries for each module.

---

3. Containers vs Views (logic vs UI)

Split a component into controller + view when it has two or more of:

* Data fetching or mutations
* Non-trivial state management
* Complex derived flags
* Long JSX blocks (> 80 lines)
* Multiple render branches

Controller / hook:

* Owns data, state, handlers, side effects
* Returns: state, derived flags, handlers
* Never returns JSX

View:

* Pure UI — driven only by props
* No side effects
* Thin: just render and event delegation

Do not split trivial components mechanically. Split when clarity improves.

---

4. No mega-files, no over-fragmentation

Practical limits, by FSD layer:

* **Page** (`pages/{route}/page.tsx`): maximum **80 lines** — pages
  compose; they don't contain logic. If you're past 80, extract a widget
  or feature.
* **Widget / Feature / shared UI component**: maximum **150 lines** (strict)
* **Custom hook**: aim for 80-150 lines
* **Utility file**: maximum 200 lines

The 80-line ceiling on pages is intentionally tighter than the
component limit — it forces composition rather than a god-page that
absorbs widget logic.

If a file exceeds its limit:

1. Extract reusable UI parts.
2. Extract business logic into a custom hook.
3. Extract complex conditions into named predicates.
4. Extract mapping/transformation logic into helpers.

Avoid:

* One file doing everything.
* Creating dozens of tiny files without clear responsibility.
* Deep nesting without clear architectural meaning.

---

4a. Extract sub-components greater than 30 lines

If an inline sub-component function inside a parent file exceeds 30 lines,
it must be extracted into a named file in a subfolder.

Structure example:

features/
  FormEditor/
    FormEditor.tsx         (host, <= 150 lines)
    FeatureSection.tsx     (extracted sub-component)
    PersonaSection.tsx     (extracted sub-component)
    index.ts               (public API)

Rules:

* Sub-components go in a folder named after the parent component
* Each sub-component file gets a single, clear responsibility
* The parent imports from subfolder files, not inline
* Sub-components are not exported from the feature's index unless reused elsewhere

Reason: inline sub-component functions that grow beyond 30 lines make the parent file
unreadable and make the AI slow to process. Named files are faster to edit in isolation.

---

5. Hooks-first architecture

Business logic belongs in hooks, not in JSX.

Naming conventions:

* useXxxQuery / useXxxMutation  — data operations
* useXxxController              — feature state + handlers (for pages and widgets)
* useXxxViewModel               — derived UI data

Hooks must:

* Return state
* Return derived flags
* Return handlers
* Never return JSX
* Never accept JSX as argument

Handler extraction rule: if a component passes more than 2 inline handlers with
branching logic to useXxx or child components, extract all handlers to a controller hook.

---

6. Conditions and branching

One complex idea = one named predicate.

Rules:

* Extract multi-operator conditions to named consts before use:
    const canSubmit = isFormValid && !isSubmitting && hasChanges;
    const shouldShowWarning = isDirty && !isSaved && tabCount > 1;

* Use early returns to reduce nesting:
    if (!document) return <EmptyState />;
    if (isLoading) return <Spinner />;
    return <Content ... />;

Avoid:

* Nested ternaries beyond one level
* Long boolean chains inline in JSX attributes
* Conditions that require mental parsing to understand

---

6a. No JSX ternary component-selectors in render body

A ternary that selects which component to render must NOT appear inside the JSX
return body. It must be resolved before the return.

Wrong:
    return (
      <div>
        {isEditing ? <EditPanel /> : <ViewPanel />}
      </div>
    );

Correct — const before return:
    const panel = isEditing ? <EditPanel /> : <ViewPanel />;
    return <div>{panel}</div>;

Correct — early return:
    if (isCollapsed) return <CollapsedSidebar />;
    return <ExpandedSidebar ... />;

Applies to:
* Component-selecting ternaries (A ? <CompA /> : <CompB />)
* Multi-branch conditions (3+ branches: use early returns or extract component)

Does NOT apply to:
* Simple value rendering: {isActive ? 'Active' : 'Inactive'}
* Attribute conditionals: className={isActive ? 'active' : ''}
* Short non-component ternaries that are immediately readable

Reason: component-selecting ternaries in render bodies hide control flow inside JSX,
making it hard to trace what renders without reading the full return block.

---

7. Functions must stay simple

Avoid long positional parameter lists.

If a function needs more than 3-5 parameters, use a typed input object:

    // Wrong
    function updateFeature(id: string, title: string, priority: string, attention: string) { ... }

    // Correct
    function updateFeature({ id, title, priority, attention }: UpdateFeatureInput) { ... }

Do not pass entire state objects as props. Pass only what is required.
Do not pass store references as props. Use the hook directly in the component.

---

8. SOLID applied to frontend

Single Responsibility:
* Pages compose. Widgets orchestrate. Features manage interaction. Shared renders.

Interface Segregation:
* Keep props small and specific. Do not pass large objects with many fields.

Dependency Inversion:
* Components depend on hooks/services, not raw HTTP calls or DTO shapes.
* Shared UI components are pure — they do not know about business domain.

---

9. TypeScript rules

* Strict mode enabled — never disable
* No any — if a type is unknown, use unknown and narrow
* Avoid overly broad types (Record<string, unknown> for domain entities)
* Prefer domain types in UI instead of raw API DTOs
* Use discriminated unions for state variants:
    type ViewMode = 'form' | 'xml' | 'split';
    type LoadState = { status: 'idle' } | { status: 'loading' } | { status: 'error'; message: string };
* Keep types close to usage unless reused across multiple files
* Type assertion (as X) requires a comment explaining why it is safe

---

10. State management

* Do not store derived state — compute it inline or with useMemo (only when needed)
* Avoid multiple sources of truth for the same data
* Keep side effects inside hooks, never in store actions
* For complex forms: reducer pattern or a form library (react-hook-form)
* Zustand store selectors: use granular selectors, not the whole store slice
* Persisted state: use zustand/middleware persist, not manual localStorage reads

---

11. Performance

* Do not use useMemo or useCallback by default
* Optimize only with a measured reason (profiler, visible lag)
* Lazy-import heavy libraries at the top level
* Code-split heavy features with React.lazy + Suspense
* Avoid re-renders from inline object/array creation in props

---

12. Required AI output format

For any non-trivial task, the AI must:

1. Provide a file structure plan.
2. Define key types and interfaces affected.
3. Implement code split by file (filename as heading).
4. Briefly explain architectural decisions.
5. List which tests need to be written or updated.

---

13. Additional best practices

* Use index files as public API boundaries — do not import from internal paths externally
* Avoid circular dependencies
* Keep formatting helpers in shared/lib
* Keep data mapping (DTO -> domain type) outside UI components
* Add short comments only where intent is not obvious from names
* Do not add comments that repeat what the code already says

---

14. CSS / Tailwind — Max 3 utilities per className

Every className attribute must contain at most 3 Tailwind utility classes.

Wrong:
    <div className="flex items-center justify-between h-12 px-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">

Correct:
    <div className="toolbar-bar">

    // src/index.css
    @layer components {
      .toolbar-bar {
        @apply flex items-center justify-between h-12 px-4
               bg-white dark:bg-gray-900
               border-b border-gray-200 dark:border-gray-700 shadow-sm;
      }
    }

Two-tier CSS strategy:

* Tier 1 — Tailwind utilities (<= 3 per className): for truly one-off, non-repeated styles
* Tier 2 — Semantic classes in index.css via @apply: for any element with > 3 utilities
           or any pattern that appears more than once

Semantic class naming rules:

* Describe purpose, not appearance: `btn-primary`, not `blue-rounded-button`
* Use BEM-like structure for sub-elements: `sidebar-header`, `sidebar-header__title`
* Group related classes together in index.css with a comment

---

15. Self-check before finishing

Before submitting any non-trivial change, verify all of the following:

1. Clear FSD layer separation — no upward imports, no cross-feature imports
2. No component file over 150 lines
3. No inline sub-component over 30 lines — extracted to named subfolder file
4. All business logic extracted into hooks, not inline in JSX
5. Complex conditions extracted to named predicates before use
6. No JSX ternary component-selector in render body — const or early return used
7. No any types
8. No JSX className with more than 3 Tailwind utilities — semantic class used
9. Tests written and passing for all new stores, hooks, and utilities
