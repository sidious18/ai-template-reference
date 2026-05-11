# Java / Spring Boot Refactoring

## Field Injection

**Problem:** Using `@Autowired` on fields hides dependencies, prevents immutability,
and makes classes impossible to instantiate in tests without Spring context.

**Rule:** Use **constructor injection** exclusively. Fields are `private final`.

### Before (violation)

    @Service
    public class OrderService {
        @Autowired
        private OrderRepository orderRepository;

        @Autowired
        private PaymentGateway paymentGateway;

        @Autowired
        private NotificationService notificationService;
    }

### After

    @Service
    public class OrderService {
        private final OrderRepository orderRepository;
        private final PaymentGateway paymentGateway;
        private final NotificationService notificationService;

        public OrderService(
            OrderRepository orderRepository,
            PaymentGateway paymentGateway,
            NotificationService notificationService
        ) {
            this.orderRepository = orderRepository;
            this.paymentGateway = paymentGateway;
            this.notificationService = notificationService;
        }
    }

With Lombok:

    @Service
    @RequiredArgsConstructor
    public class OrderService {
        private final OrderRepository orderRepository;
        private final PaymentGateway paymentGateway;
        private final NotificationService notificationService;
    }

---

## Entities Exposed in API

**Problem:** JPA entities are returned directly from controllers, leaking database
structure, lazy-loading proxies, and internal fields to the client.

**Rule:** Map entities to **DTO records** in the controller or a mapper. Never return entities from API endpoints.

### Before (violation)

    @GetMapping("/orders/{id}")
    public Order getOrder(@PathVariable Long id) {
        return orderRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        // Exposes: Hibernate proxy, all fields including internal ones,
        // potential LazyInitializationException on serialization
    }

### After

    public record OrderResponse(
        Long id,
        String status,
        BigDecimal total,
        Instant createdAt,
        String customerName
    ) {}

    @GetMapping("/orders/{id}")
    public OrderResponse getOrder(@PathVariable Long id) {
        Order order = orderService.getById(id);
        return new OrderResponse(
            order.getId(),
            order.getStatus().name(),
            order.getTotal(),
            order.getCreatedAt(),
            order.getCustomer().getName()
        );
    }

---

## Logic in Controllers

**Problem:** Controllers contain business logic, database queries, and conditional
branching instead of delegating to services.

**Rule:** Controllers are **thin** — parse input, call service, return response. Max **15 lines** per method.

### Before (violation)

    @PostMapping("/orders/{id}/confirm")
    public ResponseEntity<?> confirmOrder(@PathVariable Long id) {
        Optional<Order> orderOpt = orderRepository.findById(id);
        if (orderOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Order order = orderOpt.get();
        if (order.getStatus() != OrderStatus.DRAFT) {
            return ResponseEntity.badRequest().body("Order is not in draft status");
        }
        order.setStatus(OrderStatus.CONFIRMED);
        orderRepository.save(order);
        emailService.sendConfirmation(order.getCustomer().getEmail(), order.getId());
        return ResponseEntity.ok(order);
    }

### After

    @PostMapping("/orders/{id}/confirm")
    public OrderResponse confirmOrder(@PathVariable Long id) {
        Order order = orderService.confirm(id);
        return OrderResponse.from(order);
    }

    // Service handles all logic
    @Service @RequiredArgsConstructor
    public class OrderService {
        @Transactional
        public Order confirm(Long id) {
            Order order = orderRepository.findById(id)
                .orElseThrow(() -> new OrderNotFoundException(id));
            if (order.getStatus() != OrderStatus.DRAFT) {
                throw new InvalidOrderStateException(id, order.getStatus(), OrderStatus.DRAFT);
            }
            order.setStatus(OrderStatus.CONFIRMED);
            emailService.sendConfirmation(order.getCustomer().getEmail(), order.getId());
            return orderRepository.save(order);
        }
    }

---

## Enum Ordinal Mapping

**Problem:** `@Enumerated(EnumType.ORDINAL)` maps enums to integers. Adding or
reordering enum values silently corrupts existing database records.

**Rule:** Always use `@Enumerated(EnumType.STRING)`.

### Before (violation)

    @Enumerated  // defaults to ORDINAL — position-based mapping
    private OrderStatus status;

### After

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OrderStatus status;

---

## Refactoring Checklist

- All injection is constructor-based — no `@Autowired` on fields
- Entities never returned from API endpoints — mapped to DTO records
- Controllers under 15 lines per method — logic in services
- All enums use `@Enumerated(EnumType.STRING)`
- `@Transactional` on service methods, not repositories
- Domain exceptions with `@RestControllerAdvice`, not `ResponseStatusException`
