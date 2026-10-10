import { ToolDecorator as Tool, Widget, Injectable, ExecutionContext, z } from '@nitrostack/core';
import { SchedulerService } from './scheduler.service.js';

@Injectable({ deps: [SchedulerService] })
export class OptimizationTools {
  constructor(private readonly scheduler: SchedulerService) {}

  @Tool({
    name: 'compare-workload-schedules',
    description:
      'Compare immediate, cost-aware, carbon-aware, and combined (weighted) execution schedules for a flexible workload. Respects deadline and cluster capacity. Returns estimated cost (USD), estimated operational emissions (kgCO2e), deltas vs the immediate baseline, candidate windows, methodology and assumptions. Recommendation only — does not execute workloads.',
    inputSchema: z.object({
      workloadId: z.string().min(1).describe('Workload identifier, e.g. wl-nightly-etl-001'),
      weights: z
        .object({
          cost: z.number().min(0).max(1).describe('Cost weight 0–1'),
          carbon: z.number().min(0).max(1).describe('Carbon weight 0–1'),
        })
        .optional()
        .describe('Weights for the combined strategy (normalized to sum 1). Default cost 0.5, carbon 0.5.'),
      maxCandidates: z.number().int().min(1).max(48).default(24).describe('Max candidate windows returned'),
    }),
  })
  @Widget('schedule-comparison')
  async compareWorkloadSchedules(input: any, ctx: ExecutionContext) {
    const cost = input.weights?.cost ?? 0.5;
    const carbon = input.weights?.carbon ?? 0.5;
    ctx.logger.info('compare-workload-schedules', { workloadId: input.workloadId, cost, carbon });
    return this.scheduler.compare(input.workloadId, cost, carbon, input.maxCandidates ?? 24);
  }
}
