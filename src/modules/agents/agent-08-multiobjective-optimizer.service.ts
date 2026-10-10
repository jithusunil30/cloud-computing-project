import { Injectable } from '@nitrostack/core';
import { AgentMetadata, AgentResult } from './agent.interface.js';
import { SchedulerService, Candidate, StrategyResult } from '../optimization/scheduler.service.js';

export interface MultiObjectiveInput {
  workloadId: string;
  costWeight: number; // 0 to 1
  carbonWeight: number; // 0 to 1
  maxCandidates?: number;
}

export interface ParetoCandidate {
  start: string;
  end: string;
  costUsd: number;
  emissionsKg: number;
  isParetoOptimal: boolean;
  score: number;
}

export interface MultiObjectiveOutput {
  workloadId: string;
  normalizedWeights: { cost: number; carbon: number };
  baseline: StrategyResult;
  optimalCandidate: ParetoCandidate | null;
  paretoFrontier: ParetoCandidate[];
  tradeOffExplanation: string;
}

@Injectable({ deps: [SchedulerService] })
export class MultiObjectiveOptimizationAgent {
  readonly metadata: AgentMetadata = {
    id: 'agent-08-multiobjective-optimizer',
    name: 'Multi-Objective Optimization Agent',
    role: 'Pareto Trade-Off & Normalized Multi-Criteria Optimization',
    description: 'Calculates Pareto-optimal alternatives balancing financial expenditure and carbon emissions with normalized objective functions.',
    authorizedTools: ['compare-workload-schedules'],
    status: 'ready',
  };

  constructor(private readonly scheduler: SchedulerService) {}

  async execute(input: MultiObjectiveInput): Promise<AgentResult<MultiObjectiveOutput>> {
    const startTime = Date.now();
    // Normalize weights so they sum to 1.0
    const rawSum = (input.costWeight || 0) + (input.carbonWeight || 0);
    const wc = rawSum > 0 ? input.costWeight / rawSum : 0.5;
    const we = rawSum > 0 ? input.carbonWeight / rawSum : 0.5;

    const comp = this.scheduler.compare(input.workloadId, wc, we, input.maxCandidates ?? 24);
    const immediateStrat = comp.strategies.find((s) => s.strategy === 'immediate') ?? comp.strategies[0];
    const candidates: Candidate[] = comp.candidates.items.filter((c: Candidate) => c.feasible);

    if (candidates.length === 0) {
      return {
        agentId: this.metadata.id,
        agentName: this.metadata.name,
        status: 'degraded',
        durationMs: Date.now() - startTime,
        data: {
          workloadId: input.workloadId,
          normalizedWeights: { cost: wc, carbon: we },
          baseline: immediateStrat,
          optimalCandidate: null,
          paretoFrontier: [],
          tradeOffExplanation: `No feasible scheduling windows found for workload ${input.workloadId}.`,
        },
        evidence: [`Workload ${input.workloadId} cannot be scheduled within constraints.`],
        provenance: {
          source: 'Pareto Multi-Objective Analysis Engine',
          isSynthetic: true,
          timestamp: new Date().toISOString(),
          assumptions: ['Strict deadline and cluster capacity constraints applied.'],
        },
        warnings: ['Workload infeasible.'],
        verificationNeeded: false,
      };
    }

    const costs = candidates.map((c: Candidate) => c.estimatedCostUsd);
    const emissions = candidates.map((c: Candidate) => c.estimatedEmissionsKg);
    const minCost = Math.min(...costs);
    const maxCost = Math.max(...costs);
    const minEm = Math.min(...emissions);
    const maxEm = Math.max(...emissions);

    const norm = (val: number, min: number, max: number) => (max > min ? (val - min) / (max - min) : 0);

    // Identify non-dominated (Pareto-optimal) solutions
    const paretoCandidates: ParetoCandidate[] = candidates.map((c: Candidate) => {
      const score = wc * norm(c.estimatedCostUsd, minCost, maxCost) + we * norm(c.estimatedEmissionsKg, minEm, maxEm);
      // Dominance check: does there exist another candidate strictly better in one and not worse in the other?
      const isDominated = candidates.some(
        (other: Candidate) =>
          other.estimatedCostUsd <= c.estimatedCostUsd &&
          other.estimatedEmissionsKg <= c.estimatedEmissionsKg &&
          (other.estimatedCostUsd < c.estimatedCostUsd || other.estimatedEmissionsKg < c.estimatedEmissionsKg)
      );

      return {
        start: c.start,
        end: c.end,
        costUsd: c.estimatedCostUsd,
        emissionsKg: c.estimatedEmissionsKg,
        isParetoOptimal: !isDominated,
        score: Math.round(score * 1000) / 1000,
      };
    });

    const paretoFrontier = paretoCandidates.filter((p) => p.isParetoOptimal);
    const sorted = [...paretoCandidates].sort((a, b) => a.score - b.score);
    const optimal = sorted[0] || null;

    const baseCost = immediateStrat.estimatedCostUsd ?? 0;
    const baseEm = immediateStrat.estimatedEmissionsKg ?? 0;
    const costDelta = baseCost - (optimal ? optimal.costUsd : 0);
    const emDelta = baseEm - (optimal ? optimal.emissionsKg : 0);

    const explanation = `Selected schedule (${optimal?.start}) delivers ${
      costDelta >= 0 ? `$${costDelta.toFixed(2)} cost reduction` : `$${(-costDelta).toFixed(2)} premium`
    } and ${
      emDelta >= 0 ? `${emDelta.toFixed(3)} kgCO2e emissions reduction` : `${(-emDelta).toFixed(3)} kgCO2e trade-off`
    } vs baseline (normalized weights: ${(wc * 100).toFixed(0)}% cost, ${(we * 100).toFixed(0)}% carbon).`;

    return {
      agentId: this.metadata.id,
      agentName: this.metadata.name,
      status: 'succeeded',
      durationMs: Date.now() - startTime,
      data: {
        workloadId: input.workloadId,
        normalizedWeights: { cost: wc, carbon: we },
        baseline: immediateStrat,
        optimalCandidate: optimal,
        paretoFrontier,
        tradeOffExplanation: explanation,
      },
      evidence: [
        `Identified ${paretoFrontier.length} Pareto-optimal (non-dominated) scheduling points out of ${candidates.length} feasible windows.`,
        explanation,
      ],
      provenance: {
        source: 'Normalized Multi-Objective Scalarization & Pareto Non-Dominance Filter',
        isSynthetic: true,
        timestamp: new Date().toISOString(),
        assumptions: [
          'Cost and Carbon metrics normalized using min-max scaling across candidate windows.',
          'Scalarized objective function: Score = W_cost * Norm(Cost) + W_carbon * Norm(Carbon).',
        ],
      },
      warnings: [],
      verificationNeeded: true,
    };
  }
}
