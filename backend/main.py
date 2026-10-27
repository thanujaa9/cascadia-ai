"""
CASCADIA — FastAPI Orchestration Server
Provides REST APIs for live telemetry streaming, failure injection,
graph topology, root cause analysis, cascade prediction, and the Cascade Intervention Lab.
"""

from fastapi import FastAPI, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import os
from pydantic import BaseModel
from typing import Dict, List, Any, Optional

from simulator import IncidentSimulator
from dependency_graph import DependencyGraph, SERVICES_TOPOLOGY, DEPENDENCY_EDGES
from anomaly_detector import AnomalyDetector
from root_cause import RootCauseAnalyzer
from predictor import CascadePredictor
from recovery import RecoveryEngine
from recovery_sim import InterventionSimulator
from incident_store import IncidentStore
from report import ReportGenerator
from evaluator import BenchmarkEvaluator
from ml_anomaly import MLAnomalyDetector
from runbook_rag import RunbookRAGEngine

app = FastAPI(
    title="CASCADIA SRE Intelligence API",
    description="Predict the ripple. Prevent the collapse. Cascading Failure Prediction & Intervention Engine.",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core engine instances
simulator = IncidentSimulator()
dep_graph = DependencyGraph()
anomaly_detector = AnomalyDetector()
root_cause_analyzer = RootCauseAnalyzer()
cascade_predictor = CascadePredictor()
recovery_engine = RecoveryEngine()
intervention_sim = InterventionSimulator()
incident_store = IncidentStore()
report_gen = ReportGenerator()
benchmark_evaluator = BenchmarkEvaluator()
ml_detector = MLAnomalyDetector()
rag_engine = RunbookRAGEngine()

# Request models
class ScenarioRequest(BaseModel):
    scenario: str

class CustomFaultRequest(BaseModel):
    target_service: str
    fault_type: str
    intensity: float = 1.0

class RecoveryRequest(BaseModel):
    strategy_id: str

class AssistantQuery(BaseModel):
    query: str

def get_complete_analysis() -> Dict[str, Any]:
    """Computes end-to-end intelligence pipeline for the current simulator tick."""
    snapshot = simulator.get_snapshot()
    services = snapshot["services"]
    logs = snapshot["recent_logs"]

    anomalies = anomaly_detector.detect_anomalies(services)
    root_cause = root_cause_analyzer.analyze(services, logs, anomalies)
    predictions = cascade_predictor.predict_cascade(services, root_cause)
    strategies = recovery_engine.get_recovery_strategies(root_cause, predictions)

    # Attach visual node labels based on state & predictions
    top_rc_id = (root_cause.get("top_candidate") or {}).get("service_id")
    predicted_at_risk_ids = set(p["service_id"] for p in predictions.get("predictions", []))

    for sid, s in services.items():
        if s["status"] == "RECOVERED":
            s["visual_label"] = "Recovered"
        elif sid == top_rc_id:
            s["visual_label"] = "Probable Root Cause"
        elif s["status"] in ["CRITICAL", "DEGRADED"]:
            s["visual_label"] = "Observed Degradation"
        elif sid in predicted_at_risk_ids:
            s["visual_label"] = "Predicted At-Risk"
        else:
            s["visual_label"] = "Healthy"

    active_rec_id = simulator.active_recovery or "enable_cache_fallback"
    comparison = intervention_sim.compare_interventions(simulator.active_scenario, active_rec_id, services)

    # Compute ML anomaly scores and RAG grounded diagnosis
    ml_scores = {sid: ml_detector.detect_service_anomaly(sid, s) for sid, s in services.items()}
    copilot_diagnose = rag_engine.generate_grounded_diagnosis(snapshot, root_cause, predictions, simulator.active_recovery)

    return {
        "snapshot": snapshot,
        "topology": {
            "services": SERVICES_TOPOLOGY,
            "edges": DEPENDENCY_EDGES
        },
        "anomalies": anomalies,
        "ml_anomalies": ml_scores,
        "root_cause": root_cause,
        "predictions": predictions,
        "recovery_strategies": strategies,
        "comparison": comparison,
        "copilot_diagnose": copilot_diagnose
    }

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "cascadia-engine", "version": "1.0.0"}

@app.get("/api/state")
def get_state():
    """Returns current live incident state with full intelligence analytics."""
    return get_complete_analysis()

@app.post("/api/step")
def step_simulation():
    """Advance simulation by 1 tick (5 seconds)."""
    simulator.step()
    return get_complete_analysis()

@app.post("/api/reset")
def reset_simulation():
    """Resets simulator to baseline state."""
    simulator.reset()
    return get_complete_analysis()

@app.post("/api/scenario")
def set_scenario(req: ScenarioRequest):
    """Loads a named scenario."""
    simulator.inject_scenario(req.scenario)
    return get_complete_analysis()

@app.post("/api/fault/custom")
def inject_custom_fault(req: CustomFaultRequest):
    """Injects custom failure."""
    simulator.inject_custom_fault(req.target_service, req.fault_type, req.intensity)
    return get_complete_analysis()

@app.post("/api/recovery/apply")
def apply_recovery(req: RecoveryRequest):
    """Executes a recovery intervention in the simulator."""
    res = simulator.apply_recovery(req.strategy_id)
    analysis = get_complete_analysis()
    analysis["recovery_execution"] = res
    return analysis

@app.post("/api/recovery/rollback")
def rollback_recovery():
    """Rolls back the active intervention."""
    simulator.rollback_recovery()
    return get_complete_analysis()

@app.get("/api/recovery/compare")
def compare_recovery(strategy_id: Optional[str] = Query(None)):
    """Cascade Intervention Lab comparison matrix."""
    strat = strategy_id or simulator.active_recovery or "enable_cache_fallback"
    return intervention_sim.compare_interventions(
        simulator.active_scenario, 
        strat, 
        simulator.services_state
    )

@app.get("/api/incidents")
def list_incidents():
    """List historical and saved incident records."""
    return incident_store.get_all_incidents()

@app.post("/api/incidents/save")
def save_incident():
    """Saves the current incident to persistent SQLite store."""
    analysis = get_complete_analysis()
    top_rc = analysis["root_cause"].get("top_candidate") or {}
    comp = analysis["comparison"]
    incident_id = incident_store.save_incident({
        "title": f"{simulator.active_scenario.replace('_', ' ').title()} Incident",
        "scenario_name": simulator.active_scenario,
        "status": simulator.system_status,
        "root_cause_service": top_rc.get("service_id", "database"),
        "recovery_strategy": simulator.active_recovery or "none",
        "blast_radius_pct": comp.get("simulated_outcome", {}).get("blast_radius_pct", 0.0),
        "mttr_seconds": comp.get("simulated_outcome", {}).get("simulated_recovery_time_sec", 8),
        "summary": analysis["root_cause"].get("summary", ""),
        "metrics": comp.get("delta", {})
    })
    return {"status": "SAVED", "incident_id": incident_id}

@app.get("/api/report/markdown", response_class=PlainTextResponse)
def get_markdown_report():
    """Generates an executive incident post-mortem markdown report."""
    analysis = get_complete_analysis()
    return report_gen.generate_markdown_report(
        analysis["snapshot"],
        analysis["root_cause"],
        analysis["predictions"],
        analysis["comparison"]
    )

@app.get("/api/copilot/diagnose")
def get_copilot_diagnosis():
    """Generates RAG runbook diagnosis with verified citations and unsafe action guardrails."""
    analysis = get_complete_analysis()
    return analysis["copilot_diagnose"]

@app.get("/api/copilot/runbook/{chunk_id}")
def get_runbook_chunk(chunk_id: str):
    """Fetches full content of an individual runbook chunk by ID for modal preview."""
    for c in rag_engine.chunks:
        if c.chunk_id.lower() == chunk_id.lower():
            return c.to_dict()
    raise HTTPException(status_code=404, detail="Runbook chunk not found")

@app.get("/api/evaluate")
def run_benchmark():
    """Executes empirical benchmark on synthetic labelled test incidents, ML comparison, and RAG retrieval."""
    base_eval = benchmark_evaluator.run_benchmark()
    ml_eval = ml_detector.benchmark_comparison()
    rag_eval = rag_engine.evaluate_retrieval()

    base_eval["ml_comparison"] = ml_eval
    base_eval["rag_evaluation"] = rag_eval
    return base_eval

@app.post("/api/assistant/ask")
def query_incident_assistant(req: AssistantQuery):
    """
    Evidence-grounded SRE incident assistant.
    Answers operator questions using live telemetry, dependency graph, and causal reasoning.
    """
    analysis = get_complete_analysis()
    q = req.query.lower()
    top_rc = analysis["root_cause"].get("top_candidate") or {}
    preds = analysis["predictions"].get("predictions", [])
    active_strat = simulator.active_recovery

    if "root cause" in q or "why" in q or "cause" in q:
        if top_rc:
            evidence_str = "\n".join([f"• {e}" for e in top_rc.get("evidence", [])])
            answer = (
                f"**Probable Root Cause: {top_rc['service_name']} ({top_rc['suspicion_score']}% confidence)**\n\n"
                f"{top_rc['status_label']} based on temporal priority and dependency positioning:\n"
                f"{evidence_str}\n\n"
                f"Downstream callers are backing up waiting for synchronous responses."
            )
        else:
            answer = "Currently all services are within healthy bounds. No active root cause detected."

    elif "predict" in q or "risk" in q or "next" in q or "cascade" in q:
        if preds:
            pred_lines = [f"• **{p['service_name']}** — Risk: {p['risk_score']}%, Time Window: ~{p['time_window_sec']}s ({p['predicted_state']})" for p in preds]
            answer = (
                f"**Downstream Cascade Risk Prediction:**\n"
                f"Identified {len(preds)} service(s) on the critical propagation path:\n"
                + "\n".join(pred_lines) +
                f"\n\nProjected blast radius without intervention: **{analysis['predictions'].get('projected_blast_radius_pct')}%**."
            )
        else:
            answer = "No cascading risks predicted. Dependency pathways are clear."

    elif "recover" in q or "fix" in q or "strategy" in q or "recommend" in q:
        strategies = analysis["recovery_strategies"]
        rec = next((s for s in strategies if s.get("is_recommended")), strategies[0] if strategies else None)
        if rec:
            answer = (
                f"**Recommended Intervention: {rec['title']}**\n\n"
                f"• **Expected Benefit:** {rec['expected_benefit']}\n"
                f"• **Trade-off:** {rec['trade_off']}\n"
                f"• **Projected MTTR:** {rec['projected_recovery_time_sec']} seconds\n"
                f"• **Blast Radius Containment:** {rec['containment_rating']}\n\n"
                f"**CLI Execution:**\n`{rec['cli_command']}`"
            )
        else:
            answer = "System is currently healthy. No recovery action needed."

    else:
        answer = (
            f"**CASCADIA Incident Assistant**\n\n"
            f"Active Scenario: `{simulator.active_scenario}` | Status: `{simulator.system_status}` | Tick: `{simulator.tick}`\n\n"
            f"Current Root Cause Candidate: **{top_rc.get('service_name', 'None')}**\n"
            f"At-risk Services: **{len(preds)}**\n"
            f"Active Intervention: `{active_strat or 'None applied'}`\n\n"
            f"Ask me about root causes, cascading failure risks, or recommended recovery interventions."
        )

    return {
        "query": req.query,
        "answer": answer,
        "timestamp": simulator.get_current_timestamp()
    }

# Serve frontend build if available
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))

