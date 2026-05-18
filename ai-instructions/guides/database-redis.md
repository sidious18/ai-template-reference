# Database Guide: Redis

Use this guide for any project that uses Redis for caching, sessions, queues,
or real-time features.

## Stack Assumptions

- Redis 7.0+ or equivalent (Valkey, Dragonfly)
- Client library: ioredis (Node.js), redis-py / aioredis (Python), Jedis / Lettuce (Java)
- Used alongside a primary database — not as the sole data store
- Persistence configured if data loss is unacceptable

## Key Design Rules

- Use a consistent naming convention: `{service}:{entity}:{id}:{field}`
  - Example: `app:user:42:session`, `app:cache:products:list`
- Keep keys short but readable — avoid single-character prefixes
- Use colons as separators — this is the Redis convention
- Never use user input directly as a key name — sanitize or hash it
- Set TTL on every key unless it is permanent reference data
- Document key patterns in a central registry (README or config file)

## Data Structure Rules

- **Strings**: simple values, counters, cached JSON blobs
- **Hashes**: object-like data with multiple fields (user profile, config)
- **Lists**: ordered queues, recent activity feeds (bounded with `LTRIM`)
- **Sets**: unique collections, tags, membership checks
- **Sorted Sets**: leaderboards, priority queues, time-series with scores
- Choose the right structure — do not serialize everything into JSON strings
- Use `HSET`/`HGET` for partial reads of objects instead of `GET`/`SET` of serialized JSON

## Caching Rules

- Cache-aside pattern: check cache → miss → query DB → write to cache → return
- Set TTL on every cache key — stale data is worse than a cache miss
- Use consistent TTLs per data type (e.g., 5min for user data, 1h for product listings)
- Invalidate on write: when the source data changes, delete the cache key
- For high-throughput: use write-through or write-behind patterns
- Avoid caching data that changes every request — it defeats the purpose

## Connection Management

- Use connection pooling — one connection per operation is wasteful
- Reuse the client instance — do not create a new client per request
- Set connection timeouts and retry policies
- Use pipelining for batch operations — reduces round trips
- Monitor connection count — Redis has a max client limit

## Error Handling Rules

- Treat cache failures as non-fatal — fall back to the primary database
- Log cache errors but do not crash the application
- Use circuit breakers for Redis calls if availability is not guaranteed
- Handle `WRONGTYPE` errors — they indicate a key type mismatch (logic bug)
- Set command timeouts to prevent blocking on slow operations

## Security Rules

- Enable authentication (`requirepass` or ACLs)
- Use TLS for connections over the network
- Restrict commands with ACLs in production — disable `FLUSHALL`, `KEYS`, `DEBUG`
- Never expose Redis to the public internet
- Use `SCAN` instead of `KEYS` for iteration — `KEYS` blocks the server

## Workflow

1. Identify the use case (caching, session, queue, real-time)
2. Choose the right data structure
3. Design the key naming pattern
4. Set appropriate TTLs
5. Implement with error handling and fallback
6. Monitor hit rate and memory usage

## Self-Check

1. Consistent key naming convention used
2. TTL set on every cache key
3. Cache failures do not crash the application
4. Connection pooling configured
5. No `KEYS` command in production code — use `SCAN`
6. Right data structure for the job — not everything as JSON strings
