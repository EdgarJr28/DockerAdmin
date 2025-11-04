// api/src/metrics/metrics.service.ts
import { Injectable } from '@nestjs/common';
import si from 'systeminformation';
import { DockerService } from '../docker/docker.service';

@Injectable()
export class MetricsService {
  constructor(private readonly dockerService: DockerService) {}

  // 1. MÉTRICAS DE HARDWARE: siempre del host donde corre Nest
  async host() {
    const [currentLoad, mem, osInfo, fs] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.osInfo(),
      si.fsSize(),
    ]);

    const totalDisk = fs.reduce((acc, d) => acc + d.size, 0);
    const usedDisk = fs.reduce((acc, d) => acc + d.used, 0);

    return {
      hostId: 'local',
      cpuPercent: currentLoad.currentLoad,
      memory: {
        total: mem.total,
        free: mem.available,
        used: mem.total - mem.available,
        percent: ((mem.total - mem.available) / mem.total) * 100,
      },
      load: {
        one: currentLoad.avgLoad, // o si quieres si.currentLoad() no trae 1/5/15, puedes usar si.currentLoad().rawCurrentLoad
        five: 0,
        fifteen: 0,
      },
      uptimeSec: process.uptime(),
      platform: osInfo.platform,
      arch: osInfo.arch,
      hostname: osInfo.hostname,
      disk: {
        total: totalDisk,
        used: usedDisk,
        free: totalDisk - usedDisk,
        percent: (usedDisk / totalDisk) * 100,
      },
    };
  }

  // 2. MÉTRICAS DE DOCKER: AHORA SÍ según el hostId remoto
  async docker(hostId: string) {
    // usamos tu DockerService, que ya mira Mongo y crea Dockerode con baseUrl
    const list = await this.dockerService.listContainers(hostId, true);
    const info = await this.dockerService.info(hostId); // la vamos a crear abajo

    // Normalizamos
    return {
      hostId,
      serverVersion: info.ServerVersion,
      containers: {
        total: info.Containers,
        running: info.ContainersRunning,
        paused: info.ContainersPaused,
        stopped: info.ContainersStopped,
        restarting: 0,
      },
      images: info.Images,
      driver: info.Driver,
      os: info.OperatingSystem,
      ncpu: info.NCPU,
      memTotal: info.MemTotal,
    };
  }
}
