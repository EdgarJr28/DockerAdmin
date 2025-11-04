"use client";

import { useEffect } from "react";
import { getSocket } from "@/app/libs/socket";
import { useDockerHost } from "@/app/store/docker-host";

export function useContainerLogs(containerId: string, onLine: (line: string) => void) {
    const { hostId } = useDockerHost();

    useEffect(() => {
        if (!hostId || !containerId) return;

        // usamos tu helper, solo cambiamos el namespace
        const socket = getSocket("/docker");

        // nos suscribimos
        socket.emit("logs:subscribe", {
            hostId,
            containerId,
        });

        const handleData = (msg: any) => {
            // el gateway te manda: { hostId, containerId, text }
            onLine?.(msg.text ?? "");
        };

        const handleError = (msg: any) => {
            console.warn("logs:error", msg);
        };

        socket.on("logs:data", handleData);
        socket.on("logs:error", handleError);

        return () => {
            // opcional: avisar que ya no queremos logs
            socket.emit("logs:unsubscribe", {
                hostId,
                containerId,
            });

            socket.off("logs:data", handleData);
            socket.off("logs:error", handleError);
        };
    }, [hostId, containerId, onLine]);
}
