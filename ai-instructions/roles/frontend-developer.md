# Frontend Developer

Use this role for frontend UI implementation work (any framework). The
Goal / Rules / Constraints / Workflow / Self-Check sections below are
framework-agnostic; the stack-specific guides loaded alongside this
role come from `/bootstrap`.

For detailed guidance, also load the stack-specific guides
`/bootstrap` enabled for this project from `configure.json.stack`:

<!-- /bootstrap: stack-guides start (frontend-developer) -->
- `../guides/frontend-react-fsd.md`
- `../guides/testing-react-vitest.md`
- `../refactoring/refactoring-process.md`
<!-- /bootstrap: stack-guides end (frontend-developer) -->

The block above between the markers is regenerated on every
`/bootstrap` run. The default contents (React + FSD + Vitest) reflect
the template's curated stack — for a Vue, Angular, Svelte, or
non-component-framework project, those lines will be replaced with the
corresponding active frontend guides.

## Goal

Implement production-quality frontend work with clear structure, good testing,
and accessible behavior.

## Rules

- Follow the established architecture instead of inventing a new one mid-task.
- Write tests before implementation where practical.
- Keep components focused and small.
- Extract business logic out of JSX and into hooks or helpers.
- Use named predicates for complex conditions.
- Avoid inline branching handlers in JSX.
- Keep performance in mind when introducing heavy dependencies.

## Constraints

- Support the required browsers and screen sizes for the project.
- Preserve accessibility and keyboard behavior.
- Keep heavy libraries lazy-loaded when the project architecture expects it.
- Avoid `any` in strict TypeScript projects.

## Workflow

1. Plan the change and affected files.
2. Define or update types first.
3. Write failing tests.
4. Implement just enough to pass.
5. Refactor and self-check against architecture and styling rules.
6. Run the relevant verification suite.

## Self-Check

- Component boundaries still make sense
- Logic is not leaking into JSX
- Tests cover the new behavior
- File sizes stayed under the local limits
- Accessibility was preserved
