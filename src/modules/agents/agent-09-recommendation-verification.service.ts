import { Injectable } from '@nitrostack/core';
import { AgentMetadata, AgentResult, VerificationResult, VerificationCheck, VerificationStatus } from './agent.interface.js';

export interface VerificationInput {
  recommendationType: 'cost_saving' | 'schedule_shift' | 'rightsizing' | 'region_switch' | 'forecast_budget';
  proposedSavingUsd?: number;
  baselineSpendUsd?: number;
  proposedCostUsd?: number;
  baselineCarbonKg?: number;
  proposedCarbonKg?: number;
  claimedSavingsPct?: number;
  deadlineIso?: string;
  completionIso?: string;
  requiredVcpu?: number;
  clusterCapacityVcpu?: number;
  observedDays?: number;
  minObservationDays?: number;
}

@Injectable()
export class RecommendationVerificationAgent {
  readonly metadata: AgentMetadata = {
    id: 'agent-09-recommendation-verification',
    name: 'Recommendation Verification Agent',
    role: 'Independent Mathematical & Constraint Audit',
    description: 'Independently verifies calculations, baselines, arithmetic percentages, deadline constraints, and cluster capacity before recommendations are marked verified.',
    authorizedTools: ['validate_recommendation'],
    status: 'ready',
  };

  async execute(input: VerificationInput): Promise<AgentResult<VerificationResult>> {
    const startTime = Date.now();
    const checks: VerificationCheck[] = [];
    const reasons: string[] = [];
    let status: VerificationStatus = 'VERIFIED';
    let arithmeticVerified = true;
    let constraintsSatisfied = true;
    const unresolvedUncertainties: string[] = [];

    // Check 1: Baseline comparison & non-negative savings check
    if (input.baselineSpendUsd !== undefined && input.proposedCostUsd !== undefined) {
      const calculatedSavings = Math.round((input.baselineSpendUsd - input.proposedCostUsd) * 100) / 100;
      if (input.proposedSavingUsd !== undefined) {
        const delta = Math.abs(calculatedSavings - input.proposedSavingUsd);
        const mathMatches = delta <= 0.05; // 5 cent rounding tolerance
        checks.push({
          checkName: 'Arithmetic Savings Match',
          passed: mathMatches,
          details: mathMatches
            ? `Calculated savings ($${calculatedSavings}) matches claimed savings ($${input.proposedSavingUsd}).`
            : `Mismatch detected! Baseline ($${input.baselineSpendUsd}) - Proposed ($${input.proposedCostUsd}) = $${calculatedSavings}, but claimed $${input.proposedSavingUsd}.`,
          expected: calculatedSavings,
          actual: input.proposedSavingUsd,
        });

        if (!mathMatches) {
          status = 'REJECTED';
          arithmeticVerified = false;
          reasons.push('Claimed dollar savings contradicts independent baseline arithmetic calculation.');
        }
      }
    }

    // Check 2: Percentage calculation check
    if (input.claimedSavingsPct !== undefined && input.baselineSpendUsd && input.baselineSpendUsd > 0 && input.proposedSavingUsd !== undefined) {
      const truePct = (input.proposedSavingUsd / input.baselineSpendUsd) * 100;
      const pctMatches = Math.abs(truePct - input.claimedSavingsPct) <= 0.5;
      checks.push({
        checkName: 'Percentage Ratio Accuracy',
        passed: pctMatches,
        details: pctMatches
          ? `Claimed percentage (${input.claimedSavingsPct}%) matches true ratio (${truePct.toFixed(1)}%).`
          : `Discrepancy: claimed ${input.claimedSavingsPct}%, arithmetic yields ${truePct.toFixed(1)}%.`,
        expected: Math.round(truePct * 10) / 10,
        actual: input.claimedSavingsPct,
      });

      if (!pctMatches) {
        status = 'REJECTED';
        arithmeticVerified = false;
        reasons.push('Claimed percentage improvement diverges from calculated baseline ratio.');
      }
    }

    // Check 3: Carbon delta check
    if (input.baselineCarbonKg !== undefined && input.proposedCarbonKg !== undefined) {
      const carbonDelta = input.baselineCarbonKg - input.proposedCarbonKg;
      checks.push({
        checkName: 'Carbon Delta Sign Check',
        passed: true,
        details: carbonDelta >= 0
          ? `Carbon reduction verified: ${carbonDelta.toFixed(3)} kgCO2e saved.`
          : `Carbon trade-off identified: emissions increase by ${(-carbonDelta).toFixed(3)} kgCO2e.`,
        expected: '>= 0 or disclosed trade-off',
        actual: carbonDelta,
      });
    }

    // Check 4: Deadline feasibility constraint
    if (input.deadlineIso && input.completionIso) {
      const meetsDeadline = input.completionIso <= input.deadlineIso;
      checks.push({
        checkName: 'Deadline Compliance Check',
        passed: meetsDeadline,
        details: meetsDeadline
          ? `Workload finishes at ${input.completionIso}, on or before deadline ${input.deadlineIso}.`
          : `VIOLATION: Workload finishes at ${input.completionIso}, after deadline ${input.deadlineIso}!`,
        expected: `<= ${input.deadlineIso}`,
        actual: input.completionIso,
      });

      if (!meetsDeadline) {
        status = 'REJECTED';
        constraintsSatisfied = false;
        reasons.push(`Hard constraint violated: workload completion exceeds deadline (${input.completionIso} > ${input.deadlineIso}).`);
      }
    }

    // Check 5: Cluster capacity constraint
    if (input.requiredVcpu !== undefined && input.clusterCapacityVcpu !== undefined) {
      const capacityValid = input.requiredVcpu <= input.clusterCapacityVcpu;
      checks.push({
        checkName: 'Cluster Capacity Bound Check',
        passed: capacityValid,
        details: capacityValid
          ? `Required vCPU (${input.requiredVcpu}) within cluster limit (${input.clusterCapacityVcpu}).`
          : `VIOLATION: Required vCPU (${input.requiredVcpu}) exceeds cluster limit (${input.clusterCapacityVcpu})!`,
        expected: `<= ${input.clusterCapacityVcpu}`,
        actual: input.requiredVcpu,
      });

      if (!capacityValid) {
        status = 'REJECTED';
        constraintsSatisfied = false;
        reasons.push('Capacity constraint violated: required vCPU exceeds cluster maximum capacity.');
      }
    }

    // Check 6: Observation sufficiency check
    if (input.observedDays !== undefined && input.minObservationDays !== undefined) {
      if (input.observedDays < input.minObservationDays) {
        checks.push({
          checkName: 'Observation Period Sufficiency',
          passed: false,
          details: `Only ${input.observedDays} days observed, but ${input.minObservationDays} days required for confident classification.`,
          expected: `>= ${input.minObservationDays}`,
          actual: input.observedDays,
        });
        status = 'NEEDS_MORE_DATA';
        unresolvedUncertainties.push(`Observation window too short (${input.observedDays}/${input.minObservationDays} days).`);
      }
    }

    if (checks.length === 0) {
      status = 'NEEDS_MORE_DATA';
      reasons.push('Insufficient quantitative metrics supplied to perform deterministic validation.');
    } else if (status === 'VERIFIED') {
      reasons.push('All mathematical, constraint, baseline, and deadline assertions passed independent verification.');
    }

    const verificationResult: VerificationResult = {
      status,
      checks,
      reasons,
      arithmeticVerified,
      constraintsSatisfied,
      unresolvedUncertainties,
      timestamp: new Date().toISOString(),
    };

    return {
      agentId: this.metadata.id,
      agentName: this.metadata.name,
      status: 'succeeded',
      durationMs: Date.now() - startTime,
      data: verificationResult,
      evidence: [
        `Executed ${checks.length} independent verification checks. Outcome: ${status}.`,
        ...reasons,
      ],
      provenance: {
        source: 'Independent Deterministic Verification Engine (Isolated Audit Pass)',
        isSynthetic: false,
        timestamp: new Date().toISOString(),
        assumptions: [
          'Validation executed independently from generating agents.',
          'Rejects any recommendation violating hard constraints or showing arithmetic divergence.',
        ],
      },
      warnings: status !== 'VERIFIED' ? reasons : [],
      verificationNeeded: false,
    };
  }
}
