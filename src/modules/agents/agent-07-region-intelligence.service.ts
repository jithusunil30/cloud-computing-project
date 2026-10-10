import { Injectable } from '@nitrostack/core';
import { AgentMetadata, AgentResult } from './agent.interface.js';
import { PythonBridgeService } from './python-bridge.service.js';

export interface RegionIntelligenceInput {
  vcpus?: number;
  ramGb?: number;
  hours?: number;
  allowedRegions?: string[];
  maxLatencyTier?: 'Low' | 'Medium' | 'High';
  dataResidencyRequired?: string;
}

export interface RegionIntelligenceOutput {
  eligibleRegions: Array<{
    region: string;
    region_name: string;
    grid_carbon_intensity_gco2_kwh: number;
    pue: number;
    price_per_vcpu_hr_usd: number;
    estimated_cost_usd: number;
    estimated_carbon_kgco2e: number;
    energy_kwh: number;
    latency_tier: string;
    eligible: boolean;
  }>;
  bestCarbonRegion: string;
  bestCostRegion: string;
  tradeOffSummary: string;
}

@Injectable({ deps: [PythonBridgeService] })
export class CloudRegionIntelligenceAgent {
  readonly metadata: AgentMetadata = {
    id: 'agent-07-region-intelligence',
    name: 'Cloud Region Intelligence Agent',
    role: 'Multi-Region Cost, Carbon & Compliance Evaluation',
    description: 'Compares cloud regions for eligible workloads based on real pricing benchmarks, grid carbon intensity, latency tiers, and data residency rules.',
    authorizedTools: ['compare_cloud_regions'],
    status: 'ready',
  };

  constructor(private readonly pythonBridge: PythonBridgeService) {}

  async execute(input: RegionIntelligenceInput = {}): Promise<AgentResult<RegionIntelligenceOutput>> {
    const startTime = Date.now();
    const vcpus = input.vcpus ?? 4;
    const hours = input.hours ?? 24;

    const pyResult = await this.pythonBridge.executeAction('region_comparison', {
      vcpus,
      hours,
      ram_gb: input.ramGb ?? 16,
      regions: input.allowedRegions,
    });

    let comparison = pyResult.comparison ?? [];

    // Apply data residency constraints
    if (input.dataResidencyRequired) {
      comparison = comparison.filter((r: any) =>
        r.region.startsWith(input.dataResidencyRequired!) || r.region_name.toLowerCase().includes(input.dataResidencyRequired!.toLowerCase())
      );
    }

    // Apply latency tier filtering
    if (input.maxLatencyTier === 'Low') {
      comparison = comparison.filter((r: any) => r.latency_tier === 'Low');
    } else if (input.maxLatencyTier === 'Medium') {
      comparison = comparison.filter((r: any) => r.latency_tier === 'Low' || r.latency_tier === 'Medium');
    }

    const bestCarbon = comparison.length ? comparison[0].region : 'N/A';
    const sortedByCost = [...comparison].sort((a: any, b: any) => a.estimated_cost_usd - b.estimated_cost_usd);
    const bestCost = sortedByCost.length ? sortedByCost[0].region : 'N/A';

    const output: RegionIntelligenceOutput = {
      eligibleRegions: comparison,
      bestCarbonRegion: bestCarbon,
      bestCostRegion: bestCost,
      tradeOffSummary: `Lowest carbon region is ${bestCarbon} (${comparison[0]?.estimated_carbon_kgco2e ?? 0} kg CO2e). Lowest cost region is ${bestCost} ($${sortedByCost[0]?.estimated_cost_usd ?? 0} USD).`,
    };

    return {
      agentId: this.metadata.id,
      agentName: this.metadata.name,
      status: 'succeeded',
      durationMs: Date.now() - startTime,
      data: output,
      evidence: [
        `Evaluated ${output.eligibleRegions.length} candidate regions for workload (${vcpus} vCPU, ${hours}h).`,
        output.tradeOffSummary,
      ],
      provenance: {
        source: 'Verified regional grid carbon intensity (EPA eGRID / Electricity Maps) and published cloud PUE tables',
        isSynthetic: false,
        timestamp: new Date().toISOString(),
        assumptions: [
          'Workload power modeled using TDP specs and data center PUE overhead.',
          'Live cloud availability subject to current provider quota.',
        ],
      },
      warnings: comparison.length === 0 ? ['No regions met the combined latency and data-residency criteria.'] : [],
      verificationNeeded: true,
    };
  }
}
