import { Injectable } from '@nitrostack/core';
import { AgentMetadata, AgentResult } from './agent.interface.js';
import { PythonBridgeService } from './python-bridge.service.js';

export interface CarbonIntelligenceInput {
  numDays?: number;
  dataMode?: 'synthetic' | 'aws_cur' | 'gcp_billing';
}

export interface CarbonIntelligenceOutput {
  totalCarbonKgco2e: number;
  totalEnergyKwh: number;
  regionalEmissions: Record<
    string,
    {
      carbon_kgco2e: number;
      energy_kwh: number;
      grid_intensity_gco2_kwh: number;
      location: string;
      pue: number;
    }
  >;
  methodology: string;
  reductionOpportunities: string[];
}

@Injectable({ deps: [PythonBridgeService] })
export class CarbonIntelligenceAgent {
  readonly metadata: AgentMetadata = {
    id: 'agent-04-carbon-intelligence',
    name: 'Carbon Intelligence Agent',
    role: 'Cloud Carbon Footprint & Environmental Impact Modeling',
    description: 'Estimates GHG Protocol Scope 2 carbon emissions (kg CO2e) and energy consumption (kWh) from CPU, hardware TDP, PUE, and regional grid intensity.',
    authorizedTools: ['estimate_carbon_emissions'],
    status: 'ready',
  };

  constructor(private readonly pythonBridge: PythonBridgeService) {}

  async execute(input: CarbonIntelligenceInput = {}): Promise<AgentResult<CarbonIntelligenceOutput>> {
    const startTime = Date.now();
    const numDays = input.numDays ?? 30;
    const dataMode = input.dataMode ?? 'synthetic';

    const pyResult = await this.pythonBridge.executeAction('carbon', {
      num_days: numDays,
      data_mode: dataMode,
    });

    const output: CarbonIntelligenceOutput = {
      totalCarbonKgco2e: pyResult.total_carbon_kgco2e ?? 0,
      totalEnergyKwh: pyResult.total_energy_kwh ?? 0,
      regionalEmissions: pyResult.regional_emissions ?? {},
      methodology: pyResult.methodology ?? 'GHG Protocol Scope 2 location-based accounting (Power = P_idle + (P_max - P_idle)*CPU%; Energy = Power*PUE*Hours/1000; Emissions = Energy*Grid_gCO2/1000)',
      reductionOpportunities: pyResult.reduction_opportunities ?? [
        'Shift batch workloads to hydro/nuclear-heavy regions such as us-west-2 Oregon (120 gCO2/kWh).',
        'Consolidate low-utilization nodes to reduce constant baseline idle power draw.',
      ],
    };

    return {
      agentId: this.metadata.id,
      agentName: this.metadata.name,
      status: 'succeeded',
      durationMs: Date.now() - startTime,
      data: output,
      evidence: [
        `Calculated total fleet emissions: ${output.totalCarbonKgco2e} kg CO2e from ${output.totalEnergyKwh} kWh energy consumed.`,
        `Regional grid intensities applied: Oregon (120 g/kWh), Ireland (260 g/kWh), Virginia (385 g/kWh), Mumbai (708 g/kWh).`,
      ],
      provenance: {
        source: 'Published data center PUE benchmarks (1.12-1.22) & regional grid carbon intensity factors (EPA eGRID / Electricity Maps)',
        isSynthetic: dataMode === 'synthetic',
        timestamp: new Date().toISOString(),
        assumptions: [
          'Calculations are software-based model estimates, NOT direct hardware power meter readings.',
          'PUE reflects data center cooling and facility infrastructure overhead.',
        ],
      },
      warnings: ['Carbon figures are software estimates derived from published grid and hardware coefficients.'],
      verificationNeeded: true,
    };
  }
}
