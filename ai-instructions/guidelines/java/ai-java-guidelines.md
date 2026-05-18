Java / Spring Boot Guidelines (Claude / LLM)
Java 17+ | Spring Boot 3.x | Spring Data JPA | Layered architecture | JUnit 5

These guidelines are loaded by an AI when generating or refactoring Java backend
code.
Goal: strict layer separation, immutable DTOs, predictable dependency injection,
clean error handling, and testable service logic.

---

0. Defaults

- Java 17+ (LTS), prefer records for DTOs
- Spring Boot 3.x with Spring Web MVC
- Spring Data JPA + Hibernate
- PostgreSQL (or project-specified database)
- Constructor injection — no field injection
- JUnit 5 + Mockito for testing
- Maven or Gradle

---

1. Layered Architecture

    Controller → Service → Repository

Each layer has a single responsibility. No upward or cross-boundary imports.

- **Controller** — HTTP concerns only: parse request, call service, build response.
  No business logic, no repository access.
- **Service** — all business logic. Receives typed inputs, returns typed outputs.
  Annotated with `@Service`. Contains `@Transactional` for write operations.
- **Repository** — data access only. Extends `JpaRepository` or `CrudRepository`.
  Custom queries via `@Query`. No business logic.

Rules:
- Controllers never call repositories directly
- Services never access `HttpServletRequest` or HTTP headers
- Repositories never throw business exceptions — they return `Optional` or empty

---

2. Dependency Injection

Constructor injection exclusively:

    @Service
    public class OrderService {
        private final OrderRepository orderRepository;
        private final PaymentGateway paymentGateway;

        public OrderService(OrderRepository orderRepository, PaymentGateway paymentGateway) {
            this.orderRepository = orderRepository;
            this.paymentGateway = paymentGateway;
        }
    }

Rules:
- No `@Autowired` on fields — it hides dependencies and prevents immutability
- If using Lombok: `@RequiredArgsConstructor` is acceptable
- Keep constructor parameters under 5 — if more, the class has too many concerns
- Use interfaces for dependencies that have multiple implementations
- `@Component`, `@Service`, `@Repository` for Spring-managed beans only

---

3. DTOs and Records

Use Java records for request/response objects:

    public record CreateOrderRequest(
        @NotBlank String customerId,
        @NotEmpty List<OrderItemRequest> items
    ) {}

    public record OrderResponse(
        Long id,
        String status,
        BigDecimal total,
        Instant createdAt
    ) {}

Rules:
- DTOs are records — immutable, no setters
- Entities are never exposed in API responses — map to DTOs in the controller or
  a mapper
- Validation annotations (`@NotBlank`, `@NotNull`, `@Size`) go on DTO fields
- Use a mapper (MapStruct or manual) for Entity ↔ DTO conversion
- Keep DTOs flat — nested DTOs only when the relationship is meaningful to the client

---

4. Entity Design

    @Entity
    @Table(name = "orders")
    public class Order {
        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        @Enumerated(EnumType.STRING)
        @Column(nullable = false)
        private OrderStatus status = OrderStatus.DRAFT;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "customer_id", nullable = false)
        private Customer customer;

        @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
        private List<OrderItem> items = new ArrayList<>();
    }

Rules:
- `@Enumerated(EnumType.STRING)` — never `ORDINAL`
- `FetchType.LAZY` for `@ManyToOne` and `@OneToMany` by default
- Override `equals` and `hashCode` using the business key, not the auto-generated ID
- No business methods on entities — logic belongs in services
- Use `@Column(nullable = false)` to match database constraints
- Use `@Version` for optimistic locking on frequently updated entities

---

5. Exception Handling

Define domain exceptions and map them centrally:

    public class OrderNotFoundException extends RuntimeException {
        public OrderNotFoundException(Long id) {
            super("Order not found: " + id);
        }
    }

    @RestControllerAdvice
    public class GlobalExceptionHandler {
        @ExceptionHandler(OrderNotFoundException.class)
        public ResponseEntity<ErrorResponse> handle(OrderNotFoundException ex) {
            return ResponseEntity.status(404).body(new ErrorResponse("NOT_FOUND", ex.getMessage()));
        }

        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<ErrorResponse> handle(MethodArgumentNotValidException ex) {
            // Map validation errors to structured response
        }
    }

Rules:
- Services throw domain exceptions — never `ResponseStatusException`
- `@RestControllerAdvice` maps exceptions to HTTP responses — controllers do not try/catch
- Use `RuntimeException` subclasses — avoid checked exceptions for business logic
- Include an error code and message in every error response
- Log the full stack trace server-side, return only safe details to the client

---

6. Transaction Management

- `@Transactional` on service methods, not repositories
- Read-only operations use `@Transactional(readOnly = true)` for performance
- Avoid long-running transactions — keep them focused on the write path
- Let Spring manage transaction boundaries — do not manually open/close
- Be aware of `@Transactional` on `private` methods — it has no effect (proxy-based)

---

7. Testing

    @ExtendWith(MockitoExtension.class)
    class OrderServiceTest {
        @Mock OrderRepository orderRepository;
        @Mock PaymentGateway paymentGateway;
        @InjectMocks OrderService orderService;

        @Test
        void should_confirmOrder_when_statusIsDraft() {
            // Arrange
            var order = new Order();
            order.setStatus(OrderStatus.DRAFT);
            when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

            // Act
            orderService.confirmOrder(1L);

            // Assert
            assertThat(order.getStatus()).isEqualTo(OrderStatus.CONFIRMED);
        }
    }

Rules:
- Unit tests for services — mock repositories and external dependencies
- `@WebMvcTest` + `MockMvc` for controller integration tests
- `@DataJpaTest` for repository tests with an embedded database
- `@SpringBootTest` sparingly — only for full-context integration tests
- Test names: `should_expectedBehavior_when_condition`
- Use AssertJ for assertions — not JUnit's `assertEquals`

---

8. Configuration

- Use `application.yml` with Spring profiles (`dev`, `test`, `prod`)
- Externalize secrets via environment variables or a secrets manager
- Create `@ConfigurationProperties` classes for typed config:

      @ConfigurationProperties(prefix = "app.payments")
      public record PaymentConfig(String apiKey, String baseUrl, Duration timeout) {}

- Validate config at startup with `@Validated` and Jakarta validation annotations
- Fail fast on missing required config

---

9. Self-check before finishing

1. No business logic in controllers or repositories
2. All injection is constructor-based
3. DTOs are records — entities never exposed in API
4. Enums use `STRING` mapping
5. `@Transactional` on service methods, not repository methods
6. Exception handling via `@RestControllerAdvice`
7. Lazy fetch by default for associations
8. Tests cover service logic and API contract
9. Configuration is typed and validated at startup
