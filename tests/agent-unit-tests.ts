/**
 * EcoFinOps AI - 12 Specialist Agents Unit Test Suite
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

async function runUnitTests() {
  console.log('\n======================================================');
  console.log('  ECOFINOPS AI - 12 AGENTS UNIT TEST SUITE');
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

  // Test Agent 1: FinOps Analyst
  console.log('--- Testing Agent 1: FinOps Analyst Agent ---');
  const res1 = await agent1.execute({ numDays: 7, dataMode: 'synthetic', monthlyBudgetUsd: 500 });
  assert(res1.status === 'succeeded', 'Agent 1 status succeeded');
  assert(res1.data.totalCostUsd > 0, `Agent 1 total spend > 0 ($${res1.data.totalCostUsd})`);
  assert(res1.data.budgetStatus.monthlyBudgetUsd === 500, 'Agent 1 budget correctly set to $500');
  assert(res1.provenance.isSynthetic === true, 'Agent 1 marks synthetic mode correctly');
  assert(res1.data.rankedRecommendations.length > 0, 'Agent 1 returns ranked recommendations');

  // Test Agent 2: Cost Forecasting
  console.log('\n--- Testing Agent 2: Cost Forecasting Agent ---');
  const res2 = await agent2.execute({ horizonHours: 24, modelType: 'Ridge' });
  assert(res2.status === 'succeeded', 'Agent 2 status succeeded');
  assert(res2.data.accumulatedForecastUsd > 0, `Agent 2 accumulated forecast > 0 ($${res2.data.accumulatedForecastUsd})`);
  assert(res2.data.predictions.length === 24, `Agent 2 returns 24 step predictions (got ${res2.data.predictions.length})`);
  assert(res2.data.predictions[0].ci_upper_usd >= res2.data.predictions[0].predicted_cost_usd, 'Prediction upper CI >= predicted');
  assert(res2.data.predictions[0].ci_lower_usd <= res2.data.predictions[0].predicted_cost_usd, 'Prediction lower CI <= predicted');

  // Test Agent 3: Cost Anomaly Detection
  console.log('\n--- Testing Agent 3: Cost Anomaly Detection Agent ---');
  const res3 = await agent3.execute({ numDays: 7, contamination: 0.03 });
  assert(res3.status === 'succeeded', 'Agent 3 status succeeded');
  assert(res3.data.totalAnomaliesDetected >= 0, `Agent 3 detected anomalies (${res3.data.totalAnomaliesDetected})`);
  assert(res3.data.idleZombieCount >= 0, `Agent 3 detected zombie resources (${res3.data.idleZombieCount})`);
  assert(res3.data.investigationGuidance.length > 0, 'Agent 3 provides investigation guidance');

  // Test Agent 4: Carbon Intelligence
  console.log('\n--- Testing Agent 4: Carbon Intelligence Agent ---');
  const res4 = await agent4.execute({ numDays: 7 });
  assert(res4.status === 'succeeded', 'Agent 4 status succeeded');
  assert(res4.data.totalCarbonKgco2e > 0, `Agent 4 estimated carbon > 0 (${res4.data.totalCarbonKgco2e} kgCO2e)`);
  assert(res4.data.totalEnergyKwh > 0, `Agent 4 energy consumed > 0 (${res4.data.totalEnergyKwh} kWh)`);
  assert(res4.provenance.assumptions[0].toLowerCase().includes('estimate'), 'Agent 4 explicitly states emissions are estimates');

  // Test Agent 5: Workload Scheduling
  console.log('\n--- Testing Agent 5: Workload Scheduling Agent ---');
  const res5 = await agent5.execute({ workloadId: 'wl-nightly-etl-001', costWeight: 0.5, carbonWeight: 0.5 });
  assert(res5.status === 'succeeded', 'Agent 5 status succeeded');
  assert(res5.data.isFeasible === true, 'Agent 5 workload scheduling is feasible');
  assert(res5.data.candidatesCount > 0, `Agent 5 evaluated candidates (${res5.data.candidatesCount})`);
  assert(res5.data.selectedStrategy.estimatedCostUsd !== undefined, 'Agent 5 returns estimated cost for strategy');

  // Test Agent 6: Resource Optimization
  console.log('\n--- Testing Agent 6: Resource Optimization Agent ---');
  const res6 = await agent6.execute({ startDate: '2026-09-01', endDate: '2026-09-30' });
  assert(res6.status === 'succeeded', 'Agent 6 status succeeded');
  assert(res6.data.resourcesAnalyzed > 0, `Agent 6 analyzed resources (${res6.data.resourcesAnalyzed})`);
  assert(res6.data.riskAssessment.safeToTerminateCount === 0, 'Agent 6 enforces safeguard: safeToTerminateCount = 0 on CPU alone');
  assert(res6.warnings[0].includes('CPU utilization alone is insufficient'), 'Agent 6 issues safeguard warning');

  // Test Agent 7: Cloud Region Intelligence
  console.log('\n--- Testing Agent 7: Cloud Region Intelligence Agent ---');
  const res7 = await agent7.execute({ vcpus: 4, hours: 24 });
  assert(res7.status === 'succeeded', 'Agent 7 status succeeded');
  assert(res7.data.eligibleRegions.length > 0, `Agent 7 compared eligible regions (${res7.data.eligibleRegions.length})`);
  assert(res7.data.bestCarbonRegion === 'us-west-2', `Agent 7 identifies us-west-2 (Oregon) as best carbon region (got ${res7.data.bestCarbonRegion})`);

  // Test Agent 8: Multi-Objective Optimization
  console.log('\n--- Testing Agent 8: Multi-Objective Optimization Agent ---');
  const res8 = await agent8.execute({ workloadId: 'wl-nightly-etl-001', costWeight: 0.8, carbonWeight: 0.2 });
  assert(res8.status === 'succeeded', 'Agent 8 status succeeded');
  assert(Math.abs(res8.data.normalizedWeights.cost + res8.data.normalizedWeights.carbon - 1.0) < 1e-6, 'Agent 8 weights normalized to sum to 1.0');
  assert(res8.data.paretoFrontier.length > 0, `Agent 8 identified Pareto optimal front (${res8.data.paretoFrontier.length} points)`);

  // Test Agent 9: Recommendation Verification Agent
  console.log('\n--- Testing Agent 9: Recommendation Verification Agent ---');
  // Scenario A: Valid recommendation
  const res9Valid = await agent9.execute({
    recommendationType: 'cost_saving',
    baselineSpendUsd: 100,
    proposedCostUsd: 80,
    proposedSavingUsd: 20,
    claimedSavingsPct: 20,
    deadlineIso: '2026-09-02T12:00:00Z',
    completionIso: '2026-09-02T08:00:00Z',
    requiredVcpu: 4,
    clusterCapacityVcpu: 32,
  });
  assert(res9Valid.data.status === 'VERIFIED', 'Agent 9 correctly marks valid arithmetic as VERIFIED');
  assert(res9Valid.data.arithmeticVerified === true, 'Agent 9 arithmeticVerified === true');
  assert(res9Valid.data.constraintsSatisfied === true, 'Agent 9 constraintsSatisfied === true');

  // Scenario B: Deliberate arithmetic distortion
  const res9Fraud = await agent9.execute({
    recommendationType: 'cost_saving',
    baselineSpendUsd: 100,
    proposedCostUsd: 80,
    proposedSavingUsd: 50, // Fraudulent claim: 100 - 80 = 20, but claims 50!
  });
  assert(res9Fraud.data.status === 'REJECTED', 'Agent 9 detects and REJECTS fraudulent arithmetic savings');
  assert(res9Fraud.data.arithmeticVerified === false, 'Agent 9 arithmeticVerified === false on discrepancy');

  // Scenario C: Deadline constraint violation
  const res9Deadline = await agent9.execute({
    recommendationType: 'schedule_shift',
    deadlineIso: '2026-09-02T10:00:00Z',
    completionIso: '2026-09-02T14:00:00Z', // 4 hours late!
  });
  assert(res9Deadline.data.status === 'REJECTED', 'Agent 9 REJECTS schedule violating deadline');
  assert(res9Deadline.data.constraintsSatisfied === false, 'Agent 9 constraintsSatisfied === false on deadline breach');

  // Test Agent 11: Cloud Governance and Risk Agent
  console.log('\n--- Testing Agent 11: Cloud Governance and Risk Agent ---');
  const res11Safe = await agent11.execute({
    monthlyBudgetUsd: 500,
    projectedMonthlySpendUsd: 420,
    requestedAction: 'read_only_analysis',
  });
  assert(res11Safe.data.overallCompliance === 'COMPLIANT', 'Agent 11 confirms compliant status under budget');
  assert(res11Safe.data.readOnlyGuardrailEnforced === true, 'Agent 11 enforces read-only guardrail');

  const res11Mutate = await agent11.execute({
    monthlyBudgetUsd: 500,
    projectedMonthlySpendUsd: 420,
    requestedAction: 'terminate_instance', // Mutating action!
  });
  assert(res11Mutate.data.approvalRequired === true, 'Agent 11 flags approvalRequired = true for destructive action');

  // Test Agent 10: Supervisor and Orchestration Agent
  console.log('\n--- Testing Agent 10: Supervisor and Orchestration Agent ---');
  const classBudget = agent10.classifyRequest('Help me plan our monthly cloud budget');
  assert(classBudget.classification === 'budget_planning', 'Agent 10 classifies budget request');
  assert(classBudget.agentIds.includes('agent-01-finops-analyst'), 'Agent 10 selects FinOps for budget request');
  assert(!classBudget.agentIds.includes('agent-05-workload-scheduling'), 'Agent 10 does NOT invoke scheduling for budget request (selective routing)');

  const classCarbon = agent10.classifyRequest('Estimate carbon emissions from workloads');
  assert(classCarbon.classification === 'carbon_assessment', 'Agent 10 classifies carbon request');

  const orchRes = await agent10.coordinate({
    prompt: 'Investigate spending anomalies and idle resources',
  });
  assert(orchRes.executionTrace.length > 0, `Agent 10 logged execution trace (${orchRes.executionTrace.length} steps)`);
  assert(orchRes.verificationSummary.status === 'VERIFIED', 'Agent 10 verification summary is VERIFIED');

  // Test Agent 12: Reporting and Explanation Agent
  console.log('\n--- Testing Agent 12: Reporting and Explanation Agent ---');
  const reportRes = await agent12.execute({ orchestrationResult: orchRes });
  assert(reportRes.status === 'succeeded', 'Agent 12 status succeeded');
  assert(reportRes.data.markdownContent.includes('# EcoFinOps AI Optimization & Audit Report'), 'Agent 12 generates full markdown report');
  assert(reportRes.data.executionTrace.length > 0, 'Agent 12 includes execution trace in report');

  console.log('\n======================================================');
  console.log(`  UNIT TESTS COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runUnitTests().catch((err) => {
  console.error('Fatal error running unit tests:', err);
  process.exit(1);
});
