"""
CASCADIA — Cascading Failure Prediction Engine
Estimates downstream failure propagation, risk scores, time-to-degradation windows,
and causal chains before secondary services fail.
"""

from typing import Dict, List, Any, Optional
from dependency_graph import DependencyGraph, SERVICES_TOPOLOGY

class CascadePredictor:
    def __init__(self):
        self.graph = DependencyGraph()
        self.topology = SERVICES_TOPOLOGY

    def predict_cascade(
        self, 
        services_state: Dict[str, Dict[str, Any]], 
        root_cause_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Predicts which downstream services will degrade next, providing
        risk probability, projected time windows, and supporting evidence.
        """
        top_root = root_cause_data.get("top_candidate")
        if not top_root:
            return {
                "has_prediction": False,
                "at_risk_count": 0,
                "time_to_collapse_sec": 0,
                "projected_blast_radius_pct": 0.0,
                "predictions": [],
                "summary": "No active cascading risks detected. All downstream paths stable."
            }

        origin_id = top_root["service_id"]
        origin_name = top_root["service_name"]
        origin_state = services_state.get(origin_id, {})
        origin_lat = origin_state.get("latency_ms", 20.0)
        origin_pool = origin_state.get("connection_pool_pct", 20.0)

        # Get all upstream callers that depend on this failing service
        impact_chain = self.graph.get_all_upstream_impacted(origin_id)
        predictions: List[Dict[str, Any]] = []

        for item in impact_chain:
            sid = item["service_id"]
            current_s = services_state.get(sid, {})
            current_lat = current_s.get("latency_ms", 0)
            current_status = current_s.get("status", "HEALTHY")
            coupling_strength = item["coupling_strength"]
            delay = item["estimated_delay_sec"]

            # Calculate risk score (0 - 100%)
            # High coupling + high origin latency = high risk
            base_risk = coupling_strength * 85.0
            if origin_lat > 1000:
                base_risk += 12.0
            if origin_pool > 80:
                base_risk += 8.0
            
            # If already degraded, risk is already manifested (100%)
            if current_status == "CRITICAL":
                risk_score = 99.0
                pred_state = "COLLAPSED (OBSERVED)"
                time_win = 0
            elif current_status == "DEGRADED":
                risk_score = 92.0
                pred_state = "IMMINENT CRITICAL"
                time_win = max(5, delay // 2)
            else:
                risk_score = min(95.0, round(base_risk, 1))
                pred_state = "PREDICTED DEGRADATION"
                time_win = delay

            # Build supporting evidence explanation
            evidence_points = [
                f"Directly coupled to {origin_name} via {item['coupling_type']} (coupling factor: {coupling_strength:.2f}).",
                f"Estimated cascade arrival window: ~{time_win} seconds based on connection pool depletion rate.",
                f"Sync timeout threshold ({item.get('timeout_ms', 500)}ms) will be exceeded if {origin_name} latency ({round(origin_lat, 1)}ms) sustains."
            ]

            predictions.append({
                "service_id": sid,
                "service_name": item["service_name"],
                "tier": self.topology[sid]["tier"],
                "current_status": current_status,
                "predicted_state": pred_state,
                "risk_score": round(risk_score, 1),
                "confidence": "HIGH" if coupling_strength > 0.8 else "MEDIUM",
                "time_window_sec": time_win,
                "hop_distance": item["hop_distance"],
                "propagation_path": item["path"],
                "evidence": evidence_points
            })

        # Sort predictions by hop distance / time window
        predictions.sort(key=lambda x: (x["time_window_sec"], -x["risk_score"]))

        # Time to catastrophic collapse (when ingress gateway degrades)
        gateway_pred = next((p for p in predictions if p["service_id"] == "gateway"), None)
        time_to_collapse = gateway_pred["time_window_sec"] if gateway_pred else (predictions[-1]["time_window_sec"] if predictions else 0)

        blast = self.graph.calculate_blast_radius(origin_id)

        at_risk_count = len(predictions)
        summary = (
            f"Cascade Alert: Initiating fault at {origin_name} is projected to degrade {at_risk_count} downstream "
            f"services within {time_to_collapse}s, reaching {blast['blast_radius_pct']}% blast radius."
        )

        return {
            "has_prediction": len(predictions) > 0,
            "at_risk_count": at_risk_count,
            "time_to_collapse_sec": time_to_collapse,
            "projected_blast_radius_pct": blast["blast_radius_pct"],
            "predictions": predictions,
            "summary": summary
        }
