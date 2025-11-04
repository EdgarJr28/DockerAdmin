// api/src/metrics/metrics.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
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

  // guardamos los intervalos por socket
  private timers = new Map<string, NodeJS.Timeout>();

  constructor(private readonly metricsService: MetricsService) {}

  afterInit() {
    console.log('✅ Metrics gateway initialized');
  }

  handleConnection(socket: Socket) {
    console.log(`📡 Client connected: ${socket.id}`);

    // OJO: ya no llamamos this.emitMetrics(socket) aquí
    // esperamos a que el cliente diga qué host quiere
    socket.on('metrics:subscribe', ({ hostId } = { hostId: 'local' }) => {
      this.startEmitter(socket, hostId || 'local');
    });

    // si quieres un default cuando NO mandan nada:
    // this.startEmitter(socket, 'local');
  }

  handleDisconnect(socket: Socket) {
    console.log(`❌ Client disconnected: ${socket.id}`);
    const t = this.timers.get(socket.id);
    if (t) {
      clearInterval(t);
      this.timers.delete(socket.id);
    }
  }

  private startEmitter(socket: Socket, hostId: string) {
    // si ya había un intervalo para este socket, lo limpiamos
    const prev = this.timers.get(socket.id);
    if (prev) {
      clearInterval(prev);
    }

    console.log(`📊 ${socket.id} -> metrics for host '${hostId}'`);

    const timer = setInterval(async () => {
      try {
        // AQUÍ ya pasamos el hostId
        const host = await this.metricsService.host();
        const docker = await this.metricsService.docker(hostId);

        socket.emit('metrics:update', { host, docker });
      } catch (err: any) {
        socket.emit('metrics:error', {
          message: err.message,
          hostId,
        });
      }
    }, 5000);

    this.timers.set(socket.id, timer);
  }
}
