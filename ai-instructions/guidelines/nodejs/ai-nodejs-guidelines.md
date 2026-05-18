Node.js / Express Guidelines (Claude / LLM)
Node.js 20+ | Express | TypeScript strict | Layered architecture | Error handling

These guidelines are loaded by an AI when generating or refactoring Node.js
backend code.
Goal: consistent layered architecture, robust error handling, type-safe service
boundaries, and predictable async patterns.

---

0. Defaults

- Node.js 20+ LTS (Node 18 reached EOL April 2025)
- Express 4.x or 5.x
- TypeScript strict mode
- ESM modules (`"type": "module"` in package.json)
- Zod for runtime validation
- Pino for structured logging
- Prisma, Knex, or Drizzle for database access

---

1. Layered Architecture

Strict layer separation — no upward or cross-boundary imports.

    routes/        → controllers/    → services/     → repositories/
    (HTTP wiring)    (thin handlers)   (business logic)  (data access)

- **Routes** define URL patterns and wire middleware. No logic.
- **Controllers** extract input from the request, call services, format responses.
  Maximum 20 lines per handler function.
- **Services** contain all business logic. They receive typed inputs and return
  typed outputs. No HTTP concepts (no `req`, `res`, `next`).
- **Repositories** handle database queries. They return domain types, not raw rows.

Import rule: each layer only imports the layer directly below it.

---

2. Error Handling

Define a base `AppError` class and domain-specific subclasses:

    class AppError extends Error {
      constructor(
        message: string,
        public readonly statusCode: number,
        public readonly code: string,
      ) {
        super(message);
      }
    }
    class NotFoundError extends AppError { ... }
    class ValidationError extends AppError { ... }

- Services throw `AppError` subclasses — never raw `Error`
- Controllers do not catch errors — they propagate to the error middleware
- The centralized error middleware maps `AppError.statusCode` to HTTP responses
- Unhandled rejections and uncaught exceptions trigger a graceful shutdown
- Log the full error (stack, context) server-side; return only safe details to the client

---

3. Validation

- Validate all external input (body, params, query, headers) in the controller layer
- Use Zod schemas — define them alongside the route or in a shared `schemas/` directory
- Validation middleware parses and narrows the type before the controller runs:

      const createUserSchema = z.object({
        email: z.string().email(),
        name: z.string().min(1).max(100),
      });

- Failed validation returns 400 with structured `{ code, issues }` — not a plain string
- Reuse schemas for request and response where the shapes overlap

---

4. Async Patterns

- All async code uses `async/await` — no callbacks, no `.then()` chains
- Wrap Express route handlers to catch async errors:

      const asyncHandler = (fn: RequestHandler): RequestHandler =>
        (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

- Use `Promise.all` for concurrent independent I/O — not sequential awaits
- Set timeouts on every external call (database, HTTP, file I/O)
- Never block the event loop — offload CPU work to worker threads or a task queue
- Avoid `setTimeout` for flow control — use proper async coordination

---

5. Middleware

- One concern per middleware function
- Order matters: security → parsing → auth → validation → handler → error
- Authentication middleware populates `req.user` — controllers check authorization
- Do not modify `req` or `res` beyond their intended purpose (e.g., do not store
  business data on `req`)
- Middleware that applies to all routes goes in the app setup; route-specific
  middleware is declared in the route file

---

6. Configuration

- All config from environment variables — use a typed config module that reads
  `process.env` at startup and validates with Zod
- Fail fast on missing required config — crash at startup, not at runtime
- No default values for secrets — they must be explicitly set
- Separate config for different environments (development, test, production) via
  environment variables, not conditional code

---

7. Database Access

- Repository methods return domain types — not raw query results
- Use transactions for multi-table mutations
- Pagination uses cursor-based or offset-based patterns from the repository — not
  ad-hoc `LIMIT/OFFSET` in services
- Connection pooling is configured at the infrastructure level
- Migrations are version-controlled and run as part of deployment

---

8. Logging

- Use structured JSON logging (Pino)
- Log at request boundaries: incoming request, outgoing response, errors
- Include request ID in every log entry for traceability
- Log levels: `error` for failures, `warn` for degraded behavior, `info` for
  significant events, `debug` for development
- Never log secrets, tokens, passwords, or full request bodies in production

---

9. Self-check before finishing

1. Strict layer separation — no upward imports
2. All input validated with Zod schemas at the boundary
3. Async errors are caught and propagated to the error middleware
4. No business logic in controllers or routes
5. Typed errors with status codes — no generic `throw new Error()`
6. Configuration validated at startup
7. Database access is in repositories, not services
8. Structured logging with request ID
9. No event loop blocking
