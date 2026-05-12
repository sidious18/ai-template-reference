# Language Guide: Python

Use this guide for any Python project. Stack-specific guides (FastAPI, Django) take
precedence when they conflict.

## Stack Assumptions

- Python 3.10+
- Type hints required on all public functions and module-level variables
- Type checker configured (mypy strict or pyright)
- Linter configured (ruff or flake8)
- Formatter configured (ruff format or black)

## Typing Rules

- All public functions must have type annotations for parameters and return type
- Use `str | None` syntax (PEP 604), not `Optional[str]`
- Use `TypedDict` or `dataclass` for structured data — not raw `dict`
- Use `Protocol` for structural subtyping instead of ABCs when possible
- Avoid `Any` — use `object` or `Unknown` and narrow. If `Any` is truly needed, add a comment explaining why
- Use `typing.TypeAlias` for complex type expressions
- Generic types use the built-in syntax: `list[str]`, `dict[str, int]`, not `List`, `Dict`

## Module Structure Rules

- One module, one responsibility — if a module does two unrelated things, split it
- Use `__init__.py` as a public API — re-export only what consumers need
- Private functions and classes are prefixed with `_`
- Avoid circular imports — if two modules import each other, extract shared types to a third
- Keep import blocks ordered: stdlib → third-party → local (ruff/isort handles this)

## Error Handling Rules

- Define domain-specific exceptions that extend `Exception` or `ValueError`/`TypeError`
- Catch specific exceptions, never bare `except:`
- Use `raise ... from err` to preserve the exception chain
- Log exceptions at the boundary (API handler, CLI entry, task runner) — not deep in the call stack
- Do not use exceptions for flow control — check conditions first

## Async Rules

- Use `async/await` consistently — do not mix sync and async in the same call chain
- CPU-bound work goes to `ProcessPoolExecutor` or a task queue, not `asyncio`
- Use `asyncio.gather` for concurrent I/O, not sequential `await` calls
- Async context managers (`async with`) for database connections, HTTP sessions
- Always set timeouts on I/O operations

## Data Classes and Models

- Use `dataclass` or `pydantic.BaseModel` for data containers — not plain dicts
- Frozen dataclasses (`frozen=True`) for immutable value objects
- Pydantic for validation at system boundaries (API input, config)
- Dataclasses for internal domain objects
- Keep data classes focused — one model per concept, not a god-model

## Testing Rules

- Use `pytest` — not `unittest` style
- Fixtures over setup methods
- Parametrize for testing multiple inputs against the same logic
- Mock at the boundary (external APIs, file system, database) — not internal functions
- Test names describe behavior: `test_parse_rejects_empty_input`, not `test_parse_1`

## Workflow

1. Define types and data models
2. Implement the function or module
3. Add type annotations
4. Run the type checker
5. Write tests
6. Run linter and formatter

## Self-Check

1. All public functions have type annotations
2. No `Any` without justification
3. Exceptions are specific, not generic
4. No bare `except:` blocks
5. Async code does not block the event loop
6. Tests use pytest fixtures, not unittest patterns
