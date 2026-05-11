# Refactoring Process

Use this guide when enforcing a code quality rule across existing code or when
the codebase has drifted away from its intended standards.

Load the technology-specific refactoring docs only when they match the stack:

- `react/react-refactoring.md`
- `css/css-refactoring.md`
- `backend-pipeline.md`

## When To Trigger A Refactoring Pass

Run a dedicated pass when:

- A new rule is added and must be applied retroactively
- A component exceeds agreed file-size limits
- An inline sub-component has grown too large
- JSX branching is becoming unreadable
- Handlers with branching logic have piled up inside a component
- Styling density has made markup hard to review
- Route handlers accumulate service logic
- Worker orchestration grows tangled or duplicates stage logic
- Provider logic leaks outside its adapter
- Validation and processing stage responsibilities drift

> **Rule from experience:** Adding a rule mid-project and applying it retroactively
> to all existing code consistently surfaces latent bugs. Treat every rule addition
> as a refactoring trigger, not just a guideline for new code.

## Retroactive Refactoring Process

When adding a new rule, apply it to all existing code in this order:

1. **Identify all violations** — search for the pattern across the codebase
2. **Batch by file** — group violations by component or module file
3. **Refactor file by file** — fix all violations in one file before moving to the next
4. **Run tests after each file** — catch regressions immediately, not at the end
5. **Update tests for extracted files** — new files need their own tests

## Process

1. Identify the exact rule or architectural smell.
2. Map the affected boundaries (files, stages, modules).
3. Group edits by file or stage.
4. Change one unit at a time.
5. Re-run the narrowest useful verification after each unit.
6. Inspect artifacts and logs when the behavior is pipeline-facing.

## Principles

- Refactor for a specific rule, not for vague neatness
- Avoid mixing large refactors with feature implementation
- Keep extracted files focused and testable
- Surface latent bugs early by verifying as you go

## Pre-Submission Self-Check

- The targeted rule was applied consistently
- Extracted logic still has test coverage
- Existing tests still pass
- File boundaries are clearer than before
- No unrelated cleanup was mixed in
- Responsibilities are clearer than before
- Logs and failure behavior remain observable
