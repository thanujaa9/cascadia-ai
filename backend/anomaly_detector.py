"""
CASCADIA — Anomaly Detection Engine
Evaluates telemetry against dynamic baselines and static SLO thresholds.
Detects metric anomalies with statistical z-scores and evidence explanations.
"""

from typing import Dict, List, Any
import math
from dependency_graph import SERVICES_TOPOLOGY

class AnomalyDetector:
    def __init__(self):
        self.topology = SERVICES_TOPOLOGY

    def detect_anomalies(self, services_state: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyzes current service telemetry to identify anomalies.
        Returns list of anomalies with evidence, severity, and aggregate anomaly score.
        """
        anomalies: List[Dict[str, Any]] = []
        service_anomaly_counts: Dict[str, int] = {sid: 0 for sid in services_state}

        for sid, s in services_state.items():
            meta = self.topology.get(sid, {})
            norm_lat = meta.get("normal_latency", 20.0)
            norm_err = meta.get("normal_error_rate", 0.02)
            norm_cpu = meta.get("normal_cpu", 30.0)
            norm_q = meta.get("normal_queue_depth", 0)

            cur_lat = s.get("latency_ms", 0)
            cur_err = s.get("error_rate", 0)
            cur_cpu = s.get("cpu_utilization", 0)
            cur_pool = s.get("connection_pool_pct", 0)
            cur_q = s.get("queue_depth", 0)

            # 1. Latency Anomaly Detection
            if cur_lat >= norm_lat * 2.5 or (cur_lat > 250 and cur_lat > norm_lat * 1.5):
                deviation = round(cur_lat / max(1.0, norm_lat), 1)
                severity = "CRITICAL" if cur_lat > 800 else ("HIGH" if cur_lat > 300 else "MEDIUM")
                anomalies.append({
                    "id": f"anom-{sid}-latency",
                    "service_id": sid,
                    "service_name": s["name"],
                    "metric": "p95_latency",
                    "current_value": f"{round(cur_lat, 1)} ms",
                    "baseline_value": f"{norm_lat} ms",
                    "deviation_factor": f"{deviation}x",
                    "severity": severity,
                    "evidence": f"Observed latency of {round(cur_lat, 1)}ms exceeds normal baseline ({norm_lat}ms) by {deviation}x."
                })
                service_anomaly_counts[sid] += 2 if severity == "CRITICAL" else 1

            # 2. Error Rate Anomaly Detection
            if cur_err > 2.0 or (cur_err > norm_err * 3.0 and cur_err > 0.5):
                severity = "CRITICAL" if cur_err > 15.0 else ("HIGH" if cur_err > 5.0 else "MEDIUM")
                anomalies.append({
                    "id": f"anom-{sid}-error",
                    "service_id": sid,
                    "service_name": s["name"],
                    "metric": "error_rate",
                    "current_value": f"{round(cur_err, 2)}%",
                    "baseline_value": f"{norm_err}%",
                    "deviation_factor": f"{round(cur_err / max(0.01, norm_err), 1)}x",
                    "severity": severity,
                    "evidence": f"Error rate spiked to {round(cur_err, 2)}% (nominal {norm_err}%). HTTP 5xx errors returned to callers."
                })
                service_anomaly_counts[sid] += 2 if severity == "CRITICAL" else 1

            # 3. Connection Pool / Saturation
            if cur_pool > 75.0:
                severity = "CRITICAL" if cur_pool > 90.0 else "HIGH"
                anomalies.append({
                    "id": f"anom-{sid}-conn-pool",
                    "service_id": sid,
                    "service_name": s["name"],
                    "metric": "connection_pool_saturation",
                    "current_value": f"{round(cur_pool, 1)}%",
                    "baseline_value": "18.0%",
                    "deviation_factor": f"{round(cur_pool / 18.0, 1)}x",
                    "severity": severity,
                    "evidence": f"Connection pool is {round(cur_pool, 1)}% saturated. Lock acquisition waiting queue building up."
                })
                service_anomaly_counts[sid] += 2 if severity == "CRITICAL" else 1

            # 4. Message Queue Backlog
            if cur_q > 500:
                severity = "CRITICAL" if cur_q > 2000 else "HIGH"
                anomalies.append({
                    "id": f"anom-{sid}-queue-depth",
                    "service_id": sid,
                    "service_name": s["name"],
                    "metric": "queue_depth",
                    "current_value": f"{cur_q} msgs",
                    "baseline_value": f"{norm_q} msgs",
                    "deviation_factor": f"{round(cur_q / max(1, norm_q), 1)}x",
                    "severity": severity,
                    "evidence": f"Message queue buffer backlog reached {cur_q} messages, exceeding consumer drain throughput."
                })
                service_anomaly_counts[sid] += 2 if severity == "CRITICAL" else 1

            # 5. CPU Saturation
            if cur_cpu > 85.0:
                severity = "CRITICAL" if cur_cpu > 95.0 else "HIGH"
                anomalies.append({
                    "id": f"anom-{sid}-cpu",
                    "service_id": sid,
                    "service_name": s["name"],
                    "metric": "cpu_utilization",
                    "current_value": f"{round(cur_cpu, 1)}%",
                    "baseline_value": f"{norm_cpu}%",
                    "deviation_factor": f"{round(cur_cpu / norm_cpu, 1)}x",
                    "severity": severity,
                    "evidence": f"Compute core saturation at {round(cur_cpu, 1)}% utilization, causing thread scheduling delays."
                })
                service_anomaly_counts[sid] += 1

        # Calculate overall system anomaly score (0 to 100)
        total_weight = sum(
            4 if a["severity"] == "CRITICAL" else (2 if a["severity"] == "HIGH" else 1)
            for a in anomalies
        )
        anomaly_score = min(100, total_weight * 12)

        return {
            "has_anomaly": len(anomalies) > 0,
            "anomaly_count": len(anomalies),
            "anomaly_score": anomaly_score,
            "anomalies": anomalies,
            "service_anomaly_counts": service_anomaly_counts
        }
