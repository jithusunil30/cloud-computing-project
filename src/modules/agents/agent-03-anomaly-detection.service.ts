import { Injectable } from '@nitrostack/core';
import { AgentMetadata, AgentResult } from './agent.interface.js';
import { PythonBridgeService } from './python-bridge.service.js';

export interface AnomalyDetectionInput {
  numDays?: number;
  contamination?: number;
  dataMode?: 'synthetic' | 'aws_cur' | 'gcp_billing';
}

export interface AnomalyDetectionOutput {
  totalAnomaliesDetected: number;
  idleZombieCount: number;
  totalEstimatedWasteUsd: number;
  anomalies: Array<{
    timestamp: string;
    instance_id: string;
    instance_type: string;
    region: string;
    hourly_cost_usd: number;
    cpu_utilization_pct: number;
    is_cost_spike: boolean;
    cost_zscore: number;
  }>;
  idleResources: Array<{
    instance_id: string;
    instance_type: string;
    region: string;
    idle_hours: number;
    wasted_cost_usd: number;
    wasted_kgco2e: number;
    avg_cpu_pct: number;
    recommendation: string;
  }>;
  investigationGuidance: string[];
}

@Injectable({ deps: [PythonBridgeService] })
export class CostAnomalyDetectionAgent {
  readonly metadata: AgentMetadata = {
    id: 'agent-03-anomaly-detection',
    name: 'Cost Anomaly Detection Agent',
    role: 'Spending Spike & Zombie Resource Detection',
    description: 'Detects unusual cost spikes using Isolation Forest and Z-score statistics, and identifies idle zombie resources accumulating waste.',
    authorizedTools: ['detect_cost_anomalies', 'analyze-resource-utilization'],
    status: 'ready',
  };

  constructor(private readonly pythonBridge: PythonBridgeService) {}

  async execute(input: AnomalyDetectionInput = {}): Promise<AgentResult<AnomalyDetectionOutput>> {
    const startTime = Date.now();
    const numDays = input.numDays ?? 30;
    const contamination = input.contamination ?? 0.03;
    const dataMode = input.dataMode ?? 'synthetic';

    const pyResult = await this.pythonBridge.executeAction('anomalies', {
      num_days: numDays,
      contamination,
      data_mode: dataMode,
    });

    const output: AnomalyDetectionOutput = {
      totalAnomaliesDetected: pyResult.anomaly_count ?? 0,
      idleZombieCount: pyResult.idle_instance_count ?? 0,
      totalEstimatedWasteUsd: pyResult.total_estimated_waste_usd ?? 0,
      anomalies: pyResult.anomalies ?? [],
      idleResources: pyResult.idle_resources ?? [],
      investigationGuidance: [
        'Distinguish statistically detected anomalies from verified operational spikes (e.g. batch jobs vs misconfigured loops).',
        'Check memory and network metrics before terminating idle instances; CPU alone does not guarantee a safe shutdown.',
        'Review zombie instances with >100 idle hours for immediate decommissioning or rightsizing.',
      ],
    };

    return {
      agentId: this.metadata.id,
      agentName: this.metadata.name,
      status: 'succeeded',
      durationMs: Date.now() - startTime,
      data: output,
      evidence: [
        ...(pyResult.evidence ?? []),
        `Total idle waste identified: $${output.totalEstimatedWasteUsd} USD across ${output.idleZombieCount} zombie resources.`,
        `Detected ${output.totalAnomaliesDetected} statistical cost spikes requiring operator investigation.`,
      ],
      provenance: {
        source: 'Multivariate Isolation Forest (sklearn) & Statistical Z-Score Threshold Engine',
        isSynthetic: dataMode === 'synthetic',
        timestamp: new Date().toISOString(),
        assumptions: [
          'Idle resources defined as <10% average CPU while incurring >$0.03/hr cost.',
          'Cost spikes flagged when cost z-score exceeds 2.5 standard deviations above baseline mean.',
        ],
      },
      warnings: output.totalAnomaliesDetected > 10 ? [`High anomaly density detected (${output.totalAnomaliesDetected} spikes); verify whether cluster underwent scheduled load testing.`] : [],
      verificationNeeded: output.totalEstimatedWasteUsd > 0,
    };
  }
}
