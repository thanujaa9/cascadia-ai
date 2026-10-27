import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Copy, 
  Check, 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  Activity,
  History,
  Layers
} from 'lucide-react';
import { TimelineEvent } from '../types';
import { getMarkdownReport } from '../services/api';

interface TimelineAndReportProps {
  timeline: TimelineEvent[];
  scenarioName: string;
}

export const TimelineAndReport: React.FC<TimelineAndReportProps> = ({
  timeline,
  scenarioName
}) => {
  const [reportMarkdown, setReportMarkdown] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    loadReport();
  }, [timeline]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const md = await getMarkdownReport();
      setReportMarkdown(md);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(reportMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([reportMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cascadia-postmortem-${Date.now()}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 max-w-[1600px] mx-auto py-2">
      {/* Left Column: Sequential Incident Timeline */}
      <div className="lg:col-span-5 bg-[#141414] border border-[#262626] rounded-xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-blue-400">
              <History className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white">
                Sequential Incident Timeline
              </h3>
              <p className="text-[11px] text-[#A3A3A3]">
                Chronological chain of events & intervention triggers
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-900 text-neutral-400 border border-neutral-800">
            {timeline.length} milestones
          </span>
        </div>

        {/* Timeline Event List */}
        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-neutral-800">
          {timeline.length > 0 ? (
            timeline.map((event, idx) => {
              let circleColor = 'bg-neutral-700 border-neutral-600';
              let badgeColor = 'text-neutral-400 border-neutral-800';

              if (event.severity === 'CRITICAL') {
                circleColor = 'bg-red-500 border-red-400 shadow-sm shadow-red-500 animate-pulse';
                badgeColor = 'text-red-300 bg-red-950/80 border-red-700/50';
              } else if (event.severity === 'WARNING') {
                circleColor = 'bg-amber-400 border-amber-300';
                badgeColor = 'text-amber-300 bg-amber-950/60 border-amber-700/50';
              } else if (event.severity === 'HEALTHY') {
                circleColor = 'bg-emerald-400 border-emerald-300';
                badgeColor = 'text-emerald-300 bg-emerald-950/60 border-emerald-700/50';
              }

              return (
                <div key={event.id || idx} className="relative group">
                  {/* Timeline Node Dot */}
                  <div className={`absolute -left-[27px] top-1.5 w-3.5 h-3.5 rounded-full border-2 ${circleColor}`} />

                  {/* Card */}
                  <div className="bg-[#181818] hover:bg-[#1c1c1c] border border-[#262626] rounded-lg p-3 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded border font-semibold ${badgeColor}`}>
                        {event.type}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-500">
                        Tick {event.tick} (+{event.tick * 5}s)
                      </span>
                    </div>

                    <p className="text-xs text-neutral-200 leading-snug">
                      {event.description}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-neutral-500 text-xs font-mono">
              Timeline awaiting incident progression events.
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Executive Post-Mortem Report Viewer */}
      <div className="lg:col-span-7 bg-[#141414] border border-[#262626] rounded-xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-200">
              <FileText className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Executive Post-Mortem Audit Report</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-950 border border-blue-700/50 text-blue-300">
                  P1 EXPORT
                </span>
              </h3>
              <p className="text-[11px] text-[#A3A3A3]">
                Defensible evidence summary, trade-offs, and verification deltas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-2.5 py-1.5 bg-[#1b1b1b] hover:bg-[#222222] border border-[#2d2d2d] rounded-lg text-xs font-mono text-neutral-300 flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy MD'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-2.5 py-1.5 bg-gradient-to-r from-neutral-800 to-neutral-700 hover:from-neutral-700 hover:to-neutral-600 border border-neutral-600 rounded-lg text-xs font-mono text-white font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Report</span>
            </button>
          </div>
        </div>

        {/* Report Preview */}
        <div className="bg-[#0b0b0b] border border-[#222222] rounded-xl p-5 font-mono text-xs text-neutral-300 max-h-[560px] overflow-y-auto whitespace-pre-wrap leading-relaxed selection:bg-neutral-800">
          {loading ? (
            <div className="text-center py-12 text-neutral-500">
              Compiling post-mortem metrics & telemetry deltas...
            </div>
          ) : (
            reportMarkdown || 'Report generating...'
          )}
        </div>
      </div>
    </div>
  );
};
