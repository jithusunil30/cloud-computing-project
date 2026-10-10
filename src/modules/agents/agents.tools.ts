import { ToolDecorator as Tool, Widget, Injectable, ExecutionContext, z } from '@nitrostack/core';
import { FinopsAnalystAgent } from './agent-01-finops-analyst.service.js';
import { CostForecastingAgent } from './agent-02-cost-forecasting.service.js';
import { CostAnomalyDetectionAgent } from './agent-03-anomaly-detection.service.js';
import { CarbonIntelligenceAgent } from './agent-04-carbon-intelligence.service.js';
import { CloudRegionIntelligenceAgent } from './agent-07-region-intelligence.service.js';
import { RecommendationVerificationAgent } from './agent-09-recommendation-verification.service.js';
import { SupervisorOrchestrationAgent } from './agent-10-supervisor.service.js';
import { CloudGovernanceRiskAgent } from './agent-11-governance-risk.service.js';
import { ReportingExplanationAgent } from './agent-12-reporting-explanation.service.js';
import { PythonBridgeService } from './python-bridge.service.js';

@Injectable({
  deps: [
    FinopsAnalystAgent,
    CostForecastingAgent,
    CostAnomalyDetectionAgent,
    CarbonIntelligenceAgent,
    CloudRegionIntelligenceAgent,
    RecommendationVerificationAgent,
    SupervisorOrchestrationAgent,
    CloudGovernanceRiskAgent,
    ReportingExplanationAgent,
    PythonBridgeService,
  ],
})
export class AgentsTools {
  constructor(
    private readonly finopsAgent: FinopsAnalystAgent,
    private readonly forecastingAgent: CostForecastingAgent,
    private readonly anomalyAgent: CostAnomalyDetectionAgent,
    private readonly carbonAgent: CarbonIntelligenceAgent,
    private readonly regionAgent: CloudRegionIntelligenceAgent,
    private readonly verificationAgent: RecommendationVerificationAgent,
    private readonly supervisorAgent: SupervisorOrchestrationAgent,
    private readonly governanceAgent: CloudGovernanceRiskAgent,
    private readonly reportingAgent: ReportingExplanationAgent,
    private readonly pythonBridge: PythonBridgeService
  ) {}

  @Tool({
    name: 'get_cost_summary',
    description: 'Summarize cloud fleet expenditure, compute period-over-period trends, analyze drivers by service and region, and evaluate budget utilization.',
    inputSchema: z.object({
      numDays: z.number().int().min(1).max(90).default(30).describe('Number of observation days (1-90)'),
      dataMode: z.enum(['synthetic', 'aws_cur', 'gcp_billing']).default('synthetic').describe('Data operating mode'),
      monthlyBudgetUsd: z.number().positive().default(500).describe('Monthly budget limit in USD'),
      regions: z.array(z.string()).optional().describe('Optional list of regions to filter'),
    }),
  })
  async getCostSummary(input: any, ctx: ExecutionContext) {
    ctx.logger.info('Tool: get_cost_summary', input);
    return this.finopsAgent.execute(input);
  }

  @Tool({
    name: 'forecast_cloud_cost',
    description: 'Predict future cloud expenditure for configurable horizons (hours or days) with 95% confidence intervals and evaluation metrics.',
    inputSchema: z.object({
      horizonHours: z.number().int().min(1).max(168).default(48).describe('Forward forecast horizon in hours'),
      modelType: z.enum(['Ridge', 'RandomForest']).default('Ridge').describe('Forecasting ML algorithm'),
      numDays: z.number().int().min(7).max(90).default(30).describe('Historical training window in days'),
      dataMode: z.enum(['synthetic', 'aws_cur', 'gcp_billing']).default('synthetic'),
      monthlyBudgetUsd: z.number().positive().default(500),
    }),
  })
  async forecastCloudCost(input: any, ctx: ExecutionContext) {
    ctx.logger.info('Tool: forecast_cloud_cost', input);
    return this.forecastingAgent.execute(input);
  }

  @Tool({
    name: 'detect_cost_anomalies',
    description: 'Detect abnormal spending spikes and identify idle zombie instances accumulating waste using multivariate Isolation Forest and Z-score models.',
    inputSchema: z.object({
      numDays: z.number().int().min(1).max(90).default(30).describe('Observation window in days'),
      contamination: z.number().min(0.01).max(0.15).default(0.03).describe('Expected anomaly contamination fraction'),
      dataMode: z.enum(['synthetic', 'aws_cur', 'gcp_billing']).default('synthetic'),
    }),
  })
  async detectCostAnomalies(input: any, ctx: ExecutionContext) {
    ctx.logger.info('Tool: detect_cost_anomalies', input);
    return this.anomalyAgent.execute(input);
  }

  @Tool({
    name: 'estimate_carbon_emissions',
    description: 'Calculate cloud workload Scope 2 GHG emissions in kg CO2e and energy in kWh using regional grid carbon intensity factors and PUE overhead.',
    inputSchema: z.object({
      numDays: z.number().int().min(1).max(90).default(30).describe('Observation window in days'),
      dataMode: z.enum(['synthetic', 'aws_cur', 'gcp_billing']).default('synthetic'),
    }),
  })
  async estimateCarbonEmissions(input: any, ctx: ExecutionContext) {
    ctx.logger.info('Tool: estimate_carbon_emissions', input);
    return this.carbonAgent.execute(input);
  }

  @Tool({
    name: 'get_model_evaluation',
    description: 'Retrieve measured forecasting model evaluation metrics (MAE, RMSE, MAPE) across single split and rolling-origin cross-validation folds.',
    inputSchema: z.object({
      numDays: z.number().int().min(7).max(90).default(30),
      dataMode: z.enum(['synthetic', 'aws_cur', 'gcp_billing']).default('synthetic'),
    }),
  })
  async getModelEvaluation(input: any, ctx: ExecutionContext) {
    ctx.logger.info('Tool: get_model_evaluation', input);
    return this.pythonBridge.executeAction('model_evaluation', input);
  }

  @Tool({
    name: 'compare_cloud_regions',
    description: 'Compare candidate cloud regions for workload execution across price ($/vCPU-hr), grid carbon intensity (gCO2/kWh), PUE, and latency bounds.',
    inputSchema: z.object({
      vcpus: z.number().int().min(1).max(128).default(4),
      hours: z.number().int().min(1).max(720).default(24),
      allowedRegions: z.array(z.string()).optional(),
      maxLatencyTier: z.enum(['Low', 'Medium', 'High']).optional(),
      dataResidencyRequired: z.string().optional(),
    }),
  })
  async compareCloudRegions(input: any, ctx: ExecutionContext) {
    ctx.logger.info('Tool: compare_cloud_regions', input);
    return this.regionAgent.execute(input);
  }

  @Tool({
    name: 'analyze_budget_risk',
    description: 'Audit monthly spend projections against budget thresholds, verify read-only guardrails, and check compliance with data policies.',
    inputSchema: z.object({
      monthlyBudgetUsd: z.number().positive().default(500),
      projectedMonthlySpendUsd: z.number().nonnegative().optional(),
      requestedAction: z.string().optional().describe('Proposed action, e.g. "terminate_instance" or "shift_region"'),
      targetRegion: z.string().optional(),
      dataResidencyPolicy: z.string().optional(),
    }),
  })
  async analyzeBudgetRisk(input: any, ctx: ExecutionContext) {
    ctx.logger.info('Tool: analyze_budget_risk', input);
    return this.governanceAgent.execute(input);
  }

  @Tool({
    name: 'validate_recommendation',
    description: 'Independently audit mathematical calculations, percentage ratios, deadline feasibility, and cluster capacity constraints.',
    inputSchema: z.object({
      recommendationType: z.enum(['cost_saving', 'schedule_shift', 'rightsizing', 'region_switch', 'forecast_budget']),
      proposedSavingUsd: z.number().optional(),
      baselineSpendUsd: z.number().optional(),
      proposedCostUsd: z.number().optional(),
      baselineCarbonKg: z.number().optional(),
      proposedCarbonKg: z.number().optional(),
      claimedSavingsPct: z.number().optional(),
      deadlineIso: z.string().optional(),
      completionIso: z.string().optional(),
      requiredVcpu: z.number().optional(),
      clusterCapacityVcpu: z.number().optional(),
      observedDays: z.number().optional(),
      minObservationDays: z.number().optional(),
    }),
  })
  async validateRecommendation(input: any, ctx: ExecutionContext) {
    ctx.logger.info('Tool: validate_recommendation', input);
    return this.verificationAgent.execute(input);
  }

  @Tool({
    name: 'generate_optimization_report',
    description: 'Orchestrate specialist agents for a user request and generate an audit-grade optimization report with executive briefings and caveats.',
    inputSchema: z.object({
      prompt: z.string().min(1).describe('The user optimization or investigation prompt'),
      dataMode: z.enum(['synthetic', 'aws_cur', 'gcp_billing']).default('synthetic'),
      monthlyBudgetUsd: z.number().positive().default(500),
    }),
  })
  async generateOptimizationReport(input: any, ctx: ExecutionContext) {
    ctx.logger.info('Tool: generate_optimization_report', input);
    const orch = await this.supervisorAgent.coordinate({
      prompt: input.prompt,
      dataMode: input.dataMode,
      monthlyBudgetUsd: input.monthlyBudgetUsd,
    });
    return this.reportingAgent.execute({ orchestrationResult: orch });
  }

  @Tool({
    name: 'get_audit_history',
    description: 'Retrieve the recorded multi-agent execution traces, routing decisions, tool calls, and verification outcomes.',
    inputSchema: z.object({
      limit: z.number().int().min(1).max(50).default(10),
    }),
  })
  async getAuditHistory(input: any, ctx: ExecutionContext) {
    ctx.logger.info('Tool: get_audit_history', input);
    const history = this.supervisorAgent.getAuditHistory();
    return {
      totalRecordedTraces: history.length,
      traces: history.slice(0, input.limit ?? 10),
    };
  }
}
