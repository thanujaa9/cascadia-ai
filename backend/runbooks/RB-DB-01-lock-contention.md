# RUNBOOK: PostgreSQL Database Lock Contention & Transaction Deadlocks
ID: RB-DB-01
SERVICE: database
FAILURE_TYPE: database_slowdown

<!-- CHUNK: RB-DB-01-A -->
## Symptoms & Detection
- p95/p99 query latency spikes from nominal <15ms to >1500ms.
- High active connection count on PostgreSQL with `waiting = true` in `pg_stat_activity`.
- Upstream Order Service and Payment Service log connection checkout timeout errors.
- Lock wait logs: `Lock wait timeout exceeded on index order_items_pkey`.

<!-- CHUNK: RB-DB-01-B -->
## Likely Causes
- Long-running write transactions holding row-level locks on `orders` or `inventory` tables.
- Batch update or analytics query run against primary write cluster during peak checkout traffic.
- Unindexed foreign key lookups triggering full table scans and prolonged table exclusive locks.

<!-- CHUNK: RB-DB-01-C -->
## Recommended Safe Actions
1. **Enable Redis Cache Fallback & Read Throttling (Recommended)**:
   - Direct all non-transactional read queries (product catalog, order status lookups) to Redis replicas.
   - Command: `consul kv put config/orders/cache_fallback_enabled true`
   - Expected Result: Drops write-lock contention by 70-80% within 8 seconds, freeing Postgres backends.
2. **Terminate Blocking Sessions**:
   - Run `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle in transaction' AND wait_event_type = 'Lock';`
3. **Scale Read Replicas**:
   - Provision additional reader nodes if read IOPS saturation is primary contributor.

<!-- CHUNK: RB-DB-01-D -->
## ⛔ Unsafe Actions (Anti-Patterns to Avoid)
- **DO NOT hard restart the PostgreSQL primary database instance.**
  * *Reason*: Restarting forces abrupt disconnection of hundreds of upstream callers. In-flight transactions fail, and reconnecting services will stampede the cold database, immediately re-saturating locks and prolonging downtime from 8 seconds to 75+ seconds.
- **DO NOT simply increase max_connections.**
  * *Reason*: Exceeding CPU core capacity adds context-switching overhead and worsens lock convoying.

<!-- CHUNK: RB-DB-01-E -->
## Rollback & Verification
- Verify `pg_stat_activity` waiting query count drops below 5.
- Confirm p95 latency returns to <25ms.
- Rollback cache fallback flag once lock contention is stabilized: `consul kv put config/orders/cache_fallback_enabled false`.
