import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DockerHost, DockerHostSchema } from './schemas/docker-host.schema';
import { DockerHostService } from './docker-host.service';
import { DockerHostController } from './docker-host.controller';
import { DockerModule } from 'src/docker/docker.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DockerHost.name, schema: DockerHostSchema },
    ]),
    forwardRef(() => DockerModule),
  ],
  providers: [DockerHostService],
  controllers: [DockerHostController],
  exports: [
    MongooseModule,     // ⬅️ exporto el modelo
    DockerHostService,  // opcional pero útil
  ],
})
export class DockerHostModule { }
