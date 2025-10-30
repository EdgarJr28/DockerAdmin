import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateScheduleDto {
  @IsString() expr!: string;             // "0 3 * * *"
  @IsString() target!: string;           // nombre/ID contenedor
  @IsOptional() @IsString() timezone?: string; // "America/Bogota"
  @IsOptional() @IsBoolean() enabled?: boolean;
}

