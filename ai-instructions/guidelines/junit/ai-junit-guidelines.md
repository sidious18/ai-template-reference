JUnit 5 Guidelines (Claude / LLM)
JUnit 5 | Mockito | AssertJ | Spring Boot Test | Testcontainers

These guidelines are loaded by an AI when writing or refactoring Java tests.
Goal: clear test structure, correct use of Spring test slices, composable
mocking, and efficient coverage.

---

0. Defaults

- JUnit 5 (Jupiter)
- Mockito 5+ with `MockitoExtension`
- AssertJ for assertions
- Spring Boot Test for integration tests
- H2 for lightweight DB tests, Testcontainers for production-like DB tests
- Coverage target: 60-70% from targeted strategy

---

1. Test Organization

    src/test/java/
      com/example/
        services/
          OrderServiceTest.java         # unit tests
        controllers/
          OrderControllerTest.java      # @WebMvcTest
        repositories/
          OrderRepositoryTest.java      # @DataJpaTest
        integration/
          OrderFlowTest.java            # @SpringBootTest (rare)

Rules:
- Mirror source package structure in test directory
- One test class per production class
- Unit tests for services, integration tests for controllers and repositories
- `@SpringBootTest` only for full flow tests — use sliced annotations for everything else
- Tag integration tests: `@Tag("integration")`

---

2. Test Anatomy

    @ExtendWith(MockitoExtension.class)
    class OrderServiceTest {

        @Mock OrderRepository orderRepository;
        @Mock PaymentGateway paymentGateway;
        @InjectMocks OrderService orderService;

        @Test
        void should_createOrder_when_itemsAreValid() {
            // Arrange
            var items = List.of(new OrderItem("product-1", 2));
            when(orderRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            // Act
            var order = orderService.createOrder(items);

            // Assert
            assertThat(order.getStatus()).isEqualTo(OrderStatus.DRAFT);
            assertThat(order.getItems()).hasSize(1);
            verify(orderRepository).save(any(Order.class));
        }
    }

Rules:
- `@ExtendWith(MockitoExtension.class)` — not `@RunWith` or `openMocks`
- Arrange-Act-Assert — clearly separated with blank lines
- One behavior per test — multiple assertions for one behavior is fine
- Method names: `should_{behavior}_when_{condition}`
- No logic (if/for/try) in tests

---

3. AssertJ Assertions

    // Basic
    assertThat(result).isNotNull();
    assertThat(result.getStatus()).isEqualTo(OrderStatus.CONFIRMED);
    assertThat(items).hasSize(3).extracting(Item::getName).contains("Widget");

    // Exception
    assertThatThrownBy(() -> orderService.confirm(999L))
        .isInstanceOf(OrderNotFoundException.class)
        .hasMessageContaining("999");

    // Collection
    assertThat(orders)
        .filteredOn(o -> o.getStatus() == OrderStatus.ACTIVE)
        .extracting(Order::getTotal)
        .allSatisfy(total -> assertThat(total).isPositive());

Rules:
- Use AssertJ exclusively — not JUnit's `assertEquals`, `assertTrue`, `assertThrows`
- Chain assertions for readability
- Use `extracting()` for collection element properties
- Use `satisfies()` for complex object assertions
- Use `assertThatThrownBy` or `assertThatCode().doesNotThrowAnyException()` for exception testing

---

4. Mockito Patterns

    // Stubbing
    when(repo.findById(1L)).thenReturn(Optional.of(order));
    when(repo.findById(999L)).thenReturn(Optional.empty());
    when(gateway.charge(any())).thenThrow(new PaymentFailedException());

    // Verification
    verify(repo).save(any(Order.class));
    verify(repo, never()).delete(any());
    verify(emailService, times(1)).send(argThat(email ->
        email.getTemplate().equals("confirmation")
    ));

    // Argument capture
    var captor = ArgumentCaptor.forClass(Order.class);
    verify(repo).save(captor.capture());
    assertThat(captor.getValue().getStatus()).isEqualTo(OrderStatus.CONFIRMED);

Rules:
- Stub only what the test needs — do not stub methods that are never called
- Use `verify()` when the interaction IS the behavior being tested
- Use `ArgumentCaptor` for complex argument assertions
- Avoid `RETURNS_DEEP_STUBS` — it hides design problems
- Use `@Mock` + `@InjectMocks` — not manual `Mockito.mock()` calls

---

5. Spring Test Slices

| Annotation | Scope | Use for |
|---|---|---|
| `@WebMvcTest(Controller.class)` | Controller + filters | Testing HTTP mapping, validation, serialization |
| `@DataJpaTest` | JPA + embedded DB | Testing repository queries, entity mapping |
| `@JsonTest` | Jackson ObjectMapper | Testing JSON serialization/deserialization |
| `@SpringBootTest` | Full application context | Full integration flows (use sparingly) |

    @WebMvcTest(OrderController.class)
    class OrderControllerTest {
        @Autowired MockMvc mockMvc;
        @MockBean OrderService orderService;

        @Test
        void should_return200_when_orderExists() throws Exception {
            when(orderService.getById(1L)).thenReturn(mockOrder);

            mockMvc.perform(get("/api/orders/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("confirmed"));
        }
    }

Rules:
- Use the narrowest slice that covers the behavior
- `@MockBean` for dependencies in sliced tests
- `@SpringBootTest` only when slices cannot cover the scenario
- Use `@Testcontainers` for tests needing a real PostgreSQL/MongoDB

---

6. Test Data

    class OrderFixtures {
        static Order draftOrder() {
            var order = new Order();
            order.setStatus(OrderStatus.DRAFT);
            order.setTotal(new BigDecimal("99.99"));
            return order;
        }

        static Order confirmedOrder() {
            var order = draftOrder();
            order.setStatus(OrderStatus.CONFIRMED);
            return order;
        }
    }

Rules:
- Use fixture classes or builder patterns — not inline construction in tests
- Keep fixtures minimal — only set fields relevant to the test scenario
- Name fixture methods after the scenario: `draftOrder()`, `expiredToken()`
- Share fixtures via static methods, not inheritance

---

7. Coverage Strategy

- Target 60-70% from intentional testing
- Always cover: service logic, validation, error handling, state transitions
- Skip: getters/setters, configuration classes, framework-generated code
- Run: `mvn test jacoco:report` or `gradle jacocoTestReport`
- Focus on branch coverage for conditional logic

---

8. Self-check before finishing

1. Unit tests use `MockitoExtension`, not full Spring context
2. AssertJ used exclusively — no JUnit assertEquals
3. Test names follow `should_X_when_Y`
4. One behavior per test method
5. `@WebMvcTest` / `@DataJpaTest` over `@SpringBootTest`
6. Test data from fixtures — not inline construction
7. Mocks verified explicitly where interaction is the behavior
8. No logic in test methods
