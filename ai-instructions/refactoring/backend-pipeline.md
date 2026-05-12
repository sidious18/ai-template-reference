# Refactoring Guide: Backend Pipeline

Use this guide for dedicated cleanup passes in backend service and processing pipelines.

## When To Trigger A Refactoring Pass

Run a dedicated pass when:

- Route handlers accumulate service logic
- Worker orchestration grows tangled or duplicates stage logic
- Provider logic leaks outside its adapter module
- Validation starts doing processing work, or processing starts doing validation work
- Persisted artifact handling becomes inconsistent
- Processing stages become too large to reason about safely

## Process

1. Identify the exact rule or architectural smell.
2. Map the affected stage boundaries.
3. Group edits by file or stage.
4. Change one stage at a time.
5. Re-run the narrowest useful verification after each stage.
6. Inspect saved artifacts and logs when the behavior is pipeline-facing.

## Separation Rules

- API routes should orchestrate, not implement processing or validation logic
- Worker should coordinate stages, not absorb provider-specific details
- Provider adapters should own request/response behavior for external services
- Validators should own schema compliance and structural checks
- Storage managers should own file layout and persistence behavior

## Refactoring Checklist

- Responsibilities are clearer than before
- Stage boundaries are easier to explain
- Logs and failure behavior remain observable
- Artifact persistence still supports debugging
- Verification was run after each meaningful batch
