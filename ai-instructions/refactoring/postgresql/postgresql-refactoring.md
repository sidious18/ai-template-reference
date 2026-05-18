# PostgreSQL Refactoring

## Missing Foreign Key Indexes

**Problem:** PostgreSQL does not automatically create indexes on foreign key columns.
Joins and cascading deletes on unindexed FKs cause sequential scans on large tables.

**Rule:** Every foreign key column must have an index.

### Before (violation)

    CREATE TABLE orders (
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        customer_id bigint NOT NULL REFERENCES customers(id),  -- no index
        created_at timestamptz NOT NULL DEFAULT now()
    );
    -- SELECT * FROM orders WHERE customer_id = 42;  →  Seq Scan

### After

    CREATE TABLE orders (
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        customer_id bigint NOT NULL REFERENCES customers(id),
        created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX idx_orders_customer_id ON orders (customer_id);
    -- Same query  →  Index Scan

---

## Wrong Timestamp Type

**Problem:** Using `timestamp` without time zone stores ambiguous times. The same
value means different things depending on the server's timezone setting.

**Rule:** Use `timestamptz` for all timestamp columns.

### Before (violation)

    ALTER TABLE events ADD COLUMN created_at timestamp NOT NULL DEFAULT now();

### After

    ALTER TABLE events ADD COLUMN created_at timestamptz NOT NULL DEFAULT now();

---

## N+1 Query Pattern

**Problem:** Fetching a list, then issuing a separate query per row to load related
data. 100 orders = 101 queries instead of 2.

**Rule:** Use `JOIN` or batch `WHERE id IN (...)` to load related data in bulk.

### Before (violation)

    -- Application code pseudocode
    orders = query("SELECT * FROM orders WHERE status = 'active'")
    for order in orders:
        customer = query("SELECT * FROM customers WHERE id = $1", order.customer_id)
        # N+1: one query per order

### After

    SELECT o.*, c.name as customer_name, c.email as customer_email
    FROM orders o
    JOIN customers c ON c.id = o.customer_id
    WHERE o.status = 'active';
    -- 1 query total

---

## Unsafe Migration: Adding NOT NULL Without Default

**Problem:** Adding a `NOT NULL` column without a default locks the table and
rewrites every row (on PostgreSQL < 11) or fails outright if rows exist.

**Rule:** Add columns as `NULL` first, backfill, then add `NOT NULL` constraint
separately.

### Before (violation)

    ALTER TABLE users ADD COLUMN role text NOT NULL DEFAULT 'member';
    -- On PG 11+: instant, but on older versions: full table rewrite with lock

### After (safe for all versions and zero-downtime)

    -- Migration 1: add nullable
    ALTER TABLE users ADD COLUMN role text;

    -- Migration 2: backfill
    UPDATE users SET role = 'member' WHERE role IS NULL;

    -- Migration 3: add constraint
    ALTER TABLE users ADD CONSTRAINT users_role_not_null CHECK (role IS NOT NULL) NOT VALID;
    ALTER TABLE users VALIDATE CONSTRAINT users_role_not_null;

---

## Refactoring Checklist

- All foreign key columns have indexes
- All timestamps use `timestamptz`
- No N+1 query patterns — related data loaded with JOIN or batch IN
- Migrations are safe for zero-downtime deploys
- New indexes created with `CONCURRENTLY`
- `EXPLAIN ANALYZE` run on changed queries
