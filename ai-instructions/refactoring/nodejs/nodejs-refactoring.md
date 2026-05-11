# Node.js / Express Refactoring

## Fat Route Handlers

**Problem:** Route handlers accumulate validation, business logic, database queries,
and error formatting in a single function. They become impossible to test in isolation.

**Rule:** Route handlers must be **under 20 lines**. Extract to controller → service → repository.

### Before (violation)

    router.post('/orders', async (req, res) => {
      // validation mixed with logic mixed with DB
      if (!req.body.items || req.body.items.length === 0) {
        return res.status(400).json({ error: 'Items required' });
      }
      const user = await db.users.findUnique({ where: { id: req.user.id } });
      if (!user) return res.status(404).json({ error: 'User not found' });
      let total = 0;
      for (const item of req.body.items) {
        const product = await db.products.findUnique({ where: { id: item.productId } });
        if (!product) return res.status(404).json({ error: `Product ${item.productId} not found` });
        total += product.price * item.quantity;
      }
      const order = await db.orders.create({
        data: { userId: user.id, total, items: { create: req.body.items } },
      });
      res.status(201).json(order);
    });

### After

    // routes/orders.ts
    router.post('/orders', asyncHandler(orderController.create));

    // controllers/orderController.ts
    async create(req: Request, res: Response) {
      const input = createOrderSchema.parse(req.body);
      const order = await orderService.createOrder(req.user.id, input);
      res.status(201).json(order);
    }

    // services/orderService.ts
    async createOrder(userId: string, input: CreateOrderInput): Promise<Order> {
      const user = await userRepository.findByIdOrThrow(userId);
      const total = await this.calculateTotal(input.items);
      return orderRepository.create({ userId: user.id, total, items: input.items });
    }

---

## Callback-Style Error Handling

**Problem:** Error handling is scattered across every route with try/catch blocks
that duplicate the same error formatting logic.

**Rule:** Use a **centralized error middleware** and typed error classes. Handlers do not catch errors.

### Before (violation)

    router.get('/users/:id', async (req, res) => {
      try {
        const user = await db.users.findUnique({ where: { id: req.params.id } });
        if (!user) {
          return res.status(404).json({ error: 'Not found' });
        }
        res.json(user);
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

### After

    // Handler — no try/catch
    router.get('/users/:id', asyncHandler(async (req, res) => {
      const user = await userService.getById(req.params.id);
      res.json(user);
    }));

    // Service throws typed errors
    async getById(id: string): Promise<User> {
      const user = await userRepository.findById(id);
      if (!user) throw new NotFoundError('User', id);
      return user;
    }

    // Centralized error middleware (registered last)
    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ code: err.code, message: err.message });
      } else {
        logger.error({ err, requestId: req.id }, 'Unhandled error');
        res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Internal server error' });
      }
    });

---

## Unvalidated Inputs

**Problem:** Request data is used directly without validation, leading to runtime
errors deep in the service layer instead of clear 400 responses.

**Rule:** Validate all external input with **Zod schemas** at the controller boundary.

### Before (violation)

    const { email, name } = req.body;
    // No validation — email could be undefined, name could be a number
    await userService.create(email, name);

### After

    const createUserSchema = z.object({
      email: z.string().email(),
      name: z.string().min(1).max(100),
    });

    // In controller
    const input = createUserSchema.parse(req.body); // throws ZodError on invalid
    await userService.create(input);

---

## Refactoring Checklist

- All route handlers under 20 lines
- Business logic is in services, not handlers
- Centralized error middleware catches all errors
- Typed error classes with status codes
- All external input validated with schemas
- No `try/catch` in individual route handlers
