# Refactoring Doc Generation Template

Use this template to generate technology-specific refactoring guides. Not every
technology needs a refactoring doc — only generate one when there are concrete,
enforceable code-quality rules with clear before/after examples.

Quality references:
- `refactoring/refactoring-process.md` — process-style (stack-agnostic, always kept)
- `refactoring/react/react-refactoring.md` — example-style with code
- `refactoring/backend-pipeline.md` — process-style (stack-specific)

---

## Qualification check (run before generating)

Skip generation entirely when:

1. Fewer than **2** concrete, mechanically-fixable violations have been
   identified for this technology (review the technology's official style
   guide, common linter rules, and active guides under
   `ai-instructions/guides/{tech}/` to find them).
2. The violations are generic ("write clear code", "add tests") rather
   than technology-specific. Only generate when the rules require knowing
   the technology to enforce.
3. The would-be code examples are pseudo-code or hand-waving. If you
   cannot produce real, runnable before/after snippets, the doc has no
   teeth — skip.

When you skip, record the decision in the bootstrap run report
(`Refactoring doc for {tech}: skipped — {reason}`) so it doesn't
look like an oversight.

---

## Pattern selection

Pick **Pattern A** (Process-Style) when violations are architectural —
service-boundary leaks, layer-mixing, module-organization issues. The
"fix" is a design change, not a code rewrite, so before/after would be
diagrams or pseudo-code.

Pick **Pattern B** (Example-Style) when violations have small,
mechanical code transformations (each example fits in 10–25 lines).
Most language-level refactoring docs (Python, Go, Java, etc.) are
Pattern B; most architecture-level docs (backend pipeline, FSD layer
violations) are Pattern A.

When in doubt, look at the curated exemplar for the closest technology
in `refactoring/{tech}/` and match its pattern.

---

## Pattern A: Process-Style (for architectural concerns)

Use when the rules are about code organization, not specific syntax patterns.

```markdown
# {Technology/Area} Refactoring

{One-line note about when to load this guide.}

## When To Trigger A Refactoring Pass

Run a dedicated pass when:
{Bulleted list of 4-8 trigger conditions. Be specific:
 "Route handlers accumulate service logic" not "Code is messy."}

## Process

{Numbered steps 1-6 for executing the refactoring.
 Step 1: identify violations. Last step: verify.}

## Separation Rules (or equivalent name)

{4-8 bulleted architectural constraints specific to this technology.
 Example: "Route handlers delegate to services — no business logic in handlers."
 Example: "Repository methods return domain types, not ORM objects."}

## Refactoring Checklist

{5-8 bulleted verification items. Check after every refactoring pass.}
```

## Pattern B: Example-Style (for concrete code patterns)

Use when violations have clear before/after code transformations.

```markdown
# {Technology} Refactoring

## {Rule 1 Name}

**Problem:** {1-2 sentences explaining the anti-pattern and why it hurts.}

**Rule:** {One declarative sentence with key thresholds bolded.}

### Before (violation)

{Code example showing the anti-pattern. 10-25 lines.
 Add brief comments explaining what is wrong.}

### After

{Code example showing the correct pattern. 10-25 lines.
 Can include multiple options (Option A, Option B) if
 there are valid alternative approaches.}

{Optional: brief note on naming conventions or benefits.}

## {Rule 2 Name}

{Same structure. Repeat for 2-4 rules total.}

## Refactoring Checklist

{4-6 bulleted verification items.}
```

## Generation Rules

- Before/after examples are critical for example-style docs. Without them, the
  doc is too vague to act on.
- `refactoring/refactoring-process.md` is stack-agnostic and should be kept for
  all projects. Do not regenerate it — only generate technology-specific docs.
- Only create a refactoring doc when the technology has at least 2 concrete,
  enforceable rules with clear violation patterns (see "Qualification check"
  at the top of this template).
- Code examples must be realistic and use the project's actual technology
  stack — pull real code shapes from the project's `src/` directory or from
  the technology's official documentation rather than inventing toy code.
