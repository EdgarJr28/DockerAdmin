"use client";

import { useEffect } from "react";
import { getSocket } from "@/app/libs/socket";
import { useDockerHost } from "@/app/store/docker-host";

export function useMetricsSocket(onUpdate?: (data: any) => void) {
  const { hostId } = useDockerHost(); // el que eliges en ServerSelect

  useEffect(() => {
    const sock = getSocket("/metrics");

    // cada vez que cambie el host en el store, se lo decimos al backend
    if (hostId) {
      sock.emit("metrics:subscribe", { hostId });
    }

    const handleUpdate = (payload: any) => {
      // opcional, para que el componente que use este hook reciba las métricas
      onUpdate?.(payload);
    };

    sock.on("metrics:update", handleUpdate);

    return () => {
      sock.off("metrics:update", handleUpdate);
    };
  }, [hostId, onUpdate]);
}
