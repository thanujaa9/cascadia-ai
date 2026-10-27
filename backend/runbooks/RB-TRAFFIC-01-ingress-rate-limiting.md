# RUNBOOK: Ingress Rate Limiting & Traffic Shedding
ID: RB-TRAFFIC-01
SERVICE: gateway
FAILURE_TYPE: traffic_spike

<!-- CHUNK: RB-TRAFFIC-01-A -->
## Symptoms & Detection
- Ingress request rate exceeds 3x baseline capacity (e.g. 1,250 RPS -> 5,000+ RPS).
- Thread starvation at ingress proxies and connection pool exhaustion across all backend microservices.

<!-- CHUNK: RB-TRAFFIC-01-B -->
## Likely Causes
- External marketing campaign launch without pre-warmed backend capacity.
- Distributed volumetric bot traffic scraping checkout endpoints.

<!-- CHUNK: RB-TRAFFIC-01-C -->
## Recommended Safe Actions
1. **Enable Ingress Shedding (40% Token Bucket Rate Limiting)**:
   - Shed guest non-authenticated requests at the ingress gateway edge before requests reach backend services.
   - Command: `kubectl patch gateway ingress-controller -p '{"spec":{"rateLimit":{"rps":500}}}'`
   - Expected Result: Backend application latency immediately drops back into healthy range (<50ms).

<!-- CHUNK: RB-TRAFFIC-01-D -->
## ⛔ Unsafe Actions (Anti-Patterns to Avoid)
- **DO NOT scale all backend microservices simultaneously without database capacity planning.**
  * *Reason*: Multiplying backend pods will exponentially overwhelm database connection limits and CPU.

<!-- CHUNK: RB-TRAFFIC-01-E -->
## Rollback & Verification
- Monitor ingress request throughput and gradually relax rate limits in 15% increments.
