import React, { useState, useEffect, useRef } from 'react';
import { 
  Navbar 
} from './components/Navbar';
import { 
  DependencyGraph 
} from './components/DependencyGraph';
import { 
  PredictionPanel 
} from './components/PredictionPanel';
import { 
  RootCauseCard 
} from './components/RootCauseCard';
import { 
  CascadeInterventionLab 
} from './components/CascadeInterventionLab';
import { 
  ServiceInspector 
} from './components/ServiceInspector';
import { 
  LogViewer 
} from './components/LogViewer';
import { 
  TimelineAndReport 
} from './components/TimelineAndReport';
import { 
  BenchmarkModal 
} from './components/BenchmarkModal';
import { 
  AssistantDrawer 
} from './components/AssistantDrawer';
import { 
  CustomFaultModal 
} from './components/CustomFaultModal';
import { 
  CopilotDiagnoseCard 
} from './components/CopilotDiagnoseCard';
import { 
  RunbookModal 
} from './components/RunbookModal';

import { 
  CascadiaState, 
  ServiceState,
  RunbookChunkData
} from './types';
import { 
  getState, 
  stepSimulation, 
  resetSimulation, 
  setScenario, 
  injectCustomFault, 
  applyRecovery, 
  rollbackRecovery,
  getComparison 
} from './services/api';

import { 
  Activity, 
  ShieldAlert, 
  SlidersHorizontal, 
  Target, 
  Layers, 
  Sparkles,
  Flame,
  Clock,
  CheckCircle2
} from 'lucide-react';

export const App: React.FC = () => {
  const [state, setState] = useState<CascadiaState | null>(null);
  const [activeTab, setActiveTab] = useState<string>('command-center');
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>('database');
  const [isAutoStepping, setIsAutoStepping] = useState<boolean>(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState<boolean>(false);
  const [activeRunbookChunk, setActiveRunbookChunk] = useState<RunbookChunkData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const autoStepTimerRef = useRef<any>(null);

  // Initial fetch
  useEffect(() => {
    fetchLatestState();
  }, []);

  // Auto-stepping loop
  useEffect(() => {
    if (isAutoStepping) {
      autoStepTimerRef.current = setInterval(() => {
        handleStep();
      }, 3500);
    } else {
      if (autoStepTimerRef.current) {
        clearInterval(autoStepTimerRef.current);
        autoStepTimerRef.current = null;
      }
    }
    return () => {
      if (autoStepTimerRef.current) clearInterval(autoStepTimerRef.current);
    };
  }, [isAutoStepping]);

  const fetchLatestState = async () => {
    try {
      const data = await getState();
      setState(data);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('Unable to reach CASCADIA API server. Ensure backend is running on port 8000.');
    }
  };

  const handleStep = async () => {
    try {
      const data = await stepSimulation();
      setState(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleReset = async () => {
    setIsAutoStepping(false);
    try {
      const data = await resetSimulation();
      setState(data);
      setSelectedServiceId('database');
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSelectScenario = async (sc: string) => {
    try {
      const data = await setScenario(sc);
      setState(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleInjectCustom = async (target: string, fault: string, intensity: number) => {
    try {
      const data = await injectCustomFault(target, fault, intensity);
      setState(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleApplyRecovery = async (strategyId: string) => {
    try {
      const data = await applyRecovery(strategyId);
      setState(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleRollbackRecovery = async () => {
    try {
      const data = await rollbackRecovery();
      setState(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSelectStrategyToCompare = async (strategyId: string) => {
    try {
      const comp = await getComparison(strategyId);
      setState(prev => prev ? { ...prev, comparison: comp } : null);
    } catch (err: any) {
      console.error(err);
    }
  };

  const services = state?.snapshot?.services || {};
  const selectedService: ServiceState | null = selectedServiceId ? services[selectedServiceId] : null;

  // Derive callers and callees for selected service
  const edges = state?.topology?.edges || [];
  const upstreamCallers = edges.filter(e => e.target === selectedServiceId).map(e => e.source);
  const downstreamCallees = edges.filter(e => e.source === selectedServiceId).map(e => e.target);

  const topRootCandidate = state?.root_cause?.top_candidate;
  const rootCauseServiceId = topRootCandidate?.service_id || null;
  const predictedServiceIds = (state?.predictions?.predictions || []).map(p => p.service_id);

  return (
    <div className="min-h-screen bg-[#070707] text-[#F5F5F5] flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        state={state}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAutoStepping={isAutoStepping}
        setIsAutoStepping={setIsAutoStepping}
        onStep={handleStep}
        onReset={handleReset}
        onSelectScenario={handleSelectScenario}
        onOpenCustomFault={() => setIsCustomModalOpen(true)}
        onOpenBenchmark={() => setActiveTab('benchmark')}
        onOpenReport={() => setActiveTab('timeline')}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto p-4 sm:p-5 flex flex-col gap-4">
        {error && (
          <div className="bg-red-950/80 border border-red-500/70 p-3 rounded-xl text-red-200 text-xs font-mono flex items-center justify-between">
            <span>{error}</span>
            <button 
              onClick={fetchLatestState}
              className="px-2.5 py-1 bg-red-900 hover:bg-red-800 rounded font-semibold text-white"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* TAB 1: COMMAND CENTER */}
        {activeTab === 'command-center' && (
          <div className="flex flex-col gap-4">
            {/* Top Operational Metrics Ribbon (From prompt section 4 visual spec) */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 font-mono">
              {/* Card 1: System Status */}
              <div className="bg-[#141414] border border-[#262626] rounded-xl p-3.5 flex flex-col justify-between">
                <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold block">
                  SYSTEM HEALTH
                </span>
                <div className="flex items-baseline gap-2 my-1">
                  <span className={`text-xl font-bold tracking-tight ${
                    state?.snapshot?.system_status === 'CRITICAL' ? 'text-red-400' : 
                    state?.snapshot?.system_status === 'DEGRADING' ? 'text-amber-300' : 
                    state?.snapshot?.system_status === 'RECOVERED' ? 'text-cyan-300' : 'text-emerald-400'
                  }`}>
                    {state?.snapshot?.system_status || 'HEALTHY'}
                  </span>
                </div>
                <span className="text-[10px] text-neutral-500 truncate">
                  Simulation state · Tick {state?.snapshot?.tick || 0}
                </span>
              </div>

              {/* Card 2: At-Risk Services */}
              <div className="bg-[#141414] border border-[#262626] rounded-xl p-3.5 flex flex-col justify-between">
                <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold block">
                  AT-RISK SERVICES
                </span>
                <div className="flex items-baseline gap-2 my-1">
                  <span className="text-2xl font-bold text-amber-300">
                    {state?.predictions?.at_risk_count?.toString().padStart(2, '0') || '00'}
                  </span>
                  <span className="text-xs text-neutral-400">nodes</span>
                </div>
                <span className="text-[10px] text-neutral-500">
                  Predicted downstream degradation
                </span>
              </div>

              {/* Card 3: Root Cause Candidate */}
              <div className="bg-[#141414] border border-[#262626] rounded-xl p-3.5 flex flex-col justify-between">
                <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold block">
                  ROOT CAUSE CANDIDATE
                </span>
                <div className="my-1 truncate">
                  <span className={`text-base font-bold truncate ${topRootCandidate ? 'text-red-400' : 'text-neutral-400'}`}>
                    {topRootCandidate?.service_name || 'None Active'}
                  </span>
                </div>
                <span className="text-[10px] text-neutral-500">
                  {topRootCandidate ? `${topRootCandidate.suspicion_score}% suspicion` : 'All telemetry nominal'}
                </span>
              </div>

              {/* Card 4: Blast Radius */}
              <div className="bg-[#141414] border border-[#262626] rounded-xl p-3.5 flex flex-col justify-between">
                <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold block">
                  EST. BLAST RADIUS
                </span>
                <div className="flex items-baseline gap-2 my-1">
                  <span className={`text-2xl font-bold ${
                    (state?.predictions?.projected_blast_radius_pct || 0) > 40 ? 'text-red-400' : 'text-neutral-200'
                  }`}>
                    {state?.predictions?.projected_blast_radius_pct || 0}%
                  </span>
                  <span className="text-xs text-neutral-400">topology</span>
                </div>
                <span className="text-[10px] text-neutral-500">
                  Cascade propagation exposure
                </span>
              </div>

              {/* Card 5: Recovery Options */}
              <div 
                onClick={() => setActiveTab('intervention-lab')}
                className="bg-[#141414] hover:bg-[#191919] border border-[#262626] hover:border-red-600/40 rounded-xl p-3.5 flex flex-col justify-between cursor-pointer transition-all col-span-2 md:col-span-1"
              >
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold block">
                    RECOVERY OPTIONS
                  </span>
                  <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="flex items-baseline gap-2 my-1">
                  <span className="text-2xl font-bold text-white">
                    {state?.recovery_strategies?.length?.toString().padStart(2, '0') || '04'}
                  </span>
                  <span className="text-xs text-neutral-400">ready</span>
                </div>
                <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                  <span>Open Intervention Lab →</span>
                </span>
              </div>
            </div>

            {/* Middle Section: Topology Graph + Intelligence Predictions */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left 7 Columns: Dependency Graph */}
              <div className="lg:col-span-7 flex flex-col gap-2">
                <DependencyGraph
                  services={services}
                  selectedServiceId={selectedServiceId}
                  onSelectService={setSelectedServiceId}
                  cascadeOriginId={rootCauseServiceId}
                  predictedServiceIds={predictedServiceIds}
                />
              </div>

              {/* Right 5 Columns: Predictions & Root Cause */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <PredictionPanel
                  predictionData={state?.predictions || null}
                  onSelectService={setSelectedServiceId}
                />

                <RootCauseCard
                  rootCauseData={state?.root_cause || null}
                  onSelectService={setSelectedServiceId}
                />
              </div>
            </div>

            {/* Copilot RAG Grounded Diagnosis Row */}
            <CopilotDiagnoseCard
              diagnoseData={state?.copilot_diagnose}
              onOpenRunbookChunk={(chunk) => setActiveRunbookChunk(chunk)}
            />

            {/* Bottom Section: Service Inspector & Live Telemetry Logs */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left 5 Cols: Selected Service Inspector */}
              <div className="lg:col-span-5">
                <ServiceInspector
                  service={selectedService}
                  logs={state?.snapshot?.recent_logs || []}
                  onClose={() => setSelectedServiceId(null)}
                  upstreamCallers={upstreamCallers}
                  downstreamCallees={downstreamCallees}
                />
              </div>

              {/* Right 7 Cols: Live Log Stream */}
              <div className="lg:col-span-7">
                <LogViewer
                  logs={state?.snapshot?.recent_logs || []}
                  selectedServiceId={selectedServiceId}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CASCADE INTERVENTION LAB */}
        {activeTab === 'intervention-lab' && (
          <CascadeInterventionLab
            strategies={state?.recovery_strategies || []}
            comparison={state?.comparison || null}
            activeRecovery={state?.snapshot?.active_recovery || null}
            services={services}
            onApplyRecovery={handleApplyRecovery}
            onRollbackRecovery={handleRollbackRecovery}
            onSelectStrategyToCompare={handleSelectStrategyToCompare}
          />
        )}

        {/* TAB 3: TIMELINE & REPORT */}
        {activeTab === 'timeline' && (
          <TimelineAndReport
            timeline={state?.snapshot?.timeline || []}
            scenarioName={state?.snapshot?.active_scenario || 'database_slowdown'}
          />
        )}

        {/* TAB 4: BENCHMARK EVALUATION */}
        {activeTab === 'benchmark' && (
          <BenchmarkModal />
        )}

        {/* TAB 5: AI COPILOT */}
        {activeTab === 'assistant' && (
          <AssistantDrawer />
        )}
      </main>

      {/* Custom Fault Injection Modal */}
      <CustomFaultModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onInject={handleInjectCustom}
      />

      {/* RAG Runbook Source Preview Modal */}
      <RunbookModal
        chunk={activeRunbookChunk}
        onClose={() => setActiveRunbookChunk(null)}
      />
    </div>
  );
};
