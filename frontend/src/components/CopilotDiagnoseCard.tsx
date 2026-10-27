import React, { useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  AlertTriangle, 
  ShieldAlert, 
  BookOpen, 
  ExternalLink,
  CheckCircle2,
  Terminal,
  Zap
} from 'lucide-react';
import { CopilotDiagnoseData, RunbookChunkData } from '../types';

interface CopilotDiagnoseCardProps {
  diagnoseData?: CopilotDiagnoseData;
  onOpenRunbookChunk: (chunk: RunbookChunkData) => void;
}

export const CopilotDiagnoseCard: React.FC<CopilotDiagnoseCardProps> = ({
  diagnoseData,
  onOpenRunbookChunk
}) => {
  if (!diagnoseData) return null;

  const { diagnosis, recommended_action, unsafe_action, citations, retrieved_chunks, retrieval_hit_rate_eval } = diagnoseData;

  // Helper to render text with clickable citation pills
  const renderTextWithCitations = (rawText: string) => {
    const parts = rawText.split(/(\[RB\-[A-Za-z0-9\-]+\])/g);
    return parts.map((part, idx) => {
      const match = part.match(/\[(RB\-[A-Za-z0-9\-]+)\]/);
      if (match) {
        const chunkId = match[1];
        const chunk = retrieved_chunks.find(c => c.chunk_id === chunkId);

        return (
          <button
            key={idx}
            onClick={() => chunk && onOpenRunbookChunk(chunk)}
            className="inline-flex items-center gap-1 mx-1 px-1.5 py-0.2 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-300 font-mono text-[10px] font-bold transition-all shadow-sm group"
            title="Click to view verified runbook chunk source"
          >
            <BookOpen className="w-2.5 h-2.5 text-cyan-400 group-hover:scale-110" />
            <span>{chunkId}</span>
          </button>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <div className="bg-[#141414] border border-[#262626] rounded-xl p-4 flex flex-col gap-3 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#222222]">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-cyan-950/80 border border-cyan-500/50 text-cyan-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>Runbook-Grounded Copilot Diagnosis</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-700/60 text-cyan-300 font-semibold">
                RAG GENAI
              </span>
            </h3>
            <p className="text-[11px] text-[#A3A3A3]">
              Evidence-grounded SRE explanation with verified citations ({retrieval_hit_rate_eval})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded">
          <CheckCircle2 className="w-3 h-3 text-cyan-400" />
          <span>{citations.length} Citations Verified</span>
        </div>
      </div>

      {/* Diagnosis Paragraph */}
      <div className="bg-[#171717] border border-[#282828] rounded-lg p-3 text-xs text-neutral-200 leading-relaxed font-sans">
        {renderTextWithCitations(diagnosis)}
      </div>

      {/* Recommended Action */}
      <div className="bg-[#0e1713] border border-emerald-900/40 rounded-lg p-3 text-xs text-emerald-200 leading-relaxed">
        {renderTextWithCitations(recommended_action)}
      </div>

      {/* ⛔ Unsafe Action (The key feature) */}
      <div className="bg-[#1c0f0f] border border-red-900/50 rounded-lg p-3 text-xs text-red-200 leading-relaxed shadow-sm">
        <div className="flex items-start gap-1.5">
          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>{renderTextWithCitations(unsafe_action)}</div>
        </div>
      </div>

      {/* Clickable Retrieved Runbook Chips Footer */}
      <div className="pt-1 border-t border-[#222222] flex items-center justify-between text-[11px] font-mono">
        <span className="text-neutral-500 text-[10px]">Retrieved Runbook Chunks:</span>
        <div className="flex flex-wrap gap-1.5">
          {retrieved_chunks.map((chunk) => (
            <button
              key={chunk.chunk_id}
              onClick={() => onOpenRunbookChunk(chunk)}
              className="px-2 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white transition-colors text-[10px] flex items-center gap-1"
            >
              <BookOpen className="w-3 h-3 text-cyan-400" />
              <span>{chunk.chunk_id} ({chunk.service})</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
