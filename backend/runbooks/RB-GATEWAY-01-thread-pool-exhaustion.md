# RUNBOOK: API Gateway Thread Pool Exhaustion & Ingress Starvation
ID: RB-GATEWAY-01
SERVICE: gateway
FAILURE_TYPE: traffic_spike

<!-- CHUNK: RB-GATEWAY-01-A -->
## Symptoms & Detection
- API Gateway latency surges from 18ms to >1000ms.
- Massive spike in HTTP 504 Gateway Timeout and HTTP 503 Service Unavailable errors returned to clients.
- Gateway worker thread pool utilization hits 100% capacity; incoming requests queued in OS socket listen backlog.

<!-- CHUNK: RB-GATEWAY-01-B -->
## Likely Causes
- Downstream application services (Orders, Payments) responding slowly, causing Gateway worker threads to block waiting for synchronous replies.
- Distributed volumetric traffic surge or DDoS spike on public checkout endpoints.
- Inadequate ingress connection timeout configuration allowing hung client connections to linger.

<!-- CHUNK: RB-GATEWAY-01-C -->
## Recommended Safe Actions
1. **Activate Edge Rate Limiting & Shedding (Recommended)**:
   - Reject non-critical guest user requests with HTTP 429 Too Many Requests to preserve gateway worker threads.
   - Command: `kubectl patch gateway ingress-controller -p '{"spec":{"rateLimit":{"rps":500}}}'`
2. **Reduce Upstream Proxy Timeouts**:
   - Lower client-upstream timeout from 5000ms to 1000ms so blocked threads fail fast and free worker slots.
3. **Trip Circuit Breakers on Unhealthy Downstream Routes**:
   - Return cached or synthetic fallback responses for failing downstream services.

<!-- CHUNK: RB-GATEWAY-01-D -->
## ⛔ Unsafe Actions (Anti-Patterns to Avoid)
- **DO NOT simply restart Gateway pods.**
  * *Reason*: Does not resolve the downstream blockage; new Gateway pods will saturate within seconds of becoming ready.
- **DO NOT increase timeout thresholds.**
  * *Reason*: Prolonging timeouts ties up worker threads even longer, accelerating total gateway collapse.

<!-- CHUNK: RB-GATEWAY-01-E -->
## Rollback & Verification
- Verify Gateway error rate drops below 0.1%.
- Monitor active thread pool utilization until it stabilizes below 45%.
