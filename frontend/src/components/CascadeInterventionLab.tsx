import React, { useState } from 'react';
import { 
  SlidersHorizontal, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  ShieldAlert, 
  Zap, 
  RotateCcw, 
  DollarSign, 
  ArrowRight, 
  Terminal, 
  Copy, 
  Check,
  TrendingDown,
  Sparkles
} from 'lucide-react';
import { RecoveryStrategy, CounterfactualComparison, ServiceState } from '../types';

interface CascadeInterventionLabProps {
  strategies: RecoveryStrategy[];
  comparison: CounterfactualComparison | null;
  activeRecovery: string | null;
  services: Record<string, ServiceState>;
  onApplyRecovery: (strategyId: string) => void;
  onRollbackRecovery: () => void;
  onSelectStrategyToCompare: (strategyId: string) => void;
}

export const CascadeInterventionLab: React.FC<CascadeInterventionLabProps> = ({
  strategies,
  comparison,
  activeRecovery,
  services,
  onApplyRecovery,
  onRollbackRecovery,
  onSelectStrategyToCompare
}) => {
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>(
    activeRecovery || strategies[0]?.strategy_id || 'enable_cache_fallback'
  );
  const [copiedCmd, setCopiedCmd] = useState<boolean>(false);

  const selectedStrategy = strategies.find(s => s.strategy_id === selectedStrategyId) || strategies[0];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const handleStrategyClick = (sId: string) => {
    setSelectedStrategyId(sId);
    onSelectStrategyToCompare(sId);
  };

  const outcome = comparison?.simulated_outcome;
  const baseline = comparison?.unmitigated_baseline;
  const delta = comparison?.delta;

  return (
    <div className="flex flex-col gap-5 max-w-[1600px] mx-auto py-2">
      {/* Lab Banner Header */}
      <div className="bg-gradient-to-r from-[#170e0e] via-[#141414] to-[#0c0c0c] border border-red-900/40 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-red-950/80 border border-red-500/50 text-red-400">
                <SlidersHorizontal className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-extrabold text-white tracking-wide">
                CASCADE INTERVENTION LAB
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 border border-red-700/60 text-red-300 font-semibold uppercase">
                Signature Differentiator
              </span>
            </div>
            <p className="text-xs text-[#A3A3A3] mt-1.5 max-w-3xl leading-relaxed">
              Don't guess in the dark. Evaluate alternative recovery strategies before executing. 
              Project recovery times, blast radius containment, and cost trade-offs — then verify outcomes in the simulation sandbox.
            </p>
          </div>

          {/* Active Intervention Status Pill */}
          <div className="flex items-center gap-3">
            {activeRecovery ? (
              <div className="flex items-center gap-2 bg-emerald-950/70 border border-emerald-500/50 px-3 py-1.5 rounded-lg">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <div className="text-left font-mono">
                  <span className="text-[10px] text-emerald-400 block font-semibold">ACTIVE INTERVENTION</span>
                  <span className="text-xs text-white font-bold">{activeRecovery}</span>
                </div>
                <button
                  onClick={onRollbackRecovery}
                  className="ml-2 px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300 rounded border border-neutral-700 flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Rollback</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-lg text-neutral-400 text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Simulation awaiting operator intervention decision</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Strategies Multi-Option Cards Row */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-semibold">
            Ranked Recovery Strategies ({strategies.length} Alternatives)
          </span>
          <span className="text-[11px] text-neutral-500 font-mono">
            Click to compare metrics & simulated verification
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
          {strategies.map((strat) => {
            const isSelected = strat.strategy_id === selectedStrategyId;
            const isApplied = strat.strategy_id === activeRecovery;
            const isRecommended = strat.is_recommended;

            let cardBorder = 'border-[#262626] bg-[#141414] hover:border-neutral-700';
            let badgeBg = 'bg-neutral-800 text-neutral-300 border-neutral-700';

            if (isRecommended) {
              badgeBg = 'bg-emerald-950/80 text-emerald-300 border-emerald-600/50';
              if (isSelected) cardBorder = 'border-emerald-500/80 bg-[#0e1713] ring-2 ring-emerald-500/40 shadow-lg';
            } else if (strat.rank === 4) {
              badgeBg = 'bg-red-950/80 text-red-300 border-red-600/50';
              if (isSelected) cardBorder = 'border-red-500/70 bg-[#170e0e] ring-2 ring-red-500/30';
            } else {
              if (isSelected) cardBorder = 'border-blue-500/70 bg-[#10141c] ring-2 ring-blue-500/30';
            }

            return (
              <div
                key={strat.strategy_id}
                onClick={() => handleStrategyClick(strat.strategy_id)}
                className={`rounded-xl border p-4 cursor-pointer transition-all duration-200 flex flex-col justify-between ${cardBorder}`}
              >
                <div>
                  {/* Top Badge & Rank */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono text-neutral-500 font-bold">
                      OPTION 0{strat.rank}
                    </span>
                    <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${badgeBg}`}>
                      {strat.badge}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="text-sm font-bold text-white mb-2 leading-tight">
                    {strat.title}
                  </h4>

                  {/* Expected Benefit */}
                  <div className="mb-2 text-xs text-neutral-300">
                    <span className="text-neutral-500 block text-[10px] font-mono uppercase">Benefit:</span>
                    <p className="leading-snug">{strat.expected_benefit}</p>
                  </div>

                  {/* Trade-off */}
                  <div className="mb-3 text-xs text-amber-300/90 bg-amber-950/30 border border-amber-900/30 rounded p-2">
                    <span className="text-amber-500 block text-[10px] font-mono uppercase font-bold">Trade-Off:</span>
                    <p className="leading-snug">{strat.trade_off}</p>
                  </div>
                </div>

                <div>
                  {/* Key Projected Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2 py-2.5 border-t border-[#222222] text-[11px] font-mono mb-3">
                    <div>
                      <span className="text-[10px] text-neutral-500 block">Projected MTTR</span>
                      <span className="font-bold text-white flex items-center gap-1">
                        <Clock className="w-3 h-3 text-neutral-400" />
                        ~{strat.projected_recovery_time_sec}s
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-neutral-500 block">Risk Reduction</span>
                      <span className="font-bold text-emerald-400">
                        {strat.blast_radius_reduction_pct}%
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-neutral-500 block">Resource Cost</span>
                      <span className={`font-semibold ${
                        strat.resource_cost === 'HIGH' ? 'text-red-400' : 'text-neutral-300'
                      }`}>
                        {strat.resource_cost}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-neutral-500 block">Residual Risk</span>
                      <span className={`font-semibold ${
                        strat.residual_risk === 'HIGH' ? 'text-red-400' : 'text-emerald-400'
                      }`}>
                        {strat.residual_risk}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  {isApplied ? (
                    <div className="w-full py-2 rounded-lg bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 font-mono text-xs font-bold text-center flex items-center justify-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      <span>APPLIED IN SANDBOX</span>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onApplyRecovery(strat.strategy_id);
                      }}
                      className={`w-full py-2 rounded-lg font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                        isRecommended 
                          ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-emerald-950/40' 
                          : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Execute Intervention</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Strategy Deep Dive & Counterfactual Verification */}
      {selectedStrategy && (
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-3 border-b border-[#222222] gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-neutral-500 uppercase">Selected Strategy Deep Dive:</span>
                <span className="font-bold text-base text-white">{selectedStrategy.title}</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  selectedStrategy.is_recommended ? 'bg-emerald-950 text-emerald-300 border-emerald-600' : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                }`}>
                  {selectedStrategy.badge}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
                {selectedStrategy.technical_explanation}
              </p>
            </div>

            {/* CLI Command Preview */}
            <div className="w-full md:w-auto flex items-center gap-2 bg-[#0c0c0c] border border-[#262626] rounded-lg px-3 py-1.5 font-mono text-xs">
              <Terminal className="w-3.5 h-3.5 text-neutral-500" />
              <code className="text-neutral-300 text-[11px] truncate max-w-sm">
                {selectedStrategy.cli_command}
              </code>
              <button
                onClick={() => handleCopy(selectedStrategy.cli_command)}
                className="text-neutral-400 hover:text-white p-1 rounded hover:bg-neutral-800 transition-colors"
                title="Copy CLI snippet"
              >
                {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Counterfactual Verification Comparison Matrix */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-neutral-300 font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Simulated Counterfactual Verification (With vs Without Intervention)</span>
              </span>
              <span className="text-[11px] font-mono text-neutral-500">
                Ground-truth comparison against unmitigated failure scenario
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Baseline: Without Intervention */}
              <div className="bg-[#180f0f] border border-red-900/40 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-red-400 uppercase flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4" />
                      <span>Counterfactual: Without Intervention</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 border border-red-700/50 text-red-300 font-semibold">
                      UNMITIGATED COLLAPSE
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300 mb-4">
                    {baseline?.impact_summary}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono">
                    <div className="bg-[#120a0a] p-2 rounded border border-red-950">
                      <span className="text-[10px] text-neutral-500 block">Blast Radius</span>
                      <span className="text-sm font-bold text-red-400">{baseline?.blast_radius_pct}%</span>
                      <span className="text-[9px] text-neutral-500 block">4 services</span>
                    </div>

                    <div className="bg-[#120a0a] p-2 rounded border border-red-950">
                      <span className="text-[10px] text-neutral-500 block">Est. Downtime</span>
                      <span className="text-sm font-bold text-red-400">~{baseline?.estimated_downtime_minutes} min</span>
                      <span className="text-[9px] text-neutral-500 block">Extended outage</span>
                    </div>

                    <div className="bg-[#120a0a] p-2 rounded border border-red-950">
                      <span className="text-[10px] text-neutral-500 block">Gateway Errors</span>
                      <span className="text-sm font-bold text-red-400">{baseline?.gateway_error_rate_pct}%</span>
                      <span className="text-[9px] text-neutral-500 block">504 timeouts</span>
                    </div>

                    <div className="bg-[#120a0a] p-2 rounded border border-red-950">
                      <span className="text-[10px] text-neutral-500 block">Requests Lost</span>
                      <span className="text-sm font-bold text-red-400">~{baseline?.requests_lost_est?.toLocaleString()}</span>
                      <span className="text-[9px] text-neutral-500 block">Failed checkouts</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-[11px] font-mono text-neutral-400 pt-2 border-t border-red-950/60">
                  Financial Exposure: <span className="text-red-300 font-bold">{baseline?.financial_risk_score}</span>
                </div>
              </div>

              {/* Outcome: With Selected Intervention */}
              <div className="bg-[#0b1712] border border-emerald-900/40 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Simulated Sandbox: With {selectedStrategy.title}</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-600/50 text-emerald-300 font-semibold">
                      {outcome?.simulated_state}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300 mb-4">
                    Downstream services spared: <span className="text-white font-bold">{outcome?.spared_services?.join(', ') || 'all callers'}</span>. {outcome?.trade_off_measured}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono">
                    <div className="bg-[#08120e] p-2 rounded border border-emerald-950">
                      <span className="text-[10px] text-neutral-500 block">Blast Radius</span>
                      <span className="text-sm font-bold text-emerald-400">{outcome?.blast_radius_pct}%</span>
                      <span className="text-[9px] text-emerald-500 block">Contained</span>
                    </div>

                    <div className="bg-[#08120e] p-2 rounded border border-emerald-950">
                      <span className="text-[10px] text-neutral-500 block">Recovery Time</span>
                      <span className="text-sm font-bold text-emerald-400">~{outcome?.simulated_recovery_time_sec}s</span>
                      <span className="text-[9px] text-emerald-500 block">MTTR</span>
                    </div>

                    <div className="bg-[#08120e] p-2 rounded border border-emerald-950">
                      <span className="text-[10px] text-neutral-500 block">Gateway Errors</span>
                      <span className="text-sm font-bold text-emerald-400">{outcome?.gateway_error_rate_pct}%</span>
                      <span className="text-[9px] text-emerald-500 block">Healthy (0%)</span>
                    </div>

                    <div className="bg-[#08120e] p-2 rounded border border-emerald-950">
                      <span className="text-[10px] text-neutral-500 block">Requests Saved</span>
                      <span className="text-sm font-bold text-emerald-400">~{outcome?.requests_saved_est?.toLocaleString()}</span>
                      <span className="text-[9px] text-emerald-500 block">Protected</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-neutral-400 pt-2 border-t border-emerald-950/60">
                  <div>
                    Latency Drop: <span className="text-emerald-300 font-bold">-{delta?.latency_reduction_pct}%</span>
                  </div>
                  <div>
                    Error Reduction: <span className="text-emerald-300 font-bold">-{delta?.error_reduction_pct}%</span>
                  </div>
                  <div>
                    Services Saved: <span className="text-emerald-300 font-bold">{delta?.services_saved} of 3</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
