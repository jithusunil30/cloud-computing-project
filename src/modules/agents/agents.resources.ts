import { ResourceDecorator as Resource, Injectable, ExecutionContext } from '@nitrostack/core';
import { SupervisorOrchestrationAgent } from './agent-10-supervisor.service.js';

@Injectable({ deps: [SupervisorOrchestrationAgent] })
export class AgentsResources {
  constructor(private readonly supervisorAgent: SupervisorOrchestrationAgent) {}

  @Resource({
    uri: 'audit://history',
    name: 'Audit Execution History',
    description: 'Chronological multi-agent execution traces, routing decisions, tool calls, and verification outcomes.',
    mimeType: 'application/json',
  })
  async getAuditHistoryResource(ctx: ExecutionContext) {
    ctx.logger.info('Resource: audit://history');
    return {
      traces: this.supervisorAgent.getAuditHistory(),
      timestamp: new Date().toISOString(),
    };
  }

  @Resource({
    uri: 'methodology://carbon',
    name: 'Carbon Accounting Methodology',
    description: 'Documentation of GHG Protocol Scope 2 location-based carbon estimation formulas and data sources.',
    mimeType: 'text/markdown',
  })
  async getCarbonMethodologyResource(ctx: ExecutionContext) {
    ctx.logger.info('Resource: methodology://carbon');
    return {
      title: 'EcoFinOps AI Carbon Accounting Methodology',
      framework: 'GHG Protocol Scope 2 Guidance (Location-Based Accounting)',
      formulas: [
        'Power (Watts) = P_idle + (TDP_Watts - P_idle) * (CPU_Util / 100)',
        'Energy (kWh) = (Power_Watts * PUE * Usage_Hours) / 1000',
        'Emissions (kg CO2e) = (Energy_kWh * Grid_Carbon_Intensity_gCO2e_kWh) / 1000',
      ],
      disclaimer: 'All carbon figures are software-based model estimates, not direct hardware sensor meter readings.',
    };
  }

  @Resource({
    uri: 'widget://examples',
    name: 'EcoFinOps Widget Examples',
    description: 'Pre-configured demonstrations for widgets and visual components.',
    mimeType: 'application/json',
  })
  async getWidgetExamplesResource(ctx: ExecutionContext) {
    ctx.logger.info('Resource: widget://examples');
    return {
      availableWidgets: [
        {
          id: 'resource-utilization',
          route: '/resource-utilization',
          description: 'Interactive fleet resource utilization, rightsizing candidate table, and p95 peak CPU charts.',
        },
        {
          id: 'schedule-comparison',
          route: '/schedule-comparison',
          description: 'Side-by-side comparison of immediate baseline, cost-aware, and carbon-aware workload schedules.',
        },
        {
          id: 'ecofinops-dashboard',
          route: '/dashboard',
          description: 'Unified 12-agent monitoring console with real-time execution trace, FinOps metrics, and exportable reports.',
        },
      ],
    };
  }
}
