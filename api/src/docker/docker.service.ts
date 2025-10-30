import Docker from 'dockerode';
import { Injectable } from '@nestjs/common';
import { getHostById } from './registry';
import { getDockerClientFor } from './client-factory';

@Injectable()
export class DockerService {
  private client(hostId: string): Docker {
    const host = getHostById(hostId);
    return getDockerClientFor(host);
  }

  listContainers(hostId: string, all = true) {
    return this.client(hostId).listContainers({ all });
  }

  async start(hostId: string, id: string) {
    const c = this.client(hostId).getContainer(id);
    await c.start();
    return { ok: true };
  }

  async stop(hostId: string, id: string) {
    const c = this.client(hostId).getContainer(id);
    await c.stop();
    return { ok: true };
  }

  async restart(hostId: string, id: string) {
    const c = this.client(hostId).getContainer(id);
    await c.restart();
    return { ok: true };
  }

  async stats(hostId: string, id: string) {
    const c = this.client(hostId).getContainer(id);
    // Nota: dockerode stats devuelve stream; ajusta a tu formato
    // Aquí devuelve el JSON puntual (si lo implementaste así)
    return c.stats({ stream: false });
  }

  async logsStream(hostId: string, id: string) {
    const c = this.client(hostId).getContainer(id);
    // Devuelve stream (stdout/stderr)
    return c.logs({ follow: true, stdout: true, stderr: true, tail: 200 });
  }
}
