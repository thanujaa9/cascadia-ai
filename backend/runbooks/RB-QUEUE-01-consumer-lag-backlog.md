# RUNBOOK: Message Broker Backlog & Consumer Queue Overload
ID: RB-QUEUE-01
SERVICE: queue
FAILURE_TYPE: queue_overload

<!-- CHUNK: RB-QUEUE-01-A -->
## Symptoms & Detection
- Message broker unconsumed queue depth spikes from nominal (<50 msgs) to >2,000 msgs.
- Consumer lag metrics climbing rapidly; message consumption rate significantly lower than publication rate.
- Worker pod memory utilization exceeds 85% with threat of OOMKilled crashes.

<!-- CHUNK: RB-QUEUE-01-B -->
## Likely Causes
- Upstream order burst during sales campaign publishing thousands of events per second.
- Consumer worker pods hanging on external third-party email/SMS provider calls.
- Worker pod replica count insufficient for sudden surge in asynchronous load.

<!-- CHUNK: RB-QUEUE-01-C -->
## Recommended Safe Actions
1. **Auto-Scale Notification Consumer Workers 3x (Recommended)**:
   - Scale consumer pods from 4 to 12 replicas to increase drain throughput from 850 msg/s to 2,550 msg/s.
   - Command: `kubectl scale deployment notification-worker --replicas=12`
   - Expected Result: Drains queue backlog within 12 seconds with zero message loss.
2. **Divert Stale Messages to Dead-Letter Queue (DLQ)**:
   - Divert messages older than 5 minutes to DLQ for offline asynchronous replay.

<!-- CHUNK: RB-QUEUE-01-D -->
## ⛔ Unsafe Actions (Anti-Patterns to Avoid)
- **DO NOT purge the message queue outright without DLQ routing.**
  * *Reason*: Irrevocably drops customer confirmation emails, shipping dispatches, and audit trail events.
- **DO NOT throttle the publishing service if messages represent completed financial orders.**
  * *Reason*: Creates inconsistent transactional states between payment authorization and fulfillment.

<!-- CHUNK: RB-QUEUE-01-E -->
## Rollback & Verification
- Verify consumer lag reaches zero.
- Re-scale consumer worker deployment back to baseline replica count after backlog drains.
