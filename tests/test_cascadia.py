"""
CASCADIA Unit & Integration Test Suite
Validates the complete 4-step Operating Loop:
1. OBSERVE (Telemetry & Anomaly Detection)
2. PREDICT (Cascade Propagation & Blast Radius)
3. DECIDE (Cascade Intervention Lab & Strategy Comparison)
4. RECOVER & VERIFY (Counterfactual Outcome Verification)
"""

import unittest
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from dependency_graph import DependencyGraph, SERVICES_TOPOLOGY
from simulator import IncidentSimulator
from anomaly_detector import AnomalyDetector
from root_cause import RootCauseAnalyzer
from predictor import CascadePredictor
from recovery import RecoveryEngine
from recovery_sim import InterventionSimulator
from evaluator import BenchmarkEvaluator
from ml_anomaly import MLAnomalyDetector
from runbook_rag import RunbookRAGEngine

class TestCascadiaPipeline(unittest.TestCase):
    def setUp(self):
        self.graph = DependencyGraph()
        self.sim = IncidentSimulator()
        self.detector = AnomalyDetector()
        self.root_cause = RootCauseAnalyzer()
        self.predictor = CascadePredictor()
        self.recovery = RecoveryEngine()
        self.intervention = InterventionSimulator()

    def test_dependency_topology(self):
        """Validates the 6 monitored services and dependency relationships."""
        services = self.graph.get_services()
        self.assertEqual(len(services), 6)
        self.assertIn("gateway", services)
        self.assertIn("database", services)
        self.assertIn("orders", services)
        self.assertIn("payments", services)
        self.assertIn("queue", services)
        self.assertIn("notifications", services)

        # Database callers
        callers = self.graph.get_upstream_callers("database")
        self.assertIn("orders", callers)
        self.assertIn("payments", callers)

        # Blast radius of database failure
        blast = self.graph.calculate_blast_radius("database")
        self.assertGreaterEqual(blast["blast_radius_pct"], 50.0)

    def test_healthy_telemetry_baselines(self):
        """Validates that healthy simulation generates zero critical anomalies."""
        snapshot = self.sim.get_snapshot()
        anomalies = self.detector.detect_anomalies(snapshot["services"])
        self.assertFalse(anomalies["has_anomaly"])
        self.assertEqual(self.sim.system_status, "HEALTHY")

    def test_database_slowdown_cascade_and_root_cause(self):
        """Validates failure injection, anomaly detection, and root cause attribution."""
        self.sim.inject_scenario("database_slowdown")
        
        # Advance simulation by 3 ticks (15s)
        for _ in range(3):
            self.sim.step()

        snapshot = self.sim.get_snapshot()
        self.assertIn(snapshot["system_status"], ["DEGRADING", "CRITICAL"])

        # Detect anomalies
        anom_res = self.detector.detect_anomalies(snapshot["services"])
        self.assertTrue(anom_res["has_anomaly"])

        # Root cause analysis
        rc_res = self.root_cause.analyze(snapshot["services"], snapshot["recent_logs"], anom_res)
        self.assertTrue(rc_res["has_incident"])
        self.assertEqual(rc_res["top_candidate"]["service_id"], "database")
        self.assertGreaterEqual(rc_res["top_candidate"]["suspicion_score"], 80.0)

        # Cascade prediction
        pred_res = self.predictor.predict_cascade(snapshot["services"], rc_res)
        self.assertTrue(pred_res["has_prediction"])
        self.assertGreaterEqual(pred_res["at_risk_count"], 2)

    def test_cascade_intervention_lab_comparison(self):
        """Validates multi-strategy recovery options and counterfactual simulation."""
        self.sim.inject_scenario("database_slowdown")
        for _ in range(3):
            self.sim.step()

        snapshot = self.sim.get_snapshot()
        anom_res = self.detector.detect_anomalies(snapshot["services"])
        rc_res = self.root_cause.analyze(snapshot["services"], snapshot["recent_logs"], anom_res)
        pred_res = self.predictor.predict_cascade(snapshot["services"], rc_res)

        strategies = self.recovery.get_recovery_strategies(rc_res, pred_res)
        self.assertGreaterEqual(len(strategies), 3)

        # Recommended strategy should be cache fallback
        rec_strat = next((s for s in strategies if s["is_recommended"]), None)
        self.assertIsNotNone(rec_strat)
        self.assertEqual(rec_strat["strategy_id"], "enable_cache_fallback")

        # Test counterfactual comparison
        comparison = self.intervention.compare_interventions(
            "database_slowdown", 
            "enable_cache_fallback", 
            snapshot["services"]
        )
        self.assertEqual(comparison["simulated_outcome"]["verification_status"], "VERIFIED_SUCCESSFUL")
        self.assertGreaterEqual(comparison["delta"]["latency_reduction_pct"], 90.0)

    def test_apply_recovery_in_simulator(self):
        """Validates that applying recovery restores healthy telemetry in the simulator."""
        self.sim.inject_scenario("database_slowdown")
        for _ in range(3):
            self.sim.step()

        # Apply intervention
        self.sim.apply_recovery("enable_cache_fallback")
        self.sim.step()

        snapshot = self.sim.get_snapshot()
        self.assertEqual(snapshot["system_status"], "RECOVERED")
        db_state = snapshot["services"]["database"]
        self.assertLess(db_state["latency_ms"], 100.0)

    def test_benchmark_evaluator(self):
        """Validates the synthetic benchmark test suite."""
        bench_eval = BenchmarkEvaluator()
        result = bench_eval.run_benchmark()
        self.assertEqual(result["total_tests"], 12)
        self.assertGreaterEqual(result["anomaly_detection"]["precision"], 90.0)
        self.assertGreaterEqual(result["root_cause_analysis"]["top_1_accuracy"], 70.0)
        self.assertGreaterEqual(result["root_cause_analysis"]["top_3_accuracy"], 95.0)

    def test_ml_isolation_forest(self):
        """Validates scikit-learn Isolation Forest model inference and multivariate benchmark."""
        ml = MLAnomalyDetector()
        res = ml.detect_service_anomaly("database", {"latency_ms": 1850.0, "error_rate": 0.05, "connection_pool_pct": 92.0, "queue_depth": 0, "cpu_utilization": 85.0})
        self.assertTrue(res["is_anomaly"])
        self.assertEqual(res["method"], "Isolation Forest (Unsupervised ML)")
        
        bench = ml.benchmark_comparison()
        self.assertGreaterEqual(bench["isolation_forest_ml"]["f1_score"], 85.0)

    def test_runbook_rag_and_citations(self):
        """Validates runbook chunk retrieval, citation verification, and unsafe action guardrails."""
        rag = RunbookRAGEngine()
        self.assertGreaterEqual(len(rag.chunks), 8)
        
        # Retrieval
        retrieved = rag.retrieve("database lock contention", target_service="database", top_k=3)
        self.assertGreaterEqual(len(retrieved), 2)
        
        # Grounded diagnosis with citation validation
        diag = rag.generate_grounded_diagnosis(
            incident_snapshot={"active_scenario": "database_slowdown"},
            root_cause_data={"top_candidate": {"service_id": "database", "service_name": "Primary Database"}},
            predictions={"predictions": []}
        )
        self.assertIn("⛔ UNSAFE ACTION TO AVOID", diag["unsafe_action"])
        self.assertGreaterEqual(len(diag["citations"]), 1)
        # Verify citations match retrieved chunk IDs
        retrieved_ids = set(c["chunk_id"] for c in diag["retrieved_chunks"])
        for cit in diag["citations"]:
            self.assertIn(cit, retrieved_ids)

        # Retrieval evaluation
        eval_res = rag.evaluate_retrieval()
        self.assertGreaterEqual(eval_res["hit_rate_pct"], 80.0)

if __name__ == "__main__":
    unittest.main()
