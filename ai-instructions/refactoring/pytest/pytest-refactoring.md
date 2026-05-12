# Pytest Refactoring

## Tests Coupled to Implementation

**Problem:** Tests assert on internal implementation details (private method calls,
internal data structures, execution order). They break on every refactor even when
behavior is unchanged.

**Rule:** Test **behavior through the public API**, not internal implementation.

### Before (violation)

    def test_create_order(mocker):
        mock_validate = mocker.patch("myapp.services._validate_items")
        mock_calc = mocker.patch("myapp.services._calculate_total", return_value=100)
        mock_save = mocker.patch("myapp.services._save_to_db")

        create_order(items=[{"id": 1, "qty": 2}])

        # Testing internal call sequence — breaks if we rename or restructure internals
        mock_validate.assert_called_once()
        mock_calc.assert_called_once()
        mock_save.assert_called_once()

### After

    def test_create_order(mock_order_repo):
        # Mock only the boundary (repository)
        mock_order_repo.create.return_value = Order(id=1, status="draft", total=100)

        result = create_order(items=[{"id": 1, "qty": 2}])

        # Assert on observable behavior
        assert result.status == "draft"
        assert result.total == 100
        mock_order_repo.create.assert_called_once()

---

## Fixture Chain Too Deep

**Problem:** Fixtures depend on fixtures that depend on fixtures. Understanding what
a test gets requires tracing 4-5 levels of indirection across multiple conftest files.

**Rule:** Max fixture chain depth is **3**. Flatten or use factory fixtures.

### Before (violation)

    # conftest.py — 5 levels deep
    @pytest.fixture
    def engine(): ...

    @pytest.fixture
    def connection(engine): ...

    @pytest.fixture
    def session(connection): ...

    @pytest.fixture
    def user_repo(session): ...

    @pytest.fixture
    def order_service(user_repo): ...

    # Test receives order_service but has no idea what is behind it

### After

    # Flatten to 2 levels
    @pytest.fixture
    def db_session():
        engine = create_test_engine()
        session = Session(engine)
        yield session
        session.rollback()
        session.close()

    @pytest.fixture
    def order_service(db_session):
        repo = OrderRepository(db_session)
        return OrderService(repo)

---

## Duplicate Test Setup

**Problem:** Multiple tests repeat the same setup code — creating objects, setting
state, mocking the same dependencies. When the setup changes, every test must be
updated individually.

**Rule:** Extract repeated setup into **fixtures** or **factory functions**.

### Before (violation)

    def test_confirm_order():
        order = Order(id=1, status="draft", total=100, customer_id=42)
        repo = Mock()
        repo.get_by_id.return_value = order
        service = OrderService(repo)
        service.confirm(1)
        assert order.status == "confirmed"

    def test_cancel_order():
        order = Order(id=1, status="draft", total=100, customer_id=42)
        repo = Mock()
        repo.get_by_id.return_value = order
        service = OrderService(repo)
        service.cancel(1)
        assert order.status == "cancelled"

### After

    @pytest.fixture
    def draft_order():
        return Order(id=1, status="draft", total=100, customer_id=42)

    @pytest.fixture
    def order_service(draft_order):
        repo = Mock()
        repo.get_by_id.return_value = draft_order
        return OrderService(repo)

    def test_confirm_order(order_service, draft_order):
        order_service.confirm(1)
        assert draft_order.status == "confirmed"

    def test_cancel_order(order_service, draft_order):
        order_service.cancel(1)
        assert draft_order.status == "cancelled"

---

## Refactoring Checklist

- Tests assert on behavior, not internal implementation details
- Fixture chains max 3 levels deep
- Repeated setup extracted into fixtures or factories
- Mocks only at boundaries (external APIs, DB, file system)
- Each test is independent — no shared mutable state
- `parametrize` used for multi-input scenarios
