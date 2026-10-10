import { Module } from '@nitrostack/core';
import { PythonBridgeService } from './python-bridge.service.js';
import { FinopsAnalystAgent } from './agent-01-finops-analyst.service.js';
import { CostForecastingAgent } from './agent-02-cost-forecasting.service.js';
import { CostAnomalyDetectionAgent } from './agent-03-anomaly-detection.service.js';
import { CarbonIntelligenceAgent } from './agent-04-carbon-intelligence.service.js';
import { WorkloadSchedulingAgent } from './agent-05-workload-scheduling.service.js';
import { ResourceOptimizationAgent } from './agent-06-resource-optimization.service.js';
import { CloudRegionIntelligenceAgent } from './agent-07-region-intelligence.service.js';
import { MultiObjectiveOptimizationAgent } from './agent-08-multiobjective-optimizer.service.js';
import { RecommendationVerificationAgent } from './agent-09-recommendation-verification.service.js';
import { SupervisorOrchestrationAgent } from './agent-10-supervisor.service.js';
import { CloudGovernanceRiskAgent } from './agent-11-governance-risk.service.js';
import { ReportingExplanationAgent } from './agent-12-reporting-explanation.service.js';
import { AgentsTools } from './agents.tools.js';
import { AgentsResources } from './agents.resources.js';
import { FinopsModule } from '../finops/finops.module.js';
import { OptimizationModule } from '../optimization/optimization.module.js';

@Module({
  name: 'agents',
  description: 'EcoFinOps AI 12-Agent Multi-Agent Orchestration & Analytics Module',
  imports: [FinopsModule, OptimizationModule],
  providers: [
    PythonBridgeService,
    FinopsAnalystAgent,
    CostForecastingAgent,
    CostAnomalyDetectionAgent,
    CarbonIntelligenceAgent,
    WorkloadSchedulingAgent,
    ResourceOptimizationAgent,
    CloudRegionIntelligenceAgent,
    MultiObjectiveOptimizationAgent,
    RecommendationVerificationAgent,
    SupervisorOrchestrationAgent,
    CloudGovernanceRiskAgent,
    ReportingExplanationAgent,
    AgentsTools,
    AgentsResources,
  ],
  exports: [
    PythonBridgeService,
    FinopsAnalystAgent,
    CostForecastingAgent,
    CostAnomalyDetectionAgent,
    CarbonIntelligenceAgent,
    WorkloadSchedulingAgent,
    ResourceOptimizationAgent,
    CloudRegionIntelligenceAgent,
    MultiObjectiveOptimizationAgent,
    RecommendationVerificationAgent,
    SupervisorOrchestrationAgent,
    CloudGovernanceRiskAgent,
    ReportingExplanationAgent,
    AgentsTools,
    AgentsResources,
  ],
})
export class AgentsModule {}
