# Backend Guide: Node.js + Express

Use this guide for backend implementation work in Node.js/Express projects.

## Stack Assumptions

- Node.js 20+ (active LTS; Node 18 reached EOL April 2025)
- Express 4.x or 5.x
- TypeScript with strict mode
- Structured logging (pino, winston, or similar)
- Process manager for production (PM2 or container orchestrator)

## Architecture Rules

- Separate route definitions from handler logic — routes are wiring, handlers are thin
- Group routes by domain, not by HTTP method
- All business logic lives in service modules — handlers call services, not the other way around
- Use a layered structure: routes → controllers → services → repositories
- Keep middleware focused — one concern per middleware function
- No global mutable state. Use dependency injection or factory functions

## Error Handling Rules

- Use a centralized error handler middleware (registered last)
- Throw typed errors with status codes — do not catch and re-throw generics
- Async route handlers must be wrapped or use express-async-errors
- Never swallow errors silently — log, then respond with an appropriate status
- Distinguish operational errors (bad input, timeout) from programmer errors (null reference)
- Operational errors return 4xx/5xx; programmer errors restart the process

## Validation Rules

- Validate all external input at the boundary (request body, query, params)
- Use a schema validation library (zod, joi, or similar) — not manual checks
- Validation schemas live next to their route or in a shared schemas directory
- Return 400 with structured error details, not just a message string
- Never trust client-side validation

## Database Rules

- Use an ORM or query builder (Prisma, Knex, TypeORM) — not raw SQL strings in handlers
- Keep database access in repository modules, never in routes or controllers
- All mutations happen inside transactions when they touch multiple tables
- Use migrations for schema changes — never modify the database manually
- Connection pooling is required in production

## Security Rules

- Set security headers via helmet or equivalent middleware
- Rate-limit public endpoints
- Sanitize user input before database operations
- Use parameterized queries — never concatenate user input into SQL
- Store secrets in environment variables, never in code
- Enable CORS only for known origins

## Workflow

1. Define the route and method
2. Write the validation schema for input
3. Implement the service function with business logic
4. Wire the route → controller → service → repository
5. Add error handling for expected failure modes
6. Write tests for the service layer and integration tests for the route

## Verification

1. All routes respond with correct status codes for success and failure
2. Validation rejects malformed input with 400
3. Error handler catches unhandled rejections
4. No business logic in route handlers
5. Database queries use parameterized inputs
6. Tests pass for happy path and error paths
