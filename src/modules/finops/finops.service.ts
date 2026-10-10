import { Injectable } from '@nitrostack/core';
import { RESOURCES, DATASET_COVERAGE, DATASET_LABEL } from '../../data/resources.fixture.js';
import { getUsageSamples, DailyUsageSample } from '../../data/usage.generator.js';

export interface UtilizationQuery {
  startDate: string;
  endDate: string;
  region?: string;
  cpuThresholdPct: number;
  minObservationDays: number;
  persistenceShare: number;
  limit: number;
  offset: number;
}

export type UtilizationClass = 'persistent-low' | 'usage-spike' | 'normal' | 'insufficient-data';

export interface ResourceUtilization {
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
  classification: UtilizationClass;
  estimatedWasteUsd: number;
  recommendation: string;
  evidence: string;
}

const RIGHTSIZE_PEAK_LIMIT_PCT = 40;
const SPIKE_RATIO = 1.5;

const round = (v: number, d = 2) => Math.round(v * 10 ** d) / 10 ** d;

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const idx = Math.min(s.length - 1, Math.max(0, Math.ceil((p / 100) * s.length) - 1));
  return s[idx];
}

const mean = (v: number[]) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0);

@Injectable()
export class FinopsService {
  analyzeUtilization(q: UtilizationQuery) {
    if (q.startDate > q.endDate) {
      throw new Error(`startDate (${q.startDate}) must be on or before endDate (${q.endDate}).`);
    }
    const regionFilter = q.region?.trim().toLowerCase();
    const knownRegions = [...new Set(RESOURCES.map((r) => r.region))];
    if (regionFilter && !knownRegions.includes(regionFilter)) {
      throw new Error(`Unknown region "${q.region}". Regions in dataset: ${knownRegions.join(', ')}.`);
    }

    const resources = RESOURCES.filter((r) => !regionFilter || r.region === regionFilter);
    const samplesByResource = new Map<string, DailyUsageSample[]>();
    for (const s of getUsageSamples()) {
      if (s.date < q.startDate || s.date > q.endDate) continue;
      if (regionFilter && s.region !== regionFilter) continue;
      const arr = samplesByResource.get(s.resourceId) ?? [];
      arr.push(s);
      samplesByResource.set(s.resourceId, arr);
    }

    const results: ResourceUtilization[] = resources.map((r) => {
      const samples = (samplesByResource.get(r.resourceId) ?? []).sort((a, b) => a.date.localeCompare(b.date));
      const cpu = samples.map((s) => s.cpuAvgPct);
      const cpuMax = samples.map((s) => s.cpuMaxPct);
      const totalCost = samples.reduce((a, s) => a + s.costUsd, 0);
      const lowDays = samples.filter((s) => s.cpuAvgPct < q.cpuThresholdPct).length;
      const share = samples.length ? lowDays / samples.length : 0;
      const p95Max = percentile(cpuMax, 95);
      const avgCpu = mean(cpu);

      let classification: UtilizationClass = 'normal';
      let waste = 0;
      let recommendation = 'No action — utilisation within normal range.';
      let evidence = `${lowDays}/${samples.length} days below ${q.cpuThresholdPct}% avg CPU; p95 daily peak ${round(p95Max)}%.`;

      if (samples.length < q.minObservationDays) {
        classification = 'insufficient-data';
        recommendation = `Not enough data: ${samples.length} day(s) observed, ${q.minObservationDays} required.`;
      } else if (share >= q.persistenceShare) {
        classification = 'persistent-low';
        const canHalve = p95Max <= RIGHTSIZE_PEAK_LIMIT_PCT && r.vcpu >= 2;
        if (canHalve) {
          waste = totalCost * 0.5;
          recommendation = `Review for downsizing one instance size (${r.vcpu} → ${r.vcpu / 2} vCPU). Peak p95 ${round(p95Max)}% would be ≈${round(Math.min(100, p95Max * 2))}% after halving.`;
        } else {
          recommendation = 'Persistently low average, but peaks are too high to downsize safely — review scheduling instead.';
        }
      } else {
        const window = Math.min(7, Math.floor(samples.length / 2));
        if (window >= 3) {
          const first = mean(cpu.slice(0, window));
          const last = mean(cpu.slice(-window));
          if (first > 0 && last / first >= SPIKE_RATIO) {
            classification = 'usage-spike';
            recommendation = `Sustained usage increase: last ${window}d avg ${round(last)}% vs first ${window}d ${round(first)}% (×${round(last / first)}). Investigate cause before resizing.`;
            evidence += ` First-${window}d avg ${round(first)}%, last-${window}d avg ${round(last)}%.`;
          }
        }
      }

      return {
        resourceId: r.resourceId,
        name: r.name,
        provider: r.provider,
        region: r.region,
        service: r.service,
        resourceType: r.resourceType,
        vcpu: r.vcpu,
        imageUrl: r.imageUrl,
        observedDays: samples.length,
        totalCostUsd: round(totalCost),
        avgCpuPct: round(avgCpu),
        p95CpuMaxPct: round(p95Max),
        avgMemPct: round(mean(samples.map((s) => s.memAvgPct))),
        lowUtilDays: lowDays,
        lowUtilShare: round(share, 3),
        classification,
        estimatedWasteUsd: round(waste),
        recommendation,
        evidence,
      };
    });

    const order: Record<UtilizationClass, number> = { 'persistent-low': 0, 'usage-spike': 1, normal: 2, 'insufficient-data': 3 };
    results.sort((a, b) => order[a.classification] - order[b.classification] || b.estimatedWasteUsd - a.estimatedWasteUsd || b.totalCostUsd - a.totalCostUsd);

    const page = results.slice(q.offset, q.offset + q.limit);
    const persistentLow = results.filter((r) => r.classification === 'persistent-low');

    return {
      period: { startDate: q.startDate, endDate: q.endDate },
      region: regionFilter ?? 'all',
      thresholds: {
        cpuThresholdPct: q.cpuThresholdPct,
        minObservationDays: q.minObservationDays,
        persistenceShare: q.persistenceShare,
        rightsizePeakLimitPct: RIGHTSIZE_PEAK_LIMIT_PCT,
      },
      summary: {
        resourcesAnalyzed: results.length,
        persistentLowCount: persistentLow.length,
        usageSpikeCount: results.filter((r) => r.classification === 'usage-spike').length,
        totalCostUsd: round(results.reduce((a, r) => a + r.totalCostUsd, 0)),
        estimatedWasteUsd: round(results.reduce((a, r) => a + r.estimatedWasteUsd, 0)),
        currency: 'USD',
      },
      pagination: { offset: q.offset, limit: q.limit, total: results.length, returned: page.length },
      resources: page,
      assumptions: [
        `A resource is "persistent-low" when ≥${Math.round(q.persistenceShare * 100)}% of observed days have average CPU < ${q.cpuThresholdPct}% and at least ${q.minObservationDays} days were observed.`,
        `Estimated waste = 50% of period cost, applied only when p95 daily peak CPU ≤ ${RIGHTSIZE_PEAK_LIMIT_PCT}% (so a one-size downsize keeps peak ≤ ~80%) and the instance has ≥2 vCPU.`,
        'Costs are on-demand list-price assumptions × runtime hours; no discounts, reservations or savings plans applied.',
        'Recommendations only — no resources are modified.',
      ],
      provenance: {
        dataset: DATASET_LABEL,
        coverage: DATASET_COVERAGE,
        synthetic: true,
        generatedBy: 'src/data/usage.generator.ts (seeded deterministic generator)',
      },
    };
  }
}
