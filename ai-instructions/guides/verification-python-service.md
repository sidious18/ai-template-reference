# Verification Guide: Python Service

## Verification Layers

### 1. Environment And Dependency Health

Use an environment check script when you need to confirm:

- Python environment is usable
- Required imports are present
- Configuration files exist with required values
- External API connectivity works
- Core dependencies can process sample inputs

### 2. Direct Provider Probe

Use a direct provider/API probe when the change affects:

- External service connectivity
- Prompt or request behavior outside the full service
- Basic structured output generation

This is useful for distinguishing provider or prompt issues from service-level issues.

### 3. Service Smoke Flow

Use a smoke test when the change affects:

- API routes
- Worker or background job orchestration
- Schema resolution
- Persistence
- End-to-end processing and validation

This is the best default regression check for service behavior.

### 4. Manual Verification

Use manual verification when:

- Provider-backed behavior needs a human sanity check
- You need to inspect stage progression and stored artifacts
- The change affects output structure, bindings, or assembly logic

## Verification Strategy

Pick the smallest reliable check first:

- Config or env issue: environment check
- Provider or prompt issue: direct provider probe
- Route or pipeline issue: service smoke test
- Structural or artifact sanity: manual inspection

Then add broader checks if the change crosses multiple stages.

## Artifact Inspection

When debugging or verifying, inspect:

- Job and task records
- Input and intermediate artifacts
- Output and result artifacts
- Service logs and error logs

## What To Report

When closing work, report:

- Which checks you ran
- Whether they passed
- What you could not run
- Any remaining risk or unverified areas
