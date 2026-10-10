/**
 * EcoFinOps AI - 12 Specialist Agents End-to-End Integration Test Suite
 */

import { PythonBridgeService } from '../src/modules/agents/python-bridge.service.js';
import { FinopsAnalystAgent } from '../src/modules/agents/agent-01-finops-analyst.service.js';
import { CostForecastingAgent } from '../src/modules/agents/agent-02-cost-forecasting.service.js';
import { CostAnomalyDetectionAgent } from '../src/modules/agents/agent-03-anomaly-detection.service.js';
import { CarbonIntelligenceAgent } from '../src/modules/agents/agent-04-carbon-intelligence.service.js';
import { WorkloadSchedulingAgent } from '../src/modules/agents/agent-05-workload-scheduling.service.js';
import { ResourceOptimizationAgent } from '../src/modules/agents/agent-06-resource-optimization.service.js';
import { CloudRegionIntelligenceAgent } from '../src/modules/agents/agent-07-region-intelligence.service.js';
import { MultiObjectiveOptimizationAgent } from '../src/modules/agents/agent-08-multiobjective-optimizer.service.js';
import { RecommendationVerificationAgent } from '../src/modules/agents/agent-09-recommendation-verification.service.js';
import { SupervisorOrchestrationAgent } from '../src/modules/agents/agent-10-supervisor.service.js';
import { CloudGovernanceRiskAgent } from '../src/modules/agents/agent-11-governance-risk.service.js';
import { ReportingExplanationAgent } from '../src/modules/agents/agent-12-reporting-explanation.service.js';
import { FinopsService } from '../src/modules/finops/finops.service.js';
import { SchedulerService } from '../src/modules/optimization/scheduler.service.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName}${details ? ` - ${details}` : ''}`);
    failed++;
  }
}

async function runIntegrationTests() {
  console.log('\n======================================================');
  console.log('  ECOFINOPS AI - END-TO-END INTEGRATION TEST SUITE');
  console.log('======================================================\n');

  const pythonBridge = new PythonBridgeService();
  const finopsService = new FinopsService();
  const schedulerService = new SchedulerService();

  const agent1 = new FinopsAnalystAgent(pythonBridge);
  const agent2 = new CostForecastingAgent(pythonBridge);
  const agent3 = new CostAnomalyDetectionAgent(pythonBridge);
  const agent4 = new CarbonIntelligenceAgent(pythonBridge);
  const agent5 = new WorkloadSchedulingAgent(schedulerService);
  const agent6 = new ResourceOptimizationAgent(finopsService);
  const agent7 = new CloudRegionIntelligenceAgent(pythonBridge);
  const agent8 = new MultiObjectiveOptimizationAgent(schedulerService);
  const agent9 = new RecommendationVerificationAgent();
  const agent11 = new CloudGovernanceRiskAgent();
  const agent10 = new SupervisorOrchestrationAgent(
    agent1, agent2, agent3, agent4, agent5, agent6, agent7, agent8, agent9, agent11
  );
  const agent12 = new ReportingExplanationAgent();

  // Scenario 1: Cost investigation
  console.log('--- Scenario 1: Cost Investigation Workflow ---');
  const costInv = await agent10.coordinate({
    prompt: 'Investigate our monthly cloud cost drivers and major spenders',
    monthlyBudgetUsd: 500,
  });
  assert(costInv.requestClassification === 'cross_domain_optimization' || costInv.requestClassification.includes('cost'), 'Scenario 1: Correct classification');
  assert(costInv.findings.finops !== undefined, 'Scenario 1: FinOps findings included');
  assert(costInv.findings.finops.rankedRecommendations.length > 0, 'Scenario 1: Ranked recommendations present');

  // Scenario 2: Cost forecasting
  console.log('\n--- Scenario 2: Cost Forecasting & Evaluation ---');
  const forecastInv = await agent10.coordinate({
    prompt: 'Forecast cloud expenditure for next 48 hours and check budget risk',
  });
  assert(forecastInv.findings.forecasting !== undefined, 'Scenario 2: Forecasting findings included');
  assert(forecastInv.findings.forecasting.predictions.length > 0, 'Scenario 2: Forward predictions generated');
  assert(forecastInv.findings.forecasting.budgetRisk !== undefined, 'Scenario 2: Budget risk evaluated');

  // Scenario 3: Anomaly investigation
  console.log('\n--- Scenario 3: Anomaly Investigation ---');
  const anomalyInv = await agent10.coordinate({
    prompt: 'Investigate spending anomalies and identify zombie idle instances',
  });
  assert(anomalyInv.findings.anomalies !== undefined, 'Scenario 3: Anomaly detection executed');
  assert(anomalyInv.findings.anomalies.totalAnomaliesDetected >= 0, 'Scenario 3: Anomaly count reported');
  assert(anomalyInv.findings.anomalies.investigationGuidance.length > 0, 'Scenario 3: Investigation guidance present');

  // Scenario 4: Carbon assessment
  console.log('\n--- Scenario 4: Carbon Assessment & Provenance ---');
  const carbonInv = await agent10.coordinate({
    prompt: 'Estimate carbon emissions from our cloud infrastructure across regions',
  });
  assert(carbonInv.findings.carbon !== undefined, 'Scenario 4: Carbon findings present');
  assert(carbonInv.findings.carbon.totalCarbonKgco2e > 0, 'Scenario 4: Emissions quantified in kg CO2e');
  assert(carbonInv.findings.carbon.methodology.includes('Scope 2'), 'Scenario 4: Scope 2 methodology disclosed');

  // Scenario 5: Workload scheduling
  console.log('\n--- Scenario 5: Workload Scheduling Strategies ---');
  const schedInv = await agent10.coordinate({
    prompt: 'Schedule flexible nightly batch ETL workload for maximum efficiency',
    workloadId: 'wl-nightly-etl-001',
  });
  assert(schedInv.findings.scheduling !== undefined, 'Scenario 5: Scheduling findings present');
  assert(schedInv.findings.scheduling.allStrategies.immediate !== undefined, 'Scenario 5: Immediate baseline strategy present');
  assert(schedInv.findings.scheduling.allStrategies['cost-aware'] !== undefined, 'Scenario 5: Cost-aware strategy present');
  assert(schedInv.findings.scheduling.allStrategies['carbon-aware'] !== undefined, 'Scenario 5: Carbon-aware strategy present');

  // Scenario 6: Resource optimization
  console.log('\n--- Scenario 6: Resource Optimization & Safeguards ---');
  const resOpt = await agent6.execute({ startDate: '2026-09-01', endDate: '2026-09-30' });
  assert(resOpt.data.riskAssessment.safeToTerminateCount === 0, 'Scenario 6: Enforces no auto-termination on CPU alone');
  assert(resOpt.data.estimatedWasteUsd >= 0, 'Scenario 6: Estimated waste quantified');

  // Scenario 7: Region comparison
  console.log('\n--- Scenario 7: Region Comparison & Latency Constraints ---');
  const regionRes = await agent7.execute({ vcpus: 4, hours: 24, maxLatencyTier: 'Low' });
  assert(regionRes.data.eligibleRegions.every((r) => r.latency_tier === 'Low'), 'Scenario 7: Only low-latency regions returned');

  // Scenario 8: Recommendation verification
  console.log('\n--- Scenario 8: Recommendation Verification Audits ---');
  const verPass = await agent9.execute({
    recommendationType: 'cost_saving',
    baselineSpendUsd: 200,
    proposedCostUsd: 150,
    proposedSavingUsd: 50,
    claimedSavingsPct: 25,
    deadlineIso: '2026-09-02T12:00:00Z',
    completionIso: '2026-09-02T10:00:00Z',
    requiredVcpu: 4,
    clusterCapacityVcpu: 32,
  });
  assert(verPass.data.status === 'VERIFIED', 'Scenario 8A: Valid recommendation marked VERIFIED');

  const verFailMath = await agent9.execute({
    recommendationType: 'cost_saving',
    baselineSpendUsd: 200,
    proposedCostUsd: 150,
    proposedSavingUsd: 90, // Fraudulent claim: 200 - 150 = 50, not 90!
  });
  assert(verFailMath.data.status === 'REJECTED', 'Scenario 8B: Arithmetic fraud marked REJECTED');

  const verFailDeadline = await agent9.execute({
    recommendationType: 'schedule_shift',
    deadlineIso: '2026-09-02T08:00:00Z',
    completionIso: '2026-09-02T14:00:00Z', // Infeasible: after deadline
  });
  assert(verFailDeadline.data.status === 'REJECTED', 'Scenario 8C: Deadline breach marked REJECTED');

  // Scenario 9: Governance
  console.log('\n--- Scenario 9: Cloud Governance Hard Constraints ---');
  const govReject = await agent11.execute({
    monthlyBudgetUsd: 500,
    projectedMonthlySpendUsd: 650, // >20% budget overrun!
    requestedAction: 'terminate_ec2_instances', // Mutating action!
  });
  assert(govReject.data.overallCompliance === 'VIOLATION', 'Scenario 9: Severe budget breach marked VIOLATION');
  assert(govReject.data.approvalRequired === true, 'Scenario 9: Destructive action marked approvalRequired');

  // Scenario 10: Supervisor selective routing
  console.log('\n--- Scenario 10: Supervisor Selective Routing ---');
  const routeCheck = agent10.classifyRequest('Check our carbon emission levels in Europe');
  assert(routeCheck.classification === 'carbon_assessment', 'Scenario 10: Specific carbon classification');
  assert(routeCheck.agentIds.includes('agent-04-carbon-intelligence'), 'Scenario 10: Carbon agent included');
  assert(!routeCheck.agentIds.includes('agent-05-workload-scheduling'), 'Scenario 10: Unneeded scheduler omitted');

  // Scenario 11: Reporting
  console.log('\n--- Scenario 11: Optimization Report Synthesis ---');
  const fullReport = await agent12.execute({ orchestrationResult: costInv });
  assert(fullReport.data.reportId.startsWith('report-'), 'Scenario 11: Valid reportId generated');
  assert(fullReport.data.markdownContent.length > 500, 'Scenario 11: Comprehensive markdown report generated');

  // Scenario 12: Full cross-domain workflow
  console.log('\n--- Scenario 12: Full Cross-Domain End-to-End Workflow ---');
  const fullWorkflow = await agent10.coordinate({
    prompt: 'Perform comprehensive cross-domain optimization across cost, carbon, anomalies, and batch workloads',
    dataMode: 'synthetic',
    monthlyBudgetUsd: 500,
  });
  assert(fullWorkflow.executionTrace.length >= 7, `Scenario 12: Executed multi-agent pipeline (${fullWorkflow.executionTrace.length} steps)`);
  assert(fullWorkflow.verificationSummary.status === 'VERIFIED', 'Scenario 12: Independent verification successful');
  assert(fullWorkflow.totalDurationMs < 10000, `Scenario 12: Latency within SLA (${fullWorkflow.totalDurationMs}ms)`);

  console.log('\n======================================================');
  console.log(`  INTEGRATION TESTS COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runIntegrationTests().catch((err) => {
  console.error('Fatal error running integration tests:', err);
  process.exit(1);
});
