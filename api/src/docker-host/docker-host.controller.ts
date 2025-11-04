import { Body, Controller, Get, Param, Post, Patch, Delete } from '@nestjs/common';
import { DockerHostService } from './docker-host.service';
import { CreateDockerHostDto } from './dto/create-docker-host.dto';
import { DockerService } from '../docker/docker.service'; 
import { Public } from 'src/auth/decorator/public.decorator';

@Controller('docker-hosts')
@Public()
export class DockerHostController {
  constructor(
    private readonly dockerHostService: DockerHostService,
    private readonly dockerService: DockerService, 
  ) {}

  @Post()
  create(@Body() dto: CreateDockerHostDto) {
    return this.dockerHostService.create(dto);
  }

  @Get()
  findAll() {
    return this.dockerHostService.findAll();
  }

  @Get(':code')
  findOne(@Param('code') code: string) {
    return this.dockerHostService.findByCode(code);
  }

  @Patch(':code')
  update(@Param('code') code: string, @Body() data: Partial<CreateDockerHostDto>) {
    return this.dockerHostService.updateByCode(code, data);
  }

  @Delete(':code')
  async remove(@Param('code') code: string) {
    return this.dockerHostService.removeByCode(code);
  }

  // ⬇️ NUEVO: probar conexión sin guardar
  @Post('test')
  async testConnection(@Body() body: {
    baseUrl: string;
    basicUser?: string;
    basicPass?: string;
  }) {
    // reusamos la lógica que ya hicimos en docker.service, pero con datos en crudo
    return this.dockerService.testRawConnection(body);
  }
}
