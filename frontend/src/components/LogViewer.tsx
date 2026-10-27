import React, { useState } from 'react';
import { Terminal, Search, Filter, AlertCircle, ShieldAlert } from 'lucide-react';
import { LogEntry } from '../types';

interface LogViewerProps {
  logs: LogEntry[];
  selectedServiceId: string | null;
}

export const LogViewer: React.FC<LogViewerProps> = ({ logs, selectedServiceId }) => {
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterService, setFilterService] = useState<string>(selectedServiceId || 'ALL');

  const filteredLogs = logs.filter((log) => {
    if (filterLevel === 'ERRORS' && !['ERROR', 'FATAL'].includes(log.level)) return false;
    if (filterLevel === 'WARN' && log.level !== 'WARN') return false;
    if (filterService !== 'ALL' && log.service !== filterService) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        log.message.toLowerCase().includes(term) ||
        log.service.toLowerCase().includes(term) ||
        log.level.toLowerCase().includes(term)
      );
    }
    return true;
  });

  return (
    <div className="bg-[#141414] border border-[#262626] rounded-xl p-4 flex flex-col gap-3">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-[#222222]">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Live System Telemetry & Log Stream</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400">
                {filteredLogs.length} entries
              </span>
            </h3>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          {/* Level Filter */}
          <div className="flex items-center bg-[#0e0e0e] border border-[#262626] rounded-lg p-0.5 text-xs font-mono">
            <button
              onClick={() => setFilterLevel('ALL')}
              className={`px-2 py-0.5 rounded transition-colors ${
                filterLevel === 'ALL' ? 'bg-neutral-800 text-white font-bold' : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              ALL
            </button>
            <button
              onClick={() => setFilterLevel('ERRORS')}
              className={`px-2 py-0.5 rounded transition-colors ${
                filterLevel === 'ERRORS' ? 'bg-red-950 text-red-300 font-bold border border-red-800/40' : 'text-neutral-500 hover:text-red-400'
              }`}
            >
              ERRORS
            </button>
            <button
              onClick={() => setFilterLevel('WARN')}
              className={`px-2 py-0.5 rounded transition-colors ${
                filterLevel === 'WARN' ? 'bg-amber-950 text-amber-300 font-bold' : 'text-neutral-500 hover:text-amber-300'
              }`}
            >
              WARN
            </button>
          </div>

          {/* Search box */}
          <div className="flex items-center bg-[#0e0e0e] border border-[#262626] rounded-lg px-2 py-1 text-xs">
            <Search className="w-3.5 h-3.5 text-neutral-500 mr-1.5" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-white placeholder-neutral-600 focus:outline-none text-xs w-28 sm:w-36 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Log Feed */}
      <div className="bg-[#0b0b0b] border border-[#222222] rounded-lg p-2.5 max-h-56 overflow-y-auto font-mono text-[11px] space-y-1.5">
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log) => {
            let levelBadge = 'text-neutral-400 bg-neutral-900 border-neutral-800';
            let rowHighlight = 'hover:bg-[#121212]';

            if (log.level === 'FATAL') {
              levelBadge = 'text-red-300 bg-red-950 border-red-700/60 font-bold';
              rowHighlight = 'bg-red-950/20 hover:bg-red-950/30';
            } else if (log.level === 'ERROR') {
              levelBadge = 'text-red-400 bg-red-950/60 border-red-800/40';
              rowHighlight = 'bg-red-950/10 hover:bg-red-950/20';
            } else if (log.level === 'WARN') {
              levelBadge = 'text-amber-300 bg-amber-950/50 border-amber-800/40';
            }

            return (
              <div
                key={log.id}
                className={`p-1.5 rounded transition-colors flex items-start gap-2 ${rowHighlight}`}
              >
                <span className="text-neutral-600 shrink-0 select-none">
                  T{log.tick.toString().padStart(2, '0')}
                </span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded border shrink-0 ${levelBadge}`}>
                  {log.level}
                </span>
                <span className="text-neutral-400 shrink-0 text-[10px] bg-neutral-900 px-1 rounded border border-neutral-800">
                  {log.service}
                </span>
                <span className="text-neutral-200 leading-snug break-all">
                  {log.message}
                </span>
              </div>
            );
          })
        ) : (
          <div className="text-center py-6 text-neutral-600 text-xs">
            No logs matching filter criteria.
          </div>
        )}
      </div>
    </div>
  );
};
