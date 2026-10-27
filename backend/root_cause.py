"""
CASCADIA — Root Cause Analysis Engine
Correlates temporal order, metric signatures, error patterns, and graph topology
to deduce the probable initiating root cause with evidence-backed justification.
"""

from typing import Dict, List, Any, Optional
from dependency_graph import DependencyGraph, SERVICES_TOPOLOGY

class RootCauseAnalyzer:
    def __init__(self):
        self.graph = DependencyGraph()
        self.topology = SERVICES_TOPOLOGY

    def analyze(self, services_state: Dict[str, Dict[str, Any]], logs: List[Dict[str, Any]], anomaly_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Ranks probable root causes based on temporal onset, topological centrality,
        and causal error propagation.
        """
        if not anomaly_data.get("has_anomaly", False):
            return {
                "has_incident": False,
                "top_candidate": None,
                "candidates": [],
                "summary": "Telemetry within normal operating parameters. No active root cause detected."
            }

        candidates: List[Dict[str, Any]] = []

        # Find first tick when each service showed an anomaly from history
        first_anomaly_tick: Dict[str, int] = {}
        for sid, s in services_state.items():
            hist = s.get("history", [])
            for pt in hist:
                norm_lat = self.topology[sid]["normal_latency"]
                if pt.get("latency_ms", 0) > norm_lat * 2.0 or pt.get("error_rate", 0) > 1.0 or pt.get("status") in ["DEGRADED", "CRITICAL"]:
                    if sid not in first_anomaly_tick:
                        first_anomaly_tick[sid] = pt.get("tick", 9999)
                    break

        # Calculate scores for candidate services
        for sid, s in services_state.items():
            anom_count = anomaly_data.get("service_anomaly_counts", {}).get(sid, 0)
            if anom_count == 0 and s["status"] == "HEALTHY":
                continue

            tier = self.topology[sid]["tier"]
            score = 0.0
            evidence_points: List[str] = []

            # 1. Temporal Factor (Earlier = higher suspicion)
            tick_onset = first_anomaly_tick.get(sid, 999)
            min_onset = min(first_anomaly_tick.values()) if first_anomaly_tick else tick_onset
            if tick_onset == min_onset:
                score += 35.0
                evidence_points.append(f"Earliest metric deviation recorded on {s['name']} (Tick {tick_onset}).")
            elif tick_onset <= min_onset + 1:
                score += 20.0
                evidence_points.append(f"Near-simultaneous deviation on {s['name']} within 1 interval of first fault.")
            else:
                score += 5.0
                evidence_points.append(f"Secondary deviation onset (+{(tick_onset - min_onset)*5}s delay), characteristic of downstream propagation.")

            # 2. Topological Directionality (Storage/Sink services impact callers, not vice versa)
            callers = self.graph.get_upstream_callers(sid)
            dependencies = self.graph.get_downstream_dependencies(sid)

            if tier == "STORAGE":
                score += 30.0
                evidence_points.append("Persistence tier node: Database failures propagate upstream to all connected application pools.")
            elif tier == "MESSAGING":
                score += 25.0
                evidence_points.append("Asynchronous broker node: Buffer backpressure causes worker queue starvation.")
            elif tier == "APPLICATION":
                score += 15.0
                evidence_points.append("Application tier: High coupling with both ingress routers and persistence backends.")
            elif tier == "INGRESS":
                # Ingress routers usually show 504s because downstream is slow, not self-inflicted
                score += 5.0
                evidence_points.append("Ingress tier: Timeout spikes typically reflect downstream upstream wait delays.")

            # 3. Metric Signatures
            if s.get("connection_pool_pct", 0) > 85.0:
                score += 20.0
                evidence_points.append(f"Connection pool exhaustion ({round(s.get('connection_pool_pct'), 1)}%) directly blocks caller threads.")
            if s.get("queue_depth", 0) > 1000:
                score += 20.0
                evidence_points.append(f"Message queue saturation ({s.get('queue_depth')} msgs) exceeds consumer rate.")
            if s.get("latency_ms", 0) > 1000:
                score += 15.0
                evidence_points.append(f"Severe latency spike ({round(s.get('latency_ms'), 1)}ms) triggers caller timeout cascades.")

            # 4. Corroborating Log Evidence
            service_logs = [l for l in logs if l.get("service") == sid and l.get("level") in ["ERROR", "FATAL", "WARN"]]
            if service_logs:
                first_log = service_logs[-1]  # earliest in recent slice
                evidence_points.append(f"Corroborating system log: \"{first_log.get('message')}\"")

            # Final normalized suspicion score (0 - 100)
            suspicion = min(99.0, max(15.0, score))
            confidence = "HIGH" if suspicion >= 75 else ("MEDIUM" if suspicion >= 50 else "LOW")

            candidates.append({
                "service_id": sid,
                "service_name": s["name"],
                "tier": tier,
                "suspicion_score": round(suspicion, 1),
                "confidence": confidence,
                "status_label": "Probable Root Cause" if suspicion >= 75 else "Symptomatic / Secondary",
                "evidence": evidence_points,
                "first_detected_tick": tick_onset
            })

        # Sort descending by suspicion score
        candidates.sort(key=lambda x: x["suspicion_score"], reverse=True)
        top_candidate = candidates[0] if candidates else None

        # Build natural-language evidence-backed explanation
        if top_candidate:
            top_name = top_candidate["service_name"]
            top_score = top_candidate["suspicion_score"]
            summary = (
                f"Probable root cause identified as {top_name} ({top_score}% confidence). "
                f"{top_candidate['evidence'][0]} "
                f"Downstream callers are experiencing thread pool starvation and timeout cascades."
            )
        else:
            summary = "No anomalous root cause identified."

        return {
            "has_incident": len(candidates) > 0,
            "top_candidate": top_candidate,
            "candidates": candidates,
            "summary": summary
        }
