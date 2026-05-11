# Jest Refactoring

## Snapshot Overuse

**Problem:** Large snapshots that capture entire component trees or full API
responses. They break on every visual change, produce unreadable diffs, and
developers update them without reviewing.

**Rule:** Replace large snapshots with **explicit assertions**. Use inline
snapshots only for small, stable output.

### Before (violation)

    it('should render the dashboard', () => {
      const { container } = render(<Dashboard user={mockUser} orders={mockOrders} />);
      expect(container).toMatchSnapshot();
      // 200-line snapshot that breaks on every CSS class change
    });

### After

    it('should render user name and order count', () => {
      render(<Dashboard user={mockUser} orders={mockOrders} />);
      expect(screen.getByRole('heading')).toHaveTextContent('Welcome, Alice');
      expect(screen.getByText('3 active orders')).toBeInTheDocument();
    });

---

## Implementation Testing

**Problem:** Tests verify HOW something is done (which functions are called, in what
order) instead of WHAT the outcome is. They break on every refactor.

**Rule:** Test **observable behavior and output**, not internal call sequences.

### Before (violation)

    it('should process payment', () => {
      const validateSpy = jest.spyOn(validator, 'validate');
      const formatSpy = jest.spyOn(formatter, 'formatAmount');
      const logSpy = jest.spyOn(logger, 'info');

      processPayment({ amount: 100, currency: 'USD' });

      // Testing internal implementation — breaks if we change the internals
      expect(validateSpy).toHaveBeenCalledBefore(formatSpy);
      expect(formatSpy).toHaveBeenCalledWith(100, 'USD');
      expect(logSpy).toHaveBeenCalledWith('Payment processed');
    });

### After

    it('should return success for valid payment', async () => {
      const result = await processPayment({ amount: 100, currency: 'USD' });

      // Testing observable outcome
      expect(result.status).toBe('success');
      expect(result.transactionId).toBeDefined();
    });

    it('should reject negative amount', async () => {
      await expect(processPayment({ amount: -1, currency: 'USD' }))
        .rejects.toThrow('Amount must be positive');
    });

---

## Shared Mutable State Between Tests

**Problem:** Tests share mock setup or global state. Test order matters — one test's
side effect causes another test to pass or fail unexpectedly.

**Rule:** Each test creates its own state. Mocks are restored between tests.

### Before (violation)

    // Shared mock — mutations leak between tests
    const mockDb = { users: [{ id: 1, name: 'Alice' }] };

    it('should add a user', () => {
      mockDb.users.push({ id: 2, name: 'Bob' });
      expect(mockDb.users).toHaveLength(2);
    });

    it('should have one user', () => {
      // FAILS — previous test mutated mockDb
      expect(mockDb.users).toHaveLength(1);
    });

### After

    function createMockDb() {
      return { users: [{ id: 1, name: 'Alice' }] };
    }

    it('should add a user', () => {
      const db = createMockDb();
      db.users.push({ id: 2, name: 'Bob' });
      expect(db.users).toHaveLength(2);
    });

    it('should have one user', () => {
      const db = createMockDb();
      expect(db.users).toHaveLength(1); // passes — fresh state
    });

---

## Refactoring Checklist

- Large snapshots replaced with explicit assertions
- Tests assert on behavior and output, not internal call sequences
- Each test creates fresh state — no shared mutable objects
- `jest.restoreAllMocks()` in `afterEach`
- No logic (if/for) inside test bodies
- Mock setup close to the test that uses it — not in global `beforeAll`
