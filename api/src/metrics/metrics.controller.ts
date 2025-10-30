// api/src/metrics/metrics.controller.ts
import { Controller, Get } from '@nestjs/common';
import { MetricsService } from './metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly svc: MetricsService) {}

  @Get('host')
  host() {
    return this.svc.host();
  }

  @Get('docker')
  docker() {
    return this.svc.docker();
  }
}
