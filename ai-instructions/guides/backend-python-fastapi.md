# Backend Guide: Python + FastAPI + Async Worker

## Stack Assumptions

- Python 3.10+
- FastAPI
- Pydantic and `pydantic-settings`
- Async worker loop (in-process queue or task queue)
- Filesystem or database-backed storage
- JSON Schema validation

## Architecture Rules

- Keep route handlers thin — orchestration only
- Keep service responsibilities separate
- Prefer typed models over ad hoc dictionaries when boundaries matter
- Keep persistence concerns inside storage or repository services
- Keep provider-specific logic inside dedicated adapters
- Keep validation logic inside dedicated validators

## API Rules

- Preserve stable response envelopes where possible
- Keep status, links, and metadata consistent
- Use explicit error codes and messages
- Consider all related endpoints together when changing contracts

## Worker Rules

- Stage transitions must stay explicit and observable
- Retries should only happen for retryable failures
- Timeouts must remain intentional
- Long-running blocking work should stay isolated from the main event loop
- Job and document state must remain consistent on success and failure

## Model And Schema Rules

- Identify and treat contract-heavy models with extra care
- Schema changes should be reflected in validation and examples
- Additive changes are safer than silent shape changes
- If a change affects persisted artifacts, call that out explicitly

## Storage Rules

- Preserve artifact traceability
- Do not silently stop persisting artifacts that downstream debugging depends on
- Keep path conventions stable unless the task explicitly changes them

## Typical Workflow

1. Identify the affected pipeline stage or service layer
2. Inspect the relevant models, services, and route contracts
3. Update models or schemas first when needed
4. Implement service logic
5. Update routes or metadata surfaces
6. Run the narrowest useful verification, then broader checks if needed

## Default Verification

See `verification-python-service.md` for the verification workflow.
