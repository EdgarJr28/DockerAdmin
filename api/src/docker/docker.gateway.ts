// src/docker/docker.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { DockerService } from './docker.service';

type LogsPayload = {
  hostId: string;
  containerId: string;
};

type StatsPayload = {
  hostId: string;
  containerId: string;
  intervalMs?: number;
};

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/docker',
})
@Injectable()
export class DockerGateway {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(DockerGateway.name);

  constructor(private readonly dockerSvc: DockerService) {}

  @SubscribeMessage('logs:subscribe')
  async handleLogs(
    @MessageBody() body: LogsPayload,
    @ConnectedSocket() client: Socket,
  ) {
    const { hostId, containerId } = body;
    this.logger.debug(`logs:subscribe ${hostId}/${containerId}`);

    try {
      const stream = await this.dockerSvc.logsStream(hostId, containerId);

      const onClientDisconnect = () => {
        stream.destroy?.();
      };
      client.on('disconnect', onClientDisconnect);

      stream.on('data', (chunk: Buffer) => {
        client.emit('logs:data', {
          hostId,
          containerId,
          text: chunk.toString('utf8'),
        });
      });

      stream.on('end', () => {
        client.emit('logs:end', { hostId, containerId });
        client.off('disconnect', onClientDisconnect);
      });

      stream.on('error', (err: any) => {
        this.logger.error(err);
        client.emit('logs:error', {
          hostId,
          containerId,
          message: err?.message || 'error logs',
        });
        client.off('disconnect', onClientDisconnect);
      });
    } catch (err: any) {
      this.logger.error(err);
      client.emit('logs:error', {
        hostId,
        containerId,
        message: err?.message || 'error opening logs',
      });
    }
  }

  @SubscribeMessage('stats:subscribe')
  async handleStats(
    @MessageBody() body: StatsPayload,
    @ConnectedSocket() client: Socket,
  ) {
    const { hostId, containerId } = body;
    this.logger.debug(`stats:subscribe ${hostId}/${containerId}`);

    try {
      // ESTA ES TU LÍNEA
      const stream = await this.dockerSvc.statsStream(hostId, containerId);

      const onClientDisconnect = () => {
        stream.destroy?.();
      };
      client.on('disconnect', onClientDisconnect);

      stream.on('data', (chunk: Buffer) => {
        try {
          const json = JSON.parse(chunk.toString('utf8'));
          client.emit('stats:data', {
            hostId,
            containerId,
            stats: json,
          });
        } catch {
          // a veces viene partido
        }
      });

      stream.on('end', () => {
        client.emit('stats:end', { hostId, containerId });
        client.off('disconnect', onClientDisconnect);
      });

      stream.on('error', (err: any) => {
        this.logger.error(err);
        client.emit('stats:error', {
          hostId,
          containerId,
          message: err?.message || 'error stats',
        });
        client.off('disconnect', onClientDisconnect);
      });
    } catch (err: any) {
      this.logger.error(err);
      client.emit('stats:error', {
        hostId,
        containerId,
        message: err?.message || 'error opening stats',
      });
    }
  }
}
