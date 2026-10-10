import { Injectable } from '@nitrostack/core';
import { AgentMetadata, AgentResult } from './agent.interface.js';
import { FinopsService, ResourceUtilization } from '../finops/finops.service.js';

export interface ResourceOptimizationInput {
  startDate: string;
  endDate: string;
  region?: string;
  cpuThresholdPct?: number;
  minObservationDays?: number;
  persistenceShare?: number;
}

export interface ResourceOptimizationOutput {
  period: { startDate: string; endDate: string };
  resourcesAnalyzed: number;
  persistentLowCount: number;
  usageSpikeCount: number;
  totalCostUsd: number;
  estimatedWasteUsd: number;
  rightsizableResources: ResourceUtilization[];
  riskAssessment: {
    safeToTerminateCount: number;
    requiresMemoryReviewCount: number;
    guideline: string;
  };
}

@Injectable({ deps: [FinopsService] })
export class ResourceOptimizationAgent {
  readonly metadata: AgentMetadata = {
    id: 'agent-06-resource-optimization',
    name: 'Resource Optimization Agent',
    role: 'Compute Capacity & Rightsizing Analysis',
    description: 'Identifies underutilized capacity, persistent low CPU instances, and evaluates safe rightsizing opportunities with risk safeguards.',
    authorizedTools: ['analyze-resource-utilization'],
    status: 'ready',
  };

  constructor(private readonly finopsService: FinopsService) {}

  async execute(input: ResourceOptimizationInput): Promise<AgentResult<ResourceOptimizationOutput>> {
    const startTime = Date.now();
    const query = {
      startDate: input.startDate,
      endDate: input.endDate,
      region: input.region,
      cpuThresholdPct: input.cpuThresholdPct ?? 10,
      minObservationDays: input.minObservationDays ?? 14,
      persistenceShare: input.persistenceShare ?? 0.9,
      limit: 50,
      offset: 0,
    };

    const res = this.finopsService.analyzeUtilization(query);
    const rightsizable = res.resources.filter((r) => r.classification === 'persistent-low');

    const output: ResourceOptimizationOutput = {
      period: res.period,
      resourcesAnalyzed: res.summary.resourcesAnalyzed,
      persistentLowCount: res.summary.persistentLowCount,
      usageSpikeCount: res.summary.usageSpikeCount,
      totalCostUsd: res.summary.totalCostUsd,
      estimatedWasteUsd: res.summary.estimatedWasteUsd,
      rightsizableResources: rightsizable,
      riskAssessment: {
        safeToTerminateCount: 0, // Never claim safe to terminate on CPU alone
        requiresMemoryReviewCount: rightsizable.length,
        guideline: 'CAUTION: CPU utilization alone is insufficient to confirm a resource is safe to terminate. Memory, disk I/O, and active network connections must be reviewed before decommissioning.',
      },
    };

    return {
      agentId: this.metadata.id,
      agentName: this.metadata.name,
      status: 'succeeded',
      durationMs: Date.now() - startTime,
      data: output,
      evidence: [
        `Analyzed ${output.resourcesAnalyzed} cloud resources over period ${input.startDate} to ${input.endDate}.`,
        `Identified ${output.persistentLowCount} persistently underutilized instances with $${output.estimatedWasteUsd} potential waste.`,
        `Applied p95 peak threshold safeguard: instances qualify for downsizing only if p95 peak CPU <= 40%.`,
      ],
      provenance: {
        source: res.provenance.dataset,
        isSynthetic: res.provenance.synthetic,
        timestamp: new Date().toISOString(),
        assumptions: res.assumptions,
      },
      warnings: [
        'CAUTION: CPU utilization alone is insufficient to confirm a resource is safe to terminate. Memory, disk I/O, and active network connections must be reviewed.',
        'Do not automatically terminate instances without checking memory pressure, disk I/O, or dependent microservices.',
      ],
      verificationNeeded: output.estimatedWasteUsd > 0,
    };
  }
}
