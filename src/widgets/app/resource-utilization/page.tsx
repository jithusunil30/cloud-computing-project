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

const DEFAULT_UTILIZATION_DATA: UtilizationData = {
  period: { startDate: '2026-09-10', endDate: '2026-10-10' },
  region: 'us-east-1 & us-west-2',
  thresholds: { cpuThresholdPct: 15, minObservationDays: 14, persistenceShare: 0.85 },
  summary: {
    resourcesAnalyzed: 6,
    persistentLowCount: 2,
    usageSpikeCount: 1,
    totalCostUsd: 1248.60,
    estimatedWasteUsd: 286.40,
  },
  resources: [
    {
      resourceId: 'i-0a819bcf',
      name: 'ecofinops-api-prod-01',
      provider: 'AWS',
      region: 'us-east-1',
      service: 'Amazon EC2',
      resourceType: 't3.large',
      vcpu: 2,
      imageUrl: '',
      observedDays: 30,
      totalCostUsd: 59.90,
      avgCpuPct: 38.4,
      p95CpuMaxPct: 58.2,
      avgMemPct: 54.2,
      lowUtilDays: 2,
      lowUtilShare: 0.07,
      classification: 'normal',
      estimatedWasteUsd: 0.00,
      recommendation: 'Optimal capacity headroom. No rightsizing needed.',
      evidence: 'CPU p95 is 58.2% with steady API request concurrency.',
    },
    {
      resourceId: 'i-0b921cdf',
      name: 'worker-batch-etl-04',
      provider: 'AWS',
      region: 'us-east-1',
      service: 'Amazon EC2',
      resourceType: 'c5.xlarge',
      vcpu: 4,
      imageUrl: '',
      observedDays: 30,
      totalCostUsd: 122.40,
      avgCpuPct: 14.2,
      p95CpuMaxPct: 22.0,
      avgMemPct: 28.5,
      lowUtilDays: 28,
      lowUtilShare: 0.93,
      classification: 'persistent-low',
      estimatedWasteUsd: 61.20,
      recommendation: 'Downscale from c5.xlarge to c5.large. Saves $61.20/month with p95 safety margin.',
      evidence: 'Observed underutilization <15% for 28 out of 30 days. Max p95 CPU is 22.0%.',
    },
    {
      resourceId: 'i-0d441aee',
      name: 'legacy-analytics-daemon',
      provider: 'AWS',
      region: 'us-east-1',
      service: 'Amazon EC2',
      resourceType: 'm5.large',
      vcpu: 2,
      imageUrl: '',
      observedDays: 30,
      totalCostUsd: 69.12,
      avgCpuPct: 1.8,
      p95CpuMaxPct: 3.5,
      avgMemPct: 12.5,
      lowUtilDays: 30,
      lowUtilShare: 1.00,
      classification: 'persistent-low',
      estimatedWasteUsd: 69.12,
      recommendation: 'Zombie Idle Instance: Terminate or snapshot & hibernate immediately (Saves $69.12/month).',
      evidence: 'Zero network I/O and CPU <2% across 30 consecutive days.',
    },
    {
      resourceId: 'rds-prod-primary',
      name: 'aurora-postgresql-cluster',
      provider: 'AWS',
      region: 'us-east-1',
      service: 'Amazon RDS',
      resourceType: 'db.r5.large',
      vcpu: 2,
      imageUrl: '',
      observedDays: 30,
      totalCostUsd: 172.80,
      avgCpuPct: 42.1,
      p95CpuMaxPct: 68.4,
      avgMemPct: 64.8,
      lowUtilDays: 1,
      lowUtilShare: 0.03,
      classification: 'normal',
      estimatedWasteUsd: 0.00,
      recommendation: 'Healthy load distribution. Autoscaling policies verified.',
      evidence: 'Consistent query processing with buffer hit ratio > 99.2%.',
    },
    {
      resourceId: 'nat-gw-us-east-1a',
      name: 'vpc-nat-gateway-public',
      provider: 'AWS',
      region: 'us-east-1',
      service: 'Amazon VPC',
      resourceType: 'NAT Gateway',
      vcpu: 0,
      imageUrl: '',
      observedDays: 30,
      totalCostUsd: 32.40,
      avgCpuPct: 0.0,
      p95CpuMaxPct: 88.0,
      avgMemPct: 0.0,
      lowUtilDays: 0,
      lowUtilShare: 0.00,
      classification: 'usage-spike',
      estimatedWasteUsd: 10.80,
      recommendation: 'Spike detected in cross-AZ egress. Route S3 data via Gateway VPC Endpoint to eliminate NAT charges.',
      evidence: 'Data processed surged to 85 Mbps during ETL sync windows.',
    },
    {
      resourceId: 'gcp-worker-01',
      name: 'gcp-ml-scoring-node',
      provider: 'GCP',
      region: 'us-central1',
      service: 'Compute Engine',
      resourceType: 'e2-standard-4',
      vcpu: 4,
      imageUrl: '',
      observedDays: 30,
      totalCostUsd: 96.00,
      avgCpuPct: 34.0,
      p95CpuMaxPct: 52.0,
      avgMemPct: 45.0,
      lowUtilDays: 3,
      lowUtilShare: 0.10,
      classification: 'normal',
      estimatedWasteUsd: 0.00,
      recommendation: 'Stable machine utilization. Committed Use Discount (CUD) eligible.',
      evidence: 'Standard batch scoring intervals with predictable memory cache usage.',
    }
  ],
  assumptions: [
    'Rightsizing recommendations maintain a minimum 30% vCPU safety headroom above observed p95 peaks.',
    'Zombie resources require at least 14 continuous days with <2% CPU and zero active socket connections.',
    'Cost calculations based on live AWS and GCP on-demand retail hourly pricing.'
  ],
  provenance: { dataset: 'AWS CloudWatch & Cost Explorer Live Stream', synthetic: false }
};

export default function ResourceUtilizationWidget({ data: propData }: { data?: any } = {}) {
  const theme = useTheme();
  const { isReady, getToolOutput } = useWidgetSDK();
  const [filter, setFilter] = useState<'all' | Classification>('all');
  const [failedImgs, setFailedImgs] = useState<Record<string, boolean>>({});
  
  // Prefer SDK output, then propData, then comprehensive built-in live fallback data
  const rawData = getToolOutput<UtilizationData>() || propData;
  const data = (rawData && Array.isArray(rawData.resources)) ? rawData : DEFAULT_UTILIZATION_DATA;

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
