import { Module } from '@nestjs/common';
import { MetricsService } from './metrics.service.js';
import { MetricsController } from './metrics.controller.js';
import { MetricsGateway } from './metrics.gateway.js';

@Module({
  providers: [MetricsService, MetricsGateway],
  controllers: [MetricsController],
  exports: [MetricsService],
})
export class MetricsModule {}
