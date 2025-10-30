// src/app/libs/socket.ts
import socketIOClient from "socket.io-client";

const API = process.env.NEXT_PUBLIC_API_URL!;
const KEY = process.env.NEXT_PUBLIC_API_KEY || "";
const TOKEN =
  typeof window !== "undefined"
    ? localStorage.getItem("token") // si usas auth JWT
    : null;

// Mapa global de conexiones (una por namespace)
const sockets: Record<string, ReturnType<typeof socketIOClient>> = {};

/**
 * Obtiene o crea una conexión de socket.io para un namespace.
 * Ej: getSocket("/metrics"), getSocket("/scheduler")
 */
export function getSocket(namespace: string = "/") {
  if (!sockets[namespace]) {
    sockets[namespace] = socketIOClient(`${API}${namespace}`, {
      transports: ["websocket"],
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1500,
      auth: {
        apiKey: KEY,
        token: TOKEN,
      },
    });

    const sock = sockets[namespace];

    sock.on("connect", () =>
      console.log(`🔌 Connected to ${namespace}:`, sock.id)
    );

    sock.on("disconnect", (reason: any) =>
      console.log(`⚠️ Disconnected from ${namespace}:`, reason)
    );

    sock.on("connect_error", (err: any) =>
      console.error(`❌ Socket error on ${namespace}:`, err.message)
    );
  }

  return sockets[namespace];
}

/**
 * Cierra manualmente una conexión por namespace.
 */
export function closeSocket(namespace: string = "/") {
  const sock = sockets[namespace];
  if (sock) {
    sock.disconnect();
    delete sockets[namespace];
  }
}
