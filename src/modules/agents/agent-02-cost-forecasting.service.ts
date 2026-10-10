import { Injectable } from '@nitrostack/core';
import { AgentMetadata, AgentResult } from './agent.interface.js';
import { PythonBridgeService } from './python-bridge.service.js';

export interface CostForecastingInput {
  numDays?: number;
  horizonHours?: number;
  modelType?: 'Ridge' | 'RandomForest';
  dataMode?: 'synthetic' | 'aws_cur' | 'gcp_billing';
  monthlyBudgetUsd?: number;
}

export interface CostForecastingOutput {
  modelType: string;
  horizonHours: number;
  accumulatedForecastUsd: number;
  metrics: Record<string, Record<string, number>>;
  predictions: Array<{
    step_hour: number;
    predicted_cost_usd: number;
    ci_lower_usd: number;
    ci_upper_usd: number;
  }>;
  budgetRisk: {
    monthlyBudgetUsd: number;
    projectedMonthlySpendUsd: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  limitations: string[];
}

@Injectable({ deps: [PythonBridgeService] })
export class CostForecastingAgent {
  readonly metadata: AgentMetadata = {
    id: 'agent-02-cost-forecasting',
    name: 'Cost Forecasting Agent',
    role: 'Predictive Spend Modeling & Uncertainty Estimation',
    description: 'Forecasts future cloud expenditure, computes prediction intervals, and evaluates models using measured MAE, RMSE, and MAPE.',
    authorizedTools: ['forecast_cloud_cost', 'get_model_evaluation'],
    status: 'ready',
  };

  constructor(private readonly pythonBridge: PythonBridgeService) {}

  async execute(input: CostForecastingInput = {}): Promise<AgentResult<CostForecastingOutput>> {
    const startTime = Date.now();
    const horizonHours = input.horizonHours ?? 48;
    const modelType = input.modelType ?? 'Ridge';
    const numDays = input.numDays ?? 30;
    const dataMode = input.dataMode ?? 'synthetic';
    const budget = input.monthlyBudgetUsd ?? 500.0;

    const pyResult = await this.pythonBridge.executeAction('forecast', {
      num_days: numDays,
      horizon_hours: horizonHours,
      model_type: modelType,
      data_mode: dataMode,
    });

    const accumulated = pyResult.accumulated_forecast_usd ?? 0;
    const avgHourly = horizonHours > 0 ? accumulated / horizonHours : 0;
    const projectedMonthly = Math.round(avgHourly * 24 * 30 * 100) / 100;

    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (projectedMonthly > budget * 1.15) {
      riskLevel = 'HIGH';
    } else if (projectedMonthly > budget * 0.9) {
      riskLevel = 'MEDIUM';
    }

    const output: CostForecastingOutput = {
      modelType,
      horizonHours,
      accumulatedForecastUsd: accumulated,
      metrics: pyResult.metrics ?? {},
      predictions: pyResult.predictions ?? [],
      budgetRisk: {
        monthlyBudgetUsd: budget,
        projectedMonthlySpendUsd: projectedMonthly,
        riskLevel,
      },
      limitations: pyResult.limitations ?? [
        'Forecast assumes continuity of historical diurnal workloads.',
        'External unexpected demand surges not modeled in standard lag autoregression.',
      ],
    };

    const warnings: string[] = [];
    if (numDays < 7) {
      warnings.push(`Historical sample window (${numDays} days) is minimal. Recommended at least 14 days for optimal seasonality capture.`);
    }

    return {
      agentId: this.metadata.id,
      agentName: this.metadata.name,
      status: 'succeeded',
      durationMs: Date.now() - startTime,
      data: output,
      evidence: [
        ...(pyResult.evidence ?? []),
        `Accumulated ${horizonHours}-hour forecast: $${accumulated} USD ($${avgHourly.toFixed(4)}/hr average).`,
        `Budget risk assessment: ${riskLevel} (Projected monthly $${projectedMonthly} vs limit $${budget}).`,
      ],
      provenance: {
        source: 'Time-Series Machine Learning Engine (Chronological 80/20 train/test split, zero leakage)',
        isSynthetic: dataMode === 'synthetic',
        timestamp: new Date().toISOString(),
        assumptions: [
          'Autoregressive features include 1h lag, 24h lag, 6h/24h rolling means, calendar hour and day-of-week.',
          'Confidence intervals estimated at 95% standard normal variance.',
        ],
      },
      warnings,
      verificationNeeded: true,
    };
  }
}
