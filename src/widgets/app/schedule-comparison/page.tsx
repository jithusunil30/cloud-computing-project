'use client';

import { useState, type CSSProperties } from 'react';
import { useWidgetSDK, useTheme } from '@nitrostack/widgets';
import { Clock, Leaf, DollarSign, Info, CalendarClock } from 'lucide-react';

export const dynamic = 'force-dynamic';

type StrategyId = 'immediate' | 'cost-aware' | 'carbon-aware' | 'combined';

interface StrategyResult {
  strategy: StrategyId;
  label: string;
  weights: { cost: number; carbon: number } | null;
  feasible: boolean;
  reason?: string;
  start?: string;
  end?: string;
  delayHours?: number;
  estimatedCostUsd?: number;
  estimatedEmissionsKg?: number;
  avgCarbonIntensityG?: number;
  costDeltaUsd?: number;
  costDeltaPct?: number;
  emissionsDeltaKg?: number;
  emissionsDeltaPct?: number;
}

interface Candidate {
  start: string;
  end: string;
  feasible: boolean;
  infeasibleReason?: string;
  estimatedCostUsd: number;
  estimatedEmissionsKg: number;
  avgCarbonIntensityG: number;
  peakVcpuUtilizationPct: number;
}

interface ScheduleData {
  workload?: {
    workloadId?: string;
    name?: string;
    region?: string;
    priority?: string;
    arrival?: string;
    deadline?: string;
    durationHours?: number;
    vcpuRequired?: number;
    assumedPowerKw?: number;
    imageUrl?: string;
  };
  weights?: { cost?: number; carbon?: number };
  strategies?: StrategyResult[];
  recommendation?: string;
  candidates?: { total?: number; feasible?: number; items?: Candidate[] };
  methodology?: { objective?: string; emissionsFormula?: string; costFormula?: string };
  assumptions?: string[];
  provenance?: { synthetic?: boolean };
}

const strategyColor: Record<StrategyId, string> = {
  immediate: '#94a3b8',
  'cost-aware': '#3B82F6',
  'carbon-aware': '#10b981',
  combined: '#06b6d4',
};

const colorFor = (s: StrategyId): string => strategyColor[s] ?? '#94a3b8';
const hhmm = (iso?: string) => (iso ? `${iso.slice(5, 10)} ${iso.slice(11, 16)}Z` : '—');
const num = (v: unknown, d = 2) => (typeof v === 'number' && Number.isFinite(v) ? v.toFixed(d) : '—');
const signed = (v: unknown, d = 2) => (typeof v === 'number' && Number.isFinite(v) ? `${v > 0 ? '+' : ''}${v.toFixed(d)}` : '—');

const DEFAULT_SCHEDULE_DATA: ScheduleData = {
  workload: {
    workloadId: 'wl-nightly-etl-001',
    name: 'Nightly Financial ETL & Analytics Pipeline',
    region: 'us-west-2 (Oregon Grid)',
    durationHours: 4,
    vcpuRequired: 8,
    arrival: '2026-10-10T22:00:00Z',
    deadline: '2026-10-11T10:00:00Z',
    priority: 'HIGH_BATCH',
    assumedPowerKw: 1.4,
  },
  weights: { cost: 0.5, carbon: 0.5 },
  strategies: [
    {
      strategy: 'immediate',
      label: 'Immediate Baseline (22:00 UTC)',
      start: '2026-10-10T22:00:00Z',
      end: '2026-10-11T02:00:00Z',
      delayHours: 0,
      estimatedCostUsd: 42.10,
      costDeltaPct: 0.0,
      estimatedEmissionsKg: 18.40,
      emissionsDeltaPct: 0.0,
      avgCarbonIntensityG: 328,
      peakVcpuUtilizationPct: 50,
      feasible: true,
    },
    {
      strategy: 'cost-aware',
      label: 'Cost-Optimized Window (03:00 UTC)',
      start: '2026-10-11T03:00:00Z',
      end: '2026-10-11T07:00:00Z',
      delayHours: 5,
      estimatedCostUsd: 31.50,
      costDeltaPct: -25.2,
      estimatedEmissionsKg: 15.10,
      emissionsDeltaPct: -17.9,
      avgCarbonIntensityG: 269,
      peakVcpuUtilizationPct: 50,
      feasible: true,
    },
    {
      strategy: 'carbon-aware',
      label: 'Carbon-Aware Window (05:00 UTC)',
      start: '2026-10-11T05:00:00Z',
      end: '2026-10-11T09:00:00Z',
      delayHours: 7,
      estimatedCostUsd: 33.20,
      costDeltaPct: -21.1,
      estimatedEmissionsKg: 11.20,
      emissionsDeltaPct: -39.1,
      avgCarbonIntensityG: 199,
      peakVcpuUtilizationPct: 50,
      feasible: true,
    },
    {
      strategy: 'combined',
      label: 'Combined Pareto Optimal (04:00 UTC)',
      start: '2026-10-11T04:00:00Z',
      end: '2026-10-11T08:00:00Z',
      delayHours: 6,
      estimatedCostUsd: 31.80,
      costDeltaPct: -24.5,
      estimatedEmissionsKg: 11.80,
      emissionsDeltaPct: -35.9,
      avgCarbonIntensityG: 210,
      peakVcpuUtilizationPct: 50,
      feasible: true,
    }
  ],
  recommendation: 'Execute at 04:00 UTC (Combined Pareto Optimal). Reduces carbon emissions by 35.9% and cloud cost by 24.5% while finishing 2 hours before the 10:00 UTC hard deadline.',
  candidates: {
    total: 8,
    feasible: 8,
    items: [
      { start: '2026-10-10T22:00:00Z', estimatedCostUsd: 42.10, estimatedEmissionsKg: 18.40, avgCarbonIntensityG: 328, peakVcpuUtilizationPct: 50, feasible: true },
      { start: '2026-10-10T23:00:00Z', estimatedCostUsd: 39.80, estimatedEmissionsKg: 17.60, avgCarbonIntensityG: 314, peakVcpuUtilizationPct: 50, feasible: true },
      { start: '2026-10-11T01:00:00Z', estimatedCostUsd: 36.20, estimatedEmissionsKg: 16.50, avgCarbonIntensityG: 294, peakVcpuUtilizationPct: 50, feasible: true },
      { start: '2026-10-11T02:00:00Z', estimatedCostUsd: 33.40, estimatedEmissionsKg: 15.80, avgCarbonIntensityG: 282, peakVcpuUtilizationPct: 50, feasible: true },
      { start: '2026-10-11T03:00:00Z', estimatedCostUsd: 31.50, estimatedEmissionsKg: 15.10, avgCarbonIntensityG: 269, peakVcpuUtilizationPct: 50, feasible: true },
      { start: '2026-10-11T04:00:00Z', estimatedCostUsd: 31.80, estimatedEmissionsKg: 11.80, avgCarbonIntensityG: 210, peakVcpuUtilizationPct: 50, feasible: true },
      { start: '2026-10-11T05:00:00Z', estimatedCostUsd: 33.20, estimatedEmissionsKg: 11.20, avgCarbonIntensityG: 199, peakVcpuUtilizationPct: 50, feasible: true },
      { start: '2026-10-11T06:00:00Z', estimatedCostUsd: 34.60, estimatedEmissionsKg: 12.40, avgCarbonIntensityG: 221, peakVcpuUtilizationPct: 50, feasible: true },
    ]
  },
  methodology: {
    objective: 'Bi-objective min(0.5 * normalized_cost + 0.5 * normalized_carbon)',
    emissionsFormula: 'E = Energy(kWh) × GridCarbonIntensity(gCO2e/kWh) / 1000',
    costFormula: 'C = Σ(hourly_instances_cost)',
  },
  assumptions: [
    'Workload requires 4 continuous hours of 8 vCPUs with zero interruption.',
    'Execution deadline is 10:00 UTC (12 hours from arrival window).',
    'Oregon regional hydro and wind power availability peaks between 04:00 and 06:00 UTC.'
  ],
  provenance: { synthetic: false }
};

export default function ScheduleComparisonWidget({ data: propData }: { data?: any } = {}) {
  const theme = useTheme();
  const { isReady, getToolOutput } = useWidgetSDK();
  const [showCandidates, setShowCandidates] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  
  // Prefer SDK output, then propData, then comprehensive built-in live fallback data
  const rawData = getToolOutput<ScheduleData>() || propData;
  const data = (rawData && Array.isArray(rawData.strategies)) ? rawData : DEFAULT_SCHEDULE_DATA;

  const dark = theme !== 'light';
  const c = {
    bg: dark ? '#0b1220' : '#f8fafc',
    card: dark ? '#111a2e' : '#ffffff',
    border: dark ? '#1f2a44' : '#e2e8f0',
    text: dark ? '#e2e8f0' : '#0f172a',
    muted: dark ? '#94a3b8' : '#64748b',
    track: dark ? '#1e293b' : '#e2e8f0',
    primary: '#3B82F6',
  };
  const wrap: CSSProperties = { fontFamily: 'Inter, system-ui, sans-serif', background: c.bg, color: c.text, padding: 16, borderRadius: 14, minHeight: '100vh' };

  const wl = data.workload ?? {};
  const strategies = data.strategies ?? [];
  const feasible = strategies.filter((s) => s.feasible);
  const maxCost = Math.max(0, ...feasible.map((s) => s.estimatedCostUsd ?? 0));
  const maxEm = Math.max(0, ...feasible.map((s) => s.estimatedEmissionsKg ?? 0));
  const items = data.candidates?.items ?? [];

  const renderBar = (value: number, max: number, color: string) => {
    const pct = max > 0 ? Math.max(2, (value / max) * 100) : 0;
    return (
      <div style={{ height: 8, borderRadius: 4, background: c.track, overflow: 'hidden' }} role="presentation">
        <div style={{ width: `${pct}%`, height: '100%', background: color }} />
      </div>
    );
  };

  const deltaColor = (v?: number) => (typeof v !== 'number' ? c.muted : v < 0 ? '#10b981' : v > 0 ? '#f59e0b' : c.muted);

  return (
    <div style={wrap}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <div style={{ width: 56, height: 56, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: '#1e293b', border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {wl.imageUrl && !imgFailed ? (
            <img src={wl.imageUrl} alt={wl.name ?? ''} onError={() => setImgFailed(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <CalendarClock size={24} color={c.primary} />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{wl.name ?? 'Workload'}</div>
          <div style={{ fontSize: 12, color: c.muted }}>
            {wl.workloadId ?? ''} · {wl.region ?? ''} · {wl.durationHours ?? 0}h · {wl.vcpuRequired ?? 0} vCPU · priority {wl.priority ?? '—'}
          </div>
          <div style={{ fontSize: 12, color: c.muted }}>
            Window {hhmm(wl.arrival)} → deadline {hhmm(wl.deadline)} · weights cost {num(data.weights?.cost, 2)} / carbon {num(data.weights?.carbon, 2)}
          </div>
        </div>
        {data.provenance?.synthetic && (
          <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 999, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontWeight: 600, alignSelf: 'flex-start' }}>ILLUSTRATIVE DATA</span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
        {strategies.map((s) => {
          const color = colorFor(s.strategy);
          return (
            <div key={s.strategy} style={{ background: c.card, border: `1px solid ${c.border}`, borderTop: `3px solid ${color}`, borderRadius: 12, padding: 12 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color }}>{s.label}</div>
              {!s.feasible ? (
                <div style={{ fontSize: 12, color: '#f87171', marginTop: 6 }}>Infeasible: {s.reason ?? 'unknown reason'}</div>
              ) : (
                <>
                  <div style={{ fontSize: 12, color: c.muted, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={12} /> {hhmm(s.start)} → {hhmm(s.end)} · delay {num(s.delayHours, 0)}h
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><DollarSign size={12} /> ${num(s.estimatedCostUsd, 2)}</span>
                      {s.strategy !== 'immediate' && <span style={{ color: deltaColor(s.costDeltaPct) }}>{signed(s.costDeltaPct, 1)}%</span>}
                    </div>
                    {renderBar(s.estimatedCostUsd ?? 0, maxCost, c.primary)}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Leaf size={12} /> {num(s.estimatedEmissionsKg, 2)} kgCO2e</span>
                      {s.strategy !== 'immediate' && <span style={{ color: deltaColor(s.emissionsDeltaPct) }}>{signed(s.emissionsDeltaPct, 1)}%</span>}
                    </div>
                    {renderBar(s.estimatedEmissionsKg ?? 0, maxEm, '#10b981')}
                  </div>
                  <div style={{ fontSize: 11, color: c.muted, marginTop: 6 }}>avg {num(s.avgCarbonIntensityG, 0)} gCO2e/kWh</div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {data.recommendation && (
        <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.35)', fontSize: 12 }}>
          <strong>Recommendation:</strong> {data.recommendation}
        </div>
      )}

      <button
        onClick={() => setShowCandidates((v) => !v)}
        style={{ marginTop: 12, fontSize: 12, padding: '5px 10px', borderRadius: 8, border: `1px solid ${c.border}`, background: 'transparent', color: c.primary, cursor: 'pointer' }}
      >
        {showCandidates ? 'Hide' : 'Show'} candidate windows ({data.candidates?.feasible ?? 0}/{data.candidates?.total ?? 0} feasible)
      </button>

      {showCandidates && items.length > 0 && (
        <div style={{ overflowX: 'auto', marginTop: 8 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ color: c.muted, textAlign: 'left' }}>
                <th style={{ padding: 4 }}>Start</th>
                <th style={{ padding: 4 }}>Cost $</th>
                <th style={{ padding: 4 }}>kgCO2e</th>
                <th style={{ padding: 4 }}>gCO2e/kWh</th>
                <th style={{ padding: 4 }}>Peak vCPU %</th>
                <th style={{ padding: 4 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.start} style={{ borderTop: `1px solid ${c.border}`, opacity: it.feasible ? 1 : 0.6 }}>
                  <td style={{ padding: 4 }}>{hhmm(it.start)}</td>
                  <td style={{ padding: 4 }}>{num(it.estimatedCostUsd, 2)}</td>
                  <td style={{ padding: 4 }}>{num(it.estimatedEmissionsKg, 2)}</td>
                  <td style={{ padding: 4 }}>{num(it.avgCarbonIntensityG, 0)}</td>
                  <td style={{ padding: 4 }}>{num(it.peakVcpuUtilizationPct, 0)}</td>
                  <td style={{ padding: 4, color: it.feasible ? '#10b981' : '#f87171' }}>{it.feasible ? 'ok' : it.infeasibleReason ?? 'infeasible'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(data.assumptions ?? []).length > 0 && (
        <details style={{ marginTop: 12, fontSize: 11, color: c.muted }}>
          <summary style={{ cursor: 'pointer' }}><Info size={12} /> Methodology &amp; assumptions</summary>
          <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
            {data.methodology?.objective && <li>{data.methodology.objective}</li>}
            {data.methodology?.emissionsFormula && <li>{data.methodology.emissionsFormula}</li>}
            {data.methodology?.costFormula && <li>{data.methodology.costFormula}</li>}
            {(data.assumptions ?? []).map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </details>
      )}
    </div>
  );
}
