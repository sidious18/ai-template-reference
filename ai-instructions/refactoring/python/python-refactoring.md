# Python Refactoring

## Untyped Dictionary Passing

**Problem:** Functions pass `dict` objects with implicit key expectations. Callers
and consumers have no contract, leading to KeyError at runtime and impossible-to-trace
data shapes.

**Rule:** Replace `dict` parameters and returns with **dataclasses or TypedDict**.

### Before (violation)

    def process_payment(payment_data: dict) -> dict:
        amount = payment_data['amount']          # KeyError if missing
        currency = payment_data.get('currency')  # might be None
        result = gateway.charge(amount, currency)
        return {'success': True, 'transaction_id': result.id, 'amount': amount}

### After

    @dataclass(frozen=True)
    class PaymentRequest:
        amount: Decimal
        currency: str

    @dataclass(frozen=True)
    class PaymentResult:
        success: bool
        transaction_id: str
        amount: Decimal

    def process_payment(request: PaymentRequest) -> PaymentResult:
        result = gateway.charge(request.amount, request.currency)
        return PaymentResult(success=True, transaction_id=result.id, amount=request.amount)

---

## Bare Except Blocks

**Problem:** Bare `except:` or `except Exception:` catches everything including
`KeyboardInterrupt` and `SystemExit`, hiding real bugs and making debugging impossible.

**Rule:** Catch **specific exceptions** only. Add `from err` to preserve the chain.

### Before (violation)

    def fetch_user(user_id: str) -> User:
        try:
            response = http_client.get(f"/users/{user_id}")
            return User(**response.json())
        except Exception:
            return None  # swallows network errors, JSON errors, validation errors

### After

    def fetch_user(user_id: str) -> User | None:
        try:
            response = http_client.get(f"/users/{user_id}")
            response.raise_for_status()
        except httpx.HTTPStatusError as err:
            if err.response.status_code == 404:
                return None
            raise UserFetchError(user_id) from err
        except httpx.RequestError as err:
            raise UserFetchError(user_id) from err
        return User(**response.json())

---

## Sequential Async Calls

**Problem:** Independent async I/O operations are awaited sequentially, wasting time
that could be spent on concurrent execution.

**Rule:** Use `asyncio.gather` or `TaskGroup` for **independent concurrent I/O**.

### Before (violation)

    async def get_dashboard(user_id: str) -> Dashboard:
        profile = await fetch_profile(user_id)      # 200ms
        orders = await fetch_orders(user_id)         # 300ms
        notifications = await fetch_notifications(user_id)  # 150ms
        # Total: 650ms sequential
        return Dashboard(profile=profile, orders=orders, notifications=notifications)

### After

    async def get_dashboard(user_id: str) -> Dashboard:
        profile, orders, notifications = await asyncio.gather(
            fetch_profile(user_id),
            fetch_orders(user_id),
            fetch_notifications(user_id),
        )
        # Total: ~300ms concurrent
        return Dashboard(profile=profile, orders=orders, notifications=notifications)

---

## God Module

**Problem:** A single module contains models, services, utilities, and configuration
for an entire feature. It exceeds 500 lines and has mixed responsibilities.

**Rule:** Split by responsibility. One module, one concern. Max **300 lines** per module.

### Before

    # orders.py (800 lines)
    # Contains: Order model, OrderItem model, create_order(), confirm_order(),
    # cancel_order(), OrderSerializer, calculate_shipping(), format_receipt(),
    # ORDER_STATUSES, SHIPPING_RATES, ...

### After

    orders/
      __init__.py          # Public API: re-exports
      models.py            # Order, OrderItem dataclasses
      services.py          # create_order, confirm_order, cancel_order
      shipping.py          # calculate_shipping, SHIPPING_RATES
      serializers.py       # OrderSerializer, format_receipt
      constants.py         # ORDER_STATUSES

---

## Refactoring Checklist

- No `dict` as function parameter type when the shape is known — use dataclass or TypedDict
- No bare `except:` or `except Exception:` without re-raising
- Independent async I/O uses `gather` or `TaskGroup`
- No module over 300 lines — split by responsibility
- All public functions have type annotations
- Exception chains preserved with `from err`
