import { forwardRef, Module } from '@nestjs/common';
import { DockerService } from './docker.service.js';
import { DockerController } from './docker.controller.js';
import { HostsService } from './hosts.service.js';
import { DockerGateway } from './docker.gateway.js';
import { DockerHostService } from '../docker-host/docker-host.service.js';
import { DockerHostModule } from '../docker-host/docker-host.module.js';


@Module({
    imports: [forwardRef(() => DockerHostModule),],
    providers: [DockerService, DockerGateway, HostsService, DockerHostService],
    controllers: [DockerController],
    exports: [DockerService],
})
export class DockerModule { }