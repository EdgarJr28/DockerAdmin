import {
    Injectable,
    NotFoundException,
    Logger,
    BadRequestException,
} from '@nestjs/common';
import Docker from 'dockerode';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
    DockerHost,
    DockerHostDocument,
} from '../docker-host/schemas/docker-host.schema';
import * as https from 'https';
import * as url from 'url';

@Injectable()
export class DockerService {
    private readonly logger = new Logger(DockerService.name);

    constructor(
        @InjectModel(DockerHost.name)
        private readonly hostModel: Model<DockerHostDocument>,
    ) { }

    // ====== helpers ======
    private normalizeBaseUrl(raw: string): string {
        if (!raw) return raw;
        const base = raw.trim();

        // tu caso especial
        if (base.startsWith('http://test-caracterizacion.epsianaswayuu.com/')) {
            return base.replace('http://', 'https://');
        }

        return base;
    }

    /**
     * Convierte los errores feos de docker / proxy / nginx en algo que el front pueda mostrar.
     * Siempre logea el error original.
     */
    private wrapDockerError(e: any, ctx: { hostId?: string; action?: string }) {
        // Log completo para ti
        this.logger.error(
            `Docker error [${ctx.action ?? 'unknown'}] host=${ctx.hostId ?? '-'}: ${e?.message || e
            }`,
            e?.stack,
        );

        // Si es un HTML de Nginx / proxy (lo que te pasaba):
        const msg = String(e?.message || '');
        if (msg.includes('HTTP code 404') && msg.includes('<!DOCTYPE html>')) {
            throw new BadRequestException(
                `El proxy Docker respondió 404. Revisa que la ruta termine en /dockerd/ y que el host permita /v1.XX/*`,
            );
        }

        // Si es de conexión TLS
        if (msg.includes('self signed') || msg.includes('certificate')) {
            throw new BadRequestException(
                `No se pudo establecer conexión TLS con el daemon Docker remoto (certificado).`,
            );
        }

        // Para todo lo demás, un mensaje genérico
        throw new BadRequestException(
            `No se pudo completar la operación en Docker (${ctx.action ?? 'operación'}).`,
        );
    }

    private async client(hostId: string): Promise<Docker> {
        const host = await this.hostModel
            .findOne({ code: hostId, enabled: true })
            .lean();

        if (!host) {
            throw new NotFoundException(
                `Host '${hostId}' no encontrado o deshabilitado`,
            );
        }

        this.logger.debug(
            `Host from DB (${hostId}): baseUrl='${host.baseUrl}', type='${host.type}'`,
        );

        const baseUrl = this.normalizeBaseUrl(host.baseUrl || '');
        this.logger.debug(`Host normalized (${hostId}): '${baseUrl}'`);

        // 1) socket
        if (baseUrl.startsWith('/')) {
            this.logger.debug(
                `Creating DOCKER client via socketPath=${baseUrl} (host=${hostId})`,
            );
            return new Docker({ socketPath: baseUrl });
        }

        // 2) http(s)
        const parsed = url.parse(baseUrl);
        const protocol = (parsed.protocol || 'http:').replace(':', ''); // http | https
        const hostname = parsed.hostname || 'localhost';
        const port = parsed.port || (protocol === 'https' ? '443' : '80');

        const headers: Record<string, string> = {};
        if (host.basicUser && host.basicPass) {
            headers['Authorization'] =
                'Basic ' +
                Buffer.from(`${host.basicUser}:${host.basicPass}`).toString('base64');
        }

        this.logger.debug(
            `Creating DOCKER client with protocol=${protocol}, host=${hostname}, port=${port}`,
        );

        if (protocol === 'https') {
            return new Docker({
                host: hostname,
                port: Number(port),
                protocol: 'https',
                headers: Object.keys(headers).length ? headers : undefined,
                agent: new https.Agent({
                    rejectUnauthorized: false,
                }),
            });
        } else {
            return new Docker({
                host: hostname,
                port: Number(port),
                protocol: 'http',
                headers: Object.keys(headers).length ? headers : undefined,
            });
        }
    }

    // ====== API pública ======

    async listHosts() {
        try {
            const docs = await this.hostModel
                .find({ enabled: true })
                .select(
                    'code name description type enabled baseUrl basicUser basicPass',
                )
                .lean();
            return docs.map((d) => ({
                id: d.code,
                name: d.name ?? d.code,
                description: d.description ?? '',
                type: d.type ?? 'proxy',
                enabled: d.enabled ?? true,
                baseUrl: this.normalizeBaseUrl(d.baseUrl || ''),
                hasAuth: !!(d.basicUser && d.basicPass),
            }));
        } catch (e) {
            this.logger.error('Error listando hosts', e as any);
            throw new BadRequestException('No se pudieron listar los hosts.');
        }
    }

    async health(hostId: string) {
        try {
            const cli = await this.client(hostId);
            const info = await cli.version();
            return {
                ok: true,
                version: info?.Version,
                apiVersion: info?.ApiVersion,
            };
        } catch (e) {
            this.wrapDockerError(e, { hostId, action: 'health' });
        }
    }

    async listContainers(hostId: string, all = true) {
        try {
            const cli = await this.client(hostId);
            return await cli.listContainers({ all });
        } catch (e) {
            this.wrapDockerError(e, { hostId, action: 'listContainers' });
        }
    }

    async start(hostId: string, id: string) {
        try {
            const cli = await this.client(hostId);
            await cli.getContainer(id).start();
            return { ok: true };
        } catch (e) {
            this.wrapDockerError(e, { hostId, action: `start:${id}` });
        }
    }

    async stop(hostId: string, id: string) {
        try {
            const cli = await this.client(hostId);
            await cli.getContainer(id).stop();
            return { ok: true };
        } catch (e) {
            this.wrapDockerError(e, { hostId, action: `stop:${id}` });
        }
    }

    async restart(hostId: string, id: string) {
        try {
            const cli = await this.client(hostId);
            await cli.getContainer(id).restart();
            return { ok: true };
        } catch (e) {
            this.wrapDockerError(e, { hostId, action: `restart:${id}` });
        }
    }

    async statsOnce(hostId: string, id: string) {
        try {
            const cli = await this.client(hostId);
            return await cli.getContainer(id).stats({ stream: false });
        } catch (e) {
            this.wrapDockerError(e, { hostId, action: `statsOnce:${id}` });
        }
    }

    async statsStream(hostId: string, id: string) {
        // aquí normalmente lo manejas en gateway/controller, pero igual lo protegemos
        try {
            const cli = await this.client(hostId);
            return await cli.getContainer(id).stats({ stream: true });
        } catch (e) {
            this.wrapDockerError(e, { hostId, action: `statsStream:${id}` });
        }
    }

    async listImages(hostId: string) {
        try {
            const cli = await this.client(hostId);
            return await cli.listImages();
        } catch (e) {
            this.wrapDockerError(e, { hostId, action: 'listImages' });
        }
    }

    async info(hostId: string) {
        try {
            const cli = await this.client(hostId);
            return await cli.info();
        } catch (e) {
            this.wrapDockerError(e, { hostId, action: 'info' });
        }
    }

    async logsStream(hostId: string, id: string) {
        try {
            const cli = await this.client(hostId);
            return await cli.getContainer(id).logs({
                follow: true,
                stdout: true,
                stderr: true,
                tail: 200,
            });
        } catch (e) {
            this.wrapDockerError(e, { hostId, action: `logsStream:${id}` });
        }
    }

    // validar antes de guardar
    async testRawConnection(input: {
        baseUrl: string;
        basicUser?: string;
        basicPass?: string;
    }) {
        try {
            const raw = input.baseUrl?.trim();
            if (!raw) {
                throw new BadRequestException('baseUrl es requerido');
            }

            const parsed = new URL(raw);
            const isHttps = parsed.protocol === 'https:';

            const cli = new Docker({
                protocol: isHttps ? 'https' : 'http',
                host: parsed.hostname,
                port: parsed.port ? Number(parsed.port) : isHttps ? 443 : 80,
                pathname: parsed.pathname, // /dockerd/
                headers:
                    input.basicUser && input.basicPass
                        ? {
                            Authorization:
                                'Basic ' +
                                Buffer.from(
                                    `${input.basicUser}:${input.basicPass}`,
                                ).toString('base64'),
                        }
                        : undefined,
                // si fuera https sin cert válido:
                ...(isHttps
                    ? {
                        agent: new https.Agent({
                            rejectUnauthorized: false,
                        }),
                    }
                    : {}),
            });

            const ver = await cli.version();
            return {
                ok: true,
                version: ver.Version,
                apiVersion: ver.ApiVersion,
            };
        } catch (e) {
            this.wrapDockerError(e, { action: 'testRawConnection' });
        }
    }
}
