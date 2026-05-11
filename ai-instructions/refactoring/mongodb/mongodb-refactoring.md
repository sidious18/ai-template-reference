# MongoDB Refactoring

## Unbounded Embedded Arrays

**Problem:** Embedding an array that grows without limit. The document approaches
the 16MB limit, updates become slow, and read performance degrades as the array
is loaded in full every time.

**Rule:** Embedded arrays must have a known upper bound. If unbounded, switch to
referencing.

### Before (violation)

    // User document with unbounded order history
    {
      _id: ObjectId("..."),
      name: "Alice",
      orders: [
        { orderId: 1, total: 99.99, date: "2024-01-01" },
        { orderId: 2, total: 45.00, date: "2024-01-15" },
        // ... grows forever
      ]
    }

### After

    // User document — no embedded orders
    { _id: ObjectId("..."), name: "Alice" }

    // Separate orders collection with parent reference
    {
      _id: ObjectId("..."),
      userId: ObjectId("..."),      // reference to user
      total: 99.99,
      date: ISODate("2024-01-01")
    }
    // Index: { userId: 1, date: -1 }

---

## Missing Schema Validation

**Problem:** Collection accepts any document shape. A typo in a field name or
a missing required field silently creates malformed data.

**Rule:** Enable `$jsonSchema` validation on every collection.

### Before (violation)

    // No validation — anything goes
    db.createCollection("orders")

### After

    db.createCollection("orders", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["customerId", "status", "total", "createdAt"],
          properties: {
            customerId: { bsonType: "objectId" },
            status: { enum: ["draft", "confirmed", "shipped", "cancelled"] },
            total: { bsonType: "decimal" },
            createdAt: { bsonType: "date" }
          }
        }
      }
    })

---

## COLLSCAN on Frequent Queries

**Problem:** Queries that run frequently do a full collection scan because no
matching index exists. Performance degrades linearly with collection size.

**Rule:** Every frequent query pattern must have a supporting index. Verify with
`explain('executionStats')`.

### Before (violation)

    // Frequent query — no index
    db.orders.find({ customerId: "abc", status: "active" }).sort({ createdAt: -1 })
    // explain: stage: "COLLSCAN", docsExamined: 500000

### After

    // Compound index following ESR rule (Equality → Sort → Range)
    db.orders.createIndex({ customerId: 1, status: 1, createdAt: -1 })
    // explain: stage: "IXSCAN", docsExamined: 47

---

## Refactoring Checklist

- No unbounded arrays in embedded documents
- Schema validation enabled on every collection
- Indexes support all frequent query patterns — verified with `explain()`
- Dates stored as `Date` type, money as `Decimal128` or integer cents
- Projections used on queries — no full-document returns unnecessarily
- Aggregation pipelines filter with `$match` early
