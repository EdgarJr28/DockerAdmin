// src/scheduler/scheduler.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { Public } from 'src/auth/decorator/public.decorator';

@Controller('scheduler')
@Public()
export class SchedulerController {
  constructor(private readonly svc: SchedulerService) {}


  // Lista TODAS las tareas (de todos los hosts)
  @Get('list')
  list() {
    return this.svc.list(); // devuelve con hostId en cada item
  }

  // Una tarea por id global
  @Get(':id')
  get(@Param('id') id: string) {
    return this.svc.get(id);
  }

  // Crear (legacy): si dto.hostId no viene, se usa DEFAULT_HOST_ID
  @Post()
  create(@Body() dto: CreateScheduleDto) {
    return this.svc.create(dto);
  }

  // Actualizar (expr/target/timezone/enabled)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateScheduleDto) {
    return this.svc.update(id, dto);
  }

  // Encender/apagar
  @Post(':id/enable')
  enable(@Param('id') id: string) {
    return this.svc.enable(id);
  }
  @Post(':id/disable')
  disable(@Param('id') id: string) {
    return this.svc.disable(id);
  }

  // Borrar
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.svc.remove(id);
  }

  /** ====== NUEVAS RUTAS HOST-AWARE ====== */

  // Lista tareas SOLO de un host
  @Get(':hostId/list/by-host')
  listByHost(@Param('hostId') hostId: string) {
    return this.svc.listByHost(hostId);
  }

  // Crear tarea para un host específico
  @Post(':hostId')
  createForHost(
    @Param('hostId') hostId: string,
    @Body() dto: CreateScheduleDto,
  ) {
    // dto.hostId se ignora si viene; prevalece el de la ruta
    return this.svc.createForHost(hostId, dto);
  }

  // Obtener una tarea por id, validando que pertenece al host (opcional)
  @Get(':hostId/:id')
  getInHost(@Param('hostId') hostId: string, @Param('id') id: string) {
    return this.svc.getInHost(hostId, id);
  }

  // Actualizar dentro de un host
  @Patch(':hostId/:id')
  updateInHost(
    @Param('hostId') hostId: string,
    @Param('id') id: string,
    @Body() dto: UpdateScheduleDto,
  ) {
    return this.svc.updateInHost(hostId, id, dto);
  }

  // Encender / apagar dentro de un host
  @Post(':hostId/:id/enable')
  enableInHost(@Param('hostId') hostId: string, @Param('id') id: string) {
    return this.svc.enableInHost(hostId, id);
  }
  @Post(':hostId/:id/disable')
  disableInHost(@Param('hostId') hostId: string, @Param('id') id: string) {
    return this.svc.disableInHost(hostId, id);
  }

  // Eliminar dentro de un host
  @Delete(':hostId/:id')
  removeInHost(@Param('hostId') hostId: string, @Param('id') id: string) {
    return this.svc.removeInHost(hostId, id);
  }
}
