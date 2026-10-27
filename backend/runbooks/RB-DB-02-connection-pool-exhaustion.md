# RUNBOOK: Database Connection Pool Saturation & Starvation
ID: RB-DB-02
SERVICE: database
FAILURE_TYPE: database_slowdown

<!-- CHUNK: RB-DB-02-A -->
## Symptoms & Detection
- Connection pool utilization exceeds 85% (e.g. 94/100 active connections in pool).
- Application services (Orders, Payments) throw `ConnectionPoolTimeoutException: Timeout waiting for idle connection`.
- Upstream API Gateway records HTTP 504 Gateway Timeout on checkout endpoints.

<!-- CHUNK: RB-DB-02-B -->
## Likely Causes
- Connection leak in application code (connections not returned to pool in `finally` blocks).
- Slow queries holding open pool connections longer than the average request budget.
- Sudden spike in client request concurrency without ingress admission control.

<!-- CHUNK: RB-DB-02-C -->
## Recommended Safe Actions
1. **Enable Ingress Shedding / Rate Limiting (Fast Relief)**:
   - Shed 40% non-essential ingress traffic at API Gateway to prevent queue buildup.
   - Command: `kubectl patch gateway ingress-controller -p '{"spec":{"rateLimit":{"rps":500}}}'`
2. **Expand PgBouncer / Connection Pool Limits**:
   - Temporarily increase pool reserve buffer if physical database host has spare CPU headroom.
3. **Route Read Traffic to Cache**:
   - Switch application data access layer to fallback cache replicas.

<!-- CHUNK: RB-DB-02-D -->
## ⛔ Unsafe Actions (Anti-Patterns to Avoid)
- **DO NOT restart the connection pooler or database cluster.**
  * *Reason*: Clears connection state indiscriminately, aborting active transactions and triggering severe client retry storms.
- **DO NOT set connection timeout to infinity.**
  * *Reason*: Freezes client thread pools and propagates starvation directly to ingress edge routers.

<!-- CHUNK: RB-DB-02-E -->
## Rollback & Verification
- Verify pool saturation drops below 40%.
- Ensure zero connection wait timeout exceptions in application logs.
