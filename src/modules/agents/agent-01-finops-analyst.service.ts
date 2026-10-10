import { Injectable } from '@nitrostack/core';
import { AgentMetadata, AgentResult } from './agent.interface.js';
import { PythonBridgeService } from './python-bridge.service.js';

export interface FinopsAnalystInput {
  numDays?: number;
  dataMode?: 'synthetic' | 'aws_cur' | 'gcp_billing';
  monthlyBudgetUsd?: number;
  regions?: string[];
}

export interface FinopsAnalystOutput {
  totalCostUsd: number;
  totalEnergyKwh: number;
  activeInstances: number;
  byService: Record<string, number>;
  byRegion: Record<string, number>;
  budgetStatus: {
    monthlyBudgetUsd: number;
    projectedMonthlySpendUsd: number;
    isOverBudget: boolean;
    budgetUtilizationPct: number;
  };
  dailyTrend: Array<{ date: string; cost_usd: number }>;
  rankedRecommendations: Array<{
    target: string;
    potentialSavingUsd: number;
    confidence: number;
    reason: string;
  }>;
}

@Injectable({ deps: [PythonBridgeService] })
export class FinopsAnalystAgent {
  readonly metadata: AgentMetadata = {
    id: 'agent-01-finops-analyst',
    name: 'FinOps Analyst Agent',
    role: 'Cloud Cost & Telemetry Driver Analysis',
    description: 'Analyzes cloud expenditure, drivers of spending, period-over-period trends, budget status, and ranks savings opportunities.',
    authorizedTools: ['get_cost_summary'],
    status: 'ready',
  };

  constructor(private readonly pythonBridge: PythonBridgeService) {}

  async execute(input: FinopsAnalystInput = {}): Promise<AgentResult<FinopsAnalystOutput>> {
    const startTime = Date.now();
    const numDays = input.numDays ?? 30;
    const dataMode = input.dataMode ?? 'synthetic';
    const budget = input.monthlyBudgetUsd ?? 500.0;

    const pyResult = await this.pythonBridge.executeAction('cost_summary', {
      num_days: numDays,
      data_mode: dataMode,
      regions: input.regions,
    });

    const totalCost = pyResult.total_cost_usd ?? 0;
    const dailyAverage = numDays > 0 ? totalCost / numDays : 0;
    const projectedMonthly = Math.round(dailyAverage * 30 * 100) / 100;
    const budgetPct = Math.round((projectedMonthly / budget) * 1000) / 10;

    const output: FinopsAnalystOutput = {
      totalCostUsd: totalCost,
      totalEnergyKwh: pyResult.total_energy_kwh ?? 0,
      activeInstances: pyResult.active_instances ?? 0,
      byService: pyResult.by_service ?? {},
      byRegion: pyResult.by_region ?? {},
      budgetStatus: {
        monthlyBudgetUsd: budget,
        projectedMonthlySpendUsd: projectedMonthly,
        isOverBudget: projectedMonthly > budget,
        budgetUtilizationPct: budgetPct,
      },
      dailyTrend: pyResult.daily_trend ?? [],
      rankedRecommendations: pyResult.recommendations ?? [],
    };

    const warnings: string[] = [];
    if (dataMode === 'synthetic') {
      warnings.push('Telemetry operates on synthetic demonstration data. Results represent simulated cloud workloads.');
    }
    if (projectedMonthly > budget) {
      warnings.push(`Projected monthly spend ($${projectedMonthly}) exceeds budget limit ($${budget}) by ${(budgetPct - 100).toFixed(1)}%.`);
    }

    return {
      agentId: this.metadata.id,
      agentName: this.metadata.name,
      status: 'succeeded',
      durationMs: Date.now() - startTime,
      data: output,
      evidence: [
        ...(pyResult.evidence ?? []),
        `Budget analysis: $${projectedMonthly} projected vs $${budget} monthly threshold (${budgetPct}% utilized).`,
        `Identified ${output.rankedRecommendations.length} ranked cost-saving opportunities.`,
      ],
      provenance: {
        source: dataMode === 'synthetic' ? 'Synthetic Telemetry Generator (Reproducible)' : `Public Billing Export (${dataMode})`,
        isSynthetic: dataMode === 'synthetic',
        timestamp: new Date().toISOString(),
        assumptions: [
          '30-day projection assumes constant average daily usage rate.',
          'Cost figures calculated in USD.',
        ],
      },
      warnings,
      verificationNeeded: output.rankedRecommendations.length > 0,
    };
  }
}
