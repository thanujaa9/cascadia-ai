import { CascadiaState, CounterfactualComparison, EvaluationBenchmark } from '../types';

const API_BASE = '/api';

export async function getState(): Promise<CascadiaState> {
  const res = await fetch(`${API_BASE}/state`);
  if (!res.ok) throw new Error('Failed to fetch state');
  return res.json();
}

export async function stepSimulation(): Promise<CascadiaState> {
  const res = await fetch(`${API_BASE}/step`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to step simulation');
  return res.json();
}

export async function resetSimulation(): Promise<CascadiaState> {
  const res = await fetch(`${API_BASE}/reset`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset simulation');
  return res.json();
}

export async function setScenario(scenario: string): Promise<CascadiaState> {
  const res = await fetch(`${API_BASE}/scenario`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario }),
  });
  if (!res.ok) throw new Error('Failed to set scenario');
  return res.json();
}

export async function injectCustomFault(target_service: string, fault_type: string, intensity: number): Promise<CascadiaState> {
  const res = await fetch(`${API_BASE}/fault/custom`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target_service, fault_type, intensity }),
  });
  if (!res.ok) throw new Error('Failed to inject custom fault');
  return res.json();
}

export async function applyRecovery(strategy_id: string): Promise<CascadiaState> {
  const res = await fetch(`${API_BASE}/recovery/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ strategy_id }),
  });
  if (!res.ok) throw new Error('Failed to apply recovery');
  return res.json();
}

export async function rollbackRecovery(): Promise<CascadiaState> {
  const res = await fetch(`${API_BASE}/recovery/rollback`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to rollback recovery');
  return res.json();
}

export async function getComparison(strategy_id?: string): Promise<CounterfactualComparison> {
  const url = strategy_id ? `${API_BASE}/recovery/compare?strategy_id=${encodeURIComponent(strategy_id)}` : `${API_BASE}/recovery/compare`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch comparison');
  return res.json();
}

export async function getBenchmark(): Promise<EvaluationBenchmark> {
  const res = await fetch(`${API_BASE}/evaluate`);
  if (!res.ok) throw new Error('Failed to run benchmark');
  return res.json();
}

export async function getMarkdownReport(): Promise<string> {
  const res = await fetch(`${API_BASE}/report/markdown`);
  if (!res.ok) throw new Error('Failed to fetch report');
  return res.text();
}

export async function saveIncident(): Promise<{ status: string; incident_id: string }> {
  const res = await fetch(`${API_BASE}/incidents/save`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to save incident');
  return res.json();
}

export async function askAssistant(query: string): Promise<{ query: string; answer: string; timestamp: string }> {
  const res = await fetch(`${API_BASE}/assistant/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error('Failed to query assistant');
  return res.json();
}
