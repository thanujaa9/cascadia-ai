import React from 'react';
import { 
  AlertTriangle, 
  Clock, 
  ArrowRight, 
  ShieldAlert, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { PredictionData, PredictionItem } from '../types';

interface PredictionPanelProps {
  predictionData: PredictionData | null;
  onSelectService: (serviceId: string) => void;
}

export const PredictionPanel: React.FC<PredictionPanelProps> = ({
  predictionData,
  onSelectService
}) => {
  if (!predictionData || !predictionData.has_prediction || predictionData.predictions.length === 0) {
    return (
      <div className="bg-[#141414] border border-[#262626] rounded-xl p-4 text-center">
        <div className="h-10 w-10 mx-auto rounded-full bg-emerald-950/40 border border-emerald-800/40 flex items-center justify-center text-emerald-400 mb-2">
          <CheckCircle className="w-5 h-5" />
        </div>
        <h4 className="text-sm font-semibold text-[#F5F5F5]">No Active Cascade Predicted</h4>
        <p className="text-xs text-[#A3A3A3] mt-1 max-w-sm mx-auto">
          All service dependency pathways are operating within healthy latency and concurrency thresholds.
        </p>
      </div>
    );
  }

  const { predictions, projected_blast_radius_pct, time_to_collapse_sec, summary } = predictionData;

  return (
    <div className="bg-[#141414] border border-[#262626] rounded-xl p-4 flex flex-col gap-3">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#222222]">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-amber-950/60 border border-amber-600/40 text-amber-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-1.5">
              <span>Cascading Failure Prediction</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-950/80 border border-amber-500/50 text-amber-300">
                P0 CORE
              </span>
            </h3>
            <p className="text-[11px] text-[#A3A3A3]">
              Downstream degradation estimates based on topology and telemetry
            </p>
          </div>
        </div>

        {/* Global Cascade Metrics */}
        <div className="flex items-center gap-3 text-right">
          <div>
            <span className="text-[10px] font-mono text-neutral-500 block">Est. Blast Radius</span>
            <span className="text-xs font-mono font-bold text-red-400">{projected_blast_radius_pct}%</span>
          </div>
          <div className="h-6 w-[1px] bg-[#262626]" />
          <div>
            <span className="text-[10px] font-mono text-neutral-500 block">Time to Ingress Collapse</span>
            <span className="text-xs font-mono font-bold text-amber-300">~{time_to_collapse_sec}s</span>
          </div>
        </div>
      </div>

      {/* Summary Narrative */}
      <div className="bg-[#1b1510] border border-amber-800/30 rounded-lg p-2.5 text-xs text-amber-200/90 leading-relaxed">
        {summary}
      </div>

      {/* List of At-Risk Services */}
      <div className="flex flex-col gap-2.5 mt-1">
        {predictions.map((p: PredictionItem, idx: number) => {
          const isImmediate = p.time_window_sec <= 5;
          const isCritical = p.risk_score >= 90;

          return (
            <div
              key={p.service_id}
              onClick={() => onSelectService(p.service_id)}
              className="bg-[#191919] hover:bg-[#1f1f1f] border border-[#2b2b2b] hover:border-amber-600/40 rounded-lg p-3 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-neutral-400 font-bold">
                    0{idx + 1}
                  </span>
                  <span className="font-semibold text-xs text-white">
                    {p.service_name}
                  </span>
                  <span className="text-[10px] font-mono text-neutral-500 bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">
                    {p.tier}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Time Window Pill */}
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold ${
                    isImmediate 
                      ? 'bg-red-950/80 border border-red-500/50 text-red-300' 
                      : 'bg-amber-950/60 border border-amber-500/40 text-amber-300'
                  }`}>
                    <Clock className="w-3 h-3" />
                    <span>{isImmediate ? 'Imminent / Degraded' : `+${p.time_window_sec}s window`}</span>
                  </span>

                  {/* Risk Score */}
                  <div className="text-right font-mono">
                    <span className={`text-xs font-bold ${isCritical ? 'text-red-400' : 'text-amber-300'}`}>
                      {p.risk_score}%
                    </span>
                    <span className="text-[9px] text-neutral-500 ml-1">Risk</span>
                  </div>
                </div>
              </div>

              {/* Risk Progress Bar */}
              <div className="w-full bg-neutral-900 rounded-full h-1.5 mb-2 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    isCritical ? 'bg-gradient-to-r from-amber-500 to-red-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${p.risk_score}%` }}
                />
              </div>

              {/* Propagation Path */}
              <div className="flex items-center gap-1 text-[10px] font-mono text-neutral-400 mb-2 overflow-x-auto pb-0.5">
                <span className="text-neutral-500">Path:</span>
                {p.propagation_path.map((step, sIdx) => (
                  <React.Fragment key={sIdx}>
                    <span className={sIdx === p.propagation_path.length - 1 ? 'text-amber-300 font-bold' : 'text-neutral-400'}>
                      {step}
                    </span>
                    {sIdx < p.propagation_path.length - 1 && (
                      <ArrowRight className="w-2.5 h-2.5 text-neutral-600 inline" />
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Evidence Points */}
              <div className="space-y-1 bg-[#121212] rounded p-2 border border-[#222222]">
                {p.evidence.map((ev, eIdx) => (
                  <p key={eIdx} className="text-[11px] text-neutral-300 flex items-start gap-1.5 leading-snug">
                    <span className="text-amber-400 mt-0.5 font-bold">›</span>
                    <span>{ev}</span>
                  </p>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
