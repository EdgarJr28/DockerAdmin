// api/src/metrics/metrics.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { MetricsService } from './metrics.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/metrics',
})
export class MetricsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() io: Server;

  constructor(private readonly metricsService: MetricsService) {}

  afterInit() {
    console.log('✅ Metrics gateway initialized');
  }

  handleConnection(socket: any) {
    console.log(`📡 Client connected: ${socket.id}`);
    this.emitMetrics(socket);
  }

  handleDisconnect(socket: any) {
    console.log(`❌ Client disconnected: ${socket.id}`);
  }

  // Emitir métricas cada 5 s
  async emitMetrics(socket: any) {
    const interval = setInterval(async () => {
      try {
        const host = await this.metricsService.host();
        const docker = await this.metricsService.docker();

        socket.emit('metrics:update', { host, docker });
      } catch (err) {
        socket.emit('metrics:error', { message: err.message });
      }
    }, 5000);

    socket.on('disconnect', () => clearInterval(interval));
  }
}
