import fs from "node:fs";
import Docker from "dockerode";
import { DockerHostConfig } from "./registry";

const cache = new Map<string, Docker>();

export function getDockerClientFor(h: DockerHostConfig): Docker {
  if (cache.has(h.id)) return cache.get(h.id)!;

  let cli: Docker;
  if (h.type === "SOCKET_PROXY") {
    const u = new URL(h.baseUrl!);            // p.ej. http://socket-proxy:2375
    cli = new Docker({ host: u.hostname, port: Number(u.port || 2375), protocol: "http" });
  } else {
    // TLS TCP
    const ca   = fs.readFileSync(`${h.certPath}/ca.pem`);
    const cert = fs.readFileSync(`${h.certPath}/cert.pem`);
    const key  = fs.readFileSync(`${h.certPath}/key.pem`);
    cli = new Docker({ host: h.tcpHost!, port: h.tcpPort ?? 2376, ca, cert, key, protocol: "https" });
  }

  cache.set(h.id, cli);
  return cli;
}
