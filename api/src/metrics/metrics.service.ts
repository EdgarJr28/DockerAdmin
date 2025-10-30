// api/src/metrics/metrics.service.ts
import { Injectable } from '@nestjs/common';
import Docker from 'dockerode';
import os from 'node:os';
import { exec as _exec } from 'node:child_process';
import { promisify } from 'node:util';
const exec = promisify(_exec);

function sampleCpu() {
  const cpus = os.cpus();
  let idle = 0, total = 0;
  for (const c of cpus) {
    idle += c.times.idle;
    total += c.times.user + c.times.nice + c.times.sys + c.times.irq + c.times.idle;
  }
  return { idle, total };
}
async function cpuPercent(windowMs = 200) {
  const a = sampleCpu();
  await new Promise(r => setTimeout(r, windowMs));
  const b = sampleCpu();
  const idle = b.idle - a.idle;
  const total = b.total - a.total;
  return total > 0 ? (1 - idle / total) * 100 : 0;
}

@Injectable()
export class MetricsService {
  private dockerClient: Docker;
  constructor() {
    // Usa el mismo host de tu DockerService (socket-proxy con INFO=1, CONTAINERS=1, SYSTEM=1)
    const host = process.env.DOCKER_HOST || 'http://socket-proxy:2375';
    this.dockerClient = new Docker({ host, port: 2375 });
  }

  async host() {
    // CPU (muestra rápida), RAM, load, uptime, disco raíz
    const [cpu, mem, load, disk] = await Promise.all([
      cpuPercent(250),
      Promise.resolve({
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
      }),
      Promise.resolve({ one: os.loadavg()[0], five: os.loadavg()[1], fifteen: os.loadavg()[2] }),
      this.diskRoot(),
    ]);
    return {
      cpuPercent: cpu,
      memory: { ...mem, percent: mem.total ? (mem.used / mem.total) * 100 : 0 },
      load,
      uptimeSec: os.uptime(),
      platform: os.platform(),
      arch: os.arch(),
      hostname: os.hostname(),
      disk: disk, // { total, used, free, percent }
    };
  }

  private async diskRoot() {
    // Linux: df -kP /
    try {
      const { stdout } = await exec('df -kP /');
      // Filesystem 1024-blocks Used Available Capacity Mounted on
      const line = stdout.trim().split('\n')[1]?.split(/\s+/);
      if (!line) throw new Error('df parse');
      const total = Number(line[1]) * 1024;
      const used = Number(line[2]) * 1024;
      const free = Number(line[3]) * 1024;
      const percent = total ? (used / total) * 100 : 0;
      return { total, used, free, percent };
    } catch {
      return { total: 0, used: 0, free: 0, percent: 0 };
    }
  }

  async docker() {
    // Requiere socket-proxy con INFO=1, CONTAINERS=1
    const [info, containers] = await Promise.all([
      this.dockerClient.info(), // version, counts, etc.
      this.dockerClient.listContainers({ all: true }),
    ]);

    const running = containers.filter(c => c.State?.toLowerCase() === 'running').length;
    const restarting = containers.filter(c => c.State?.toLowerCase() === 'restarting').length;
    const paused = containers.filter(c => c.State?.toLowerCase() === 'paused').length;
    const stopped = containers.length - running - restarting - paused;

    return {
      serverVersion: info.ServerVersion,
      containers: {
        total: info.Containers,
        running,
        paused,
        stopped,
        restarting,
      },
      images: info.Images, // solo lectura desde /info
      driver: info.Driver,
      os: info.OperatingSystem,
      ncpu: info.NCPU,
      memTotal: info.MemTotal,
    };
  }
}
