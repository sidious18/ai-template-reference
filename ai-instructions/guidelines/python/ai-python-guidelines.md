Python Guidelines (Claude / LLM)
Python 3.10+ | Type hints | Async | Data classes | Pytest

These guidelines are loaded by an AI when generating or refactoring Python code.
Goal: strict typing, clean module boundaries, predictable error handling,
idiomatic async patterns, and testable code.

---

0. Defaults

- Python 3.10+
- Type hints required on all public APIs
- Strict type checker (mypy or pyright)
- Ruff for linting and formatting
- Pytest for testing
- Dataclasses for internal models, Pydantic for boundary validation

---

1. Type System

Use the modern syntax — not the typing module equivalents:

    # Correct
    def process(items: list[str], config: dict[str, int] | None = None) -> bool: ...

    # Wrong
    from typing import List, Dict, Optional
    def process(items: List[str], config: Optional[Dict[str, int]] = None) -> bool: ...

Rules:
- All public functions: annotate parameters and return type
- Private functions: annotate when the type is not obvious
- Use `str | None` not `Optional[str]`
- Use `TypedDict` for dictionary shapes with known keys
- Use `Protocol` for structural subtyping — avoid abstract base classes
- `Any` requires a comment explaining why narrowing is not possible
- Use `TypeAlias` for complex type expressions
- Use `@overload` when a function's return type depends on input types

---

2. Data Modeling

Two tools for two purposes:

- **Pydantic `BaseModel`** — validation at system boundaries (API input, config,
  external data)
- **`dataclass`** — internal domain objects (no validation, just structure)

Rules:
- Frozen dataclasses (`frozen=True`) for immutable value objects
- Pydantic models validate on construction — use them at the edge, not everywhere
- Keep models focused: one model per concept
- Use `Enum` or `Literal` for constrained values, not raw strings
- Domain types used internally; Pydantic DTOs at the boundary. Map between them
  at the service layer.

    @dataclass(frozen=True)
    class Money:
        amount: Decimal
        currency: str

    class PaymentRequest(BaseModel):
        amount: Decimal = Field(gt=0)
        currency: str = Field(pattern=r"^[A-Z]{3}$")

---

3. Module Organization

    src/
      mypackage/
        __init__.py          # Public API — re-export only what consumers need
        models.py            # Domain types
        services.py          # Business logic
        repositories.py      # Data access
        exceptions.py        # Domain exceptions
        _internal.py         # Private helpers (underscore prefix)

Rules:
- One module, one responsibility
- `__init__.py` defines the public API — internal modules are private
- No circular imports — extract shared types to a common module
- Import order: stdlib → third-party → local (enforced by ruff/isort)
- Prefer absolute imports over relative imports

---

4. Error Handling

Define a domain exception hierarchy:

    class AppError(Exception):
        """Base for all domain exceptions."""

    class NotFoundError(AppError):
        def __init__(self, entity: str, id: str):
            super().__init__(f"{entity} {id} not found")

    class ValidationError(AppError):
        def __init__(self, field: str, reason: str):
            super().__init__(f"Validation failed: {field} — {reason}")

Rules:
- Catch specific exceptions — never bare `except:` or `except Exception:`
  without re-raising
- Use `raise ... from err` to preserve the exception chain
- Log at the boundary (API handler, CLI, task runner), not deep in the stack
- Do not use exceptions for flow control — check conditions first
- Return `None` or a sentinel from lookup functions instead of raising for
  "not found" in internal code. Raise at the service boundary.

---

5. Async Patterns

- Use `async/await` consistently — do not mix sync and async in the same flow
- CPU-bound work goes to `ProcessPoolExecutor`, not the event loop
- Use `asyncio.gather` (or `TaskGroup` in 3.11+) for concurrent I/O:

      async def fetch_all(urls: list[str]) -> list[Response]:
          async with aiohttp.ClientSession() as session:
              tasks = [session.get(url) for url in urls]
              return await asyncio.gather(*tasks)

- Always set timeouts: `asyncio.wait_for(coro, timeout=10)`
- Use `async with` for connections, sessions, and files
- Avoid `asyncio.sleep` for polling — use events or queues

---

6. Functions and Arguments

- Max 5 positional parameters. Beyond that, use keyword-only:

      def create_report(
          *, title: str, data: ReportData, format: OutputFormat = OutputFormat.PDF,
      ) -> Report: ...

- Use `*` to force keyword arguments for functions with many parameters
- Return typed results — not tuples of mixed types
- Use `@staticmethod` and `@classmethod` correctly — most helper functions should
  be module-level functions, not methods
- Avoid mutable default arguments (`def f(x=[])`). Use `None` and create inside.

---

7. Testing

- Use `pytest` exclusively — no `unittest.TestCase` inheritance
- Fixtures for setup, `conftest.py` for shared fixtures
- `@pytest.mark.parametrize` for testing multiple inputs
- Mock at the boundary (HTTP, file system, database), not internal functions
- Test names describe behavior: `test_validate_rejects_negative_amount`
- Use `tmp_path` fixture for file operations — never write to the project directory
- Async tests: use `pytest-asyncio` with `@pytest.mark.asyncio`

---

8. Logging and Observability

- Use `structlog` or `logging` with structured output (JSON in production)
- Logger per module: `logger = structlog.get_logger(__name__)`
- Include context (request ID, user, entity ID) in log entries
- Log levels: `error` for failures, `warning` for degraded, `info` for events,
  `debug` for development
- Never log secrets, passwords, or tokens

---

9. Self-check before finishing

1. All public functions have type annotations
2. No `Any` without justification comment
3. No bare `except:` blocks
4. Pydantic at boundaries, dataclasses internally
5. No circular imports
6. Async code does not block the event loop
7. Functions with 4+ parameters use keyword-only arguments
8. Tests use pytest fixtures, not unittest patterns
9. Domain exceptions are specific, not generic
