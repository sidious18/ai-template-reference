# JUnit 5 Refactoring

## Inheritance-Based Test Setup

**Problem:** Test classes extend a base test class that provides shared setup,
mocks, and utilities. The inheritance chain is fragile, hides dependencies, and
makes it hard to understand what each test actually needs.

**Rule:** Use `@ExtendWith` and composition, not inheritance for test setup.

### Before (violation)

    abstract class BaseServiceTest {
        @Mock OrderRepository orderRepository;
        @Mock PaymentGateway paymentGateway;
        @Mock EmailService emailService;
        @Mock AuditLogger auditLogger;

        @BeforeEach
        void baseSetUp() {
            MockitoAnnotations.openMocks(this);
        }
    }

    class OrderServiceTest extends BaseServiceTest {
        // Inherits 4 mocks — only uses 2
        // Cannot tell which dependencies are actually needed
        OrderService service = new OrderService(orderRepository, paymentGateway);
    }

### After

    @ExtendWith(MockitoExtension.class)
    class OrderServiceTest {
        @Mock OrderRepository orderRepository;      // only what this test needs
        @Mock PaymentGateway paymentGateway;
        @InjectMocks OrderService service;

        @Test
        void should_createOrder_when_valid() { ... }
    }

---

## JUnit Assertions Instead of AssertJ

**Problem:** Using JUnit's built-in assertions (`assertEquals`, `assertTrue`,
`assertThrows`) produces less readable tests and less informative failure messages.

**Rule:** Use **AssertJ** for all assertions.

### Before (violation)

    @Test
    void testOrderCreation() {
        Order order = service.create(items);

        assertEquals(OrderStatus.DRAFT, order.getStatus());
        assertEquals(2, order.getItems().size());
        assertTrue(order.getTotal().compareTo(BigDecimal.ZERO) > 0);
        assertNotNull(order.getCreatedAt());
    }

### After

    @Test
    void should_createDraftOrder_when_itemsValid() {
        var order = service.create(items);

        assertThat(order.getStatus()).isEqualTo(OrderStatus.DRAFT);
        assertThat(order.getItems()).hasSize(2);
        assertThat(order.getTotal()).isPositive();
        assertThat(order.getCreatedAt()).isNotNull();
    }

---

## @SpringBootTest Overuse

**Problem:** Every test class uses `@SpringBootTest`, loading the full application
context. Tests are slow (seconds to start) and brittle (any bean change breaks
unrelated tests).

**Rule:** Use the **narrowest test slice** that covers the behavior.

### Before (violation)

    @SpringBootTest                     // loads entire application
    class OrderControllerTest {
        @Autowired MockMvc mockMvc;     // only testing HTTP layer
        @MockBean OrderService service;

        @Test
        void should_return200() throws Exception {
            // Could use @WebMvcTest instead — 10x faster startup
        }
    }

### After

    @WebMvcTest(OrderController.class)  // loads only web layer
    class OrderControllerTest {
        @Autowired MockMvc mockMvc;
        @MockBean OrderService service;

        @Test
        void should_return200() throws Exception { ... }
    }

| Test target | Use |
|---|---|
| Controller HTTP mapping | `@WebMvcTest` |
| Repository queries | `@DataJpaTest` |
| JSON serialization | `@JsonTest` |
| Full application flow | `@SpringBootTest` (rare) |

---

## Refactoring Checklist

- No test base classes with inherited mocks — use `@ExtendWith(MockitoExtension.class)`
- AssertJ used for all assertions — no JUnit assertEquals/assertTrue
- `@WebMvcTest` / `@DataJpaTest` used instead of `@SpringBootTest` where possible
- Test methods named `should_X_when_Y`
- Each test declares only the mocks it needs
- No logic (if/for/try) in test methods
