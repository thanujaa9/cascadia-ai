import React from 'react';
import { 
  X, 
  Activity, 
  Cpu, 
  Server, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  Terminal, 
  ArrowRight,
  Database
} from 'lucide-react';
import { ServiceState, LogEntry } from '../types';

interface ServiceInspectorProps {
  service: ServiceState | null;
  logs: LogEntry[];
  onClose: () => void;
  upstreamCallers: string[];
  downstreamCallees: string[];
}

export const ServiceInspector: React.FC<ServiceInspectorProps> = ({
  service,
  logs,
  onClose,
  upstreamCallers,
  downstreamCallees
}) => {
  if (!service) return null;

  const serviceLogs = logs.filter(l => l.service === service.id).slice(0, 15);
  const isHealthy = service.status === 'HEALTHY';
  const isCritical = service.status === 'CRITICAL';
  const isDegraded = service.status === 'DEGRADED';
  const isRecovered = service.status === 'RECOVERED';

  let statusBadge = 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300';
  if (isCritical) statusBadge = 'bg-red-950/80 border-red-500/60 text-red-300 animate-pulse';
  else if (isDegraded) statusBadge = 'bg-amber-950/70 border-amber-500/60 text-amber-300';
  else if (isRecovered) statusBadge = 'bg-cyan-950/70 border-cyan-500/60 text-cyan-300';

  return (
    <div className="bg-[#141414] border border-[#262626] rounded-xl p-4 flex flex-col gap-4 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{service.name}</span>
              <span className="text-[10px] font-mono text-neutral-400 bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">
                {service.tier}
              </span>
            </h3>
            <span className="text-[10px] font-mono text-neutral-500">
              Service ID: {service.id}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${statusBadge}`}>
            {service.visual_label || service.status}
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
        <div className="bg-[#191919] p-2.5 rounded-lg border border-[#262626]">
          <span className="text-[10px] text-neutral-500 block">p95 Latency</span>
          <span className={`text-sm font-bold ${service.latency_ms > 300 ? 'text-red-400' : 'text-neutral-100'}`}>
            {Math.round(service.latency_ms)} ms
          </span>
          <span className="text-[9px] text-neutral-500 block">p99: {Math.round(service.p99_latency_ms)}ms</span>
        </div>

        <div className="bg-[#191919] p-2.5 rounded-lg border border-[#262626]">
          <span className="text-[10px] text-neutral-500 block">Error Rate</span>
          <span className={`text-sm font-bold ${service.error_rate > 2.0 ? 'text-red-400' : 'text-neutral-100'}`}>
            {service.error_rate.toFixed(2)}%
          </span>
          <span className="text-[9px] text-neutral-500 block">Nominal: &lt;0.05%</span>
        </div>

        <div className="bg-[#191919] p-2.5 rounded-lg border border-[#262626]">
          <span className="text-[10px] text-neutral-500 block">Throughput</span>
          <span className="text-sm font-bold text-neutral-100">
            {service.throughput_rps} rps
          </span>
          <span className="text-[9px] text-neutral-500 block">Active Conn: {service.active_connections}</span>
        </div>

        <div className="bg-[#191919] p-2.5 rounded-lg border border-[#262626]">
          <span className="text-[10px] text-neutral-500 block">
            {service.id === 'queue' ? 'Queue Depth' : (service.id === 'database' ? 'Connection Pool' : 'CPU Utilization')}
          </span>
          <span className={`text-sm font-bold ${
            (service.id === 'queue' && service.queue_depth > 500) ||
            (service.id === 'database' && service.connection_pool_pct > 80) ||
            service.cpu_utilization > 85 
              ? 'text-red-400' 
              : 'text-neutral-100'
          }`}>
            {service.id === 'queue' 
              ? `${service.queue_depth} msgs` 
              : (service.id === 'database' ? `${Math.round(service.connection_pool_pct)}%` : `${Math.round(service.cpu_utilization)}%`)}
          </span>
          <span className="text-[9px] text-neutral-500 block">Mem: {Math.round(service.memory_utilization)}%</span>
        </div>
      </div>

      {/* Latency History Sparkline */}
      <div className="bg-[#181818] border border-[#242424] rounded-lg p-3">
        <div className="flex justify-between items-center mb-1 text-[11px] font-mono text-neutral-400">
          <span>Recent Latency Trend (Last {service.history?.length || 0} ticks)</span>
          <span className="text-neutral-500">5s sample intervals</span>
        </div>
        <div className="h-16 flex items-end gap-1 pt-2">
          {service.history && service.history.map((pt, idx) => {
            const maxLat = Math.max(50, ...service.history.map(h => h.latency_ms));
            const barHeightPct = Math.max(10, Math.min(100, (pt.latency_ms / maxLat) * 100));
            const isSpike = pt.latency_ms > 300;

            return (
              <div
                key={idx}
                title={`Tick ${pt.tick}: ${pt.latency_ms}ms, Error: ${pt.error_rate}%`}
                className="flex-1 rounded-t transition-all group relative cursor-pointer"
                style={{ height: `${barHeightPct}%` }}
              >
                <div className={`w-full h-full rounded-t ${isSpike ? 'bg-red-500' : 'bg-neutral-600 group-hover:bg-neutral-400'}`} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Dependency Links */}
      <div className="grid grid-cols-2 gap-3 text-xs font-mono">
        <div className="bg-[#181818] p-2.5 rounded-lg border border-[#242424]">
          <span className="text-[10px] text-neutral-500 uppercase block mb-1">Upstream Callers:</span>
          {upstreamCallers.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {upstreamCallers.map(c => (
                <span key={c} className="bg-neutral-900 text-neutral-300 px-1.5 py-0.5 rounded border border-neutral-800 text-[10px]">
                  {c}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-neutral-600 text-[10px]">None (Ingress edge)</span>
          )}
        </div>

        <div className="bg-[#181818] p-2.5 rounded-lg border border-[#242424]">
          <span className="text-[10px] text-neutral-500 uppercase block mb-1">Downstream Dependencies:</span>
          {downstreamCallees.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {downstreamCallees.map(c => (
                <span key={c} className="bg-neutral-900 text-neutral-300 px-1.5 py-0.5 rounded border border-neutral-800 text-[10px]">
                  {c}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-neutral-600 text-[10px]">None (Terminal sink)</span>
          )}
        </div>
      </div>

      {/* Recent Service Logs */}
      <div>
        <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 block mb-1.5">
          Recent Service Logs ({serviceLogs.length})
        </span>
        <div className="bg-[#0e0e0e] border border-[#222222] rounded-lg p-2 max-h-36 overflow-y-auto font-mono text-[11px] space-y-1">
          {serviceLogs.length > 0 ? (
            serviceLogs.map((log) => {
              let lvlColor = 'text-neutral-400';
              if (log.level === 'FATAL') lvlColor = 'text-red-400 font-bold';
              else if (log.level === 'ERROR') lvlColor = 'text-red-400';
              else if (log.level === 'WARN') lvlColor = 'text-amber-300';

              return (
                <div key={log.id} className="leading-tight flex items-start gap-1.5">
                  <span className="text-neutral-600 shrink-0">T{log.tick.toString().padStart(2, '0')}</span>
                  <span className={`shrink-0 ${lvlColor}`}>[{log.level}]</span>
                  <span className="text-neutral-300 truncate">{log.message}</span>
                </div>
              );
            })
          ) : (
            <span className="text-neutral-600 text-xs">No recent logs recorded for this service.</span>
          )}
        </div>
      </div>
    </div>
  );
};
