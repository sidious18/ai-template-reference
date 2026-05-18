# Testing Guide: Pytest

Use this guide for Python testing with pytest.

## Stack Assumptions

- pytest 7+
- pytest-asyncio for async tests
- pytest-cov for coverage
- Factory Boy or Model Bakery for test data
- mock / pytest-mock for mocking

## Structure Rules

- Test files live next to source or in a `tests/` directory mirroring the source structure
- File naming: `test_{module}.py`
- Test naming: `test_{function}_{scenario}` — describe behavior, not implementation
- Use `conftest.py` for shared fixtures — scoped to the directory
- Group related tests with classes only when they share setup — prefer flat functions

## Fixture Rules

- Fixtures over setup methods — they are composable and explicit
- Scope fixtures appropriately: `function` (default), `class`, `module`, `session`
- Use `yield` fixtures for setup/teardown:

      @pytest.fixture
      def db_session():
          session = create_session()
          yield session
          session.rollback()

- Avoid fixture chains deeper than 3 — flatten or restructure
- Factory fixtures create test data: `@pytest.fixture` that returns a factory function
- Use `tmp_path` for file operations — never write to the project directory

## Assertion Rules

- Use plain `assert` — pytest rewrites them for informative failure messages
- One logical assertion per test — multiple `assert` is fine if they verify one behavior
- Use `pytest.raises` for expected exceptions:

      with pytest.raises(ValueError, match="must be positive"):
          process_payment(amount=-1)

- Use `pytest.approx` for floating point comparisons
- Avoid assertion helper functions that hide what is being tested

## Parametrize Rules

- Use `@pytest.mark.parametrize` for testing multiple inputs:

      @pytest.mark.parametrize("input,expected", [
          ("valid@email.com", True),
          ("not-an-email", False),
          ("", False),
      ])
      def test_validate_email(input, expected):
          assert validate_email(input) == expected

- Keep parameter sets readable — use `pytest.param` with `id` for complex cases
- Do not parametrize unrelated tests — create separate test functions

## Mocking Rules

- Mock at the boundary: external APIs, databases, file system, clock
- Do not mock internal functions — test them through the public API
- Use `pytest-mock` (`mocker` fixture) or `unittest.mock.patch`
- Patch where the object is used, not where it is defined
- Prefer dependency injection over patching when possible
- Assert mock calls explicitly — `mock.assert_called_once_with(...)`

## Async Rules

- Use `@pytest.mark.asyncio` for async tests
- Configure `asyncio_mode = "auto"` in `pyproject.toml` to avoid decorating every test
- Use `anyio` backend if testing with both asyncio and trio
- Mock async dependencies with `AsyncMock`

## Workflow

1. Write a failing test (RED)
2. Implement the minimum code to pass (GREEN)
3. Refactor without changing behavior (REFACTOR)
4. Run the full test suite
5. Check coverage for untested paths

## Self-Check

1. Tests describe behavior, not implementation
2. Fixtures are properly scoped and not over-chained
3. External dependencies are mocked at the boundary
4. Parametrize used for multi-input scenarios
5. Async tests use `@pytest.mark.asyncio`
6. No tests write to the project directory — use `tmp_path`
