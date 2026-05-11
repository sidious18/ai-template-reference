# Database Guide: PostgreSQL

Use this guide for any project that uses PostgreSQL as its primary database.

## Stack Assumptions

- PostgreSQL 14+
- Accessed via ORM (SQLAlchemy, Prisma, Django ORM, JPA) or query builder (Knex, JOOQ)
- Migrations managed by a tool (Alembic, Prisma Migrate, Django migrations, Flyway)
- Connection pooling in production (PgBouncer, built-in pool, or ORM pool)

## Schema Design Rules

- Every table has a primary key — prefer `bigint` generated identity or `uuid`
- Use `text` instead of `varchar(n)` unless a length constraint is a business rule
- Use `timestamptz` for all timestamps — never `timestamp` without time zone
- Use `numeric` / `decimal` for money — never `float` or `double precision`
- Add `NOT NULL` on every column unless NULL has an explicit business meaning
- Use `CHECK` constraints for domain invariants (e.g., `price > 0`, `status IN (...)`)
- Prefer enum types or check constraints over free-text status fields

## Index Rules

- Add indexes on all foreign key columns — PostgreSQL does not do this automatically
- Add indexes on columns used in `WHERE`, `ORDER BY`, and `JOIN` clauses
- Use partial indexes for filtered queries: `CREATE INDEX ... WHERE status = 'active'`
- Use composite indexes when queries filter on multiple columns — leftmost column first
- Avoid over-indexing — each index slows writes. Index for real query patterns, not hypothetical ones
- Use `EXPLAIN ANALYZE` to verify index usage before and after changes

## Query Rules

- Always use parameterized queries — never concatenate user input into SQL
- Prefer specific column lists over `SELECT *`
- Use `JOIN` instead of subqueries when both are equally readable
- Limit result sets — always use `LIMIT` or pagination for user-facing queries
- Use `EXISTS` instead of `COUNT(*)` when checking for existence
- Avoid `DISTINCT` as a fix for duplicate rows — fix the query or schema instead

## Migration Rules

- One migration per logical change
- Separate schema migrations from data migrations
- Additive changes first: add new column → deploy code → backfill → drop old column
- Never drop a column in the same deploy as the code change that stops using it
- Test migrations on a production-sized dataset before deploying
- Always include a rollback strategy (even if it is "not possible — restore from backup")

## Connection Management

- Use connection pooling — never open a connection per request
- Set `statement_timeout` to prevent long-running queries from blocking
- Set `idle_in_transaction_session_timeout` to prevent idle transactions
- Close connections properly — use context managers or try/finally
- Monitor connection count in production

## Workflow

1. Design the schema change on paper (columns, constraints, indexes)
2. Write the migration
3. Test migration against a dev database
4. Run `EXPLAIN ANALYZE` on affected queries
5. Deploy migration before or after code change (depending on direction)
6. Verify query performance post-deploy

## Self-Check

1. All timestamps use `timestamptz`
2. All foreign keys have indexes
3. No `SELECT *` in application queries
4. Migrations are additive and safe for zero-downtime deploy
5. Parameterized queries — no string concatenation
6. Connection pooling is configured
