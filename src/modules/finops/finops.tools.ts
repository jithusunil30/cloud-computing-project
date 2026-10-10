import { ToolDecorator as Tool, Widget, Injectable, ExecutionContext, z } from '@nitrostack/core';
import { FinopsService } from './finops.service.js';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');

@Injectable({ deps: [FinopsService] })
export class FinopsTools {
  constructor(private readonly finops: FinopsService) {}

  @Tool({
    name: 'analyze-resource-utilization',
    description:
      'Analyze cloud resource utilization over a date period (and optional region) to find persistently underutilized resources and sudden usage increases. Returns per-resource cost (USD), average CPU %, p95 peak CPU %, low-utilization day counts, classification, estimated waste (USD) with explicit assumptions, and dataset provenance. Read-only; recommendations only.',
    inputSchema: z.object({
      startDate: isoDate.describe('Period start date, inclusive (YYYY-MM-DD, UTC), e.g. 2026-09-01'),
      endDate: isoDate.describe('Period end date, inclusive (YYYY-MM-DD, UTC), e.g. 2026-09-30'),
      region: z.string().optional().describe('Cloud region filter, e.g. us-east-1. Omit for all regions.'),
      cpuThresholdPct: z.number().min(1).max(90).default(10).describe('Daily average CPU % below which a day counts as low-utilization'),
      minObservationDays: z.number().int().min(3).max(365).default(14).describe('Minimum observed days before a resource can be classified'),
      persistenceShare: z.number().min(0.5).max(1).default(0.9).describe('Share of observed days that must be low for "persistent-low" (0.5–1)'),
      limit: z.number().int().min(1).max(50).default(20).describe('Max resources returned'),
      offset: z.number().int().min(0).default(0).describe('Pagination offset'),
    }),
  })
  @Widget('resource-utilization')
  async analyzeResourceUtilization(input: any, ctx: ExecutionContext) {
    ctx.logger.info('analyze-resource-utilization', {
      startDate: input.startDate,
      endDate: input.endDate,
      region: input.region ?? 'all',
    });
    return this.finops.analyzeUtilization({
      startDate: input.startDate,
      endDate: input.endDate,
      region: input.region,
      cpuThresholdPct: input.cpuThresholdPct ?? 10,
      minObservationDays: input.minObservationDays ?? 14,
      persistenceShare: input.persistenceShare ?? 0.9,
      limit: input.limit ?? 20,
      offset: input.offset ?? 0,
    });
  }
}
