import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DockerModule } from './docker/docker.module';
import { SchedulerService } from './scheduler/scheduler.service';

@Module({
  imports: [DockerModule],
  controllers: [AppController],
  providers: [AppService, SchedulerService],
})
export class AppModule {}
