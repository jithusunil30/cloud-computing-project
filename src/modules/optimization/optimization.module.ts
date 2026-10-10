import { Module } from '@nitrostack/core';
import { SchedulerService } from './scheduler.service.js';
import { OptimizationTools } from './optimization.tools.js';

@Module({
  name: 'optimization',
  description: 'Cost- and carbon-aware workload schedule comparison',
  controllers: [OptimizationTools],
  providers: [SchedulerService],
})
export class OptimizationModule {}
