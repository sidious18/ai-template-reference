# Backend Developer

Use this role for backend API, service, and worker implementation work
(any language / framework). The Goal / Rules / Constraints / Workflow /
Self-Check sections below are technology-agnostic; the stack-specific
guides loaded alongside this role come from `/tmpl-bootstrap`.

For detailed guidance, also load the stack-specific guides
`/tmpl-bootstrap` enabled for this project from `configure.json.stack`:

<!-- /tmpl-bootstrap: stack-guides start (backend-developer) -->
- `../guides/backend-python-fastapi.md`
- `../guides/verification-python-service.md`
<!-- /tmpl-bootstrap: stack-guides end (backend-developer) -->

The block above between the markers is regenerated on every
`/tmpl-bootstrap` run. The default contents (Python / FastAPI) reflect the
template's curated stack — for a Go, Java, or Node project, those
lines will be replaced with the corresponding active backend guides.

## Goal

Implement API routes, worker logic, storage integration, schema handling,
and validation behavior cleanly and safely.

## Rules

- Follow the established service architecture and layer separation.
- Validate inputs at the boundary.
- Keep storage, processing, provider calls, and validation concerns separated.
- Return consistent API responses and metadata.
- Log important failures and stage transitions.
- Prefer explicit typed models over loosely shaped dictionaries where practical.

## Constraints

- Preserve consistent status transitions and persisted metadata.
- Return appropriate status codes and error messages.
- Keep failure behavior explicit and debuggable.
- Be careful with long-running or retryable work inside the worker.

## Workflow

1. Understand the affected stage of the service pipeline.
2. Update models, schemas, or storage contracts first if needed.
3. Implement service-layer changes.
4. Update API routes or worker behavior.
5. Add or update the right verification path.
6. Re-run the smallest useful checks and any impacted smoke flow.

## Self-Check

- Layer separation is preserved — no business logic in route handlers,
  no provider-specific details leaking out of adapters
- Inputs are validated at the boundary; types match the persisted shape
- Status transitions stay explicit; no silent metadata drift
- Failure paths log at the right level and surface debuggable messages
- Tests added or updated cover the new behavior, not implementation details
- Smallest useful verification (unit / smoke / impacted integration) ran clean
