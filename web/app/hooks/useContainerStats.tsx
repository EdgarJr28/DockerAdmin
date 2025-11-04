"use client";
import { useEffect, useState } from "react";
import { getSocket } from "@/app/libs/socket";
import { useDockerHost } from "@/app/store/docker-host";

type MappedStats = {
  read: string | null;
  cpuPercent: number | null;
  memUsage: number | null;
  memLimit: number | null;
  rxBytes: number | null;
  txBytes: number | null;
  pids: number | null;
};

export function useContainerStats(
  containerId: string,
  opts?: { enabled?: boolean; intervalMs?: number }
) {
  const { hostId } = useDockerHost();
  const enabled = opts?.enabled ?? true;
  const intervalMs = opts?.intervalMs ?? 3000;

  const [data, setData] = useState<MappedStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (!containerId) return;
    if (!hostId) return;

    const socket = getSocket("/docker");

    const handleData = (payload: any) => {
      // filtramos por host/contenedor
      if (
        payload?.hostId !== hostId ||
        payload?.containerId !== containerId
      ) {
        return;
      }

      const raw = payload.stats;
      if (!raw) return;

      // ====== Mapeo Docker -> nuestra forma ======
      const read: string | null = raw.read ?? null;

      // CPU %
      let cpuPercent: number | null = null;
      try {
        const cpuDelta =
          (raw.cpu_stats?.cpu_usage?.total_usage ?? 0) -
          (raw.precpu_stats?.cpu_usage?.total_usage ?? 0);
        const systemDelta =
          (raw.cpu_stats?.system_cpu_usage ?? 0) -
          (raw.precpu_stats?.system_cpu_usage ?? 0);
        const onlineCPUs =
          raw.cpu_stats?.online_cpus ??
          raw.cpu_stats?.cpu_usage?.percpu_usage?.length ??
          1;
        if (systemDelta > 0 && cpuDelta > 0) {
          cpuPercent = (cpuDelta / systemDelta) * onlineCPUs * 100;
        }
      } catch {
        cpuPercent = null;
      }

      // MEM
      const memUsage = raw.memory_stats?.usage ?? null;
      const memLimit = raw.memory_stats?.limit ?? null;

      // NET
      let rxBytes: number | null = null;
      let txBytes: number | null = null;
      if (raw.networks) {
        // suma de todas las ifaces
        rxBytes = 0;
        txBytes = 0;
        for (const k of Object.keys(raw.networks)) {
          rxBytes += raw.networks[k].rx_bytes ?? 0;
          txBytes += raw.networks[k].tx_bytes ?? 0;
        }
      }

      // PIDs
      const pids = raw.pids_stats?.current ?? null;

      setData({
        read,
        cpuPercent,
        memUsage,
        memLimit,
        rxBytes,
        txBytes,
        pids,
      });
      setError(null);
    };

    const handleError = (payload: any) => {
      if (
        payload?.hostId === hostId &&
        payload?.containerId === containerId
      ) {
        setError(payload?.message ?? "Error en stats");
      }
    };

    // suscribirse
    socket.emit("stats:subscribe", {
      hostId,
      containerId,
      intervalMs,
    });

    socket.on("stats:data", handleData);
    socket.on("stats:error", handleError);

    return () => {
      socket.emit("stats:unsubscribe", {
        hostId,
        containerId,
      });
      socket.off("stats:data", handleData);
      socket.off("stats:error", handleError);
    };
  }, [enabled, hostId, containerId, intervalMs]);

  return { data, error };
}
