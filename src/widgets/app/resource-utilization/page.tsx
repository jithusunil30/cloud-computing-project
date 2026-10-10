'use client';

import { useState, createElement, type CSSProperties } from 'react';
import { useWidgetSDK, useTheme } from '@nitrostack/widgets';
import { Server, AlertTriangle, TrendingUp, CheckCircle2, HelpCircle, Info } from 'lucide-react';

export const dynamic = 'force-dynamic';

type Classification = 'persistent-low' | 'usage-spike' | 'normal' | 'insufficient-data';

interface ResourceRow {
  resourceId: string;
  name: string;
  provider: string;
  region: string;
  service: string;
  resourceType: string;
  vcpu: number;
  imageUrl: string;
  observedDays: number;
  totalCostUsd: number;
  avgCpuPct: number;
  p95CpuMaxPct: number;
  avgMemPct: number;
  lowUtilDays: number;
  lowUtilShare: number;
  classification: Classification;
  estimatedWasteUsd: number;
  recommendation: string;
  evidence: string;
}

interface UtilizationData {
  period?: { startDate?: string; endDate?: string };
  region?: string;
  thresholds?: { cpuThresholdPct?: number; minObservationDays?: number; persistenceShare?: number };
  summary?: {
    resourcesAnalyzed?: number;
    persistentLowCount?: number;
    usageSpikeCount?: number;
    totalCostUsd?: number;
    estimatedWasteUsd?: number;
  };
  resources?: ResourceRow[];
  assumptions?: string[];
  provenance?: { dataset?: string; synthetic?: boolean };
}

interface ClassMeta {
  label: string;
  color: string;
  icon: typeof Server;
}

const usd = (v: number) =>
  `$${(Number.isFinite(v) ? v : 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const classMeta: Record<Classification, ClassMeta> = {
  'persistent-low': { label: 'Persistent low', color: '#f59e0b', icon: AlertTriangle },
  'usage-spike': { label: 'Usage spike', color: '#06b6d4', icon: TrendingUp },
  normal: { label: 'Normal', color: '#10b981', icon: CheckCircle2 },
  'insufficient-data': { label: 'Not enough data', color: '#94a3b8', icon: HelpCircle },
};

const metaFor = (k: Classification): ClassMeta => classMeta[k] ?? classMeta.normal;
const labelFor = (k: 'all' | Classification): string => (k === 'all' ? 'All' : metaFor(k).label);

function renderBar(value: number, color: string, track: string) {
  const pct = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return (
    <div style={{ height: 6, borderRadius: 3, background: track, overflow: 'hidden' }} role="presentation">
      <div style={{ width: `${pct}%`, height: '100%', background: color }} />
    </div>
  );
}

export default function ResourceUtilizationWidget() {
  const theme = useTheme();
  const { isReady, getToolOutput } = useWidgetSDK();
  const [filter, setFilter] = useState<'all' | Classification>('all');
  const [failedImgs, setFailedImgs] = useState<Record<string, boolean>>({});
  const data = getToolOutput<UtilizationData>();

  console.log('resource-utilization render', { isReady, hasData: !!data });

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
  const wrap: CSSProperties = { fontFamily: 'Inter, system-ui, sans-serif', background: c.bg, color: c.text, padding: 16, borderRadius: 14 };

  if (!isReady) return <div style={wrap}>Initializing…</div>;
  if (!data) return <div style={wrap}>Loading utilization analysis…</div>;
  if (!Array.isArray(data.resources)) return <div style={wrap}>Received an unexpected payload.</div>;

  const resources = data.resources ?? [];
  const s = data.summary ?? {};
  const shown = filter === 'all' ? resources : resources.filter((r) => r.classification === filter);
  const filters: Array<'all' | Classification> = ['all', 'persistent-low', 'usage-spike', 'normal', 'insufficient-data'];

  const renderThumb = (r: ResourceRow) => {
    const ok = !!r.imageUrl && !failedImgs[r.resourceId];
    return (
      <div style={{ width: 64, height: 64, flexShrink: 0, borderRadius: 10, overflow: 'hidden', background: '#1e293b', border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {ok ? (
          <img
            src={r.imageUrl}
            alt={r.name ?? ''}
            onError={() => setFailedImgs((p) => ({ ...p, [r.resourceId]: true }))}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Server size={26} color="#3B82F6" />
        )}
      </div>
    );
  };

  const renderStat = (label: string, value: string, accent?: string) => (
    <div style={{ flex: '1 1 120px', background: c.card, border: `1px solid ${c.border}`, borderRadius: 12, padding: '10px 12px' }}>
      <div style={{ fontSize: 11, color: c.muted, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: accent ?? c.text, marginTop: 2 }}>{value}</div>
    </div>
  );

  return (
    <div style={wrap}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Resource utilization</div>
          <div style={{ fontSize: 12, color: c.muted }}>
            {data.period?.startDate ?? '?'} → {data.period?.endDate ?? '?'} · region {data.region ?? 'all'} · CPU &lt; {data.thresholds?.cpuThresholdPct ?? 10}% on ≥{Math.round((data.thresholds?.persistenceShare ?? 0.9) * 100)}% of days
          </div>
        </div>
        {data.provenance?.synthetic && (
          <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 999, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontWeight: 600 }}>SYNTHETIC DATA</span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {renderStat('Resources', String(s.resourcesAnalyzed ?? resources.length))}
        {renderStat('Persistent low', String(s.persistentLowCount ?? 0), '#f59e0b')}
        {renderStat('Period cost', usd(s.totalCostUsd ?? 0))}
        {renderStat('Est. waste', usd(s.estimatedWasteUsd ?? 0), '#10b981')}
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              fontSize: 12, padding: '4px 10px', borderRadius: 999, cursor: 'pointer',
              border: `1px solid ${filter === f ? c.primary : c.border}`,
              background: filter === f ? 'rgba(59,130,246,0.15)' : 'transparent',
              color: filter === f ? c.primary : c.muted,
            }}
          >
            {labelFor(f)}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div style={{ padding: 20, textAlign: 'center', color: c.muted, border: `1px dashed ${c.border}`, borderRadius: 12 }}>No resources match this filter.</div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {shown.map((r) => {
            const meta = metaFor(r.classification);
            return (
              <div key={r.resourceId} style={{ display: 'flex', gap: 12, background: c.card, border: `1px solid ${c.border}`, borderLeft: `3px solid ${meta.color}`, borderRadius: 12, padding: 12 }}>
                {renderThumb(r)}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</div>
                      <div style={{ fontSize: 11, color: c.muted }}>{r.service} · {r.resourceType} · {r.vcpu ?? 0} vCPU · {r.resourceId}</div>
                    </div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: meta.color, height: 20 }}>
                      {createElement(meta.icon, { size: 13 })} {meta.label}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10, marginTop: 8 }}>
                    <div>
                      <div style={{ fontSize: 11, color: c.muted }}>Avg CPU {(r.avgCpuPct ?? 0).toFixed(1)}%</div>
                      {renderBar(r.avgCpuPct ?? 0, meta.color, c.track)}
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: c.muted }}>p95 peak {(r.p95CpuMaxPct ?? 0).toFixed(1)}%</div>
                      {renderBar(r.p95CpuMaxPct ?? 0, c.primary, c.track)}
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: c.muted }}>Cost</div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{usd(r.totalCostUsd ?? 0)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: c.muted }}>Est. waste</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: (r.estimatedWasteUsd ?? 0) > 0 ? '#10b981' : c.muted }}>{usd(r.estimatedWasteUsd ?? 0)}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, marginTop: 8 }}>{r.recommendation}</div>
                  <div style={{ fontSize: 11, color: c.muted, marginTop: 2 }}>Evidence: {r.evidence}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(data.assumptions ?? []).length > 0 && (
        <details style={{ marginTop: 12, fontSize: 11, color: c.muted }}>
          <summary style={{ cursor: 'pointer' }}><Info size={12} /> Assumptions &amp; provenance</summary>
          <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
            {(data.assumptions ?? []).map((a, i) => <li key={i}>{a}</li>)}
            {data.provenance?.dataset && <li>{data.provenance.dataset}</li>}
          </ul>
        </details>
      )}
    </div>
  );
}
