MongoDB Guidelines (Claude / LLM)
MongoDB 6.0+ | Schema design | Aggregation | Indexing | Transactions

These guidelines are loaded by an AI when designing or modifying MongoDB schemas,
queries, or data access patterns.
Goal: query-driven schema design, correct embedding/referencing decisions, efficient
indexes, and safe document evolution.

---

0. Defaults

- MongoDB 6.0+
- Schema validation with `$jsonSchema` on every collection
- Mongoose (Node.js), Motor/PyMongo (Python), or Spring Data MongoDB (Java)
- Replica set for transactions and high availability
- Dates as `Date` type, money as `Decimal128` or integer cents

---

1. Schema Design Principles

Design for queries, not for entity relationships.

Ask: "What queries will this collection serve?" before deciding the shape.

Rules:
- Data that is read together should be stored together (embed)
- Data that is shared, unbounded, or independently queried should be referenced
- Max document size is 16MB — design to stay well below this
- Avoid deeply nested structures — 3 levels maximum
- Denormalize for read performance, accept update complexity as the trade-off
- Every collection has schema validation — enforce shape at the database level

---

2. Embedding vs Referencing Decision Tree

**Embed when:**
- The child data belongs to exactly one parent
- The child data is always accessed with the parent
- The child array has a known upper bound (< 100 items)
- Updates to the child are rare

**Reference when:**
- The data is shared across multiple parents
- The array can grow without bound
- You need to query or paginate the child independently
- The child is large and only sometimes needed

**Patterns:**
- One-to-one → embed
- One-to-few (bounded) → embed as array
- One-to-many (unbounded) → reference (child stores parent ID)
- Many-to-many → reference arrays or junction collection

---

3. Index Strategy

- Index every field used in `find()`, `sort()`, and `$match`
- Compound index field order: **equality → sort → range** (ESR rule)

      // Query: find active orders for user, sorted by date
      db.orders.createIndex({ userId: 1, status: 1, createdAt: -1 })
      //                      equality    equality    sort/range

- Use partial indexes for filtered subsets:

      db.orders.createIndex(
        { createdAt: -1 },
        { partialFilterExpression: { status: "active" } }
      )

- Use TTL indexes for auto-expiring documents (sessions, tokens)
- Use unique indexes for business-unique fields
- Use `explain('executionStats')` to verify index usage — look for `IXSCAN` not `COLLSCAN`
- Drop unused indexes — check with `$indexStats`

---

4. Aggregation Pipeline

- Use the aggregation pipeline for complex transformations — not application code
- Put `$match` and `$project` early in the pipeline to reduce documents processed
- Use `$lookup` sparingly — it is a cross-collection join and can be slow
- Avoid `$unwind` on large arrays — it creates one document per array element
- Use `$facet` for computing multiple aggregations in a single pipeline pass
- Use `$merge` or `$out` for materialized views

Pipeline optimization order:
1. `$match` — filter early
2. `$project` / `$addFields` — reduce fields
3. `$sort` — after filtering
4. `$group` — aggregate
5. `$limit` / `$skip` — paginate last

---

5. Update Patterns

- Use atomic operators (`$set`, `$inc`, `$push`, `$pull`) — not full-document replacement
- Use `$addToSet` instead of `$push` when uniqueness matters
- Use `$push` with `$slice` to keep bounded arrays: `{ $push: { logs: { $each: [newLog], $slice: -100 } } }`
- Use `bulkWrite()` for batch operations — not individual `updateOne()` calls
- Use `findOneAndUpdate` with `returnDocument: 'after'` when you need the updated document

---

6. Document Evolution

- Add new fields with defaults — existing documents are not automatically backfilled
- Backfill in batches: process 1000 documents at a time with `updateMany` and a filter
- Remove fields lazily: 1. Stop writing → 2. Stop reading → 3. `$unset` in batches
- Version your document schema with a `schemaVersion` field for complex migrations
- Update schema validation when the shape changes

---

7. Performance and Monitoring

- Monitor with: `db.currentOp()`, `db.collection.stats()`, `$indexStats`
- Identify slow queries with the profiler: `db.setProfilingLevel(1, { slowms: 100 })`
- Use read preference `secondaryPreferred` for analytics queries
- Use write concern `majority` for durability on critical writes
- Shard when a single replica set cannot handle the load — but exhaust indexing and schema design first

---

8. Self-check before finishing

1. Schema validation enabled on every new collection
2. No unbounded arrays in embedded documents
3. Indexes match actual query patterns — verified with `explain()`
4. Dates use `Date` type, money uses `Decimal128` or integer cents
5. Aggregation pipelines filter early (`$match` first)
6. Batch updates use `bulkWrite()`
7. Field additions are backward-compatible
8. Projections used — no returning full documents unnecessarily
