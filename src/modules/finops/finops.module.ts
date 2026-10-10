import { Module } from '@nitrostack/core';
import { FinopsService } from './finops.service.js';
import { FinopsTools } from './finops.tools.js';

@Module({
  name: 'finops',
  description: 'Resource utilization analysis and FinOps reporting',
  controllers: [FinopsTools],
  providers: [FinopsService],
})
export class FinopsModule {}
