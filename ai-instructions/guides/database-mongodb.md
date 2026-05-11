# Database Guide: MongoDB

Use this guide for any project that uses MongoDB as its primary database.

## Stack Assumptions

- MongoDB 6.0+
- Accessed via Mongoose (Node.js), PyMongo / Motor (Python), or Spring Data MongoDB (Java)
- Replica set or Atlas deployment for production
- Schema validation enabled at the collection level

## Schema Design Rules

- Design for your queries, not your entities — embed data that is read together
- Embed when: data is owned by the parent, always accessed together, bounded in size
- Reference when: data is shared across documents, unbounded, or independently queried
- Avoid deeply nested structures — max 3 levels of nesting
- Use MongoDB schema validation (`$jsonSchema`) to enforce document shape
- Store dates as `Date` type — never as strings
- Store monetary values as integers (cents) or `Decimal128` — never floating point

## Embedding vs Referencing

- **One-to-one**: embed in the parent document
- **One-to-few** (bounded): embed as an array in the parent
- **One-to-many** (unbounded): reference with ObjectId array or parent reference
- **Many-to-many**: reference with ObjectId arrays on both sides, or a junction collection
- If an embedded array can grow without bound, switch to referencing
- If you need to query the child independently, use referencing

## Index Rules

- Index fields used in `find()`, `sort()`, and `$match` stages
- Compound indexes: order fields by equality → sort → range
- Use partial indexes for queries that filter on a subset: `{ partialFilterExpression: { status: 'active' } }`
- Use unique indexes for business-unique fields
- Use TTL indexes for auto-expiring documents (sessions, logs)
- Avoid indexing fields with low cardinality (booleans) unless part of a compound index
- Use `explain('executionStats')` to verify index usage

## Query Rules

- Always project only the fields you need — avoid returning entire documents
- Use aggregation pipeline for complex transformations, not application-side processing
- Paginate with cursor-based pagination (`_id > lastSeen`) — not `skip()`/`limit()` for large datasets
- Avoid `$where` and JavaScript expressions — they disable index usage
- Use `$lookup` sparingly — it is a cross-collection join and can be expensive
- Batch writes with `bulkWrite()` instead of individual `insertOne()` / `updateOne()` calls

## Transaction Rules

- Use transactions for multi-document operations that must be atomic
- Keep transactions short — long transactions hold locks and degrade performance
- Transactions require a replica set — they do not work on standalone deployments
- Single-document operations are already atomic — no transaction needed

## Migration Rules

- Use a migration tool or versioned scripts for schema changes
- Add new fields with default values — existing documents are not automatically updated
- Backfill existing documents in batches, not all at once
- Remove fields lazily — stop writing them first, clean up later
- Test migrations against production-sized data

## Workflow

1. Design the document schema based on query patterns
2. Define schema validation rules
3. Create indexes for query patterns
4. Implement data access layer
5. Run `explain()` on key queries
6. Load-test with realistic data volume

## Self-Check

1. No unbounded arrays in embedded documents
2. Schema validation enabled on collections
3. Indexes match actual query patterns
4. Dates stored as Date type, money as integers or Decimal128
5. Projections used — no returning entire documents unnecessarily
6. Cursor-based pagination for large datasets
