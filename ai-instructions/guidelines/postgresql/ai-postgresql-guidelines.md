PostgreSQL Guidelines (Claude / LLM)
PostgreSQL 14+ | Schema design | Indexing | Migrations | Query optimization

These guidelines are loaded by an AI when designing or modifying PostgreSQL
schemas, queries, or migrations.
Goal: correct data types, efficient indexes, safe migrations, and queries that
use indexes predictably.

---

0. Defaults

- PostgreSQL 14+
- `timestamptz` for all timestamps
- `text` over `varchar(n)` unless length is a business constraint
- `bigint` or `uuid` for primary keys
- All columns `NOT NULL` unless NULL has business meaning
- Migrations managed by a versioned tool

---

1. Data Types

- `text` for strings — `varchar(n)` only when the length limit is a business rule
- `timestamptz` for all date/time — never `timestamp` without time zone
- `numeric(p,s)` or `integer` (cents) for money — never `float` or `real`
- `boolean` for true/false — never `int` 0/1
- `uuid` with `gen_random_uuid()` for distributed-safe primary keys
- `jsonb` for semi-structured data — never `json` (it lacks indexing)
- `inet` / `cidr` for IP addresses — never `text`
- Arrays for small, bounded sets — never for unbounded or queryable data

---

2. Constraints and Integrity

- Every table has a primary key
- Every foreign key has `ON DELETE` specified: `CASCADE`, `SET NULL`, `RESTRICT`, or `NO ACTION`
- Use `CHECK` constraints for domain rules:

      ALTER TABLE orders ADD CONSTRAINT positive_total CHECK (total > 0);
      ALTER TABLE users ADD CONSTRAINT valid_email CHECK (email ~* '^.+@.+\..+$');

- Use `UNIQUE` constraints for business-unique fields (email, slug, code)
- Use `EXCLUDE` constraints for range-based uniqueness (no overlapping bookings)
- Prefer database constraints over application validation — they survive bugs

---

3. Indexing Strategy

- **Always** index foreign key columns — PostgreSQL does not create these automatically
- **Always** index columns in `WHERE`, `JOIN`, and `ORDER BY` clauses
- Composite index field order: equality filters → sort columns → range filters
- Use partial indexes for filtered subsets:

      CREATE INDEX idx_orders_active ON orders (created_at) WHERE status = 'active';

- Use `GIN` indexes for `jsonb`, full-text search, and array containment
- Use `BRIN` indexes for naturally ordered data (timestamps on append-only tables)
- Measure with `EXPLAIN (ANALYZE, BUFFERS)` — do not guess index effectiveness
- Drop unused indexes — they slow writes. Check `pg_stat_user_indexes` for usage

---

4. Query Patterns

- Use parameterized queries — never concatenate user input:

      -- ORM or prepared statement
      SELECT * FROM users WHERE id = $1

- Prefer `EXISTS` over `COUNT(*)` for existence checks:

      SELECT EXISTS(SELECT 1 FROM orders WHERE user_id = $1 AND status = 'active')

- Use CTEs (`WITH`) for readability — but be aware they are optimization fences in older versions
- Use window functions for ranking, running totals, and pagination metadata
- Avoid `SELECT *` — list columns explicitly
- Use `FOR UPDATE` or `FOR UPDATE SKIP LOCKED` for row-level locking in concurrent workflows

---

5. Migration Safety

Safe migration pattern for zero-downtime deploys:

| Change | Safe approach |
|---|---|
| Add column | Add as `NULL` or with `DEFAULT` (PG 11+ is instant) |
| Drop column | 1. Stop writing → 2. Deploy → 3. Drop in next migration |
| Rename column | 1. Add new → 2. Dual-write → 3. Migrate reads → 4. Drop old |
| Add NOT NULL | 1. Add CHECK constraint as NOT VALID → 2. VALIDATE separately |
| Create index | Use `CREATE INDEX CONCURRENTLY` — does not lock writes |
| Drop table | 1. Stop all access → 2. Drop in dedicated migration |

Rules:
- Never combine schema changes with data backfills in one migration
- Test against production-sized data — a migration that takes 100ms on dev may take 30min on prod
- Always include a rollback plan

---

6. Connection Management

- Use connection pooling (PgBouncer or application-level pool)
- Set `statement_timeout` per connection or per transaction — prevent runaway queries
- Set `idle_in_transaction_session_timeout` to kill abandoned transactions
- Set `lock_timeout` to fail fast on lock contention instead of waiting indefinitely
- Monitor `pg_stat_activity` for long-running queries and idle connections

---

7. Performance Patterns

- Use `EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)` to understand query plans
- Look for: Seq Scan on large tables, Nested Loop with high row estimates, Sort on disk
- Use `pg_stat_statements` to find the most expensive queries by total time
- Batch inserts with `COPY` or multi-row `INSERT` — not row-by-row
- Use `VACUUM` and `ANALYZE` maintenance (autovacuum handles most cases)
- Partition large tables by range (date) or list (tenant) when they exceed ~100M rows

---

8. Self-check before finishing

1. All timestamps use `timestamptz`
2. All foreign keys have indexes and explicit `ON DELETE`
3. Money uses `numeric` or integer cents — not float
4. Migrations use `CONCURRENTLY` for index creation
5. Parameterized queries — no string concatenation
6. `EXPLAIN ANALYZE` run on new or changed queries
7. Column additions are `NULL` or `DEFAULT` for zero-downtime
8. Connection pooling configured
