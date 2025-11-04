// api/src/metrics/metrics.controller.ts
import { Controller, Get, Param } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { Public } from 'src/auth/decorator/public.decorator';

@Controller('metrics')
@Public()
export class MetricsController {
  constructor(private readonly svc: MetricsService) {}

/*   // legacy
  @Get('host')
  hostLegacy() {
    return this.svc.host();
  }

  @Get('docker')
  dockerLegacy() {
    return this.svc.docker();
  } */

  // multi-host
  @Get(':hostId/host')
  hostById(@Param('hostId') hostId: string) {
    return this.svc.host();
  }

  @Get(':hostId/docker')
  dockerById(@Param('hostId') hostId: string) {
    return this.svc.docker(hostId);
  }
}
