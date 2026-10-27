# RUNBOOK: Payment Service CrashLoopBackOff & Out-Of-Memory (OOM) Panic
ID: RB-PAYMENTS-01
SERVICE: payments
FAILURE_TYPE: payments_crash

<!-- CHUNK: RB-PAYMENTS-01-A -->
## Symptoms & Detection
- Payment service pod status transitions to `CrashLoopBackOff` or `OOMKilled (Exit Code 137)`.
- Error rate on payments route reaches 90%+.
- Upstream Order Service checkout transactions fail with HTTP 500 / 503 errors.

<!-- CHUNK: RB-PAYMENTS-01-B -->
## Likely Causes
- Uncaught nil pointer exception in authorization worker pod on malformed transaction payloads.
- Memory leak in batch settlement serialization buffer overflowing container cgroup limits.
- Upstream retry explosion multiplying payload processing demands.

<!-- CHUNK: RB-PAYMENTS-01-C -->
## Recommended Safe Actions
1. **Trip Circuit Breaker to Payment Service (Recommended)**:
   - Configure service mesh circuit breaker to fail fast in 2ms and queue asynchronous settlement.
   - Command: `istioctl apply -f config/circuit-breaker-payments.yaml`
   - Expected Result: Prevents callers from holding open threads waiting on crashed pods.
2. **Rolling Restart Deployment with Memory Limit Boost**:
   - Temporarily increase pod memory limit from 1Gi to 2Gi and perform rolling restart.
   - Command: `kubectl rollout restart deployment payments-service`

<!-- CHUNK: RB-PAYMENTS-01-D -->
## ⛔ Unsafe Actions (Anti-Patterns to Avoid)
- **DO NOT scale pod count to high numbers without fixing the crashing bug.**
  * *Reason*: All new replicas will consume memory and crash identically, worsening cluster resource starvation.
- **DO NOT bypass payment authorization idempotency checks.**
  * *Reason*: Can cause duplicate charges for customer orders.

<!-- CHUNK: RB-PAYMENTS-01-E -->
## Rollback & Verification
- Verify payment pod restart count ceases climbing.
- Confirm payment authorization error rate returns below 0.05%.
