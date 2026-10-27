import React, { useState } from 'react';
import { X, Flame, AlertTriangle, Sliders } from 'lucide-react';

interface CustomFaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInject: (targetService: string, faultType: string, intensity: number) => void;
}

export const CustomFaultModal: React.FC<CustomFaultModalProps> = ({
  isOpen,
  onClose,
  onInject
}) => {
  const [targetService, setTargetService] = useState<string>('database');
  const [faultType, setFaultType] = useState<string>('database_slowdown');
  const [intensity, setIntensity] = useState<number>(1.0);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onInject(targetService, faultType, intensity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#141414] border border-[#2d2d2d] rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-red-950/80 border border-red-500/50 text-red-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Custom Failure Injection</h3>
            <p className="text-xs text-neutral-400">Inject controlled synthetic faults into service mesh</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          {/* Target Service */}
          <div>
            <label className="text-neutral-400 uppercase text-[10px] block mb-1.5 font-bold">
              Target Microservice
            </label>
            <select
              value={targetService}
              onChange={(e) => setTargetService(e.target.value)}
              className="w-full bg-[#1b1b1b] border border-[#2e2e2e] rounded-lg p-2.5 text-white focus:outline-none focus:border-red-500 cursor-pointer"
            >
              <option value="database">Primary Database (Storage Tier)</option>
              <option value="orders">Order Service (Application Tier)</option>
              <option value="payments">Payment Service (Application Tier)</option>
              <option value="queue">Message Broker (Messaging Tier)</option>
              <option value="gateway">API Gateway (Ingress Tier)</option>
              <option value="notifications">Notification Worker (Async Tier)</option>
            </select>
          </div>

          {/* Fault Type */}
          <div>
            <label className="text-neutral-400 uppercase text-[10px] block mb-1.5 font-bold">
              Fault Type
            </label>
            <select
              value={faultType}
              onChange={(e) => setFaultType(e.target.value)}
              className="w-full bg-[#1b1b1b] border border-[#2e2e2e] rounded-lg p-2.5 text-white focus:outline-none focus:border-red-500 cursor-pointer"
            >
              <option value="database_slowdown">Database Slowdown (Lock Contention & Pool Saturation)</option>
              <option value="queue_overload">Queue Buffer Overload (Consumer Lag & Backlog)</option>
              <option value="payments_crash">Process SIGSEGV Crash Loop (5xx Outage)</option>
              <option value="traffic_spike">500% Ingress Traffic Surge (Thread Starvation)</option>
            </select>
          </div>

          {/* Intensity */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-neutral-400 uppercase text-[10px] font-bold">
                Fault Intensity / Scale
              </label>
              <span className="text-red-400 font-bold">{intensity}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={intensity}
              onChange={(e) => setIntensity(parseFloat(e.target.value))}
              className="w-full accent-red-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-neutral-600">
              <span>0.5x (Mild)</span>
              <span>1.0x (Standard)</span>
              <span>2.0x (Catastrophic)</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-red-950/50"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Inject Fault</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
