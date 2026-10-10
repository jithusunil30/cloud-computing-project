import { Injectable } from '@nitrostack/core';
import { AgentMetadata, AgentResult } from './agent.interface.js';
import { SchedulerService, StrategyResult } from '../optimization/scheduler.service.js';

export interface WorkloadSchedulingInput {
  workloadId: string;
  costWeight?: number;
  carbonWeight?: number;
  maxCandidates?: number;
}

export interface WorkloadSchedulingOutput {
  workloadId: string;
  baseline: StrategyResult;
  selectedStrategy: StrategyResult;
  allStrategies: Record<string, StrategyResult>;
  estimatedSavingsUsd: number;
  estimatedCarbonReductionKg: number;
  candidatesCount: number;
  isFeasible: boolean;
}

@Injectable({ deps: [SchedulerService] })
export class WorkloadSchedulingAgent {
  readonly metadata: AgentMetadata = {
    id: 'agent-05-workload-scheduling',
    name: 'Workload Scheduling Agent',
    role: 'Temporal Workload Optimization & Window Shifting',
    description: 'Compares immediate, cost-aware, carbon-aware, and combined execution schedules within deadline and capacity constraints.',
    authorizedTools: ['compare-workload-schedules'],
    status: 'ready',
  };

  constructor(private readonly scheduler: SchedulerService) {}

  async execute(input: WorkloadSchedulingInput): Promise<AgentResult<WorkloadSchedulingOutput>> {
    const startTime = Date.now();
    const costWeight = input.costWeight ?? 0.5;
    const carbonWeight = input.carbonWeight ?? 0.5;
    const maxCandidates = input.maxCandidates ?? 24;

    const comp = this.scheduler.compare(input.workloadId, costWeight, carbonWeight, maxCandidates);
    const baseline = comp.strategies.find((s) => s.strategy === 'immediate') ?? comp.strategies[0];
    const combined = comp.strategies.find((s) => s.strategy === 'combined') ?? comp.strategies[comp.strategies.length - 1];
    const isFeasible = combined.feasible;

    const savingsUsd = (baseline.estimatedCostUsd ?? 0) - (combined.estimatedCostUsd ?? 0);
    const carbonRedKg = (baseline.estimatedEmissionsKg ?? 0) - (combined.estimatedEmissionsKg ?? 0);

    const strategiesMap: Record<string, StrategyResult> = {};
    for (const s of comp.strategies) {
      strategiesMap[s.strategy] = s;
    }

    const output: WorkloadSchedulingOutput = {
      workloadId: input.workloadId,
      baseline,
      selectedStrategy: combined,
      allStrategies: strategiesMap,
      estimatedSavingsUsd: Math.max(0, Math.round(savingsUsd * 100) / 100),
      estimatedCarbonReductionKg: Math.max(0, Math.round(carbonRedKg * 1000) / 1000),
      candidatesCount: comp.candidates.total,
      isFeasible,
    };

    const evidence = [
      `Evaluated workload ${input.workloadId} across ${comp.candidates.total} candidate time windows.`,
      `Baseline (immediate) cost: $${baseline.estimatedCostUsd} USD, emissions: ${baseline.estimatedEmissionsKg} kgCO2e.`,
      isFeasible
        ? `Optimized strategy achieves $${output.estimatedSavingsUsd} savings and ${output.estimatedCarbonReductionKg} kgCO2e reduction.`
        : `Workload ${input.workloadId} infeasible under current constraints: ${combined.reason}`,
    ];

    return {
      agentId: this.metadata.id,
      agentName: this.metadata.name,
      status: 'succeeded',
      durationMs: Date.now() - startTime,
      data: output,
      evidence,
      provenance: {
        source: 'EcoFinOps Deterministic Workload Interval Scheduler & Grid Carbon Profile',
        isSynthetic: true,
        timestamp: new Date().toISOString(),
        assumptions: [
          'Workload power draw assumes constant load over execution duration.',
          'Cluster capacity strictly enforced; infeasible windows rejected.',
          'Scheduling recommendations are read-only; workloads are not moved automatically.',
        ],
      },
      warnings: !isFeasible ? [`Workload ${input.workloadId} cannot meet deadline or capacity constraints.`] : [],
      verificationNeeded: true,
    };
  }
}
