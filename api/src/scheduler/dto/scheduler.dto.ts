// src/scheduler/dto/create-schedule.dto.ts
import { IsBoolean, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateScheduleDto {
  @IsString()
  @MinLength(5)
  expr!: string; // expresión CRON

  @IsString()
  @MinLength(1)
  target!: string; // p.ej. nombre del contenedor

  @IsOptional()
  @IsString()
  timezone?: string; // p.ej. "America/Bogota"

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  /** Nuevo: host asociado a la tarea (legacy permite omitirlo) */
  @IsOptional()
  @IsString()
  hostId?: string;

  /** Opcional: clase de objetivo (por ahora 'container', pero extensible) */
  @IsOptional()
  @IsIn(['container', 'url', 'script'])
  targetKind?: 'container' | 'url' | 'script';
}
