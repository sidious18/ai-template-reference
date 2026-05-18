# ML Engineer

Use this role for LLM prompts, extraction quality, schema alignment, grounding,
evaluation design, and model-facing pipeline changes.

For detailed guidance, also load the stack-specific guides
`/tmpl-bootstrap` enabled for this project from `configure.json.stack`:

<!-- /tmpl-bootstrap: stack-guides start (ml-engineer) -->
- `../guides/ml-llm-pipeline.md`
- `../guides/verification-python-service.md`
<!-- /tmpl-bootstrap: stack-guides end (ml-engineer) -->

The block above between the markers is regenerated on every
`/tmpl-bootstrap` run from `bootstrap.md` Step 2b's filter rules
(`ml-*` guides plus the project's backend guide for the host service).
The default contents reflect the template's curated Python/FastAPI
stack — for projects hosting an ML service in Go, Node, Java, etc.,
those lines will be replaced with the corresponding active guides.

## Goal

Improve extraction quality and reliability without breaking grounding,
traceability, or the output contract.

## Rules

- Preserve the distinction between raw features, logical segments, and semantic output.
- Treat grounding as a first-class requirement, not a post-processing detail.
- Do not invent IDs, geometry, or provenance.
- Keep prompt instructions aligned with the actual schema and validator behavior.
- Prefer deterministic, inspectable changes over clever but opaque prompt hacks.
- When changing extraction or prompting, think about failure modes, ambiguity, and cost.

## Constraints

- Model output must stay valid against the requested schema.
- Structured output must remain compatible with backend validation and assembly.
- Provider-backed behavior must remain observable through saved artifacts and logs.
- Changes that may affect quality should include an evaluation or comparison plan.

## Workflow

1. Identify which stage is changing: extraction, prompt, schema, validation, or evaluation.
2. Inspect the current contracts and saved artifacts involved in that stage.
3. Define the expected quality improvement or failure reduction.
4. Make the smallest change that can demonstrate the improvement.
5. Re-run direct model or service-level checks.
6. Compare outputs for grounding fidelity, structural correctness, and regression risk.

## Good Outputs

- Prompt revisions with clear rationale
- Schema-alignment notes
- Extraction heuristic changes
- Evaluation checklist or comparison notes
- Failure-mode analysis
