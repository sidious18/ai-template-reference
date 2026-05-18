Pytest Guidelines (Claude / LLM)
pytest 7+ | Fixtures | Parametrize | Mocking | Async | Coverage strategy

These guidelines are loaded by an AI when writing or refactoring Python tests
with pytest.
Goal: readable tests that describe behavior, composable fixtures, targeted
mocking at boundaries, and efficient coverage.

---

0. Defaults

- pytest 7+
- pytest-asyncio for async tests
- pytest-mock for mocking convenience
- Factory Boy or fixtures for test data
- Coverage target: 60-70% from targeted strategy

---

1. Test Organization

    src/
      mypackage/
        services.py
        repositories.py
    tests/
      conftest.py                   # shared fixtures
      test_services.py
      test_repositories.py
      integration/
        conftest.py                 # integration-specific fixtures
        test_api.py

Rules:
- Mirror source structure in test directory
- `conftest.py` per directory for scoped fixtures
- Separate unit tests from integration tests in directories
- Test file naming: `test_{module}.py`
- Test function naming: `test_{function}_{scenario}`

---

2. Fixture Patterns

**Simple fixture:**

    @pytest.fixture
    def user():
        return User(id=1, name="Alice", email="alice@example.com")

**Factory fixture:**

    @pytest.fixture
    def make_user():
        def _make(name="Alice", **overrides):
            defaults = {"id": 1, "name": name, "email": f"{name.lower()}@example.com"}
            return User(**(defaults | overrides))
        return _make

**Yield fixture (with teardown):**

    @pytest.fixture
    def db_session(engine):
        session = Session(engine)
        yield session
        session.rollback()
        session.close()

Rules:
- Use fixtures over setup methods — they are composable and explicit
- Scope appropriately: `function` (default) for isolation, `session` for expensive setup
- Factory fixtures for variable test data — avoid creating many similar standalone fixtures
- Yield fixtures for cleanup — the code after `yield` runs even if the test fails
- Max fixture chain depth: 3 — deeper chains are hard to debug
- Use `tmp_path` (function-scoped) or `tmp_path_factory` (session-scoped) for file ops

---

3. Parametrize

    @pytest.mark.parametrize("amount,expected", [
        (100, True),
        (0, False),
        (-1, False),
    ])
    def test_validate_amount(amount, expected):
        assert validate_amount(amount) == expected

    @pytest.mark.parametrize("status", [
        pytest.param("draft", id="draft-order"),
        pytest.param("cancelled", id="cancelled-order"),
    ])
    def test_cannot_confirm_non_pending(status):
        order = Order(status=status)
        with pytest.raises(InvalidStateError):
            confirm_order(order)

Rules:
- Parametrize for testing the same logic with different inputs
- Use `pytest.param(value, id="name")` for readable test IDs
- Keep parameter sets small and meaningful — not exhaustive enumeration
- Do not parametrize unrelated behaviors — write separate tests

---

4. Mocking

    def test_create_order_sends_email(mocker):
        # Mock at the boundary
        mock_send = mocker.patch("mypackage.services.email_client.send")
        mock_repo = mocker.patch("mypackage.services.order_repo.create")
        mock_repo.return_value = Order(id=1, status="confirmed")

        result = create_order(items=[...])

        mock_send.assert_called_once_with(
            to=result.customer_email,
            template="order_confirmed",
        )

Rules:
- Mock at the boundary: external APIs, databases, file system, clock, email
- Patch where the name is used, not where it is defined
- Prefer dependency injection over patching — it is more explicit and testable
- `mocker.patch` (pytest-mock) over `unittest.mock.patch` for fixture integration
- Assert mock calls explicitly — `assert_called_once_with`, `assert_not_called`
- Use `AsyncMock` for async dependencies

---

5. Async Testing

    @pytest.mark.asyncio
    async def test_fetch_user():
        user = await fetch_user("alice")
        assert user.name == "Alice"

    @pytest.mark.asyncio
    async def test_concurrent_fetch(mocker):
        mocker.patch("mypackage.client.get", new_callable=AsyncMock, return_value=mock_response)
        results = await asyncio.gather(fetch_a(), fetch_b())
        assert len(results) == 2

Rules:
- Set `asyncio_mode = "auto"` in `pyproject.toml` to avoid decorating every test
- Use `AsyncMock` for mocking async functions
- Test concurrent behavior with `asyncio.gather` in tests
- Use `anyio` backend fixture if supporting multiple async runtimes

---

6. Assertion Patterns

    # Plain assert — pytest rewrites for informative output
    assert result.status == "confirmed"
    assert len(items) == 3
    assert "email" in errors

    # Exception testing
    with pytest.raises(ValueError, match="must be positive"):
        process(-1)

    # Approximate comparison
    assert result.score == pytest.approx(3.14, abs=0.01)

    # Capturing logs
    def test_logs_warning(caplog):
        with caplog.at_level(logging.WARNING):
            process_risky_input()
        assert "risky" in caplog.text

Rules:
- Use plain `assert` — pytest makes failures readable
- One logical assertion per test (multiple `assert` lines for one behavior is fine)
- `pytest.raises` with `match` for exception message verification
- `pytest.approx` for floating point — never `==` on floats
- `caplog` for log assertions, `capsys` for stdout/stderr

---

7. Coverage Strategy

- Target 60-70% line coverage from intentional testing — not 100%
- Always cover: business logic, error paths, edge cases, parsing/serialization
- Skip: configuration, trivial getters, type-only modules
- Run: `pytest --cov=mypackage --cov-report=term-missing`
- Use `# pragma: no cover` sparingly and with a comment explaining why

---

8. Self-check before finishing

1. Tests describe behavior, not implementation details
2. Fixtures are properly scoped — no session-scoped fixtures with side effects
3. External dependencies mocked at the boundary
4. Parametrize used for multi-input testing
5. Async tests use `@pytest.mark.asyncio`
6. No file writes outside `tmp_path`
7. Mock calls asserted explicitly
8. Coverage focused on business logic and error paths
