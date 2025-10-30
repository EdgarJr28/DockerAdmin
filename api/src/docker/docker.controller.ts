// src/docker/docker.controller.ts
import { Controller, Get, Param, Post, Sse, UseGuards } from '@nestjs/common';
import { DockerService } from './docker.service';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { Observable, fromEvent, map, merge } from 'rxjs';
import { MessageEvent } from '@nestjs/common';
import { HOSTS } from './registry'; // ⬅️ importa tu registro

type IdParam = { id: string };
type HostParam = { hostId: string };

@Controller('docker')
@UseGuards(ApiKeyGuard)
export class DockerController {
  constructor(private readonly svc: DockerService) {}

  // ========= HOSTS =========

  /**
   * Lista de servidores (hostId) habilitados para el front.
   * Sanear: no exponer certPath/baseUrl si no quieres.
   */
  @Get('hosts')
  listHosts() {
    return HOSTS.filter((h) => h.enabled).map((h) => ({
      id: h.id,
      name: h.name,
      type: h.type,
      enabled: h.enabled,
    }));
  }

  /**
   * Salud rápida de un host (opcional): devuelve versión del daemon.
   * Útil para mostrar un badge verde/rojo en el select del front.
   */
  @Get('hosts/:hostId/health')
  async hostHealth(@Param() p: HostParam) {
    const docker = this.svc['client'](p.hostId); // o expón un getter público
    // devuelve info mínima que no exponga secretos
    const info = await docker.version();
    return { ok: true, version: info?.Version, apiVersion: info?.ApiVersion };
  }

  // ========= CONTENEDORES =========

  @Get(':hostId/containers')
  list(@Param() p: HostParam) {
    return this.svc.listContainers(p.hostId, true);
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
    return this.svc.stats(p.hostId, p.id);
  }

  @Sse(':hostId/containers/:id/logs')
  async logs(
    @Param() p: HostParam & IdParam,
  ): Promise<Observable<MessageEvent>> {
    const stream = await this.svc.logsStream(p.hostId, p.id);
    const data$ = merge(
      fromEvent<Buffer>(stream as unknown as NodeJS.EventEmitter, 'data'),
      fromEvent(stream as unknown as NodeJS.EventEmitter, 'end').pipe(
        map(() => Buffer.from('\n--end--\n')),
      ),
    ).pipe(map((chunk) => ({ data: chunk.toString('utf8') }) as MessageEvent));
    return data$;
  }
}
