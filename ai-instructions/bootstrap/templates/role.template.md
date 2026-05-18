# Role Generation Template

Use this template to generate a role persona. Roles are **thinking modes** —
they define how the AI reasons about a domain, not the technical rules
(those belong in guides).

Quality references (read these for tone and structure):
- `roles/backend-developer.md` — developer role example
- `roles/qa-engineer.md` — cross-cutting role example
- `roles/backend-architect.md` — design role example

Target length: 35-70 lines. Roles are concise by design.

---

## Required Structure

```markdown
# {Role Name}

`{Role Name}` is **title case, human-readable, no hyphens** —
"Backend Developer", "QA Engineer", "Tech Lead" (not "backend-developer"
or "BACKEND DEVELOPER"). The slug used in `ai-plugins.json` is the
hyphenated lowercase form (`backend-developer`); the heading is the
display form.

Use this role for {3-5 comma-separated task types where this role applies}.

For detailed guidance, also load:
- `{path to matching guide}`
- `{path to matching verification or refactoring doc}` (if applicable)

**Empty marker blocks for stack-agnostic roles** — most role files
must include the two `<!-- /tmpl-bootstrap: stack-guides start ({slug}) -->`
and `<!-- /tmpl-bootstrap: stack-guides end ({slug}) -->` markers, even
when the role pulls no stack-specific guides. The six roles whose
marker block stays empty by default are `devops-engineer`,
`tech-writer`, `library-author`, `security-engineer`,
`platform-engineer`, and `sre`. (`data-engineer` and `mobile-developer`
also carry markers but ARE populated with stack guides — see
`bootstrap.md` Step 2b's filter table.) For roles whose block stays
empty, leave the block empty between the markers. Missing markers
cause Step 2b to log a warning and skip population for that role.

**Three roles intentionally have no marker block at all**:
`qa-engineer`, `business-analyst`, and `ui-ux-designer`. They are
stack-agnostic by design and Step 2b's filter table explicitly skips
them — the absence of markers is the signal. See `bootstrap.md`
Step 2b filter table.

**Cross-reference path format** — these paths are resolved relative to
the role file's location (`ai-instructions/roles/{slug}.md`), so they
always start with `../`:
- Guides: `../guides/{guide-name}.md`
- Refactoring docs: `../refactoring/{tech}/{tech}-refactoring.md`
  (note the per-tech subdir for category-organized refactoring docs)
  or `../refactoring/{name}.md` for top-level ones
- Guidelines: `../guidelines/{tech}/ai-{tech}-guidelines.md`
- Verification guides: `../guides/verification-{name}.md`
Do **not** use absolute paths or leading slashes. Verify each path
resolves on disk before referencing — `/tmpl-verify` will catch
broken links, but it's faster to get them right at generation time.

## Goal

{1-3 sentences defining the role's primary objective.
 Focus on WHAT the role achieves, not HOW.
 Use active voice. Example: "Produce backend implementations that respect
 existing architecture boundaries and maintain test coverage."}

## Rules

{4-8 bulleted principles. These are behavioral — how to think, what to
 prioritize. Start each with an action verb.
 Example: "Read the existing implementation before proposing changes."
 Example: "Keep route handlers thin — move logic to services."}

## Constraints

{3-5 bulleted boundaries. These are negative — what NOT to do.
 Example: "Do not change the public API contract without explicit approval."
 Example: "Do not skip tests for new logic paths."}

## Workflow

{Numbered steps 1-6 describing how this role engages with a task.
 General enough to apply across specific technologies.
 Step 1 is always some form of "understand the current state."
 Last step is always some form of "verify."}

## Self-Check (or Outputs)

{4-6 bulleted items. Either:
 - "Self-Check": verification items before finishing (for implementation roles)
 - "Outputs": expected deliverables (for design/analysis roles)}
```

## Generation Rules

- Roles describe perspective, not technology. A "Go Developer" role thinks about
  Go idioms and patterns — it does not list Go syntax rules.
- Cross-references should point to guides that exist or will be generated in the
  same bootstrap run.
- The QA Engineer and Business Analyst roles are stack-agnostic. Reuse the curated
  versions for any project. Only generate new roles when the project needs a
  perspective not covered by the 15 existing roles (e.g., Solutions Architect,
  Game Designer, Hardware Engineer, Customer Success).
