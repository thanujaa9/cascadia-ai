"""
CASCADIA — Telemetry & Failure Injection Simulator
Simulates multi-service telemetry, cascading propagation physics, logs, and interventions.
"""

import time
import math
import random
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any, Optional

from dependency_graph import SERVICES_TOPOLOGY, DEPENDENCY_EDGES, DependencyGraph

class IncidentSimulator:
    def __init__(self):
        self.graph = DependencyGraph()
        self.reset()

    def reset(self):
        """Reset the simulator back to healthy baseline state at tick 0."""
        self.tick = 0
        self.base_time = datetime.now(timezone.utc) - timedelta(minutes=15)
        self.system_status = "HEALTHY"  # HEALTHY | DEGRADING | CRITICAL | RECOVERING | RECOVERED
        self.active_scenario = "healthy_baseline"
        self.injected_fault = None
        self.active_recovery = None
        self.recovery_applied_tick = None
        self.timeline_events: List[Dict[str, Any]] = []
        self.logs: List[Dict[str, Any]] = []
        self.services_state: Dict[str, Dict[str, Any]] = {}

        # Initialize telemetry per service
        for sid, meta in SERVICES_TOPOLOGY.items():
            self.services_state[sid] = {
                "id": sid,
                "name": meta["name"],
                "tier": meta["tier"],
                "status": "HEALTHY",
                "visual_label": "Healthy",  # Healthy | Observed | Probable Root Cause | Predicted At-Risk | Recovered
                "latency_ms": meta["normal_latency"],
                "p95_latency_ms": meta["normal_latency"] * 1.35,
                "p99_latency_ms": meta["normal_latency"] * 1.9,
                "error_rate": meta["normal_error_rate"],
                "throughput_rps": meta["normal_rps"],
                "cpu_utilization": meta["normal_cpu"],
                "memory_utilization": meta["normal_memory"],
                "queue_depth": meta.get("normal_queue_depth", 0),
                "active_connections": 18,
                "connection_pool_pct": 18.0,
                "health_score": 100.0,
                "history": []
            }

        self._record_history()
        self._add_log("gateway", "INFO", "System initialized. All services reporting normal telemetry baselines.")
        self._add_timeline_event("SYSTEM_INIT", "System initialized to healthy baseline telemetry.", "HEALTHY")

    def get_current_timestamp(self) -> str:
        current_dt = self.base_time + timedelta(seconds=self.tick * 5)
        return current_dt.isoformat()

    def _add_log(self, service_id: str, level: str, message: str, details: Optional[Dict[str, Any]] = None):
        log_entry = {
            "id": f"log-{len(self.logs)+1:05d}",
            "timestamp": self.get_current_timestamp(),
            "tick": self.tick,
            "service": service_id,
            "service_name": SERVICES_TOPOLOGY.get(service_id, {}).get("name", service_id),
            "level": level,
            "message": message,
            "details": details or {}
        }
        self.logs.insert(0, log_entry)  # Prepend for reverse-chronological UI view
        if len(self.logs) > 300:
            self.logs = self.logs[:300]

    def _add_timeline_event(self, event_type: str, description: str, severity: str, metadata: Optional[Dict[str, Any]] = None):
        self.timeline_events.append({
            "id": f"event-{len(self.timeline_events)+1}",
            "tick": self.tick,
            "timestamp": self.get_current_timestamp(),
            "type": event_type,
            "description": description,
            "severity": severity,
            "metadata": metadata or {}
        })

    def inject_scenario(self, scenario_name: str):
        """Loads a pre-packaged incident scenario."""
        self.active_scenario = scenario_name
        self.active_recovery = None
        self.recovery_applied_tick = None

        if scenario_name == "healthy_baseline":
            self.injected_fault = None
            self._add_log("gateway", "INFO", "Scenario switched to Healthy Baseline.")
            self._add_timeline_event("SCENARIO_SET", "Switched scenario to Healthy Baseline.", "HEALTHY")

        elif scenario_name == "database_slowdown":
            self.injected_fault = {
                "type": "database_slowdown",
                "target": "database",
                "start_tick": self.tick + 1,
                "intensity": 1.0,
                "description": "Lock contention on write transactions causing database connection pool saturation"
            }
            self._add_timeline_event(
                "FAULT_SCHEDULED", 
                "Scheduled Database Slowdown fault injection (Lock contention & connection pool exhaustion).", 
                "WARNING"
            )

        elif scenario_name == "queue_overload":
            self.injected_fault = {
                "type": "queue_overload",
                "target": "queue",
                "start_tick": self.tick + 1,
                "intensity": 1.0,
                "description": "Message burst exceeding consumer processing throughput"
            }
            self._add_timeline_event(
                "FAULT_SCHEDULED",
                "Scheduled Message Queue Overload fault injection.",
                "WARNING"
            )

        elif scenario_name == "payments_crash":
            self.injected_fault = {
                "type": "payments_crash",
                "target": "payments",
                "start_tick": self.tick + 1,
                "intensity": 1.0,
                "description": "Uncaught exception crash loop in payment authorization pod"
            }
            self._add_timeline_event(
                "FAULT_SCHEDULED",
                "Scheduled Payment Service Crash fault injection.",
                "CRITICAL"
            )

        elif scenario_name == "traffic_spike":
            self.injected_fault = {
                "type": "traffic_spike",
                "target": "gateway",
                "start_tick": self.tick + 1,
                "intensity": 1.0,
                "description": "500% ingress burst overwhelming thread pools and database concurrency"
            }
            self._add_timeline_event(
                "FAULT_SCHEDULED",
                "Scheduled Ingress Traffic Spike fault injection.",
                "WARNING"
            )

    def inject_custom_fault(self, target_service: str, fault_type: str, intensity: float = 1.0):
        """Custom configurable fault injection."""
        self.active_scenario = "custom"
        self.injected_fault = {
            "type": fault_type,
            "target": target_service,
            "start_tick": self.tick + 1,
            "intensity": max(0.2, min(2.0, intensity)),
            "description": f"Custom {fault_type} injected into {target_service}"
        }
        self._add_timeline_event(
            "CUSTOM_FAULT_INJECTED",
            f"Configured custom fault: {fault_type} on {SERVICES_TOPOLOGY.get(target_service, {}).get('name', target_service)}",
            "WARNING"
        )

    def apply_recovery(self, strategy_id: str) -> Dict[str, Any]:
        """Applies an intervention strategy to the live simulation."""
        self.active_recovery = strategy_id
        self.recovery_applied_tick = self.tick
        self.system_status = "RECOVERING"

        recovery_labels = {
            "scale_database": "Provisioning 2x Read Replicas & Expanding Connection Pool",
            "enable_cache_fallback": "Enabling Redis Cache Fallback & Read Throttling",
            "throttle_traffic": "Activating Gateway Shedding (40% rate limit)",
            "restart_database": "Initiating Graceful Container Restart on Database Cluster",
            "scale_workers": "Auto-scaling Notification Workers 3x",
            "circuit_breaker": "Trip Circuit Breaker to Payment Service with Mock Success"
        }

        label = recovery_labels.get(strategy_id, strategy_id)
        self._add_log("gateway", "WARN", f"Intervention executed: {label}")
        self._add_timeline_event("RECOVERY_APPLIED", f"Executed intervention: {label}", "HEALTHY", {"strategy_id": strategy_id})

        return {
            "status": "APPLIED",
            "strategy_id": strategy_id,
            "label": label,
            "tick": self.tick,
            "timestamp": self.get_current_timestamp()
        }

    def rollback_recovery(self):
        """Rollbacks active recovery strategy."""
        old = self.active_recovery
        self.active_recovery = None
        self.recovery_applied_tick = None
        self._add_log("gateway", "WARN", f"Intervention {old} rolled back by operator.")
        self._add_timeline_event("RECOVERY_ROLLBACK", f"Rolled back intervention: {old}", "WARNING")

    def step(self):
        """Advances simulation by 1 tick (5 simulated seconds) and computes cascading physics."""
        self.tick += 1
        fault = self.injected_fault
        recovery = self.active_recovery
        rec_ticks = (self.tick - self.recovery_applied_tick) if self.recovery_applied_tick is not None else -1

        # Check if fault is active
        is_fault_active = fault is not None and self.tick >= fault["start_tick"]
        fault_elapsed = (self.tick - fault["start_tick"]) if is_fault_active else 0

        # Step each service state according to realistic physics
        self._step_database_slowdown(is_fault_active, fault_elapsed, recovery, rec_ticks)
        self._step_queue_overload(is_fault_active, fault_elapsed, recovery, rec_ticks)
        self._step_payments_crash(is_fault_active, fault_elapsed, recovery, rec_ticks)
        self._step_traffic_spike(is_fault_active, fault_elapsed, recovery, rec_ticks)
        self._step_healthy_noise(is_fault_active)

        # Update overall system status
        self._evaluate_system_health()

        # Record point in history
        self._record_history()

    def _step_database_slowdown(self, is_fault: bool, elapsed: int, recovery: Optional[str], rec_ticks: int):
        if not (is_fault and self.injected_fault.get("type") == "database_slowdown"):
            return

        db = self.services_state["database"]
        orders = self.services_state["orders"]
        payments = self.services_state["payments"]
        gw = self.services_state["gateway"]
        q = self.services_state["queue"]

        # Check if recovery is taking effect
        if recovery == "enable_cache_fallback" and rec_ticks >= 1:
            # Immediate relief: DB load drops 75%, latency recovers
            db["latency_ms"] = max(14.0, db["latency_ms"] * 0.45)
            db["connection_pool_pct"] = max(24.0, db["connection_pool_pct"] * 0.4)
            db["status"] = "RECOVERED"
            db["visual_label"] = "Recovered"

            orders["latency_ms"] = max(45.0, orders["latency_ms"] * 0.4)
            orders["error_rate"] = max(0.04, orders["error_rate"] * 0.15)
            orders["status"] = "HEALTHY"
            orders["visual_label"] = "Protected by Cache"

            payments["latency_ms"] = max(58.0, payments["latency_ms"] * 0.4)
            payments["error_rate"] = max(0.03, payments["error_rate"] * 0.15)
            payments["status"] = "HEALTHY"

            gw["latency_ms"] = max(20.0, gw["latency_ms"] * 0.5)
            gw["error_rate"] = max(0.02, gw["error_rate"] * 0.1)
            gw["status"] = "HEALTHY"

            if rec_ticks == 1:
                self._add_log("database", "INFO", "Redis cache fallback active. Database query load decreased by 74%. Connection pool freed.")
                self._add_log("orders", "INFO", "Order Service latency normalized (48ms). Read queries served from replica cache.")
            return

        if recovery == "scale_database":
            # Takes ~3 ticks (15s) to spin up read replicas
            if rec_ticks < 3:
                self._add_log("database", "WARN", f"Provisioning read replica containers... ({rec_ticks*5}/15s elapsed)")
            else:
                db["latency_ms"] = max(16.0, db["latency_ms"] * 0.6)
                db["connection_pool_pct"] = 32.0
                db["status"] = "RECOVERED"
                orders["latency_ms"] = max(48.0, orders["latency_ms"] * 0.6)
                orders["error_rate"] = 0.05
                orders["status"] = "HEALTHY"
                gw["status"] = "HEALTHY"
                gw["error_rate"] = 0.02
                if rec_ticks == 3:
                    self._add_log("database", "INFO", "Read replica active. Connection capacity doubled to 200.")
                return

        if recovery == "restart_database":
            if rec_ticks <= 2:
                db["status"] = "CRITICAL"
                db["error_rate"] = 100.0
                orders["status"] = "CRITICAL"
                orders["error_rate"] = 100.0
                self._add_log("database", "FATAL", "Database instance restarting. Connection dropped.")
                return
            else:
                db["latency_ms"] = 18.0
                db["error_rate"] = 0.02
                db["status"] = "RECOVERED"
                orders["latency_ms"] = 50.0
                orders["error_rate"] = 0.05
                orders["status"] = "HEALTHY"
                return

        # FAULT PROPAGATION DYNAMICS (No recovery or recovery pending)
        # Stage 1 (elapsed 0..2): Root cause manifests on Database
        if elapsed == 0:
            db["latency_ms"] = 380.0
            db["connection_pool_pct"] = 68.0
            db["cpu_utilization"] = 62.0
            db["status"] = "DEGRADED"
            db["visual_label"] = "Observed"
            self._add_log("database", "WARN", "Postgres slow query detected (SELECT * FROM orders FOR UPDATE took 380ms). Connection pool 68% saturated.")
            self._add_timeline_event("ANOMALY_DETECTED", "Database query latency crossed warning threshold (380ms).", "WARNING", {"service": "database"})

        elif elapsed == 1:
            db["latency_ms"] = 1150.0
            db["connection_pool_pct"] = 88.0
            db["cpu_utilization"] = 84.0
            db["status"] = "CRITICAL"
            db["visual_label"] = "Observed"
            # Orders and Payments start feeling the delay
            orders["latency_ms"] = 320.0
            orders["connection_pool_pct"] = 72.0
            orders["status"] = "DEGRADED"
            orders["visual_label"] = "Predicted At-Risk"
            self._add_log("database", "ERROR", "Connection pool exhausted (88/100 connections). Lock wait timeouts occurring on index order_items_pkey.")
            self._add_log("orders", "WARN", "DB query latency 1150ms exceeds warn threshold. Orders response time increased to 320ms.")

        elif elapsed == 2:
            db["latency_ms"] = 2240.0
            db["connection_pool_pct"] = 98.0
            db["status"] = "CRITICAL"
            db["visual_label"] = "Observed"

            orders["latency_ms"] = 1450.0
            orders["error_rate"] = 8.5
            orders["status"] = "CRITICAL"
            orders["visual_label"] = "Cascade Degraded"

            payments["latency_ms"] = 890.0
            payments["error_rate"] = 6.2
            payments["status"] = "DEGRADED"
            payments["visual_label"] = "Predicted At-Risk"

            self._add_log("orders", "ERROR", "Orders RPC pool depleted waiting for DB response. 504 timeouts to callers (8.5% error rate).")
            self._add_log("payments", "WARN", "Payment audit flush timed out after 600ms.")

        elif elapsed >= 3:
            # Full cascade reach to Gateway
            db["latency_ms"] = 2850.0 + random.uniform(-100, 150)
            db["connection_pool_pct"] = 100.0
            db["status"] = "CRITICAL"
            db["visual_label"] = "Observed"

            orders["latency_ms"] = 2100.0
            orders["error_rate"] = 24.8
            orders["status"] = "CRITICAL"

            payments["latency_ms"] = 1420.0
            payments["error_rate"] = 18.4
            payments["status"] = "CRITICAL"

            gw["latency_ms"] = 1180.0
            gw["error_rate"] = 26.5
            gw["throughput_rps"] = 480
            gw["status"] = "CRITICAL"
            gw["visual_label"] = "Cascade Collapsed"

            q["queue_depth"] = min(2400, q["queue_depth"] + 180)
            q["status"] = "DEGRADED"

            if elapsed == 3:
                self._add_log("gateway", "FATAL", "Ingress Gateway thread starvation! 26.5% of client requests timing out (504 Gateway Timeout).")
                self._add_timeline_event("CASCADE_COLLAPSE", "Failure propagated to API Gateway: 504 Gateway Timeouts widespread.", "CRITICAL", {"service": "gateway"})

    def _step_queue_overload(self, is_fault: bool, elapsed: int, recovery: Optional[str], rec_ticks: int):
        if not (is_fault and self.injected_fault.get("type") == "queue_overload"):
            return

        q = self.services_state["queue"]
        notif = self.services_state["notifications"]

        if recovery == "scale_workers" and rec_ticks >= 1:
            q["queue_depth"] = max(35, q["queue_depth"] - 450)
            q["status"] = "RECOVERED"
            notif["latency_ms"] = 40.0
            notif["status"] = "HEALTHY"
            if rec_ticks == 1:
                self._add_log("notifications", "INFO", "Worker pool scaled 3x (12 consumer pods active). Queue backlog draining rapidly.")
            return

        if elapsed == 0:
            q["queue_depth"] = 850
            q["status"] = "DEGRADED"
            q["visual_label"] = "Observed"
            self._add_log("queue", "WARN", "High incoming message rate (3,200 msg/s). Consumer lag increasing.")
        elif elapsed == 1:
            q["queue_depth"] = 2800
            q["status"] = "CRITICAL"
            q["visual_label"] = "Observed"
            notif["latency_ms"] = 420.0
            notif["status"] = "DEGRADED"
            notif["visual_label"] = "Predicted At-Risk"
            self._add_log("queue", "ERROR", "Queue buffer depth reached 2,800 messages. Worker consumption throttled.")
        elif elapsed >= 2:
            q["queue_depth"] = min(8500, q["queue_depth"] + 1200)
            q["status"] = "CRITICAL"
            notif["latency_ms"] = 1250.0
            notif["error_rate"] = 14.2
            notif["status"] = "CRITICAL"
            notif["visual_label"] = "Cascade Degraded"
            if elapsed == 2:
                self._add_log("notifications", "ERROR", "Notification dispatch latency exceeded 1200ms. Outbox buffer memory pressure.")

    def _step_payments_crash(self, is_fault: bool, elapsed: int, recovery: Optional[str], rec_ticks: int):
        if not (is_fault and self.injected_fault.get("type") == "payments_crash"):
            return

        pm = self.services_state["payments"]
        ord_s = self.services_state["orders"]
        gw = self.services_state["gateway"]

        if recovery == "circuit_breaker" and rec_ticks >= 1:
            pm["status"] = "DEGRADED"
            ord_s["error_rate"] = 0.5
            ord_s["status"] = "HEALTHY"
            gw["error_rate"] = 0.2
            gw["status"] = "HEALTHY"
            if rec_ticks == 1:
                self._add_log("gateway", "INFO", "Circuit breaker OPEN on payments service. Fallback mock authorization queued.")
            return

        if elapsed == 0:
            pm["error_rate"] = 45.0
            pm["status"] = "CRITICAL"
            pm["visual_label"] = "Observed"
            self._add_log("payments", "FATAL", "SIGSEGV / OOMKilled in payment-auth-worker pod container.")
        elif elapsed >= 1:
            pm["error_rate"] = 92.0
            pm["status"] = "CRITICAL"
            pm["visual_label"] = "Observed"
            ord_s["error_rate"] = 38.0
            ord_s["status"] = "CRITICAL"
            ord_s["visual_label"] = "Cascade Degraded"
            gw["error_rate"] = 28.0
            gw["status"] = "CRITICAL"
            gw["visual_label"] = "Cascade Degraded"
            if elapsed == 1:
                self._add_log("orders", "ERROR", "Payment service unreachable. Cart checkout transaction aborted for 38% of users.")

    def _step_traffic_spike(self, is_fault: bool, elapsed: int, recovery: Optional[str], rec_ticks: int):
        if not (is_fault and self.injected_fault.get("type") == "traffic_spike"):
            return

        gw = self.services_state["gateway"]
        ord_s = self.services_state["orders"]
        db = self.services_state["database"]

        if recovery == "throttle_traffic" and rec_ticks >= 1:
            gw["throughput_rps"] = 1350
            gw["latency_ms"] = 28.0
            gw["error_rate"] = 0.5
            gw["status"] = "HEALTHY"
            ord_s["status"] = "HEALTHY"
            db["status"] = "HEALTHY"
            if rec_ticks == 1:
                self._add_log("gateway", "INFO", "Ingress traffic shedder enabled (40% non-essential requests rate-limited with HTTP 429).")
            return

        if elapsed == 0:
            gw["throughput_rps"] = 4500
            gw["cpu_utilization"] = 88.0
            gw["latency_ms"] = 120.0
            gw["status"] = "DEGRADED"
            gw["visual_label"] = "Observed"
            self._add_log("gateway", "WARN", "Ingress request volume spiked from 1250 RPS to 4500 RPS.")
        elif elapsed >= 1:
            gw["throughput_rps"] = 6200
            gw["cpu_utilization"] = 98.0
            gw["latency_ms"] = 850.0
            gw["error_rate"] = 18.0
            gw["status"] = "CRITICAL"
            ord_s["cpu_utilization"] = 92.0
            ord_s["latency_ms"] = 480.0
            ord_s["status"] = "DEGRADED"
            db["connection_pool_pct"] = 95.0
            db["status"] = "DEGRADED"

    def _step_healthy_noise(self, is_fault: bool):
        """Adds natural minor jitter to healthy services for realistic live telemetry."""
        for sid, s in self.services_state.items():
            if s["status"] in ["HEALTHY", "RECOVERED"]:
                meta = SERVICES_TOPOLOGY[sid]
                noise_factor = random.uniform(0.92, 1.08)
                s["latency_ms"] = round(meta["normal_latency"] * noise_factor, 1)
                s["p95_latency_ms"] = round(s["latency_ms"] * 1.35, 1)
                s["p99_latency_ms"] = round(s["latency_ms"] * 1.85, 1)
                s["cpu_utilization"] = round(max(5.0, min(95.0, meta["normal_cpu"] + random.uniform(-3, 3))), 1)
                s["memory_utilization"] = round(max(5.0, min(95.0, meta["normal_memory"] + random.uniform(-1, 1))), 1)
                s["throughput_rps"] = int(meta["normal_rps"] * random.uniform(0.95, 1.05))
                if sid == "queue":
                    s["queue_depth"] = max(10, int(meta.get("normal_queue_depth", 45) + random.uniform(-10, 15)))

    def _evaluate_system_health(self):
        critical_count = sum(1 for s in self.services_state.values() if s["status"] == "CRITICAL")
        degraded_count = sum(1 for s in self.services_state.values() if s["status"] == "DEGRADED")
        recovered_count = sum(1 for s in self.services_state.values() if s["status"] == "RECOVERED")

        if critical_count >= 2:
            self.system_status = "CRITICAL"
        elif critical_count == 1 or degraded_count >= 2:
            self.system_status = "DEGRADING"
        elif self.active_recovery and (recovered_count > 0 or critical_count == 0):
            self.system_status = "RECOVERED"
        else:
            self.system_status = "HEALTHY"

    def _record_history(self):
        ts = self.get_current_timestamp()
        for sid, s in self.services_state.items():
            s["history"].append({
                "tick": self.tick,
                "timestamp": ts,
                "latency_ms": round(s["latency_ms"], 1),
                "error_rate": round(s["error_rate"], 2),
                "cpu_utilization": round(s["cpu_utilization"], 1),
                "throughput_rps": s["throughput_rps"],
                "queue_depth": s.get("queue_depth", 0),
                "status": s["status"]
            })
            if len(s["history"]) > 30:
                s["history"] = s["history"][-30:]

    def get_snapshot(self) -> Dict[str, Any]:
        """Returns full simulator state snapshot."""
        return {
            "tick": self.tick,
            "timestamp": self.get_current_timestamp(),
            "system_status": self.system_status,
            "active_scenario": self.active_scenario,
            "injected_fault": self.injected_fault,
            "active_recovery": self.active_recovery,
            "services": self.services_state,
            "recent_logs": self.logs[:50],
            "timeline": self.timeline_events[-20:]
        }
