import React from 'react';
import { X, BookOpen, ExternalLink, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { RunbookChunkData } from '../types';

interface RunbookModalProps {
  chunk: RunbookChunkData | null;
  onClose: () => void;
}

export const RunbookModal: React.FC<RunbookModalProps> = ({ chunk, onClose }) => {
  if (!chunk) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#141414] border border-[#2d2d2d] rounded-2xl max-w-xl w-full p-6 shadow-2xl relative font-sans">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#262626]">
          <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/50 text-cyan-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-cyan-950 border border-cyan-700/60 text-cyan-300 font-bold">
                {chunk.chunk_id}
              </span>
              <span className="text-xs font-mono text-neutral-400">
                Runbook: {chunk.runbook_id}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white mt-1">
              {chunk.runbook_title}
            </h3>
          </div>
        </div>

        <div className="space-y-3 font-mono text-xs">
          <div className="flex items-center gap-3 text-[11px] text-neutral-400 pb-2 border-b border-[#222222]">
            <span>Target Service: <strong className="text-white">{chunk.service}</strong></span>
            <span>·</span>
            <span>Section: <strong className="text-cyan-300">{chunk.section_title}</strong></span>
          </div>

          <div className="bg-[#0b0b0b] border border-[#222222] rounded-xl p-4 text-neutral-300 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
            {chunk.content}
          </div>

          <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-2">
            <span>Verified Citation Grounded by CASCADIA RAG Engine</span>
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors font-sans"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
