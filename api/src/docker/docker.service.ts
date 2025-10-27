import Docker from 'dockerode';
import { Injectable } from '@nestjs/common';


@Injectable()
export class DockerService {
    private docker: Docker;
    constructor() {
        const host = process.env.DOCKER_HOST || 'http://socket-proxy:2375';
        this.docker = new Docker({ host, port: 2375 });
    }


    listContainers(all = true) {
        return this.docker.listContainers({ all });
    }


    get(id: string) {
        return this.docker.getContainer(id);
    }


    async start(id: string) {
        await this.get(id).start();
        return { ok: true };
    }


    async stop(id: string) {
        await this.get(id).stop();
        return { ok: true };
    }


    async restart(id: string) {
        await this.get(id).restart();
        return { ok: true };
    }


    stats(id: string) {
        return this.get(id).stats({ stream: false });
    }


    async logsStream(id: string) {
        const c = this.get(id);
        return c.logs({ follow: true, stdout: true, stderr: true, tail: 200 });
    }
}