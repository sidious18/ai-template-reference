# Guide: ML / LLM Pipeline

Guide for prompt engineering, extraction quality, grounding, schema alignment,
and model-facing pipeline work.

## Pipeline Concepts

A typical LLM extraction flow is split into stages:

1. Local input parsing
2. Raw feature / fragment extraction
3. Logical segmentation
4. LLM semantic extraction
5. Schema validation
6. Backend assembly of final output

Keep those boundaries clear. They are part of the system design, not incidental
implementation details.

## Grounding Rules

- Raw extracted features are the source of truth for provenance
- Model output bindings must reference real IDs from local extraction
- Geometry, positions, and ordering come from local extraction, not the model
- Semantic nodes may span inputs, but bindings must stay grounded in raw features

## Prompt Rules

- Align prompt instructions with the actual validator and schema
- Prefer explicit constraints over vague style instructions
- Keep the prompt honest about what the backend will assemble later
- Avoid hidden dependencies on undocumented artifact structure
- When changing prompt shape, inspect both successful and failed outputs

## Extraction Rules

- Keep heuristics inspectable and incremental
- Prefer small, documented heuristics over large opaque rewrites
- Think about all content types and multi-input continuation behavior together
- When changing segmentation, evaluate downstream effect on bindings and validation

## Validation Rules

- Validator behavior is part of the contract, not just a guardrail
- Schema validity is necessary but not sufficient; provenance and structure also matter
- When modifying output assembly, reason about both content and structure nodes

## Quality And Evaluation

When changing extraction or prompting, evaluate:

- Structural validity
- Grounding fidelity
- Multi-input continuity behavior
- Media and caption handling
- Artifact traceability
- Latency and cost impact

Useful comparisons:

- Before vs after raw model payload
- Before vs after validated output
- Feature inventory changes
- Stage logs and retry behavior

## Common Failure Modes To Watch

- Invented IDs in model output
- Empty or malformed provider responses
- Schema-valid but semantically broken output
- Multi-input content split incorrectly
- Media nodes missing source links
- Prompt and validator drift

## Recommended Verification

- Direct provider probe (isolate model behavior from service logic)
- Service-level smoke flow (end-to-end)
- Artifact inspection (intermediate and final outputs)
- Manual checks for structural and semantic correctness
