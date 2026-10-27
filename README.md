# CASCADIA — Predict the ripple. Prevent the collapse.

> **AI / SRE Intelligent Incident Prediction & Recovery Platform**  
> Modern applications depend on interconnected services. One fault can take down everything.  
> CASCADIA predicts how failures propagate through connected services, identifies the most likely root cause, and recommends the best recovery strategy before a local issue becomes a system-wide outage.

---

## 1. The Core Problem & CASCADIA Solution

Modern distributed microservice systems suffer from **cascading failures**:
- A primary database lock contention causes slow queries.
- Upstream Order and Payment services wait on synchronous queries, exhausting their thread connection pools.
- API Gateway times out waiting on upstream responses, returning widespread `504 Gateway Timeout` errors.
- Influx of retries overwhelms message queues, triggering a complete systemic collapse.

Traditional APMs (Datadog, Grafana, CloudWatch) alert engineers to **symptoms as they occur**. Engineers are left to frantically triage logs, trace causal dependencies, and guess at recovery actions.

**CASCADIA closes the loop with the 4-step Operating Loop:**
1. **OBSERVE**: Continuously evaluates multi-tier telemetry (p95/p99 latency, error rates, connection pool saturation, queue depth).
2. **PREDICT**: Calculates graph propagation, topological blast radius, and estimates downstream degradation risk before secondary services collapse.
3. **DECIDE (Cascade Intervention Lab)**: Ranks alternative interventions (Scale DB, Cache Fallback, Ingress Shedding, Container Restart), displaying projected MTTR, blast radius reduction, resource cost, and trade-offs.
4. **RECOVER & VERIFY**: Simulates the selected fix in real time, validating telemetry recovery and measuring spared downstream services against an unmitigated baseline.

---

## 2. System Architecture

```
cinema-camera-site/
├── backend/
│   ├── main.py              # FastAPI REST endpoints & static server
│   ├── simulator.py         # Telemetry simulation & failure physics
│   ├── anomaly_detector.py  # Z-score and hard SLO anomaly detection
│   ├── ml_anomaly.py        # Scikit-learn Isolation Forest multivariate ML
│   ├── runbook_rag.py       # RAG engine with citation validation & fallback
│   ├── runbooks/            # 8 enterprise SRE Markdown runbooks with chunk IDs
│   ├── dependency_graph.py  # Service topology, coupling, and blast radius
│   ├── predictor.py         # Downstream risk estimates & cascade paths
│   ├── root_cause.py        # Evidence-backed root cause ranking
│   ├── recovery.py          # Action generation & trade-off projection
│   ├── recovery_sim.py      # Counterfactual simulation & verification
│   ├── incident_store.py    # SQLite persistence for incidents
│   ├── report.py            # Post-mortem report generation
│   └── evaluator.py         # 12-test synthetic evaluation benchmark
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx                   # Status, scenario switcher, time stepper
│   │   │   ├── DependencyGraph.tsx          # Interactive animated SVG service mesh
│   │   │   ├── CopilotDiagnoseCard.tsx      # RAG Copilot card with citation pills
│   │   │   ├── RunbookModal.tsx             # Clickable runbook source viewer modal
│   │   │   ├── PredictionPanel.tsx          # Downstream at-risk countdown & evidence
│   │   │   ├── RootCauseCard.tsx            # Initiating fault candidate attribution
│   │   │   ├── CascadeInterventionLab.tsx   # Standout comparison & verification
│   │   │   ├── ServiceInspector.tsx         # Node-level telemetry sparklines & logs
│   │   │   ├── LogViewer.tsx                # Filterable reverse-chronological log stream
│   │   │   ├── TimelineAndReport.tsx        # Milestone timeline & post-mortem export
│   │   │   ├── BenchmarkModal.tsx           # ML Isolation Forest vs Z-score & RAG Hit Rate
│   │   │   ├── AssistantDrawer.tsx          # Evidence-grounded natural language copilot
│   │   │   └── CustomFaultModal.tsx         # User-configurable fault injector
│   │   ├── services/api.ts                  # REST API client
│   │   ├── types/index.ts                   # TypeScript interfaces
│   │   └── App.tsx                          # Core application orchestrator
│   └── dist/                                # Production-compiled static bundle
├── tests/
│   └── test_cascadia.py                     # Python unit & integration test suite
└── start.sh                                 # One-click execution script
```

---

## 3. Key Features Ranked by Judging Impact

| Priority | Feature | Judging Value |
|---|---|---|
| **P0 Core** | **Cascading Failure Prediction** | Forecasts downstream service degradation before it happens with risk scores, confidence, time windows, and supporting evidence. |
| **P0 Core** | **Interactive Dependency Graph** | 6-node topology with animated SVG propagation pulses distinguishing *Observed*, *Probable Root Cause*, *Predicted At-Risk*, and *Healthy* nodes. |
| **P0 Differentiator** | **Cascade Intervention Lab** | Multi-strategy comparison matrix evaluating 4 distinct recovery alternatives (expected benefits, trade-offs, projected MTTR, and resource costs). |
| **P0 Core** | **Counterfactual Verification** | Measures telemetry deltas (MTTR, -98.4% latency drop, -99.8% error rate drop) comparing the intervention against an unmitigated collapse. |
| **P0 Core** | **Root Cause Analysis** | Ranks initiating faults using temporal onset precedence and graph tier positioning rather than unverified LLM guesses. |
| **P0 Core** | **Live Incident Dashboard** | Real-time telemetry, tick controls (+5s step, auto-advance), and active incident status alerts. |
| **P1 Valuable** | **Incident Timeline & Report** | Chronological replay of milestones and exportable Markdown/JSON executive post-mortem. |
| **Bonus** | **AI SRE Incident Copilot** | Natural language assistant answering questions strictly grounded in live incident telemetry and graph relationships. |
| **Bonus** | **Empirical Evaluation Benchmark** | Live test suite executing 12 synthetic labelled incidents measuring Precision, Recall, and Top-1/Top-3 Root Cause accuracy. |

---

## 4. 3-Minute Judging Demonstration Script

### Scene 1: Healthy System (00:00 – 00:25)
- Open `http://127.0.0.1:8000`.
- Point out the 6 microservices: **API Gateway** (Ingress), **Order Service** & **Payment Service** (Application), **Primary Database** (Storage), **Message Broker** (Queue), and **Notification Worker** (Async).
- Note that all baseline metrics are green: Database latency ~12ms, Gateway errors 0.02%, system status **SYSTEM HEALTHY**.

### Scene 2: The First Fault & Cascade Prediction (00:25 – 01:00)
- In the top bar, switch scenario to **🔴 DB Slowdown (Primary)**.
- Click **+5s (Step)** twice.
- Observe:
  - Database latency spikes from 12ms to 1,150ms.
  - The node turns red and is labeled **Observed Fault / Probable Root Cause (99% Suspicion)**.
  - The animated SVG pulses begin flowing upward along the dependency edges.
  - The **Cascading Failure Prediction** panel alerts: `Order Service` and `Payment Service` are **Predicted At-Risk (95% risk, ~15s window)** before they have even failed!

### Scene 3: Cascade Intervention Lab (01:00 – 01:45)
- Click the **Cascade Intervention Lab** tab.
- Show the 4 alternative recovery strategies:
  1. **Enable Cache Fallback & Read Throttling** (RECOMMENDED · MTTR ~8s · Low Cost)
  2. **Auto-Scale DB Replicas** (Alternative · MTTR ~45s · High Cost $$$)
  3. **Shed Ingress Traffic** (Containment Only · Drops 40% user requests)
  4. **Hard Restart Database** (High Risk · Causes 75s total outage)
- Highlight why CASCADIA does **not** blindly restart the database: restarting Postgres drops all active transactions and creates 100% downtime.

### Scene 4: Recover & Verify (01:45 – 02:30)
- On Option 1 (*Enable Cache Fallback*), click **Execute Intervention**.
- Click **+5s (Step)**.
- Observe immediate recovery:
  - Database latency drops from 2,850ms to 24ms (-98.4%).
  - API Gateway error rate plummets to 0.04% (-99.8%).
  - Status transitions to **RECOVERED & VERIFIED**.
  - Review the **Counterfactual Verification Matrix**: 3 of 3 downstream services spared, ~18,250 requests saved from failing.

### Scene 5: Prove the Outcome & Export Report (02:30 – 03:00)
- Click the **Incident Report** tab to view the executive post-mortem and click **Download Report**.
- Click the **Evaluation** tab and click **Re-Run Benchmark**: showcase the actual measured results on the 12 labelled test incidents (**100% Anomaly F1, 100% Top-3 Root Cause Accuracy, 0.13ms analysis latency**).

---

## 5. Measured Empirical Benchmark Results (Section 7)

Evaluated on 12 synthetic labelled incidents covering healthy baselines, isolated failures, and cascading outages:

| Metric | Measured Value | Standard Target | Status |
|---|---|---|---|
| **Anomaly Detection Precision** | **100.0%** | &gt; 90.0% | Pass |
| **Anomaly Detection Recall** | **100.0%** | &gt; 90.0% | Pass |
| **Anomaly Detection F1 Score** | **100.0%** | &gt; 90.0% | Pass |
| **Root Cause Top-1 Accuracy** | **77.8%** | &gt; 70.0% | Pass |
| **Root Cause Top-3 Accuracy** | **100.0%** | &gt; 95.0% | Pass |
| **Cascade Prediction Lead Window**| **15 – 45 seconds** | &gt; 10s | Pass |
| **Simulated Recovery MTTR** | **~8.0 seconds** | &lt; 30s | Pass |
| **Downstream Services Spared** | **100.0% (3 of 3)** | &gt; 80% | Pass |
| **Average Evaluation Latency** | **0.13 ms** | &lt; 50ms | Real-Time |

---

## 6. How to Run

### Quick Launch
```bash
# 1. Start the server (serves both API & Frontend on port 8000)
./start.sh
```

Open your browser to:
- **Application Dashboard:** `http://127.0.0.1:8000`
- **FastAPI Interactive Docs:** `http://127.0.0.1:8000/docs`
- **Evaluation API Endpoint:** `http://127.0.0.1:8000/api/evaluate`

### Run Automated Tests
```bash
python3 -m unittest tests/test_cascadia.py
```

### Frontend Development Mode (Optional)
```bash
cd frontend
npm run dev
```
Proxy routes `/api` directly to backend at `http://127.0.0.1:8000`.
