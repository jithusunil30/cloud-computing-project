/**
 * EcoFinOps AI - 12 Specialist Agents Architecture Interfaces & Types
 */

export type AgentStatus = 'configured' | 'ready' | 'running' | 'succeeded' | 'failed' | 'unavailable';

export type VerificationStatus = 'VERIFIED' | 'REJECTED' | 'NEEDS_MORE_DATA';

export interface AgentMetadata {
  id: string;
  name: string;
  role: string;
  description: string;
  authorizedTools: string[];
  status: AgentStatus;
}

export interface AgentProvenance {
  source: string;
  datasetLabel?: string;
  isSynthetic: boolean;
  timestamp: string;
  assumptions: string[];
}

export interface AgentResult<T = any> {
  agentId: string;
  agentName: string;
  status: 'succeeded' | 'failed' | 'degraded';
  durationMs: number;
  data: T;
  evidence: string[];
  provenance: AgentProvenance;
  warnings: string[];
  verificationNeeded: boolean;
}

export interface VerificationCheck {
  checkName: string;
  passed: boolean;
  details: string;
  expected?: any;
  actual?: any;
}

export interface VerificationResult {
  status: VerificationStatus;
  recommendationId?: string;
  checks: VerificationCheck[];
  reasons: string[];
  arithmeticVerified: boolean;
  constraintsSatisfied: boolean;
  unresolvedUncertainties: string[];
  timestamp: string;
}

export interface ExecutionTraceStep {
  stepIndex: number;
  agentId: string;
  agentName: string;
  task: string;
  toolsCalled: string[];
  status: 'succeeded' | 'failed' | 'skipped';
  durationMs: number;
  verificationStatus?: VerificationStatus;
  summary: string;
  timestamp: string;
}

export interface OrchestrationResult {
  requestId: string;
  userPrompt: string;
  requestClassification: string;
  selectedAgents: string[];
  executionTrace: ExecutionTraceStep[];
  findings: Record<string, any>;
  verificationSummary: {
    status: VerificationStatus;
    verifiedRecommendationsCount: number;
    rejectedRecommendationsCount: number;
  };
  executiveSummary: string;
  unresolvedIssues: string[];
  totalDurationMs: number;
}
