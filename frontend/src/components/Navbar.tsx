import React from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  FastForward, 
  ShieldAlert, 
  ShieldCheck, 
  Activity, 
  SlidersHorizontal,
  Flame,
  FileText,
  Cpu,
  Bot
} from 'lucide-react';
import { CascadiaState } from '../types';

interface NavbarProps {
  state: CascadiaState | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAutoStepping: boolean;
  setIsAutoStepping: (val: boolean) => void;
  onStep: () => void;
  onReset: () => void;
  onSelectScenario: (scenario: string) => void;
  onOpenCustomFault: () => void;
  onOpenBenchmark: () => void;
  onOpenReport: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  state,
  activeTab,
  setActiveTab,
  isAutoStepping,
  setIsAutoStepping,
  onStep,
  onReset,
  onSelectScenario,
  onOpenCustomFault,
  onOpenBenchmark,
  onOpenReport
}) => {
  const currentScenario = state?.snapshot?.active_scenario || 'healthy_baseline';
  const systemStatus = state?.snapshot?.system_status || 'HEALTHY';
  const currentTick = state?.snapshot?.tick || 0;
  const activeRecovery = state?.snapshot?.active_recovery;

  return (
    <header className="border-b border-[#222222] bg-[#0c0c0c]/90 backdrop-blur-md sticky top-0 z-40 px-4 py-2.5">
      <div className="max-w-[1720px] mx-auto flex flex-col xl:flex-row items-center justify-between gap-3">
        {/* Brand & Mission */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-red-600 to-red-950 border border-red-500/30 flex items-center justify-center shadow-lg shadow-red-950/40">
            <Flame className="w-5 h-5 text-red-200 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-wider bg-gradient-to-r from-neutral-100 via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
                CASCADIA
              </span>
              <span className="text-[10px] font-mono tracking-widest px-1.5 py-0.5 rounded bg-red-950/60 border border-red-800/40 text-red-400 font-semibold uppercase">
                AI / SRE
              </span>
            </div>
            <p className="text-[11px] text-[#A3A3A3] font-medium hidden sm:block">
              Predict the ripple. Prevent the collapse.
            </p>
          </div>

          <div className="h-6 w-[1px] bg-[#262626] mx-1 hidden md:block" />

          {/* System Status Pill */}
          <div className="flex items-center gap-2">
            {systemStatus === 'CRITICAL' && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-950/70 border border-red-500/60 text-red-400 text-xs font-semibold animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-500 shadow-sm shadow-red-500" />
                <span>CASCADE ACTIVE</span>
              </div>
            )}
            {systemStatus === 'DEGRADING' && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/70 border border-amber-500/60 text-amber-300 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>DEGRADING (AT-RISK)</span>
              </div>
            )}
            {systemStatus === 'RECOVERING' && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/60 text-cyan-300 text-xs font-semibold animate-pulse">
                <Activity className="w-3.5 h-3.5 animate-spin" />
                <span>INTERVENTION ACTIVE</span>
              </div>
            )}
            {systemStatus === 'RECOVERED' && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/60 text-emerald-300 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>RECOVERED & VERIFIED</span>
              </div>
            )}
            {systemStatus === 'HEALTHY' && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-900 border border-emerald-500/40 text-emerald-400 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>SYSTEM HEALTHY</span>
              </div>
            )}
          </div>
        </div>

        {/* Center: Navigation Tabs */}
        <div className="flex items-center bg-[#141414] border border-[#262626] p-1 rounded-xl gap-1">
          <button
            onClick={() => setActiveTab('command-center')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'command-center'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-[#A3A3A3] hover:text-white hover:bg-neutral-800/50'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-red-400" />
            <span>Command Center</span>
          </button>

          <button
            onClick={() => setActiveTab('intervention-lab')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'intervention-lab'
                ? 'bg-gradient-to-r from-red-950 to-neutral-800 text-white border border-red-700/50 shadow-sm'
                : 'text-[#A3A3A3] hover:text-white hover:bg-neutral-800/50'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold">Cascade Intervention Lab</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-900/60 text-red-300 font-mono">
              P0
            </span>
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'timeline'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-[#A3A3A3] hover:text-white hover:bg-neutral-800/50'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>Incident Report</span>
          </button>

          <button
            onClick={() => setActiveTab('benchmark')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'benchmark'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-[#A3A3A3] hover:text-white hover:bg-neutral-800/50'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span>Evaluation</span>
          </button>

          <button
            onClick={() => setActiveTab('assistant')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'assistant'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-[#A3A3A3] hover:text-white hover:bg-neutral-800/50'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI Copilot</span>
          </button>
        </div>

        {/* Right Controls: Scenarios & Simulation Step */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Scenario Selector */}
          <div className="flex items-center gap-1.5 bg-[#141414] border border-[#262626] rounded-lg px-2 py-1">
            <span className="text-[11px] text-[#A3A3A3] font-mono">Fault:</span>
            <select
              value={currentScenario}
              onChange={(e) => onSelectScenario(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer font-medium"
            >
              <option value="healthy_baseline" className="bg-[#141414] text-white">🟢 Healthy Baseline</option>
              <option value="database_slowdown" className="bg-[#141414] text-white">🔴 DB Slowdown (Primary)</option>
              <option value="queue_overload" className="bg-[#141414] text-white">🟠 Queue Buffer Overload</option>
              <option value="payments_crash" className="bg-[#141414] text-white">🔴 Payments Pod Crash</option>
              <option value="traffic_spike" className="bg-[#141414] text-white">🟡 5x Traffic Spike</option>
            </select>
          </div>

          <button
            onClick={onOpenCustomFault}
            title="Inject Custom Service Failure"
            className="p-1.5 rounded-lg bg-[#141414] border border-[#262626] text-[#A3A3A3] hover:text-white hover:border-[#333333] text-xs flex items-center gap-1 font-mono transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Custom</span>
          </button>

          {/* Clock & Stepper Controls */}
          <div className="flex items-center bg-[#141414] border border-[#262626] rounded-lg p-0.5">
            <div className="px-2 py-1 text-[11px] font-mono text-[#A3A3A3] border-r border-[#262626]">
              Tick <span className="text-white font-bold">{currentTick.toString().padStart(2, '0')}</span> (+{currentTick * 5}s)
            </div>

            <button
              onClick={() => setIsAutoStepping(!isAutoStepping)}
              title={isAutoStepping ? "Pause auto simulation" : "Start live auto ticking (every 3s)"}
              className={`p-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1 ${
                isAutoStepping 
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-600/40' 
                  : 'text-[#A3A3A3] hover:text-white hover:bg-neutral-800'
              }`}
            >
              {isAutoStepping ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
            </button>

            <button
              onClick={onStep}
              title="Advance 1 step (5 seconds)"
              className="p-1.5 rounded-md text-[#A3A3A3] hover:text-white hover:bg-neutral-800 text-xs transition-colors flex items-center gap-1"
            >
              <FastForward className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[10px] font-mono hidden md:inline">+5s</span>
            </button>

            <button
              onClick={onReset}
              title="Reset simulation to healthy baseline"
              className="p-1.5 rounded-md text-[#A3A3A3] hover:text-red-400 hover:bg-neutral-800 text-xs transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
