# Testing Guide: JUnit 5

Use this guide for Java testing with JUnit 5 and Mockito.

## Stack Assumptions

- JUnit 5 (Jupiter)
- Mockito 5+ for mocking
- AssertJ for fluent assertions
- Spring Boot Test for integration tests (if applicable)
- H2 or Testcontainers for database tests

## Structure Rules

- Test classes mirror source structure: `src/test/java` mirrors `src/main/java`
- Class naming: `{ClassName}Test`
- Method naming: `should_{expectedBehavior}_when_{condition}`
- Group related tests in the same class — one test class per production class
- Use `@Nested` for sub-grouping within a test class

## Test Anatomy

    @ExtendWith(MockitoExtension.class)
    class OrderServiceTest {

        @Mock OrderRepository orderRepository;
        @Mock PaymentGateway paymentGateway;
        @InjectMocks OrderService orderService;

        @Test
        void should_confirmOrder_when_statusIsDraft() {
            // Arrange
            var order = OrderFixtures.draftOrder();
            when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

            // Act
            orderService.confirm(1L);

            // Assert
            assertThat(order.getStatus()).isEqualTo(OrderStatus.CONFIRMED);
            verify(orderRepository).save(order);
        }
    }

- Arrange-Act-Assert in every test
- One logical assertion per test — multiple `assertThat` is fine for one behavior
- No logic (if/for/try) in tests

## Mock Rules

- Use `@Mock` for dependencies, `@InjectMocks` for the class under test
- Use `@ExtendWith(MockitoExtension.class)` — not `MockitoAnnotations.openMocks()`
- Stub only what the test needs — do not stub methods that are not called
- Use `verify()` to assert interactions — but only when the interaction IS the behavior
- Avoid deep stubbing (`RETURNS_DEEP_STUBS`) — it hides design problems
- Use `ArgumentCaptor` to verify complex arguments

## Assertion Rules

- Use AssertJ (`assertThat`) — not JUnit's `assertEquals` / `assertTrue`
- Chain assertions for readability:

      assertThat(result)
          .isNotNull()
          .extracting(Order::getStatus, Order::getTotal)
          .containsExactly(OrderStatus.CONFIRMED, new BigDecimal("99.99"));

- Use `assertThatThrownBy` for exception assertions:

      assertThatThrownBy(() -> orderService.confirm(999L))
          .isInstanceOf(OrderNotFoundException.class)
          .hasMessageContaining("999");

## Integration Test Rules

- `@WebMvcTest` for controller tests — uses MockMvc, no full context
- `@DataJpaTest` for repository tests — uses embedded DB, sliced context
- `@SpringBootTest` only when full context is needed — sparingly
- Use `@Testcontainers` for tests that need a real database
- Annotate integration tests with `@Tag("integration")` for selective execution

## Test Data Rules

- Use fixture classes or builder patterns for test data — not inline construction
- Keep test data minimal — only set fields relevant to the test
- Use random or sequential IDs to avoid cross-test interference
- Clean up state between tests — `@BeforeEach` or `@Transactional` rollback

## Workflow

1. Write a failing test
2. Implement the minimum to pass
3. Refactor
4. Run tests: `mvn test` or `gradle test`
5. Check coverage on changed files

## Self-Check

1. Tests use `should_X_when_Y` naming
2. AssertJ used for assertions — not JUnit assertEquals
3. Mocks created with `@Mock` and `@ExtendWith(MockitoExtension.class)`
4. Integration tests use sliced contexts — not full `@SpringBootTest` everywhere
5. No logic in test methods
6. Test data created via fixtures, not inline construction
