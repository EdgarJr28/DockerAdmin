// src/docker/docker.controller.ts
import { Controller, Get, Param, Post, Sse, UseGuards } from '@nestjs/common';
import { DockerService } from './docker.service';
import { ApiKeyGuard } from '../auth/guard/api-key.guard';
import { Observable, fromEvent, map, merge } from 'rxjs';
import { MessageEvent } from '@nestjs/common';
import { Public } from 'src/auth/decorator/public.decorator';

type IdParam = { id: string };
type HostParam = { hostId: string };

@Controller('docker')
@UseGuards(ApiKeyGuard)
@Public()
export class DockerController {
  constructor(private readonly svc: DockerService) { }

  @Get('hosts')
  listHosts() {
    return this.svc.listHosts();
  }

  @Get('hosts/:hostId/health')
  health(@Param() p: HostParam) {
    return this.svc.health(p.hostId);
  }

  @Get(':hostId/containers')
  list(@Param() p: HostParam) {
    return this.svc.listContainers(p.hostId, true);
  }

  @Get(':hostId/images')
  images(@Param() p: HostParam) {
    return this.svc.listImages(p.hostId);
  }

  @Post(':hostId/containers/:id/start')
  start(@Param() p: HostParam & IdParam) {
    return this.svc.start(p.hostId, p.id);
  }

  @Post(':hostId/containers/:id/stop')
  stop(@Param() p: HostParam & IdParam) {
    return this.svc.stop(p.hostId, p.id);
  }

  @Post(':hostId/containers/:id/restart')
  restart(@Param() p: HostParam & IdParam) {
    return this.svc.restart(p.hostId, p.id);
  }

  @Get(':hostId/containers/:id/stats')
  stats(@Param() p: HostParam & IdParam) {
    return this.svc.statsOnce(p.hostId, p.id);
  }

  @Sse(':hostId/containers/:id/logs')
  async logs(
    @Param() p: HostParam & IdParam,
  ): Promise<Observable<MessageEvent>> {
    const stream = await this.svc.logsStream(p.hostId, p.id);
    const data$ = merge(
      fromEvent<Buffer>(stream as any, 'data'),
      fromEvent(stream as any, 'end').pipe(
        map(() => Buffer.from('\n--end--\n')),
      ),
    ).pipe(map((chunk) => ({ data: chunk.toString('utf8') }) as MessageEvent));
    return data$;
  }
}
