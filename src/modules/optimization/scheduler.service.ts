import { Injectable } from '@nitrostack/core';
import {
  WORKLOADS,
  INTERVALS,
  CLUSTER_CAPACITY_VCPU,
  CARBON_SOURCE,
  IntervalRecord,
  WorkloadRecord,
} from '../../data/workloads.fixture.js';

export type StrategyId = 'immediate' | 'cost-aware' | 'carbon-aware' | 'combined';

export interface Candidate {
  start: string;
  end: string;
  feasible: boolean;
  infeasibleReason?: string;
  estimatedCostUsd: number;
  energyKwh: number;
  estimatedEmissionsKg: number;
  avgCarbonIntensityG: number;
  peakVcpuUtilizationPct: number;
  objective?: number;
}

export interface StrategyResult {
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

const HOUR = 3600_000;
const round = (v: number, d = 4) => Math.round(v * 10 ** d) / 10 ** d;

@Injectable()
export class SchedulerService {
  listWorkloadIds(): string[] {
    return WORKLOADS.map((w) => w.workloadId);
  }

  private evaluate(w: WorkloadRecord, intervals: IntervalRecord[], startIdx: number): Candidate {
    const slice = intervals.slice(startIdx, startIdx + w.durationHours);
    const start = intervals[startIdx].start;
    const end = new Date(new Date(start).getTime() + w.durationHours * HOUR).toISOString().replace('.000Z', 'Z');
    let cost = 0;
    let emissions = 0;
    let peak = 0;
    let reason: string | undefined;
    for (const iv of slice) {
      cost += iv.priceUsdPerVcpuHour * w.vcpuRequired; // 1h interval
      const kwh = w.assumedPowerKw * 1;
      emissions += (kwh * iv.carbonIntensityG) / 1000; // kgCO2e = kWh × g/kWh ÷ 1000
      const used = iv.reservedVcpu + w.vcpuRequired;
      peak = Math.max(peak, (used / CLUSTER_CAPACITY_VCPU) * 100);
      if (used > CLUSTER_CAPACITY_VCPU && !reason) {
        reason = `Capacity exceeded at ${iv.start}: ${iv.reservedVcpu} reserved + ${w.vcpuRequired} required > ${CLUSTER_CAPACITY_VCPU} vCPU`;
      }
    }
    if (slice.length < w.durationHours && !reason) reason = 'Not enough interval data to cover full runtime';
    if (end > w.deadline && !reason) reason = `Would finish at ${end}, after deadline ${w.deadline}`;
    const energy = w.assumedPowerKw * w.durationHours;
    return {
      start,
      end,
      feasible: !reason,
      infeasibleReason: reason,
      estimatedCostUsd: round(cost),
      energyKwh: round(energy, 3),
      estimatedEmissionsKg: round(emissions),
      avgCarbonIntensityG: round(slice.reduce((a, iv) => a + iv.carbonIntensityG, 0) / Math.max(1, slice.length), 1),
      peakVcpuUtilizationPct: round(peak, 1),
    };
  }

  private pick(cands: Candidate[], wc: number, we: number): Candidate | undefined {
    const feas = cands.filter((c) => c.feasible);
    if (!feas.length) return undefined;
    const cs = feas.map((c) => c.estimatedCostUsd);
    const es = feas.map((c) => c.estimatedEmissionsKg);
    const [cMin, cMax, eMin, eMax] = [Math.min(...cs), Math.max(...cs), Math.min(...es), Math.max(...es)];
    const norm = (v: number, lo: number, hi: number) => (hi > lo ? (v - lo) / (hi - lo) : 0);
    let best: Candidate | undefined;
    let bestScore = Infinity;
    for (const c of feas) {
      const score = wc * norm(c.estimatedCostUsd, cMin, cMax) + we * norm(c.estimatedEmissionsKg, eMin, eMax);
      // ties broken by earliest start (candidates are chronological)
      if (score < bestScore - 1e-12) {
        bestScore = score;
        best = c;
      }
    }
    return best ? { ...best, objective: round(bestScore) } : undefined;
  }

  compare(workloadId: string, costWeight: number, carbonWeight: number, maxCandidates: number) {
    const w = WORKLOADS.find((x) => x.workloadId === workloadId.trim());
    if (!w) {
      throw new Error(`Unknown workloadId "${workloadId}". Available: ${this.listWorkloadIds().join(', ')}.`);
    }
    const sum = costWeight + carbonWeight;
    if (!(sum > 0)) throw new Error('At least one of cost/carbon weight must be greater than 0.');
    const wc = costWeight / sum;
    const we = carbonWeight / sum;

    const intervals = (INTERVALS[w.region] ?? []).filter((iv) => iv.start >= w.arrival);
    if (!intervals.length) {
      throw new Error(`No carbon/price interval data for region ${w.region} after ${w.arrival}; cannot schedule.`);
    }

    const candidates: Candidate[] = [];
    for (let i = 0; i + w.durationHours <= intervals.length; i++) {
      const c = this.evaluate(w, intervals, i);
      if (c.end > w.deadline) break;
      candidates.push(c);
    }

    const immediate = candidates[0];
    const toResult = (strategy: StrategyId, label: string, weights: StrategyResult['weights'], c?: Candidate, reason?: string): StrategyResult => {
      if (!c || !c.feasible) {
        return { strategy, label, weights, feasible: false, reason: reason ?? c?.infeasibleReason ?? 'No feasible window satisfies deadline and capacity constraints.' };
      }
      const base = immediate && immediate.feasible ? immediate : undefined;
      return {
        strategy,
        label,
        weights,
        feasible: true,
        start: c.start,
        end: c.end,
        delayHours: round((new Date(c.start).getTime() - new Date(w.arrival).getTime()) / HOUR, 2),
        estimatedCostUsd: c.estimatedCostUsd,
        estimatedEmissionsKg: c.estimatedEmissionsKg,
        avgCarbonIntensityG: c.avgCarbonIntensityG,
        costDeltaUsd: base ? round(c.estimatedCostUsd - base.estimatedCostUsd) : undefined,
        costDeltaPct: base && base.estimatedCostUsd > 0 ? round(((c.estimatedCostUsd - base.estimatedCostUsd) / base.estimatedCostUsd) * 100, 2) : undefined,
        emissionsDeltaKg: base ? round(c.estimatedEmissionsKg - base.estimatedEmissionsKg) : undefined,
        emissionsDeltaPct: base && base.estimatedEmissionsKg > 0 ? round(((c.estimatedEmissionsKg - base.estimatedEmissionsKg) / base.estimatedEmissionsKg) * 100, 2) : undefined,
      };
    };

    const shiftable = w.priority !== 'high';
    const noShift = 'High-priority workload: time-shifting disabled by policy; run immediately.';
    const strategies: StrategyResult[] = [
      toResult('immediate', 'Immediate execution (baseline)', null, immediate),
      shiftable ? toResult('cost-aware', 'Cost-aware', { cost: 1, carbon: 0 }, this.pick(candidates, 1, 0)) : toResult('cost-aware', 'Cost-aware', { cost: 1, carbon: 0 }, undefined, noShift),
      shiftable ? toResult('carbon-aware', 'Carbon-aware', { cost: 0, carbon: 1 }, this.pick(candidates, 0, 1)) : toResult('carbon-aware', 'Carbon-aware', { cost: 0, carbon: 1 }, undefined, noShift),
      shiftable
        ? toResult('combined', 'Combined cost + carbon', { cost: round(wc, 3), carbon: round(we, 3) }, this.pick(candidates, wc, we))
        : toResult('combined', 'Combined cost + carbon', { cost: round(wc, 3), carbon: round(we, 3) }, undefined, noShift),
    ];

    const combined = strategies[3];
    let recommendation: string;
    if (!combined.feasible) {
      recommendation = `No combined recommendation: ${combined.reason}`;
    } else if (combined.start === immediate?.start) {
      recommendation = 'Immediate execution is already optimal under the given weights — no shift recommended.';
    } else {
      recommendation = `Recommend shifting ${w.workloadId} to start ${combined.start} (delay ${combined.delayHours}h, finishes before ${w.deadline}). Versus immediate: cost ${combined.costDeltaUsd} USD (${combined.costDeltaPct}%), emissions ${combined.emissionsDeltaKg} kgCO2e (${combined.emissionsDeltaPct}%). Recommendation only — not executed.`;
    }

    return {
      workload: {
        workloadId: w.workloadId,
        name: w.name,
        region: w.region,
        priority: w.priority,
        arrival: w.arrival,
        deadline: w.deadline,
        durationHours: w.durationHours,
        vcpuRequired: w.vcpuRequired,
        assumedPowerKw: w.assumedPowerKw,
        imageUrl: w.imageUrl,
      },
      weights: { cost: round(wc, 3), carbon: round(we, 3), normalized: true },
      strategies,
      recommendation,
      candidates: {
        total: candidates.length,
        feasible: candidates.filter((c) => c.feasible).length,
        items: candidates.slice(0, maxCandidates),
      },
      methodology: {
        objective: 'score = w_cost × minmax(cost) + w_carbon × minmax(emissions) over feasible windows; infeasible windows (deadline or capacity violation) are excluded; ties → earliest start.',
        emissionsFormula: 'kgCO2e = energy kWh × carbon intensity gCO2e/kWh ÷ 1000, per hourly interval',
        costFormula: 'USD = Σ interval price (USD/vCPU-h) × vCPU required × 1h',
        clusterCapacityVcpu: CLUSTER_CAPACITY_VCPU,
      },
      assumptions: [
        `Energy is an ESTIMATE from an assumed constant power draw of ${w.assumedPowerKw} kW, not a measurement.`,
        'Emissions are operational only; embodied emissions are excluded.',
        'All strategies are evaluated on the same workload, intervals, and assumptions.',
        'No workload is executed; this is a schedule recommendation.',
      ],
      provenance: { carbonIntensity: CARBON_SOURCE, prices: 'Illustrative synthetic price profile (ecofinops-demo-v1)', synthetic: true },
    };
  }
}
