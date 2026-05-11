# Django Refactoring

## Fat Views

**Problem:** Views contain ORM queries, business logic, validation, and response
formatting. They are untestable in isolation and grow to hundreds of lines.

**Rule:** Views must be **thin orchestrators** — extract logic to a `services.py` module.

### Before (violation)

    class OrderCreateView(APIView):
        def post(self, request):
            items = request.data.get('items', [])
            if not items:
                return Response({'error': 'Items required'}, status=400)

            total = Decimal('0')
            for item_data in items:
                product = Product.objects.get(id=item_data['product_id'])
                total += product.price * item_data['quantity']

            order = Order.objects.create(
                customer=request.user,
                total=total,
                status=Order.Status.DRAFT,
            )
            for item_data in items:
                OrderItem.objects.create(order=order, **item_data)

            send_order_confirmation.delay(order.id)
            serializer = OrderSerializer(order)
            return Response(serializer.data, status=201)

### After

    # views.py — thin
    class OrderCreateView(APIView):
        permission_classes = [IsAuthenticated]

        def post(self, request):
            serializer = CreateOrderSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            order = create_order(customer=request.user, items=serializer.validated_data['items'])
            return Response(OrderSerializer(order).data, status=201)

    # services.py — all logic here
    @transaction.atomic
    def create_order(*, customer: User, items: list[dict]) -> Order:
        total = calculate_total(items)
        order = Order.objects.create(customer=customer, total=total, status=Order.Status.DRAFT)
        OrderItem.objects.bulk_create([OrderItem(order=order, **item) for item in items])
        send_order_confirmation.delay(order.id)
        return order

---

## Fat Models

**Problem:** Models contain business methods, computed properties with side effects,
and query logic. They become god objects that are impossible to test without a database.

**Rule:** Models define **schema and constraints only**. Business logic lives in services.

### Before (violation)

    class Order(models.Model):
        # ... fields ...

        def confirm(self):
            if self.status != self.Status.DRAFT:
                raise ValueError("Can only confirm draft orders")
            self.status = self.Status.CONFIRMED
            self.save()
            self.customer.notify("Your order is confirmed")  # side effect in model
            for item in self.items.all():                     # query in model
                item.product.decrease_stock(item.quantity)    # cascade side effects

### After

    # models.py — schema only
    class Order(models.Model):
        # ... fields ...
        # No business methods

    # services.py
    @transaction.atomic
    def confirm_order(*, order_id: int) -> Order:
        order = Order.objects.select_for_update().get(id=order_id)
        if order.status != Order.Status.DRAFT:
            raise OrderAlreadyConfirmedError(order_id)
        order.status = Order.Status.CONFIRMED
        order.save(update_fields=["status"])
        decrease_stock_for_order(order)
        send_order_confirmation.delay(order_id=order.id)
        return order

---

## Raw ORM Queries in Views

**Problem:** Views contain complex `.filter()`, `.annotate()`, `.select_related()`
chains. Query logic is mixed with HTTP handling.

**Rule:** Extract read queries to a `selectors.py` module. Views call selectors,
not the ORM directly.

### Before (violation)

    class OrderListView(APIView):
        def get(self, request):
            orders = (
                Order.objects
                .filter(customer=request.user, status__in=['confirmed', 'shipped'])
                .select_related('customer')
                .prefetch_related('items__product')
                .annotate(item_count=Count('items'))
                .order_by('-created_at')[:50]
            )
            return Response(OrderSerializer(orders, many=True).data)

### After

    # selectors.py
    def get_active_orders_for_customer(*, customer: User, limit: int = 50) -> QuerySet[Order]:
        return (
            Order.objects
            .filter(customer=customer, status__in=['confirmed', 'shipped'])
            .select_related('customer')
            .prefetch_related('items__product')
            .annotate(item_count=Count('items'))
            .order_by('-created_at')[:limit]
        )

    # views.py
    class OrderListView(APIView):
        def get(self, request):
            orders = get_active_orders_for_customer(customer=request.user)
            return Response(OrderSerializer(orders, many=True).data)

---

## Refactoring Checklist

- No ORM queries in views — use services or selectors
- No business methods on models — logic in services
- Multi-step mutations wrapped in `@transaction.atomic`
- Views under 15 lines per method
- Service functions use keyword-only arguments
- Side effects (email, notifications) triggered from services, not models
