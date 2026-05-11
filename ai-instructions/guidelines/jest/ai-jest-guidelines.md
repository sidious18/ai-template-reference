AI Jest Guidelines (Claude / LLM)
Jest 29+ | TypeScript | Mocking | Async | Snapshots | Coverage strategy

These guidelines are loaded by an AI when writing or refactoring JavaScript/TypeScript
tests with Jest.
Goal: behavior-driven tests, predictable mocking, minimal snapshot usage, and
efficient coverage strategy.

---

0. Defaults

- Jest 29+ with ts-jest or @swc/jest
- TypeScript strict mode in tests
- ESM or CJS depending on project config
- Coverage target: 60-70% from targeted strategy

---

1. Test Organization

    src/
      services/
        orderService.ts
        orderService.test.ts       # co-located
      utils/
        __tests__/
          formatters.test.ts       # or in __tests__

Rules:
- Co-locate test files next to source — or use `__tests__/` subdirectory
- One test file per module
- `describe` groups by function or class
- `it` describes one behavior: `it('should reject empty items')`
- Arrange-Act-Assert structure in every test
- Max `describe` nesting: 2 levels

---

2. Describe / It Structure

    describe('OrderService', () => {
      describe('createOrder', () => {
        it('should create order with valid items', async () => {
          // Arrange
          const items = [{ productId: '1', quantity: 2 }];

          // Act
          const order = await orderService.createOrder(items);

          // Assert
          expect(order.status).toBe('draft');
          expect(order.items).toHaveLength(1);
        });

        it('should throw when items array is empty', async () => {
          await expect(orderService.createOrder([])).rejects.toThrow('Items required');
        });
      });
    });

Rules:
- `describe` for grouping — not for setup sharing (use `beforeEach` instead)
- Each `it` is independent — no test depends on another's state
- Test name reads as a sentence: "OrderService createOrder should create order with valid items"
- No conditional logic (if/for) inside tests

---

3. Mocking

**Module mock:**

    jest.mock('../repositories/orderRepository');

    const mockRepo = jest.mocked(orderRepository);
    mockRepo.create.mockResolvedValue(mockOrder);

**Spy:**

    const spy = jest.spyOn(emailService, 'send').mockResolvedValue(undefined);
    // ... run code ...
    expect(spy).toHaveBeenCalledWith({ to: 'user@test.com', template: 'confirmation' });

Rules:
- Mock at the boundary: HTTP clients, databases, file system, external services
- Do not mock internal functions — test through the public API
- Use `jest.mocked()` for TypeScript type safety on mocked modules
- Clear mocks between tests: `afterEach(() => jest.restoreAllMocks())`
- Prefer dependency injection over `jest.mock()` when architecture allows
- Mock return values close to the test that uses them — not in global `beforeAll`

---

4. Async Testing

    it('should fetch user data', async () => {
      const user = await userService.getById('123');
      expect(user.name).toBe('Alice');
    });

    it('should reject invalid input', async () => {
      await expect(userService.getById('')).rejects.toThrow(ValidationError);
    });

Rules:
- Always use `async/await` — never callbacks or raw `.then()`
- Use `rejects.toThrow()` for rejected promise assertions
- Use `jest.useFakeTimers()` for time-dependent tests
- Always `jest.useRealTimers()` in `afterEach` when using fake timers
- Use `jest.advanceTimersByTime(ms)` to control timer progression

---

5. Snapshot Testing

    it('should render the order summary', () => {
      const result = renderOrderSummary(mockOrder);
      expect(result).toMatchInlineSnapshot(`
        <div class="summary">
          <span>Order #123</span>
          <span>$99.99</span>
        </div>
      `);
    });

Rules:
- Use inline snapshots (`toMatchInlineSnapshot`) for small outputs — they are reviewable in the diff
- Use file snapshots (`toMatchSnapshot`) only for larger structural output
- Never snapshot dynamic data (timestamps, UUIDs) — exclude or mock them
- Review every snapshot update in code review — do not auto-update blindly
- Keep snapshots focused — snapshot a subtree, not the whole output
- If a snapshot breaks on every refactor, replace it with explicit assertions

---

6. Test Data

- Use factory functions for test data:

      function createMockOrder(overrides: Partial<Order> = {}): Order {
        return {
          id: '123',
          status: 'draft',
          total: 99.99,
          items: [],
          ...overrides,
        };
      }

- Keep test data minimal — only set fields relevant to the test
- Avoid shared mutable state — create fresh data in each test
- Use realistic but deterministic values — not `'test'` or `'foo'`

---

7. Coverage Strategy

- Target 60-70% from intentional testing — not blanket coverage
- Always cover: business logic, utilities, error handling, state transitions
- Skip: configuration, type-only files, framework boilerplate
- Run: `jest --coverage --collectCoverageFrom='src/**/*.ts'`
- Use `/* istanbul ignore next */` sparingly with a comment

---

8. Self-check before finishing

1. Tests describe behavior — not implementation details
2. Mocks restored between tests (`jest.restoreAllMocks()`)
3. External dependencies mocked — internal modules tested through public API
4. Async tests use `async/await` — no unhandled promises
5. Snapshots are small, reviewed, and exclude dynamic data
6. No logic (if/for) inside test bodies
7. Test data created fresh per test — no shared mutable state
8. Coverage focused on business logic and error paths
