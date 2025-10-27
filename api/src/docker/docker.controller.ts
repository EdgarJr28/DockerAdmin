import { Controller, Get, Param, Post, Res, Sse, UseGuards } from '@nestjs/common';
import { DockerService } from './docker.service.js';
import { ApiKeyGuard } from '../auth/api-key.guard.js';
import { Observable, fromEvent, map, merge } from 'rxjs';


@Controller('docker')
@UseGuards(ApiKeyGuard)
export class DockerController {
    constructor(private readonly svc: DockerService) { }


    @Get('containers')
    list() {
        return this.svc.listContainers(true);
    }


    @Post('containers/:id/start')
    start(@Param('id') id: string) {
        return this.svc.start(id);
    }


    @Post('containers/:id/stop')
    stop(@Param('id') id: string) {
        return this.svc.stop(id);
    }


    @Post('containers/:id/restart')
    restart(@Param('id') id: string) {
        return this.svc.restart(id);
    }


    @Get('containers/:id/stats')
    stats(@Param('id') id: string) {
        return this.svc.stats(id);
    }


    @Sse('containers/:id/logs')
    async logs(@Param('id') id: string): Promise<Observable<MessageEvent>> {
        const stream = await this.svc.logsStream(id);
        const data$ = merge(
            fromEvent<Buffer>(stream as any, 'data'),
            fromEvent(stream as any, 'end').pipe(map(() => Buffer.from('\n--end--\n')))
        ).pipe(map((chunk) => ({ data: chunk.toString('utf8') } as MessageEvent)));
        return data$;
    }
}