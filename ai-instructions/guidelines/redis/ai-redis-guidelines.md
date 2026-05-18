Redis Guidelines (Claude / LLM)
Redis 7.0+ | Caching | Sessions | Queues | Data structures

These guidelines are loaded by an AI when implementing Redis-based caching,
sessions, queues, or real-time features.
Goal: correct data structure selection, predictable cache invalidation, safe
key management, and resilient connection handling.

---

0. Defaults

- Redis 7.0+ (or Valkey/Dragonfly)
- Used alongside a primary database — not as sole data store
- TTL on every key unless data is permanent
- Connection pooling enabled
- Key prefix per service/application

---

1. Key Naming

Convention: `{app}:{entity}:{id}[:{field}]`

    app:user:42:session          # user session
    app:cache:products:list      # cached product list
    app:queue:emails             # email job queue
    app:rate:api:192.168.1.1     # rate limit counter
    app:lock:order:123           # distributed lock

Rules:
- Use colons as separators — this is the Redis convention
- Keep keys short but readable — avoid single-character prefixes
- Include the application name to avoid collisions in shared instances
- Never use unsanitized user input as part of a key
- Document all key patterns in a central location
- Use `SCAN` with a pattern to inspect keys — never `KEYS` in production

---

2. Data Structure Selection

| Use case | Structure | Why |
|---|---|---|
| Simple value, counter, cached JSON | String | Atomic operations, simplest |
| Object with multiple fields | Hash | Partial reads/writes, space-efficient |
| Ordered queue, recent items | List | Push/pop, bounded with `LTRIM` |
| Unique collection, tags | Set | O(1) membership test, set operations |
| Leaderboard, priority queue | Sorted Set | Score-based ordering, range queries |
| Boolean flags per item | Bitmap | Memory-efficient for large populations |
| Approximate count | HyperLogLog | Constant memory for cardinality |
| Publish/subscribe | Pub/Sub or Streams | Real-time messaging |

Rules:
- Choose the right structure — do not serialize everything as JSON strings
- Use Hash for objects instead of `SET` with serialized JSON — it allows partial updates
- Bound all lists with `LTRIM` — unbounded lists cause memory issues
- Use Sorted Sets with timestamps as scores for time-windowed data

---

3. Caching Patterns

**Cache-aside (most common):**
1. Check cache
2. On miss: query database
3. Write to cache with TTL
4. Return data

**Write-through:** write to cache and database simultaneously. Use when reads
are frequent and consistency is critical.

**Write-behind:** write to cache, asynchronously flush to database. Use for
high-throughput writes where eventual consistency is acceptable.

Rules:
- Always set TTL — stale data is worse than a cache miss
- Consistent TTL per data type: short (1-5 min) for volatile data, long (1-24h) for stable data
- Invalidate on write: delete the cache key when the source changes
- Use `SETNX` with TTL for cache stampede prevention (lock while regenerating)
- Never cache user-specific data without the user ID in the key
- Cache serialization: use MessagePack or JSON — not language-specific formats

---

4. Session Management

- Store sessions as Hash: `app:session:{sessionId}` → `{ userId, role, expiresAt }`
- Set TTL on session keys to auto-expire
- Use `HSET` / `HGET` for partial session updates — do not rewrite the whole session
- Regenerate session ID on privilege changes (login, role change)
- Use `SCAN` with pattern to find all sessions for a user (for force-logout)

---

5. Queue Patterns

**Simple queue:** use List with `LPUSH` (enqueue) and `BRPOP` (dequeue with blocking)

**Reliable queue:** use Streams with consumer groups:
- `XADD` to publish
- `XREADGROUP` to consume
- `XACK` to acknowledge
- Unacknowledged messages are retried automatically

Rules:
- Use Streams over Lists for production queues — they support acknowledgment and replay
- Set `MAXLEN` on Streams to prevent unbounded growth
- Use consumer groups for multiple workers on the same stream
- Monitor pending entries with `XPENDING`

---

6. Error Handling and Resilience

- Treat Redis failures as non-fatal — fall back to the primary database for cache
- Use circuit breakers for Redis calls if uptime is not guaranteed
- Set command timeouts to prevent blocking on slow operations
- Handle `WRONGTYPE` errors — they indicate a key was created with a different structure
- Log errors but do not crash — degrade gracefully
- Use `PING` for health checks in connection pools

---

7. Security

- Enable authentication (`requirepass` or ACL users)
- Use TLS for all non-localhost connections
- Restrict dangerous commands with ACLs: disable `FLUSHALL`, `FLUSHDB`, `KEYS`, `DEBUG`
- Run Redis on a private network — never expose to the public internet
- Use separate Redis databases or key prefixes for isolation between environments

---

8. Self-check before finishing

1. Consistent key naming convention with app prefix
2. TTL set on every cache and session key
3. Right data structure for the use case — not JSON strings for everything
4. Cache invalidation on source data changes
5. Connection pooling configured
6. No `KEYS` command in application code
7. Streams used for production queues (not Lists)
8. Failures handled gracefully — no crash on Redis timeout
