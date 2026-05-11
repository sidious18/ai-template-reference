# Guide Generation Template

Use this template to generate a technology-specific guide. Generated guides
must follow the same structural pattern as the curated examples in `guides/`.

Quality references (read these for tone and detail level):
- `guides/backend-python-fastapi.md` — backend guide example
- `guides/frontend-react-fsd.md` — frontend guide example
- `guides/ml-llm-pipeline.md` — ML/pipeline guide example

Target length: 60-150 lines. Shorter for simple stacks, longer for complex ones.

## Inputs (where to source the placeholders)

- **`{Type}`** — one of `Backend`, `Frontend`, `Database`, `Testing`,
  `Infrastructure`, `ML/Pipeline`. Pick from `configure.json.stack.*`
  category that owns the technology being documented.
- **`{Technology Stack}`** — short, capitalized stack identifier with
  primary library + ancillaries (e.g., `Python + FastAPI`, `Node.js +
  Express`, `React + Feature-Sliced Design`). Pull from
  `configure.json.stack` and the actual versions detected in the repo
  (`pyproject.toml`, `package.json`, `go.mod`).
- **Versions in "Stack Assumptions"** — read from the manifest, not
  invented. `package.json` `dependencies` for Node, `pyproject.toml`
  `[tool.poetry.dependencies]` or `[project] dependencies` for Python,
  `go.mod` for Go, etc. If a manifest doesn't pin a version, write the
  major-version floor the framework documents as supported (e.g.,
  "React 18+") rather than guessing.

---

## Required Structure

```markdown
# {Type} Guide: {Technology Stack}

{One-line context note: when to load this guide.}

## Stack Assumptions

{Bulleted list of 4-8 specific technology versions and libraries.
 Be precise: "React 18+" not just "React". "PostgreSQL 15+" not just "SQL".}

## {Category 1} Rules

{4-8 declarative bullets. Start each with an action verb or "Keep"/"Prefer"/"Avoid".
 Name the category after the technology's actual concern, not a generic label.
 Examples: "Routing Rules" for Express, "Model Rules" for Django,
 "Concurrency Rules" for Go, "Component Rules" for React.}

## {Category 2} Rules

{4-8 declarative bullets. Second most important concern.
 Examples: "Middleware Rules", "View Rules", "Error Handling Rules",
 "State Rules", "Query Rules".}

## {Category 3} Rules

{4-8 declarative bullets. Third concern.}

## {Category 4} Rules (optional)

{4-8 declarative bullets. Include if the technology has enough distinct concerns.}

## {Category 5} Rules (optional)

{4-8 declarative bullets.}

## Workflow

{Numbered steps 1-6. Describe the typical task execution flow for work
 involving this technology. Steps should be specific enough to follow
 but general enough to apply across tasks.}

## Verification

{Either point to a verification guide if one exists, or provide a numbered
 checklist of 5-8 items to verify after completing work with this technology.}

## Common Failure Modes (optional)

{Bulleted list of 4-8 known failure patterns specific to this technology.
 Include when failures are non-obvious or especially costly.}

## Refactoring Triggers (optional)

{Bulleted list of 3-6 conditions that warrant a dedicated cleanup pass.
 Cross-reference the matching refactoring doc if one exists.}
```

## Generation Rules

- Rule categories must be named after the technology's actual architectural concerns.
  A Django guide has "Model Rules", "View Rules", "URL Rules" — not "Category 1", "Category 2".
- Keep each rule as a declarative principle, not a how-to tutorial.
  Write "Keep route handlers thin — delegate to service functions" not
  "To keep route handlers thin, you should create service functions and..."
- Do not include code examples in guides. Code belongs in refactoring docs and guidelines.
- When web search is available, verify version-specific details against official documentation.
- Do not invent framework features. If unsure whether a pattern exists, omit it.
