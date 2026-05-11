Django Guidelines (Claude / LLM)
Django 4.2+ / 5.x | DRF | PostgreSQL | Type hints | Service layer

These guidelines are loaded by an AI when generating or refactoring Django code.
Goal: thin views, rich services, clean model definitions, safe migrations, and
consistent API contracts.

---

0. Defaults

- Python 3.10+
- Django 4.2+ or 5.x
- Django REST Framework for APIs
- PostgreSQL as the database
- Type hints on all public functions
- pytest-django for testing
- Factory Boy or Model Bakery for test data

---

1. App Structure

Each Django app owns one bounded domain context.

    myapp/
      models.py          # Data schema, constraints, managers
      services.py        # Business logic (the core)
      selectors.py       # Read-only queries (optional, for complex reads)
      serializers.py     # DRF serializers — API shape
      views.py           # Thin HTTP handlers
      urls.py            # URL patterns
      admin.py           # Admin configuration
      tests/
        test_services.py
        test_views.py

Rules:
- Apps must not import each other's models directly — use the public interface
  or `get_model()`
- The `services.py` pattern is mandatory — views call services, never ORM directly
- `selectors.py` is optional but recommended when read queries grow complex
- `signals.py` only for cross-app decoupled communication — prefer explicit service calls

---

2. Model Design

Models define data structure and database constraints. Business logic belongs
in services.

    class Order(models.Model):
        class Status(models.TextChoices):
            DRAFT = "draft"
            CONFIRMED = "confirmed"
            SHIPPED = "shipped"

        customer = models.ForeignKey(
            "customers.Customer",
            on_delete=models.PROTECT,
            related_name="orders",
        )
        status = models.CharField(
            max_length=20,
            choices=Status.choices,
            default=Status.DRAFT,
        )
        total = models.DecimalField(max_digits=10, decimal_places=2)
        created_at = models.DateTimeField(auto_now_add=True)

        class Meta:
            ordering = ["-created_at"]
            indexes = [models.Index(fields=["status", "created_at"])]

Rules:
- Every ForeignKey has explicit `on_delete` and `related_name`
- Use `TextChoices` for status fields — never boolean flags for multi-state
- Add `Meta.indexes` for frequently filtered fields
- Add `Meta.constraints` for database-level invariants
- Custom managers in `managers.py` — keep `models.py` focused on schema
- No business methods on models — compute in services

---

3. Service Layer

Services are plain Python functions (or classes for complex workflows). They
receive typed inputs and return typed outputs.

    def confirm_order(*, order_id: int, confirmed_by: User) -> Order:
        order = Order.objects.select_for_update().get(id=order_id)
        if order.status != Order.Status.DRAFT:
            raise OrderAlreadyConfirmedError(order_id=order_id)
        order.status = Order.Status.CONFIRMED
        order.save(update_fields=["status"])
        send_confirmation_email.delay(order_id=order.id)
        return order

Rules:
- Use keyword-only arguments (`*`) for clarity
- Wrap multi-step mutations in `@transaction.atomic`
- Raise domain-specific exceptions, not Django or HTTP exceptions
- Services never access `request` — they receive the data they need
- Side effects (email, notifications) are triggered from services, not views

---

4. View Layer

Views are thin — extract input, call service, return response.

    class OrderConfirmView(APIView):
        permission_classes = [IsAuthenticated, IsOrderOwner]

        def post(self, request, order_id):
            order = confirm_order(order_id=order_id, confirmed_by=request.user)
            return Response(OrderSerializer(order).data, status=200)

Rules:
- DRF `APIView` or `ViewSet` for APIs
- Permissions declared on the view class — not checked inside the handler
- Views do not contain `filter()`, `get()`, or any ORM calls
- Use serializers for input validation (`serializer.is_valid(raise_exception=True)`)
- Return DRF `Response` with explicit status codes

---

5. Serializer Patterns

- **Input serializers** validate and parse request data
- **Output serializers** shape the response — they can differ from input
- Nested serializers for related objects — but keep nesting shallow (max 2 levels)
- Use `SerializerMethodField` for computed values
- Never expose internal model fields (passwords, tokens) in output serializers

---

6. URL Patterns

    # orders/urls.py
    app_name = "orders"

    urlpatterns = [
        path("", OrderListView.as_view(), name="list"),
        path("<int:order_id>/", OrderDetailView.as_view(), name="detail"),
        path("<int:order_id>/confirm/", OrderConfirmView.as_view(), name="confirm"),
    ]

Rules:
- Every URL has a `name` — never hardcode paths in templates or code
- Use `app_name` for namespacing
- Use `path()` not `re_path()` unless regex is needed
- RESTful URL structure: nouns for resources, verbs only for non-CRUD actions

---

7. Migrations

- Run `makemigrations` after every model change
- One migration per logical change — do not squash prematurely
- Data migrations go in separate migration files
- Test migrations against a production-sized dataset before deploying
- Prefer additive changes — avoid dropping columns in the same deploy as the code change

---

8. Testing

- Test services in isolation — they are the core logic
- Test views through DRF's `APIClient` — not by calling view functions
- Use Factory Boy or Model Bakery for test data — not manual `Model.objects.create()`
- Parametrize tests for multiple input scenarios
- Test permission classes separately from view logic

---

9. Self-check before finishing

1. No ORM queries in views — all data access through services or selectors
2. All ForeignKeys have `on_delete` and `related_name`
3. Service functions use keyword-only arguments
4. Multi-step mutations wrapped in `@transaction.atomic`
5. Domain-specific exceptions, not generic `ValueError` or `Http404`
6. Migrations are clean and separate from data migrations
7. Tests cover service logic and API contract
8. No business logic in models
