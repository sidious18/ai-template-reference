# Guidelines Generation Template

Guidelines are **detailed normative references** — the longest documents in the
pack. They expand on the condensed guide with full rationale, code examples,
and comprehensive rule sets.

**Guidelines are optional.** Only generate when the condensed guide is not
sufficient for consistent output. Driven by `scope` (matching `bootstrap.md`
Step 2d): in `core` scope skip by default; in `full` scope generate for
detected stacks; in `custom` scope ask the user per stack.

Quality references:
- `guidelines/react/ai-react-guidelines.md` — full example (~380 lines)
- `guidelines/testing-guidelines.md` — full example (~246 lines)

Target length: 150-400 lines.

---

## Required Structure

**Title format** — the first line is one of two forms:
- **Backend / language / database / testing technologies**: `{Technology} Guidelines (Claude / LLM)` — e.g., "Python Guidelines (Claude / LLM)", "PostgreSQL Guidelines (Claude / LLM)".
- **UI / frontend technologies**: prefix with `AI ` — e.g., "AI React Guidelines (Claude / LLM)", "AI CSS Guidelines (Claude / LLM)". Match the convention of the existing curated files in `guidelines/{tech}/`.

The second line is the **versions / approaches** line — short pipe-separated facts about what this stack assumes (e.g., `Python 3.10+ | Type hints | Async`, `React 18+ | TypeScript strict | Feature-Sliced Design`). Maximum ~4 segments.

```markdown
{Technology} Guidelines (Claude / LLM)
{Technology versions and approaches — pipe-separated}

These guidelines are loaded by an AI when generating or refactoring
{technology area} code.
Goal: {One sentence summarizing the desired outcome.}

---

0. Defaults (assume unless task says otherwise)

{Bulleted list of 6-10 defaults: versions, modes, preferred libraries,
 naming conventions. These set the baseline.}

---

1. {Primary Architectural Pattern}

{Detailed description: 20-50 lines. The most important structural decision
 for this technology. Include layer descriptions, import rules, folder structure
 if applicable. This is the longest section.}

---

2. {Second Major Concern}

{15-30 lines. Examples: "Component layering", "TDD workflow",
 "Module organization", "API design".}

---

{Continue with 8-15 numbered sections. Each separated by ---.
 Cover all major concerns for this technology:
 - Architecture and structure
 - Code organization patterns
 - State management (if applicable)
 - Error handling
 - Testing approach
 - Performance considerations
 - Type system usage
 - Naming and conventions
 - Common pitfalls}

---

{N}. Self-check before finishing

{Numbered checklist of 6-10 items. This is always the final section.
 Each item maps to a rule from the sections above.}
```

## Generation Rules

- Each numbered section should cover ONE concern. Do not combine unrelated topics.
- Include code examples (5-15 lines each) when showing correct vs. incorrect patterns.
- Rules should be specific to the technology, not generic software principles.
  "Use discriminated unions for state variants" is good.
  "Write clean, maintainable code" is not.
- The self-check is a condensed summary of the most important rules — it should
  be usable as a quick reference without reading the full document.
- When generating for a technology not in the curated library, focus on the
  technology's unique patterns and common pitfalls. Skip generic programming
  advice that applies to any language.
