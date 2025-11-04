import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DockerModule } from './docker/docker.module';
import { MetricsModule } from './metrics/metric.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { DockerHostModule } from './docker-host/docker-host.module';
import { AuthModule } from './auth/auth.module';
import { IamModule } from './iam/iam.module';

@Module({
  imports: [
    AuthModule,
    IamModule,
    DockerModule,
    DockerHostModule,
    MetricsModule,
    SchedulerModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://localhost:27017'),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
