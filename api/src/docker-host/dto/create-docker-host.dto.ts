import { IsArray, IsBoolean, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateDockerHostDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsUrl()
  baseUrl: string;

  @IsOptional()
  @IsString()
  basicUser?: string;

  @IsOptional()
  @IsString()
  basicPass?: string;

  @IsOptional()
  @IsString()
  bearerToken?: string;

  @IsOptional()
  @IsArray()
  allowedOps?: string[];

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
