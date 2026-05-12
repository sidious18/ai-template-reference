# Backend Guide: Python + Django

Use this guide for backend implementation work in Django projects.

## Stack Assumptions

- Python 3.10+
- Django 4.2+ or 5.x
- Django REST Framework for APIs (if applicable)
- PostgreSQL (or project-specified database)
- Type hints enabled, mypy or pyright for checking

## Architecture Rules

- Follow Django's app-based structure — each app owns one domain
- Apps must not import from each other's internals — use public interfaces or signals
- Keep `views.py` thin — views orchestrate, services contain logic
- Business logic lives in service modules (`services.py`) or domain-specific modules, not in views or models
- Use `apps.py` for app configuration, `urls.py` for routing — keep both minimal

## Model Rules

- Models define data structure and database constraints, not business logic
- Use `Meta.constraints` and `Meta.indexes` for database-level integrity
- Prefer `CharField` with `choices` over boolean flags for state fields
- Custom managers and querysets go in `managers.py` — keep `models.py` focused on schema
- All fields must have explicit `help_text` when the purpose is not obvious from the name
- Use `related_name` on every ForeignKey and ManyToManyField

## View Rules

- Class-based views for CRUD and standard patterns, function-based for simple one-off endpoints
- DRF ViewSets for API resources — keep serializers in `serializers.py`
- Views call services — never put query logic or business rules in a view
- Use `get_object_or_404` and `get_list_or_404` — do not catch `DoesNotExist` manually in views
- Permissions and authentication are declared on the view, not checked inside

## URL Rules

- One `urls.py` per app, included from the project-level `urls.py`
- Use `path()` not `re_path()` unless regex is genuinely needed
- Name every URL pattern — templates and code reference names, never hardcoded paths
- Use `app_name` for URL namespacing

## Migration Rules

- Run `makemigrations` after every model change — do not edit migrations by hand unless required
- Each migration should be deployable independently (no data loss on rollback where possible)
- Data migrations go in their own migration file, separate from schema migrations
- Test migrations against a production-like database before deploying

## Testing Rules

- Use `pytest-django` with pytest-style fixtures (`db` / `transactional_db`).
  Do **not** inherit from Django's `TestCase` / `TransactionTestCase` —
  those classes extend `unittest.TestCase` and contradict the project's
  Python guidelines (`../guidelines/python/ai-python-guidelines.md`), which
  mandate pytest-exclusive testing.
- Prefer `baker` or `factory_boy` for test data — do not create fixtures manually
- Test views through DRF's `APIClient` (or Django's `Client` for non-DRF
  views), not by calling view functions directly
- Test services in isolation — mock external dependencies, not Django internals

## Workflow

1. Define or update the model
2. Create the migration
3. Write the service function with business logic
4. Wire the view to the service
5. Add URL route
6. Write tests for service and integration tests for the view
7. Run migrations and verify

## Self-Check

1. No business logic in views or models
2. All ForeignKey fields have `related_name` and `on_delete`
3. Migrations are clean and deployable
4. URLs use named patterns with `app_name` namespace
5. Views declare permissions, not check them inline
6. Tests cover the service layer and API contract
