import React from 'react';
import { 
  Server, 
  Database, 
  Layers, 
  Radio, 
  Send, 
  Globe, 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { ServiceState, ServiceStatus, VisualLabel } from '../types';

interface DependencyGraphProps {
  services: Record<string, ServiceState>;
  selectedServiceId: string | null;
  onSelectService: (serviceId: string) => void;
  cascadeOriginId: string | null;
  predictedServiceIds: string[];
}

interface NodeLayout {
  id: string;
  name: string;
  tier: string;
  x: number;
  y: number;
  icon: React.ReactNode;
}

const LAYOUT: NodeLayout[] = [
  { id: 'gateway', name: 'API Gateway', tier: 'INGRESS', x: 440, y: 45, icon: <Globe className="w-4 h-4" /> },
  { id: 'orders', name: 'Order Service', tier: 'APPLICATION', x: 230, y: 180, icon: <Layers className="w-4 h-4" /> },
  { id: 'payments', name: 'Payment Service', tier: 'APPLICATION', x: 650, y: 180, icon: <Server className="w-4 h-4" /> },
  { id: 'database', name: 'Primary Database', tier: 'STORAGE', x: 440, y: 320, icon: <Database className="w-4 h-4" /> },
  { id: 'queue', name: 'Message Broker', tier: 'MESSAGING', x: 120, y: 320, icon: <Radio className="w-4 h-4" /> },
  { id: 'notifications', name: 'Notification Worker', tier: 'ASYNC_WORKER', x: 120, y: 460, icon: <Send className="w-4 h-4" /> },
];

const EDGES = [
  { from: 'gateway', to: 'orders', label: 'HTTP / Sync' },
  { from: 'gateway', to: 'payments', label: 'HTTP / Sync' },
  { from: 'orders', to: 'database', label: 'Postgres / Sync' },
  { from: 'orders', to: 'queue', label: 'Async Publish' },
  { from: 'payments', to: 'database', label: 'Postgres / Sync' },
  { from: 'queue', to: 'notifications', label: 'AMQP / Consumer' },
];

export const DependencyGraph: React.FC<DependencyGraphProps> = ({
  services,
  selectedServiceId,
  onSelectService,
  cascadeOriginId,
  predictedServiceIds
}) => {
  const getNode = (id: string) => LAYOUT.find(n => n.id === id);

  return (
    <div className="relative w-full h-[540px] bg-[#0c0c0c] border border-[#222222] rounded-xl overflow-hidden select-none p-4 shadow-inner">
      {/* Background Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Graph Header / Legend */}
      <div className="absolute top-3 left-4 right-4 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#A3A3A3]">
            Service Topology & Propagation Graph
          </span>
          <span className="text-[10px] text-neutral-500 font-mono">
            (6 monitored nodes · 6 directed dependency edges)
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 bg-[#141414]/90 border border-[#262626] rounded-lg px-2.5 py-1 text-[10px] font-mono">
          <div className="flex items-center gap-1.5 text-red-400">
            <span className="w-2 h-2 rounded-full bg-red-500 shadow-sm shadow-red-500 animate-pulse" />
            <span>Observed Fault</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Predicted At-Risk</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Healthy / Monitored</span>
          </div>
          <div className="flex items-center gap-1.5 text-cyan-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Recovered</span>
          </div>
        </div>
      </div>

      {/* SVG Dependency Edges */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <linearGradient id="edge-gradient-healthy" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#262626" />
            <stop offset="100%" stopColor="#333333" />
          </linearGradient>

          <linearGradient id="edge-gradient-cascade" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="50%" stopColor="#F87171" />
            <stop offset="100%" stopColor="#EF4444" />
          </linearGradient>

          <filter id="glow-crimson" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#EF4444" floodOpacity="0.8" />
          </filter>
        </defs>

        {EDGES.map((edge, idx) => {
          const fromNode = getNode(edge.from);
          const toNode = getNode(edge.to);
          if (!fromNode || !toNode) return null;

          // Node centers
          const x1 = fromNode.x + 100;
          const y1 = fromNode.y + 40;
          const x2 = toNode.x + 100;
          const y2 = toNode.y + 40;

          // Check if this edge is on active cascading failure path
          const isFailing = 
            (cascadeOriginId === edge.to && predictedServiceIds.includes(edge.from)) ||
            (services[edge.to]?.status === 'CRITICAL' && services[edge.from]?.status !== 'HEALTHY') ||
            (cascadeOriginId === 'database' && (edge.to === 'database' || (edge.from === 'gateway' && ['orders', 'payments'].includes(edge.to))));

          // Bezier control curvature
          const midY = (y1 + y2) / 2;
          const pathD = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;

          return (
            <g key={`edge-${idx}`}>
              {/* Background Path Line */}
              <path
                d={pathD}
                fill="none"
                stroke={isFailing ? "url(#edge-gradient-cascade)" : "#222222"}
                strokeWidth={isFailing ? 2.5 : 1.5}
                strokeDasharray={isFailing ? "6,4" : "4,4"}
                className={isFailing ? "animate-pulse" : ""}
                filter={isFailing ? "url(#glow-crimson)" : undefined}
              />

              {/* Animated particle pulse for active cascades */}
              {isFailing && (
                <circle r="3.5" fill="#EF4444">
                  <animateMotion
                    path={pathD}
                    dur="1.8s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
            </g>
          );
        })}
      </svg>

      {/* Service Nodes */}
      {LAYOUT.map((node) => {
        const s = services[node.id] || {
          status: 'HEALTHY',
          visual_label: 'Healthy',
          latency_ms: 20,
          error_rate: 0.02,
          connection_pool_pct: 18,
          queue_depth: 45
        };

        const isSelected = selectedServiceId === node.id;
        const isRootCause = cascadeOriginId === node.id && s.status !== 'HEALTHY';
        const isPredicted = predictedServiceIds.includes(node.id) && s.status !== 'CRITICAL' && !isRootCause;
        const isCritical = s.status === 'CRITICAL';
        const isRecovered = s.status === 'RECOVERED';

        // Border & glow styling
        let borderClass = 'border-[#262626] bg-[#141414] hover:border-[#383838]';
        let badgeColor = 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40';

        if (isRootCause) {
          borderClass = 'border-red-500 bg-[#1e0d0d] shadow-lg shadow-red-950/70 ring-2 ring-red-500/40';
          badgeColor = 'text-red-300 bg-red-950/80 border-red-500/60 animate-pulse';
        } else if (isCritical) {
          borderClass = 'border-red-500/80 bg-[#1a0f0f] shadow-md shadow-red-950/50';
          badgeColor = 'text-red-400 bg-red-950/60 border-red-800/50';
        } else if (isPredicted) {
          borderClass = 'border-amber-500/70 bg-[#19150d] ring-1 ring-amber-500/30';
          badgeColor = 'text-amber-300 bg-amber-950/70 border-amber-500/50';
        } else if (isRecovered) {
          borderClass = 'border-cyan-500/60 bg-[#0c1619] shadow-md shadow-cyan-950/30';
          badgeColor = 'text-cyan-300 bg-cyan-950/60 border-cyan-500/50';
        }

        if (isSelected) {
          borderClass += ' ring-2 ring-blue-500';
        }

        return (
          <div
            key={node.id}
            onClick={() => onSelectService(node.id)}
            style={{ left: `${node.x}px`, top: `${node.y}px` }}
            className={`absolute w-[205px] rounded-xl border p-2.5 cursor-pointer transition-all duration-200 z-20 ${borderClass}`}
          >
            {/* Top Node Bar: Name & Icon */}
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-[#A3A3A3]">{node.icon}</span>
                <span className="font-semibold text-xs text-[#F5F5F5] truncate">{node.name}</span>
              </div>
              <span className="text-[9px] font-mono text-neutral-400 bg-neutral-900 px-1 py-0.5 rounded border border-neutral-800">
                {node.tier}
              </span>
            </div>

            {/* Status Pill Badge */}
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border flex items-center gap-1 ${badgeColor}`}>
                {isRootCause && <ShieldAlert className="w-3 h-3 text-red-400" />}
                {isPredicted && <Clock className="w-3 h-3 text-amber-400" />}
                {isRecovered && <Sparkles className="w-3 h-3 text-cyan-400" />}
                {!isRootCause && !isPredicted && !isRecovered && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                <span>
                  {isRootCause 
                    ? "Probable Root Cause" 
                    : (isPredicted 
                        ? "Predicted At-Risk" 
                        : (isRecovered ? "Recovered / Protected" : s.visual_label || s.status))}
                </span>
              </span>
            </div>

            {/* Telemetry Micro-Metrics Row */}
            <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-[#222222]/80 text-[11px] font-mono">
              <div>
                <span className="text-[10px] text-neutral-500 block leading-tight">Latency</span>
                <span className={`font-semibold ${s.latency_ms > 300 ? 'text-red-400' : 'text-neutral-200'}`}>
                  {Math.round(s.latency_ms)}ms
                </span>
              </div>

              <div>
                <span className="text-[10px] text-neutral-500 block leading-tight">
                  {node.id === 'queue' ? 'Backlog' : 'Errors'}
                </span>
                <span className={`font-semibold ${
                  (node.id === 'queue' && s.queue_depth > 500) || s.error_rate > 2.0 
                    ? 'text-red-400' 
                    : 'text-neutral-200'
                }`}>
                  {node.id === 'queue' ? `${s.queue_depth || 0} msgs` : `${s.error_rate.toFixed(1)}%`}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
