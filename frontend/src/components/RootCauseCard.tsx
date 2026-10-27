import React from 'react';
import { 
  Target, 
  ShieldAlert, 
  Clock, 
  Activity, 
  CheckCircle2, 
  FileText
} from 'lucide-react';
import { RootCauseData } from '../types';

interface RootCauseCardProps {
  rootCauseData: RootCauseData | null;
  onSelectService: (serviceId: string) => void;
}

export const RootCauseCard: React.FC<RootCauseCardProps> = ({
  rootCauseData,
  onSelectService
}) => {
  const topCandidate = rootCauseData?.top_candidate;

  if (!rootCauseData || !topCandidate) {
    return (
      <div className="bg-[#141414] border border-[#262626] rounded-xl p-4 text-center">
        <div className="h-8 w-8 mx-auto rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-emerald-400 mb-2">
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <h4 className="text-xs font-semibold text-neutral-300">Root Cause Engine Idle</h4>
        <p className="text-[11px] text-[#A3A3A3] mt-0.5">
          No anomalous root cause candidates detected.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#141414] border border-[#262626] rounded-xl p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#222222]">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-red-950/80 border border-red-600/50 text-red-400">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#F5F5F5] flex items-center gap-1.5">
              <span>Root Cause Analysis</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-red-950/80 border border-red-500/50 text-red-300">
                P0 CORE
              </span>
            </h3>
            <p className="text-[11px] text-[#A3A3A3]">
              Evidence-backed causal ranking (Not an unverified AI hallucination)
            </p>
          </div>
        </div>

        {/* Suspicion Score Badge */}
        <div className="flex items-center gap-1.5 bg-red-950/60 border border-red-500/50 px-2 py-1 rounded-lg">
          <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
          <span className="text-xs font-mono font-bold text-red-300">
            {topCandidate.suspicion_score}% Suspicion
          </span>
        </div>
      </div>

      {/* Primary Candidate Card */}
      <div 
        onClick={() => onSelectService(topCandidate.service_id)}
        className="bg-[#1a0f0f] border border-red-500/40 hover:border-red-500/70 rounded-lg p-3 cursor-pointer transition-all"
      >
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">
                {topCandidate.service_name}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-900/60 text-red-200 border border-red-700/50">
                {topCandidate.status_label}
              </span>
            </div>
            <span className="text-[10px] font-mono text-neutral-400 block mt-0.5">
              Tier: {topCandidate.tier} · First Deviation: Tick {topCandidate.first_detected_tick} (+{topCandidate.first_detected_tick * 5}s)
            </span>
          </div>

          <span className="text-[10px] font-mono text-red-300 bg-red-950/90 px-2 py-0.5 rounded border border-red-800">
            {topCandidate.confidence} CONFIDENCE
          </span>
        </div>

        {/* Evidence List */}
        <div className="space-y-1.5 pt-2 border-t border-red-900/40">
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block font-semibold">
            Empirical Evidence Chain:
          </span>
          {topCandidate.evidence.map((ev, idx) => (
            <div key={idx} className="flex items-start gap-1.5 text-xs text-neutral-200 leading-snug">
              <span className="text-red-400 font-bold mt-0.5">✓</span>
              <span>{ev}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Secondary Candidates if available */}
      {rootCauseData.candidates.length > 1 && (
        <div className="pt-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 block mb-1.5">
            Secondary / Symptomatic Nodes:
          </span>
          <div className="grid grid-cols-2 gap-2">
            {rootCauseData.candidates.slice(1, 3).map((c) => (
              <div 
                key={c.service_id}
                onClick={() => onSelectService(c.service_id)}
                className="bg-[#161616] border border-[#282828] hover:border-neutral-700 rounded p-2 text-xs cursor-pointer"
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-neutral-300 truncate">{c.service_name}</span>
                  <span className="font-mono text-[10px] text-neutral-500">{c.suspicion_score}%</span>
                </div>
                <span className="text-[9px] font-mono text-neutral-500 block">{c.status_label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
