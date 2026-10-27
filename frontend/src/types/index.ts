export type ServiceStatus = 'HEALTHY' | 'DEGRADED' | 'DEGRADING' | 'CRITICAL' | 'RECOVERING' | 'RECOVERED';

export type VisualLabel = 'Healthy' | 'Observed' | 'Probable Root Cause' | 'Predicted At-Risk' | 'Cascade Degraded' | 'Cascade Collapsed' | 'Recovered' | 'Protected by Cache';

export interface ServiceMetricHistory {
  tick: number;
  timestamp: string;
  latency_ms: number;
  error_rate: number;
  cpu_utilization: number;
  throughput_rps: number;
  queue_depth: number;
  status: ServiceStatus;
}

export interface ServiceState {
  id: string;
  name: string;
  tier: string;
  status: ServiceStatus;
  visual_label: VisualLabel;
  latency_ms: number;
  p95_latency_ms: number;
  p99_latency_ms: number;
  error_rate: number;
  throughput_rps: number;
  cpu_utilization: number;
  memory_utilization: number;
  queue_depth: number;
  active_connections: number;
  connection_pool_pct: number;
  health_score: number;
  history: ServiceMetricHistory[];
}

export interface LogEntry {
  id: string;
  timestamp: string;
  tick: number;
  service: string;
  service_name: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  message: string;
  details: Record<string, any>;
}

export interface TimelineEvent {
  id: string;
  tick: number;
  timestamp: string;
  type: string;
  description: string;
  severity: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  metadata: Record<string, any>;
}

export interface AnomalyItem {
  id: string;
  service_id: string;
  service_name: string;
  metric: string;
  current_value: string;
  baseline_value: string;
  deviation_factor: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  evidence: string;
}

export interface AnomalyData {
  has_anomaly: boolean;
  anomaly_count: number;
  anomaly_score: number;
  anomalies: AnomalyItem[];
  service_anomaly_counts: Record<string, number>;
}

export interface RootCauseCandidate {
  service_id: string;
  service_name: string;
  tier: string;
  suspicion_score: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  status_label: string;
  evidence: string[];
  first_detected_tick: number;
}

export interface RootCauseData {
  has_incident: boolean;
  top_candidate: RootCauseCandidate | null;
  candidates: RootCauseCandidate[];
  summary: string;
}

export interface PredictionItem {
  service_id: string;
  service_name: string;
  tier: string;
  current_status: ServiceStatus;
  predicted_state: string;
  risk_score: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  time_window_sec: number;
  hop_distance: number;
  propagation_path: string[];
  evidence: string[];
}

export interface PredictionData {
  has_prediction: boolean;
  at_risk_count: number;
  time_to_collapse_sec: number;
  projected_blast_radius_pct: number;
  predictions: PredictionItem[];
  summary: string;
}

export interface RecoveryStrategy {
  strategy_id: string;
  title: string;
  badge: string;
  is_recommended: boolean;
  rank: number;
  expected_benefit: string;
  trade_off: string;
  projected_recovery_time_sec: number;
  blast_radius_reduction_pct: number;
  containment_rating: string;
  resource_cost: 'LOW' | 'MEDIUM' | 'HIGH';
  residual_risk: 'LOW' | 'MEDIUM' | 'HIGH';
  implementation_speed: string;
  cli_command: string;
  technical_explanation: string;
}

export interface CounterfactualComparison {
  strategy_id: string;
  strategy_name: string;
  verification_status: string;
  unmitigated_baseline: {
    name: string;
    system_state: string;
    blast_radius_pct: number;
    services_degraded_count: number;
    estimated_downtime_minutes: number;
    gateway_error_rate_pct: number;
    database_latency_ms: number;
    orders_latency_ms: number;
    requests_lost_est: number;
    financial_risk_score: string;
    impact_summary: string;
  };
  simulated_outcome: {
    name: string;
    simulated_state: string;
    blast_radius_pct: number;
    services_spared_count: number;
    spared_services: string[];
    simulated_recovery_time_sec: number;
    gateway_error_rate_pct: number;
    database_latency_ms: number;
    orders_latency_ms: number;
    requests_saved_est: number;
    reduction_error_pct: number;
    reduction_latency_pct: number;
    trade_off_measured: string;
    verification_status: string;
  };
  delta: {
    latency_reduction_pct: number;
    error_reduction_pct: number;
    services_saved: number;
    time_saved_seconds: number;
  };
}

export interface RunbookChunkData {
  chunk_id: string;
  runbook_id: string;
  runbook_title: string;
  service: string;
  failure_type: string;
  section_title: string;
  content: string;
}

export interface CopilotDiagnoseData {
  diagnosis: string;
  recommended_action: string;
  unsafe_action: string;
  full_text: string;
  citations: string[];
  retrieved_chunks: RunbookChunkData[];
  retrieval_hit_rate_eval: string;
}

export interface MLComparisonData {
  total_test_windows: number;
  z_score_detector: {
    method: string;
    precision: number;
    recall: number;
    f1_score: number;
    primary_strength: string;
    blind_spot: string;
  };
  isolation_forest_ml: {
    method: string;
    precision: number;
    recall: number;
    f1_score: number;
    primary_strength: string;
    blind_spot: string;
  };
  architectural_recommendation: string;
}

export interface RAGEvaluationData {
  total_test_incidents: number;
  top_3_hits: number;
  hit_rate_pct: number;
  hit_ratio_label: string;
  status: string;
}

export interface CascadiaState {
  snapshot: {
    tick: number;
    timestamp: string;
    system_status: ServiceStatus;
    active_scenario: string;
    injected_fault: any;
    active_recovery: string | null;
    services: Record<string, ServiceState>;
    recent_logs: LogEntry[];
    timeline: TimelineEvent[];
  };
  topology: {
    services: Record<string, any>;
    edges: Array<{
      source: string;
      target: string;
      type: string;
      coupling_strength: number;
      propagation_delay_sec: number;
      timeout_ms: number;
    }>;
  };
  anomalies: AnomalyData;
  ml_anomalies?: Record<string, any>;
  root_cause: RootCauseData;
  predictions: PredictionData;
  recovery_strategies: RecoveryStrategy[];
  comparison: CounterfactualComparison;
  copilot_diagnose?: CopilotDiagnoseData;
}

export interface EvaluationBenchmark {
  total_tests: number;
  execution_time_total_ms: number;
  avg_latency_per_eval_ms: number;
  anomaly_detection: {
    precision: number;
    recall: number;
    f1_score: number;
    false_positive_rate: number;
  };
  root_cause_analysis: {
    top_1_accuracy: number;
    top_3_accuracy: number;
    incident_count: number;
  };
  cascade_prediction: {
    precision: number;
    recall: number;
    lead_time_window_sec: string;
  };
  recovery_containment: {
    blast_radius_containment_rate: number;
    average_simulated_mttr_sec: number;
    services_spared_pct: number;
  };
  ml_comparison?: MLComparisonData;
  rag_evaluation?: RAGEvaluationData;
  test_runs: Array<{
    test_id: string;
    scenario: string;
    ground_truth_rc: string | null;
    detected_top_rc: string | null;
    passed_root_cause: boolean;
    anomalies_detected: number;
    downstream_predicted: number;
  }>;
}
