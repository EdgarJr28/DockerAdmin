import { Module } from '@nestjs/common';
import { MetricsService } from './metrics.service.js';
import { MetricsController } from './metrics.controller.js';
import { MetricsGateway } from './metrics.gateway.js';
import { HostsService } from '../docker/hosts.service.js';
import { DockerService } from '../docker/docker.service.js';
import { DockerModule } from '../docker/docker.module.js';

@Module({
  imports: [DockerModule], // ⬅️ aquí lo metes
  providers: [MetricsService, MetricsGateway, HostsService],
  controllers: [MetricsController],
  exports: [MetricsService],
})
export class MetricsModule { }
