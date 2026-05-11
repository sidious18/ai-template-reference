# Frontend Guide: React + TypeScript + FSD

Apply this guide for projects that use React, TypeScript, Feature-Sliced Design,
Zustand, Tailwind, or similar frontend patterns.

## Stack Assumptions

- React 18+
- TypeScript strict mode
- Feature-Sliced Design
- Zustand for shared state
- Tailwind with semantic extraction when styling gets dense
- Vitest and React Testing Library

## Architecture

Use Feature-Sliced Design with strict import direction:

- `pages` -> `widgets`, `features`, `entities`, `shared`
- `widgets` -> `features`, `entities`, `shared`
- `features` -> `entities`, `shared`
- `entities` -> `shared`
- `shared` -> nothing above it

Rules:

- No upward imports
- No cross-feature imports
- Shared UI stays props-driven
- Business logic belongs in hooks, controllers, or helpers

Recommended structure:

```text
src/
  app/
  pages/
  widgets/
  features/
  entities/
  shared/
    ui/
    lib/
    store/
    api/
    config/
```

## File Size And Structure Limits

- Page components: aim for 80 lines max
- Component files: 150 lines max
- Custom hooks: aim for 80 to 150 lines
- Utility files: 200 lines max
- Inline sub-components longer than 30 lines must be extracted

If a file grows too large:

1. Extract reusable UI
2. Extract business logic into a hook
3. Extract complex predicates
4. Extract mapping or transformation helpers

## Containers, Views, And Hooks

Split logic from presentation when a component has multiple concerns such as:

- Data fetching or mutations
- Non-trivial state
- Many derived flags
- Long JSX
- Multiple render branches

Controller or hook rules:

- Returns state, derived flags, and handlers
- Never returns JSX
- Owns side effects
- Keeps branching handlers out of the render body

Naming guidance:

- `useXxxQuery`
- `useXxxMutation`
- `useXxxController`
- `useXxxViewModel`

## Branching Rules

- Give complex conditions a name before using them
- Prefer early returns over deep nesting
- Do not place component-selecting ternaries directly inside JSX returns

Good:

```tsx
const canSubmit = isFormValid && !isSubmitting && hasChanges;

if (!document) return <EmptyState />;
if (isLoading) return <Spinner />;

const valueField = isColor
  ? <ColorTokenValue value={value} />
  : <Input value={value} />;

return <section>{valueField}</section>;
```

Avoid:

- Chained ternaries in JSX
- Long boolean expressions inline in JSX props
- Branching handlers defined inline in event props

## Styling Rules

- Keep inline Tailwind utilities to 3 or fewer per `className`
- If a class needs 4 or more utilities, extract a semantic class
- Always extract repeated styling patterns even if the class count is small
- Semantic names describe purpose, not appearance

See `../refactoring/css/css-refactoring.md` for extraction patterns.

## TypeScript Rules

- No `any`
- Avoid type assertions unless justified
- Prefer domain types over raw API shapes in UI code
- Prefer discriminated unions for state variants

## State Rules

- Use Zustand for shared or persisted state
- Do not use React Context as a global state replacement
- Do not store derived state when it can be computed
- Keep side effects inside hooks

## Workflow

For non-trivial work:

1. Plan the files
2. Define types and contracts
3. Write failing tests
4. Implement the minimum to pass
5. Refactor to fit the rules
6. Run verification

## Self-Check

Before finishing, verify:

1. Layer boundaries are still valid
2. No component file exceeds 150 lines
3. No inline sub-component exceeds 30 lines
4. Logic lives in hooks or helpers, not JSX
5. Complex conditions use named predicates
6. JSX does not contain component-selecting ternaries in the return body
7. `any` was not introduced
8. Dense Tailwind classes were extracted
9. Tests were written and pass

## Refactoring Triggers

Run a dedicated cleanup pass when:

- A component exceeds the file size limit
- An inline sub-component crosses 30 lines
- Tailwind classes become dense
- JSX ternary component selectors appear
- Page or widget handlers accumulate branching logic

See:

- `../refactoring/refactoring-process.md`
- `../refactoring/react/react-refactoring.md`
- `../refactoring/css/css-refactoring.md`
