# Redis Refactoring

## Inconsistent Key Naming

**Problem:** Keys use different naming conventions across the codebase. Some use
dots, some use colons, some include the app prefix and some don't. Impossible to
scan, debug, or manage keys systematically.

**Rule:** All keys follow `{app}:{entity}:{id}[:{field}]` with colons as separators.

### Before (violation)

    SET user.42.session "..."
    SET cache_products_list "..."
    SET emailQueue "..."
    SET app:rate:limit:192.168.1.1 "..."

### After

    SET app:user:42:session "..."
    SET app:cache:products:list "..."
    SET app:queue:emails "..."
    SET app:rate:api:192.168.1.1 "..."

---

## JSON Strings Instead of Native Structures

**Problem:** Complex objects serialized as JSON strings with `SET`/`GET`. Every
read deserializes the entire object. Partial updates require read → modify → write
with race conditions.

**Rule:** Use Hash for object-like data. Use the right data structure for the job.

### Before (violation)

    // Store entire user profile as JSON string
    SET app:user:42 '{"name":"Alice","email":"alice@test.com","role":"admin","lastLogin":"..."}'

    // To update one field: read all → parse → modify → serialize → write all
    const user = JSON.parse(await redis.get("app:user:42"));
    user.lastLogin = new Date().toISOString();
    await redis.set("app:user:42", JSON.stringify(user));

### After

    // Store as Hash — each field independently accessible
    HSET app:user:42 name "Alice" email "alice@test.com" role "admin" lastLogin "..."

    // Update one field atomically
    HSET app:user:42 lastLogin "2024-01-15T10:30:00Z"

    // Read only what you need
    HGET app:user:42 role

---

## Missing TTL on Cache Keys

**Problem:** Cache keys stored without TTL. Stale data persists indefinitely,
memory grows unbounded, and the cache returns outdated results.

**Rule:** Every cache key must have a TTL. Set it on creation.

### Before (violation)

    await redis.set(`app:cache:user:${id}`, JSON.stringify(userData));
    // No TTL — this key lives forever

### After

    await redis.set(`app:cache:user:${id}`, JSON.stringify(userData), 'EX', 300);
    // 5-minute TTL — stale data auto-expires

---

## KEYS Command in Application Code

**Problem:** `KEYS *` scans the entire keyspace in a single blocking operation.
On large databases, it blocks Redis for seconds, causing timeouts for all clients.

**Rule:** Use `SCAN` for iteration. Never use `KEYS` in application code.

### Before (violation)

    // Find all sessions for a user — blocks Redis
    const keys = await redis.keys("app:session:*:user:42");

### After

    // Use SCAN with MATCH pattern — non-blocking, cursor-based
    async function findKeys(pattern: string): Promise<string[]> {
      const results: string[] = [];
      let cursor = '0';
      do {
        const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        results.push(...keys);
      } while (cursor !== '0');
      return results;
    }

---

## Refactoring Checklist

- Consistent key naming: `{app}:{entity}:{id}[:{field}]`
- Hash used for object-like data — not serialized JSON strings
- TTL set on every cache key
- No `KEYS` command — `SCAN` used for iteration
- Connection pooling configured
- Cache failures handled gracefully (fallback to DB)
