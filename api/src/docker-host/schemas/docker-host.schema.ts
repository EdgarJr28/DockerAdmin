// src/docker-host/schemas/docker-host.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class DockerHost {
  @Prop({ required: true, unique: true })
  code: string;

  @Prop()
  name?: string;

  @Prop()
  baseUrl: string;

  @Prop()
  basicUser?: string;

  @Prop()
  basicPass?: string;

  @Prop({ default: true })
  enabled: boolean;

  // nuevos:
  @Prop()
  description?: string;

  @Prop()
  type?: string; // ej: 'docker-socket-proxy', 'remote-tcp', etc.
}

export type DockerHostDocument = DockerHost & Document;
export const DockerHostSchema = SchemaFactory.createForClass(DockerHost);
