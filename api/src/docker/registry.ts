export type DockerHostType = "SOCKET_PROXY" | "TCP" | "TLS_TCP";

export interface DockerHostConfig {
  id: string; // "wayuu-dev", "albafire-prod"
  name: string; // etiqueta
  type: DockerHostType;
  baseUrl?: string; // SOCKET_PROXY: ej. "http://socket-proxy:2375"
  tcpHost?: string; // TLS_TCP
  tcpPort?: number; // 2376
  certPath?: string; // /run/secrets/docker-certs/<hostId>
  enabled: boolean;
  default: boolean;
}

// Empieza hardcode; luego lo puedes llevar a DB
export const HOSTS: DockerHostConfig[] = [
  {
    id: 'ins-wayuu',
    name: 'INS Wayuu (SSH)',
    type: 'SOCKET_PROXY',
    baseUrl: 'http://127.0.0.1:2375',
    enabled: true,
    default: false,
  },
];

export function getHostById(id: string): DockerHostConfig {
  const h = HOSTS.find((x) => x.id === id && x.enabled);
  if (!h) throw new Error('Host no permitido o deshabilitado');
  return h;
}

//ssh -N -L 127.0.0.1:2375:127.0.0.1:2375 ins-wayuu
