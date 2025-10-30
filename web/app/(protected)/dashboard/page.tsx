"use client";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/app/components/ui/Card";
import Button from "@/app/components/ui/Button";
import {
  Cpu,
  MemoryStick,
  HardDrive,
  Gauge,
  Boxes,
  Play,
  Pause,
} from "lucide-react";
import { useDashboardPrefs } from "@/app/store/dashboard-prefs";
import {
  RingGauge,
  Spark,
} from "@/app/components/containers/metrics/Primitives";
import Select from "@/app/components/ui/Select";
import DndSortableGrid from "@/app/components/dnd/DndSortableGrid";
import { getSocket } from "@/app/libs/socket";

// Tipos esperados del backend (puedes ajustarlos si tu gateway emite otro formato)
interface MetricsPayload {
  host: {
    cpuPercent: number;
    memory: { percent: number; used: number; total: number };
    disk: { percent: number; used: number; total: number };
    load: { one: number; five: number; fifteen: number };
    uptimeSec: number;
  };
  docker: {
    containers: {
      total: number;
      running: number;
      paused: number;
      stopped: number;
    };
    serverVersion: string;
    driver: string;
    ncpu: number;
    memTotal: number;
  };
}

const ALL_IDS = ["cpu", "memory", "disk", "load", "dockerSummary"] as const;

export default function DashboardPage() {
  const prefs = useDashboardPrefs();
  const [metrics, setMetrics] = useState<MetricsPayload | null>(null);
  const [live, setLive] = useState(true);

  const [histCpu, setHistCpu] = useState<number[]>([]);
  const [histMem, setHistMem] = useState<number[]>([]);

  // Asegura IDs de tiles (una vez)
  useEffect(() => {
    prefs.ensureIds(ALL_IDS as any); /* eslint-disable-next-line */
  }, []);

  // Conexión WebSocket
  useEffect(() => {
    if (!live) return;

    const socket = getSocket("/metrics");

    socket.on("metrics:update", (data: MetricsPayload) => {
      setMetrics(data);
      setHistCpu((p) =>
        [...p, Math.max(0, Math.min(100, data.host.cpuPercent))].slice(-24)
      );
      setHistMem((p) =>
        [...p, Math.max(0, Math.min(100, data.host.memory.percent))].slice(-24)
      );
    });

    socket.on("metrics:error", (err: any) =>
      console.error("Metrics error:", err)
    );

    return () => {
      socket.off("metrics:update");
      socket.off("metrics:error");
    };
  }, [live]);

  // Pausa cuando la pestaña no está visible
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) setLive(false);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const bytes = (n?: number) => {
    if (n == null || !Number.isFinite(n)) return "—";
    const kb = 1024,
      mb = kb * 1024,
      gb = mb * 1024,
      tb = gb * 1024;
    if (n >= tb) return (n / tb).toFixed(1) + " TB";
    if (n >= gb) return (n / gb).toFixed(1) + " GB";
    if (n >= mb) return (n / mb).toFixed(1) + " MB";
    if (n >= kb) return (n / kb).toFixed(1) + " KB";
    return n + " B";
  };

  const host = metrics?.host;
  const doc = metrics?.docker;

  const tilesMap = useMemo(
    () => ({
      cpu: (
        <Card className="p-4">
          <div
            className="flex items-start justify-between cursor-grab active:cursor-grabbing"
            data-drag-handle
          >
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-[var(--muted)]" />
              <span className="font-semibold">CPU</span>
            </div>
            <RingGauge value={host?.cpuPercent ?? 0} />
          </div>
          <div className="text-xs text-muted mt-1">Uso actual</div>
          <div className="mt-2">
            <Spark points={histCpu} />
          </div>
        </Card>
      ),
      memory: (
        <Card className="p-4">
          <div
            className="flex items-start justify-between cursor-grab active:cursor-grabbing"
            data-drag-handle
          >
            <div className="flex items-center gap-2">
              <MemoryStick className="h-4 w-4 text-[var(--muted)]" />
              <span className="font-semibold">Memoria</span>
            </div>
            <RingGauge value={host?.memory.percent ?? 0} />
          </div>
          <div className="text-xs text-muted mt-1">
            {bytes(host?.memory.used)} / {bytes(host?.memory.total)}
          </div>
          <div className="mt-2">
            <Spark points={histMem} />
          </div>
        </Card>
      ),
      disk: (
        <Card className="p-4">
          <div
            className="flex items-start justify-between cursor-grab active:cursor-grabbing"
            data-drag-handle
          >
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-[var(--muted)]" />
              <span className="font-semibold">Disco /</span>
            </div>
            <RingGauge value={host?.disk.percent ?? 0} />
          </div>
          <div className="text-xs text-muted mt-1">
            {bytes(host?.disk.used)} / {bytes(host?.disk.total)}
          </div>
        </Card>
      ),
      load: (
        <Card className="p-4">
          <div
            className="flex items-center gap-2 cursor-grab active:cursor-grabbing"
            data-drag-handle
          >
            <Gauge className="h-4 w-4 text-[var(--muted)]" />
            <span className="font-semibold">Load Average</span>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
            <div>
              1m:{" "}
              <span className="font-mono">
                {host?.load.one?.toFixed(2) ?? "—"}
              </span>
            </div>
            <div>
              5m:{" "}
              <span className="font-mono">
                {host?.load.five?.toFixed(2) ?? "—"}
              </span>
            </div>
            <div>
              15m:
              <span className="font-mono">
                {host?.load.fifteen?.toFixed(2) ?? "—"}
              </span>
            </div>
          </div>
          <div className="text-xs text-muted mt-2">
            Uptime: {((host?.uptimeSec ?? 0) / 3600 || 0).toFixed(0)} h
          </div>
        </Card>
      ),
      dockerSummary: (
        <Card className="p-4">
          <div
            className="flex items-center gap-2 cursor-grab active:cursor-grabbing"
            data-drag-handle
          >
            <Boxes className="h-4 w-4 text-[var(--muted)]" />
            <span className="font-semibold">Docker</span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <div>
              Total:{" "}
              <span className="font-semibold">
                {doc?.containers.total ?? "—"}
              </span>
            </div>
            <div>
              Running:{" "}
              <span className="font-semibold text-emerald-600">
                {doc?.containers.running ?? "—"}
              </span>
            </div>
            <div>
              Paused:{" "}
              <span className="font-semibold">
                {doc?.containers.paused ?? "—"}
              </span>
            </div>
            <div>
              Stopped:{" "}
              <span className="font-semibold text-slate-600">
                &nbsp;{doc?.containers.stopped ?? "—"}
              </span>
            </div>
          </div>
          <div className="text-xs text-muted mt-2">
            Engine: {doc?.serverVersion ?? "—"} • {doc?.driver ?? "—"} • CPU:{" "}
            {doc?.ncpu ?? "—"} • RAM host: {bytes(doc?.memTotal)}
          </div>
        </Card>
      ),
    }),
    [metrics, histCpu, histMem]
  );

  const visibleIds = useMemo(
    () =>
      (ALL_IDS as readonly string[]).filter(
        (id) => prefs.tiles[id as keyof typeof prefs.tiles]
      ),
    [prefs.tiles]
  );

  const order = useMemo(() => {
    const saved = (prefs.order ?? []).filter((id) => visibleIds.includes(id));
    const missing = visibleIds.filter((id: any) => !saved.includes(id));
    return [...saved, ...missing];
  }, [prefs.order, visibleIds]);

  const items = useMemo(
    () =>
      order.map((id) => ({ id, node: tilesMap[id as keyof typeof tilesMap] })),
    [order, tilesMap]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setLive((v) => !v)}
            className="h-9"
          >
            {live ? (
              <Pause className="h-4 w-4 mr-1" />
            ) : (
              <Play className="h-4 w-4 mr-1" />
            )}
            {live ? "Pausar" : "Reanudar"}
          </Button>
        </div>
      </div>

      <Card className="p-3">
        <div className="text-xs text-muted mb-2">Personaliza las tarjetas</div>
        <div className="flex flex-wrap gap-3">
          {(ALL_IDS as readonly string[]).map((k) => (
            <label key={k} className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={prefs.tiles[k as keyof typeof prefs.tiles]}
                onChange={() => prefs.toggle(k as any)}
              />
              {k}
            </label>
          ))}
        </div>
      </Card>

      <DndSortableGrid
        items={items}
        order={order}
        onOrderChange={(ids) => prefs.setOrder(ids)}
        className="sm:grid-cols-2 lg:grid-cols-3"
      />
    </div>
  );
}
