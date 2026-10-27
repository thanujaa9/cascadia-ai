# RUNBOOK: Cache Fallback Architecture & Mitigation Procedures
ID: RB-CACHE-01
SERVICE: database
FAILURE_TYPE: database_slowdown

<!-- CHUNK: RB-CACHE-01-A -->
## Symptoms & Detection
- Primary database CPU saturation >85% or transactional query pool exhaustion.
- Latency on read endpoints growing proportionally with write volume.

<!-- CHUNK: RB-CACHE-01-B -->
## Likely Causes
- Hot-key read traffic competing for transactional locks against live order writes.
- Read cache TTL expiration causing cold cache stampede to primary PostgreSQL instance.

<!-- CHUNK: RB-CACHE-01-C -->
## Recommended Safe Actions
1. **Enable Redis Stale-While-Revalidate Read Cache**:
   - Instruct application data layer to serve slightly stale (30s TTL) cached responses if primary DB query latency exceeds 200ms.
   - Command: `consul kv put config/orders/cache_fallback_enabled true`
   - Expected Result: Instantly sheds 74% of read IOPS from primary database, restoring healthy query throughput within 8 seconds.

<!-- CHUNK: RB-CACHE-01-D -->
## ⛔ Unsafe Actions (Anti-Patterns to Avoid)
- **DO NOT flush Redis cache during an active database saturation event.**
  * *Reason*: Forces all in-flight application queries directly onto the already saturated database, causing instantaneous systemic collapse.

<!-- CHUNK: RB-CACHE-01-E -->
## Rollback & Verification
- Verify database connection pool drops below 35%.
- Once database load normalizes, toggle cache fallback off.
