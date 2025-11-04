// src/docker-host/docker-host.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DockerHost, DockerHostDocument } from './schemas/docker-host.schema';
import { CreateDockerHostDto } from './dto/create-docker-host.dto';

@Injectable()
export class DockerHostService {
    constructor(
        @InjectModel(DockerHost.name)
        private dockerHostModel: Model<DockerHostDocument>,
    ) { }

    create(dto: CreateDockerHostDto) {
        return this.dockerHostModel.create(dto);
    }

    findAll() {
        return this.dockerHostModel.find({}).lean();
    }

    // NUEVO: solo los activos
    findAllEnabled() {
        return this.dockerHostModel.find({ enabled: true }).lean();
    }

    async findByCode(code: string) {
        const host = await this.dockerHostModel.findOne({ code }).lean();
        if (!host) throw new NotFoundException('Host no encontrado');
        return host;
    }

    // NUEVO: el que vamos a usar desde DockerService
    async findEnabledByCode(code: string) {
        const host = await this.dockerHostModel
            .findOne({ code, enabled: true })
            .lean();
        if (!host) {
            throw new NotFoundException(
                `Host "${code}" no encontrado o está deshabilitado`,
            );
        }
        return host;
    }

    async updateByCode(code: string, data: Partial<CreateDockerHostDto>) {
        const host = await this.dockerHostModel.findOneAndUpdate(
            { code },
            data,
            { new: true },
        );
        if (!host) throw new NotFoundException('Host no encontrado');
        return host;
    }

    async removeByCode(code: string) {
        const result = await this.dockerHostModel.findOneAndDelete({ code });
        if (!result) throw new NotFoundException('Host no encontrado');
        return { ok: true, message: `Host '${code}' eliminado correctamente` };
    }
}
