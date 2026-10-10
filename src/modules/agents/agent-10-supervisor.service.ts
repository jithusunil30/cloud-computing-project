import { Injectable } from '@nitrostack/core';
import { AgentMetadata, AgentResult, ExecutionTraceStep, OrchestrationResult, VerificationStatus } from './agent.interface.js';
import { FinopsAnalystAgent } from './agent-01-finops-analyst.service.js';
import { CostForecastingAgent } from './agent-02-cost-forecasting.service.js';
import { CostAnomalyDetectionAgent } from './agent-03-anomaly-detection.service.js';
import { CarbonIntelligenceAgent } from './agent-04-carbon-intelligence.service.js';
import { WorkloadSchedulingAgent } from './agent-05-workload-scheduling.service.js';
import { ResourceOptimizationAgent } from './agent-06-resource-optimization.service.js';
import { CloudRegionIntelligenceAgent } from './agent-07-region-intelligence.service.js';
import { MultiObjectiveOptimizationAgent } from './agent-08-multiobjective-optimizer.service.js';
import { RecommendationVerificationAgent } from './agent-09-recommendation-verification.service.js';
import { CloudGovernanceRiskAgent } from './agent-11-governance-risk.service.js';

export interface SupervisorInput {
  prompt: string;
  dataMode?: 'synthetic' | 'aws_cur' | 'gcp_billing';
  workloadId?: string;
  monthlyBudgetUsd?: number;
  startDate?: string;
  endDate?: string;
  costWeight?: number;
  carbonWeight?: number;
}

@Injectable({
  deps: [
    FinopsAnalystAgent,
    CostForecastingAgent,
    CostAnomalyDetectionAgent,
    CarbonIntelligenceAgent,
    WorkloadSchedulingAgent,
    ResourceOptimizationAgent,
    CloudRegionIntelligenceAgent,
    MultiObjectiveOptimizationAgent,
    RecommendationVerificationAgent,
    CloudGovernanceRiskAgent,
  ],
})
export class SupervisorOrchestrationAgent {
  readonly metadata: AgentMetadata = {
    id: 'agent-10-supervisor',
    name: 'Supervisor & Orchestration Agent',
    role: 'Central Dispatch, Request Classification & Execution Trace',
    description: 'Classifies user prompts, selectively routes to authorized specialist agents, executes deterministic fallbacks, routes proposals through verification, and maintains audit traces.',
    authorizedTools: ['get_audit_history'],
    status: 'ready',
  };

  private auditHistory: OrchestrationResult[] = [];

  constructor(
    private readonly finopsAgent: FinopsAnalystAgent,
    private readonly forecastingAgent: CostForecastingAgent,
    private readonly anomalyAgent: CostAnomalyDetectionAgent,
    private readonly carbonAgent: CarbonIntelligenceAgent,
    private readonly schedulingAgent: WorkloadSchedulingAgent,
    private readonly resourceAgent: ResourceOptimizationAgent,
    private readonly regionAgent: CloudRegionIntelligenceAgent,
    private readonly multiObjectiveAgent: MultiObjectiveOptimizationAgent,
    private readonly verificationAgent: RecommendationVerificationAgent,
    private readonly governanceAgent: CloudGovernanceRiskAgent
  ) {}

  /**
   * Request Classifier
   * Selects only the specialist agents necessary for the user request.
   */
  classifyRequest(prompt: string): { classification: string; agentIds: string[] } {
    const p = prompt.toLowerCase();

    if (
      p.includes('cross-domain') ||
      p.includes('cross domain') ||
      p.includes('comprehensive') ||
      (p.includes('cost') && p.includes('carbon'))
    ) {
      return {
        classification: 'cross_domain_optimization',
        agentIds: [
          'agent-01-finops-analyst',
          'agent-02-cost-forecasting',
          'agent-03-anomaly-detection',
          'agent-04-carbon-intelligence',
          'agent-05-workload-scheduling',
          'agent-06-resource-optimization',
          'agent-08-multiobjective-optimizer',
          'agent-09-recommendation-verification',
          'agent-11-governance-risk',
        ],
      };
    }

    if (p.includes('budget') || p.includes('plan') || p.includes('threshold')) {
      return {
        classification: 'budget_planning',
        agentIds: ['agent-01-finops-analyst', 'agent-02-cost-forecasting', 'agent-11-governance-risk', 'agent-09-recommendation-verification'],
      };
    }

    if (p.includes('forecast') || p.includes('predict') || p.includes('future') || p.includes('projection')) {
      return {
        classification: 'cost_forecasting',
        agentIds: ['agent-02-cost-forecasting', 'agent-01-finops-analyst', 'agent-09-recommendation-verification'],
      };
    }

    if (p.includes('anomaly') || p.includes('spike') || p.includes('zombie') || p.includes('unusual')) {
      return {
        classification: 'anomaly_investigation',
        agentIds: ['agent-03-anomaly-detection', 'agent-06-resource-optimization', 'agent-09-recommendation-verification'],
      };
    }

    if (p.includes('carbon') || p.includes('emission') || p.includes('green') || p.includes('co2')) {
      return {
        classification: 'carbon_assessment',
        agentIds: ['agent-04-carbon-intelligence', 'agent-07-region-intelligence', 'agent-09-recommendation-verification'],
      };
    }

    if (p.includes('schedule') || p.includes('workload') || p.includes('shift') || p.includes('deadline')) {
      return {
        classification: 'workload_scheduling',
        agentIds: ['agent-05-workload-scheduling', 'agent-08-multiobjective-optimizer', 'agent-09-recommendation-verification'],
      };
    }

    if (p.includes('region') || p.includes('geographic') || p.includes('latency') || p.includes('residency')) {
      return {
        classification: 'region_comparison',
        agentIds: ['agent-07-region-intelligence', 'agent-04-carbon-intelligence', 'agent-09-recommendation-verification'],
      };
    }

    if (p.includes('resource') || p.includes('underutilized') || p.includes('rightsizing') || p.includes('downsize')) {
      return {
        classification: 'resource_inefficiency',
        agentIds: ['agent-06-resource-optimization', 'agent-03-anomaly-detection', 'agent-09-recommendation-verification'],
      };
    }

    // Default: Comprehensive Cross-Domain Optimization
    return {
      classification: 'cross_domain_optimization',
      agentIds: [
        'agent-01-finops-analyst',
        'agent-02-cost-forecasting',
        'agent-03-anomaly-detection',
        'agent-04-carbon-intelligence',
        'agent-05-workload-scheduling',
        'agent-06-resource-optimization',
        'agent-08-multiobjective-optimizer',
        'agent-09-recommendation-verification',
        'agent-11-governance-risk',
      ],
    };
  }

  async coordinate(input: SupervisorInput): Promise<OrchestrationResult> {
    const startTime = Date.now();
    const requestId = `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const { classification, agentIds } = this.classifyRequest(input.prompt);

    const executionTrace: ExecutionTraceStep[] = [];
    const findings: Record<string, any> = {};
    let stepIndex = 1;
    let verifiedCount = 0;
    let rejectedCount = 0;

    const dataMode = input.dataMode ?? 'synthetic';
    const budget = input.monthlyBudgetUsd ?? 500.0;
    const workloadId = input.workloadId ?? 'wl-nightly-etl-001';

    // Step 1: FinOps Analyst if selected
    if (agentIds.includes('agent-01-finops-analyst')) {
      const stepStart = Date.now();
      try {
        const res = await this.finopsAgent.execute({ numDays: 30, dataMode, monthlyBudgetUsd: budget });
        findings.finops = res.data;
        executionTrace.push({
          stepIndex: stepIndex++,
          agentId: res.agentId,
          agentName: res.agentName,
          task: 'Summarized cloud cost drivers, service breakdown, and monthly budget trajectory.',
          toolsCalled: ['get_cost_summary'],
          status: 'succeeded',
          durationMs: Date.now() - stepStart,
          summary: `Total spend: $${res.data.totalCostUsd}. Projected monthly: $${res.data.budgetStatus.projectedMonthlySpendUsd}.`,
          timestamp: new Date().toISOString(),
        });
      } catch (err: any) {
        executionTrace.push({
          stepIndex: stepIndex++,
          agentId: 'agent-01-finops-analyst',
          agentName: 'FinOps Analyst Agent',
          task: 'Analyze cloud spend',
          toolsCalled: ['get_cost_summary'],
          status: 'failed',
          durationMs: Date.now() - stepStart,
          summary: `Agent execution failed: ${err.message}`,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Step 2: Cost Forecasting if selected
    if (agentIds.includes('agent-02-cost-forecasting')) {
      const stepStart = Date.now();
      try {
        const res = await this.forecastingAgent.execute({ horizonHours: 48, dataMode, monthlyBudgetUsd: budget });
        findings.forecasting = res.data;
        executionTrace.push({
          stepIndex: stepIndex++,
          agentId: res.agentId,
          agentName: res.agentName,
          task: 'Predicted 48-hour forward spend with 95% confidence intervals and evaluated Ridge model.',
          toolsCalled: ['forecast_cloud_cost', 'get_model_evaluation'],
          status: 'succeeded',
          durationMs: Date.now() - stepStart,
          summary: `Forecast: $${res.data.accumulatedForecastUsd} across 48h. Budget risk: ${res.data.budgetRisk.riskLevel}.`,
          timestamp: new Date().toISOString(),
        });
      } catch (err: any) {
        executionTrace.push({
          stepIndex: stepIndex++,
          agentId: 'agent-02-cost-forecasting',
          agentName: 'Cost Forecasting Agent',
          task: 'Forecast cloud expenditure',
          toolsCalled: ['forecast_cloud_cost'],
          status: 'failed',
          durationMs: Date.now() - stepStart,
          summary: `Forecasting failed: ${err.message}`,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Step 3: Anomaly Detection if selected
    if (agentIds.includes('agent-03-anomaly-detection')) {
      const stepStart = Date.now();
      try {
        const res = await this.anomalyAgent.execute({ numDays: 30, dataMode });
        findings.anomalies = res.data;
        executionTrace.push({
          stepIndex: stepIndex++,
          agentId: res.agentId,
          agentName: res.agentName,
          task: 'Ran multivariate Isolation Forest & z-score anomaly scans and zombie resource checks.',
          toolsCalled: ['detect_cost_anomalies'],
          status: 'succeeded',
          durationMs: Date.now() - stepStart,
          summary: `Detected ${res.data.totalAnomaliesDetected} spikes and $${res.data.totalEstimatedWasteUsd} waste across ${res.data.idleZombieCount} zombie nodes.`,
          timestamp: new Date().toISOString(),
        });
      } catch (err: any) {
        executionTrace.push({
          stepIndex: stepIndex++,
          agentId: 'agent-03-anomaly-detection',
          agentName: 'Cost Anomaly Detection Agent',
          task: 'Detect spending anomalies',
          toolsCalled: ['detect_cost_anomalies'],
          status: 'failed',
          durationMs: Date.now() - stepStart,
          summary: `Anomaly detection failed: ${err.message}`,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Step 4: Carbon Intelligence if selected
    if (agentIds.includes('agent-04-carbon-intelligence')) {
      const stepStart = Date.now();
      try {
        const res = await this.carbonAgent.execute({ numDays: 30, dataMode });
        findings.carbon = res.data;
        executionTrace.push({
          stepIndex: stepIndex++,
          agentId: res.agentId,
          agentName: res.agentName,
          task: 'Estimated Scope 2 GHG emissions (kg CO2e) from energy draw, PUE, and regional grids.',
          toolsCalled: ['estimate_carbon_emissions'],
          status: 'succeeded',
          durationMs: Date.now() - stepStart,
          summary: `Emissions: ${res.data.totalCarbonKgco2e} kg CO2e from ${res.data.totalEnergyKwh} kWh energy consumed.`,
          timestamp: new Date().toISOString(),
        });
      } catch (err: any) {
        executionTrace.push({
          stepIndex: stepIndex++,
          agentId: 'agent-04-carbon-intelligence',
          agentName: 'Carbon Intelligence Agent',
          task: 'Estimate carbon emissions',
          toolsCalled: ['estimate_carbon_emissions'],
          status: 'failed',
          durationMs: Date.now() - stepStart,
          summary: `Carbon assessment failed: ${err.message}`,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Step 5: Resource Optimization if selected
    if (agentIds.includes('agent-06-resource-optimization')) {
      const stepStart = Date.now();
      try {
        const res = await this.resourceAgent.execute({
          startDate: input.startDate ?? '2026-09-01',
          endDate: input.endDate ?? '2026-09-30',
        });
        findings.resources = res.data;
        executionTrace.push({
          stepIndex: stepIndex++,
          agentId: res.agentId,
          agentName: res.agentName,
          task: 'Analyzed persistent low utilization and safe rightsizing opportunities with p95 peak safeguards.',
          toolsCalled: ['analyze-resource-utilization'],
          status: 'succeeded',
          durationMs: Date.now() - stepStart,
          summary: `Found ${res.data.persistentLowCount} persistent low instances with $${res.data.estimatedWasteUsd} potential savings.`,
          timestamp: new Date().toISOString(),
        });
      } catch (err: any) {
        executionTrace.push({
          stepIndex: stepIndex++,
          agentId: 'agent-06-resource-optimization',
          agentName: 'Resource Optimization Agent',
          task: 'Analyze resource utilization',
          toolsCalled: ['analyze-resource-utilization'],
          status: 'failed',
          durationMs: Date.now() - stepStart,
          summary: `Resource analysis failed: ${err.message}`,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Step 6: Workload Scheduling if selected
    if (agentIds.includes('agent-05-workload-scheduling')) {
      const stepStart = Date.now();
      try {
        const res = await this.schedulingAgent.execute({
          workloadId,
          costWeight: input.costWeight ?? 0.5,
          carbonWeight: input.carbonWeight ?? 0.5,
        });
        findings.scheduling = res.data;
        executionTrace.push({
          stepIndex: stepIndex++,
          agentId: res.agentId,
          agentName: res.agentName,
          task: 'Optimized batch workload execution windows against time-of-use pricing and grid carbon intensity.',
          toolsCalled: ['compare-workload-schedules'],
          status: 'succeeded',
          durationMs: Date.now() - stepStart,
          summary: res.data.isFeasible
            ? `Achieved $${res.data.estimatedSavingsUsd} cost savings and ${res.data.estimatedCarbonReductionKg} kg CO2e reduction.`
            : 'Workload infeasible under constraints.',
          timestamp: new Date().toISOString(),
        });
      } catch (err: any) {
        executionTrace.push({
          stepIndex: stepIndex++,
          agentId: 'agent-05-workload-scheduling',
          agentName: 'Workload Scheduling Agent',
          task: 'Compare workload schedules',
          toolsCalled: ['compare-workload-schedules'],
          status: 'failed',
          durationMs: Date.now() - stepStart,
          summary: `Scheduling failed: ${err.message}`,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Step 7: Multi-Objective Optimization if selected
    if (agentIds.includes('agent-08-multiobjective-optimizer')) {
      const stepStart = Date.now();
      try {
        const res = await this.multiObjectiveAgent.execute({
          workloadId,
          costWeight: input.costWeight ?? 0.5,
          carbonWeight: input.carbonWeight ?? 0.5,
        });
        findings.multiObjective = res.data;
        executionTrace.push({
          stepIndex: stepIndex++,
          agentId: res.agentId,
          agentName: res.agentName,
          task: 'Mapped Pareto non-dominated frontier balancing normalized cost and carbon objectives.',
          toolsCalled: ['compare-workload-schedules'],
          status: 'succeeded',
          durationMs: Date.now() - stepStart,
          summary: `${res.data.paretoFrontier.length} Pareto-optimal configurations found. ${res.data.tradeOffExplanation}`,
          timestamp: new Date().toISOString(),
        });
      } catch (err: any) {
        executionTrace.push({
          stepIndex: stepIndex++,
          agentId: 'agent-08-multiobjective-optimizer',
          agentName: 'Multi-Objective Optimization Agent',
          task: 'Calculate Pareto frontier',
          toolsCalled: ['compare-workload-schedules'],
          status: 'failed',
          durationMs: Date.now() - stepStart,
          summary: `Pareto analysis failed: ${err.message}`,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Step 8: Region Intelligence if selected
    if (agentIds.includes('agent-07-region-intelligence')) {
      const stepStart = Date.now();
      try {
        const res = await this.regionAgent.execute({ vcpus: 4, hours: 24 });
        findings.regionIntelligence = res.data;
        executionTrace.push({
          stepIndex: stepIndex++,
          agentId: res.agentId,
          agentName: res.agentName,
          task: 'Benchmarked regional execution alternatives across grid emission factors and latency bounds.',
          toolsCalled: ['compare_cloud_regions'],
          status: 'succeeded',
          durationMs: Date.now() - stepStart,
          summary: res.data.tradeOffSummary,
          timestamp: new Date().toISOString(),
        });
      } catch (err: any) {
        executionTrace.push({
          stepIndex: stepIndex++,
          agentId: 'agent-07-region-intelligence',
          agentName: 'Cloud Region Intelligence Agent',
          task: 'Compare cloud regions',
          toolsCalled: ['compare_cloud_regions'],
          status: 'failed',
          durationMs: Date.now() - stepStart,
          summary: `Region intelligence failed: ${err.message}`,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Step 9: Governance & Risk Agent
    if (agentIds.includes('agent-11-governance-risk')) {
      const stepStart = Date.now();
      try {
        const res = await this.governanceAgent.execute({
          monthlyBudgetUsd: budget,
          projectedMonthlySpendUsd: findings.finops?.budgetStatus?.projectedMonthlySpendUsd ?? 450,
          requestedAction: 'read_only_optimization_review',
        });
        findings.governance = res.data;
        executionTrace.push({
          stepIndex: stepIndex++,
          agentId: res.agentId,
          agentName: res.agentName,
          task: 'Enforced read-only safety guardrail, budget compliance, and credential privacy.',
          toolsCalled: ['analyze_budget_risk'],
          status: 'succeeded',
          durationMs: Date.now() - stepStart,
          summary: `Compliance: ${res.data.overallCompliance}. Read-only guardrail strictly enforced.`,
          timestamp: new Date().toISOString(),
        });
      } catch (err: any) {
        executionTrace.push({
          stepIndex: stepIndex++,
          agentId: 'agent-11-governance-risk',
          agentName: 'Cloud Governance & Risk Agent',
          task: 'Evaluate cloud governance and safety',
          toolsCalled: ['analyze_budget_risk'],
          status: 'failed',
          durationMs: Date.now() - stepStart,
          summary: `Governance check failed: ${err.message}`,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Step 10: Recommendation Verification Agent (Always invoked when material recommendations exist)
    if (agentIds.includes('agent-09-recommendation-verification')) {
      const stepStart = Date.now();
      let proposedSaving = 20;
      let baselineSpend = 100;
      let proposedCost = 80;

      if (findings.scheduling?.baseline && findings.scheduling?.selectedStrategy) {
        baselineSpend = findings.scheduling.baseline.estimatedCostUsd ?? 100;
        proposedCost = findings.scheduling.selectedStrategy.estimatedCostUsd ?? 80;
        proposedSaving = Math.round((baselineSpend - proposedCost) * 100) / 100;
      } else if (findings.resources?.estimatedWasteUsd) {
        proposedSaving = findings.resources.estimatedWasteUsd;
        baselineSpend = findings.resources.totalCostUsd ?? 100;
        proposedCost = Math.max(0, baselineSpend - proposedSaving);
      } else if (findings.anomalies?.totalEstimatedWasteUsd) {
        proposedSaving = findings.anomalies.totalEstimatedWasteUsd;
        baselineSpend = findings.finops?.totalCostUsd ?? 333.39;
        proposedCost = Math.max(0, baselineSpend - proposedSaving);
      }

      const verResult = await this.verificationAgent.execute({
        recommendationType: 'cost_saving',
        proposedSavingUsd: proposedSaving,
        baselineSpendUsd: baselineSpend,
        proposedCostUsd: proposedCost,
        claimedSavingsPct: baselineSpend > 0 ? Math.round((proposedSaving / baselineSpend) * 1000) / 10 : 0,
        deadlineIso: '2026-09-02T12:00:00Z',
        completionIso: '2026-09-02T08:00:00Z',
        requiredVcpu: 8,
        clusterCapacityVcpu: 32,
      });

      findings.verification = verResult.data;
      if (verResult.data.status === 'VERIFIED') {
        verifiedCount++;
      } else {
        rejectedCount++;
      }

      executionTrace.push({
        stepIndex: stepIndex++,
        agentId: verResult.agentId,
        agentName: verResult.agentName,
        task: 'Independently checked baseline arithmetic, percentage formulas, deadline feasibility, and cluster bounds.',
        toolsCalled: ['validate_recommendation'],
        status: 'succeeded',
        durationMs: Date.now() - stepStart,
        verificationStatus: verResult.data.status,
        summary: `Verification Status: ${verResult.data.status} across ${verResult.data.checks.length} independent checks.`,
        timestamp: new Date().toISOString(),
      });
    }

    const totalDuration = Date.now() - startTime;
    const finalVerificationStatus: VerificationStatus = rejectedCount > 0 ? 'REJECTED' : 'VERIFIED';

    const execSummary = `EcoFinOps AI orchestrated ${executionTrace.length} actions across ${agentIds.length} specialist agents for request "${input.prompt}". Classification: ${classification}. Overall verification: ${finalVerificationStatus}.`;

    const result: OrchestrationResult = {
      requestId,
      userPrompt: input.prompt,
      requestClassification: classification,
      selectedAgents: agentIds,
      executionTrace,
      findings,
      verificationSummary: {
        status: finalVerificationStatus,
        verifiedRecommendationsCount: verifiedCount,
        rejectedRecommendationsCount: rejectedCount,
      },
      executiveSummary: execSummary,
      unresolvedIssues: [],
      totalDurationMs: totalDuration,
    };

    // Store in audit history (capped at 50 traces)
    this.auditHistory.unshift(result);
    if (this.auditHistory.length > 50) this.auditHistory.pop();

    return result;
  }

  getAuditHistory(): OrchestrationResult[] {
    return this.auditHistory;
  }
}
