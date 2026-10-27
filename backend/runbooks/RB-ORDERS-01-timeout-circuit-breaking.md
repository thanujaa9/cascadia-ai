# RUNBOOK: Order Service Timeout Cascades & Upstream Isolation
ID: RB-ORDERS-01
SERVICE: orders
FAILURE_TYPE: database_slowdown

<!-- CHUNK: RB-ORDERS-01-A -->
## Symptoms & Detection
- Order service RPC latency climbing rapidly (>1000ms).
- Connection pool exhaustion waiting for synchronous Database lock releases.
- Ingress Gateway timing out on order submission requests.

<!-- CHUNK: RB-ORDERS-01-B -->
## Likely Causes
- Primary PostgreSQL slow queries cascading upstream to Order checkout threads.
- Message Queue publisher blocking on buffer queue acknowledgment.

<!-- CHUNK: RB-ORDERS-01-C -->
## Recommended Safe Actions
1. **Enable Order Service Circuit Breaker & Cache Reads (Recommended)**:
   - Trip circuit breaker on synchronous database read paths; serve from cache.
   - Command: `consul kv put config/orders/circuit_breaker_enabled true`
   - Expected Result: Eliminates upstream 504 timeouts at API Gateway.

<!-- CHUNK: RB-ORDERS-01-D -->
## ⛔ Unsafe Actions (Anti-Patterns to Avoid)
- **DO NOT increase Order Service synchronous timeout thresholds from 1s to 5s.**
  * *Reason*: Forces Gateway to hold connections 5x longer, causing Gateway thread starvation.

<!-- CHUNK: RB-ORDERS-01-E -->
## Rollback & Verification
- Verify Orders latency normalizes under 50ms and error rates drop to nominal (<0.05%).
