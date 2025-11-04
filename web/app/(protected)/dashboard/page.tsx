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
  Settings,
} from "lucide-react";
import { useDashboardPrefs } from "@/app/store/dashboard-prefs";
import {
  RingGauge,
  Spark,
} from "@/app/components/containers/metrics/Primitives";
import DndSortableGrid from "@/app/components/dnd/DndSortableGrid";
import { getSocket } from "@/app/libs/socket";
import { useDockerHost } from "@/app/store/docker-host";
import { Skeleton } from "@/app/components/ui/Skeleton";
import Modal from "@/app/components/ui/Modal";

// Para gráficas: podrías usar un library como recharts, nivo, chart.js
import { LineChart, BarChart, ResponsiveContainer, Line, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";

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
    // opcionales para gráficas históricas
    history?: {
      timestamp: number;
      running: number;
      stopped: number;
      cpuPercent: number;
      memPercent: number;
    }[];
  };
  hostId?: string;
}

type DockerHistoryPoint = {
  timestamp: number;
  running: number;
  stopped: number;
  cpuPercent: number;
  memPercent: number;
};

const ALL_IDS = ["cpu", "memory", "disk", "load", "dockerSummary"] as const;

export default function DashboardPage() {
  const prefs = useDashboardPrefs();
  const { hostId } = useDockerHost();
  const [metrics, setMetrics] = useState<MetricsPayload | null>(null);
  const [live, setLive] = useState(true);
  const [ready, setReady] = useState(false);
  const [openConfig, setOpenConfig] = useState(false);

  const [histCpu, setHistCpu] = useState<number[]>([]);
  const [histMem, setHistMem] = useState<number[]>([]);

  // **Nueva parte**: acumulamos historia en arreglo
  const [dockerHistory, setDockerHistory] = useState<DockerHistoryPoint[]>([]);

  useEffect(() => {
    prefs.ensureIds(ALL_IDS as any);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 1000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!live) return;
    if (!hostId) return;

    const socket = getSocket("/metrics");

    const onUpdate = (data: MetricsPayload) => {
      if (data.hostId && data.hostId !== hostId) return;
      setMetrics(data);
      setHistCpu((p) =>
        [...p, Math.max(0, Math.min(100, data.host.cpuPercent))].slice(-24)
      );
      setHistMem((p) =>
        [...p, Math.max(0, Math.min(100, data.host.memory.percent))].slice(-24)
      );

      // gestion historia docker
      setDockerHistory((p = []) => {
        const entry = {
          timestamp: Date.now(),
          running: data.docker.containers.running,
          stopped: data.docker.containers.stopped,
          cpuPercent: data.host.cpuPercent,      // usar host cpu como proxy o docker cont CPU si disponible
          memPercent: data.host.memory.percent,  // idem
        };
        return [...p.slice(-59), entry]; // guardamos últimos 60 puntos (~5min si intervalo 5s)
      });
    };

    const onError = (err: any) => {
      console.error("Metrics error:", err);
    };

    socket.emit("metrics:subscribe", { hostId });
    socket.on("metrics:update", onUpdate);
    socket.on("metrics:error", onError);

    return () => {
      socket.emit("metrics:unsubscribe", { hostId });
      socket.off("metrics:update", onUpdate);
      socket.off("metrics:error", onError);
    };
  }, [live, hostId]);

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

  // Nuevo: datos para gráficas
  const runningSeries = dockerHistory.map((h) => ({
    time: new Date(h.timestamp).toLocaleTimeString(),
    running: h.running,
    stopped: h.stopped,
  }));

  const cpuSeries = dockerHistory.map((h) => ({
    time: new Date(h.timestamp).toLocaleTimeString(),
    cpuPercent: h.cpuPercent,
    memPercent: h.memPercent,
  }));

  const tilesMap = useMemo(
    () => ({
      cpu: (
        <Card className="p-4">
          <div className="flex items-start justify-between cursor-grab active:cursor-grabbing" data-drag-handle>
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
          <div className="flex items-start justify-between cursor-grab active:cursor-grabbing" data-drag-handle>
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
          <div className="flex items-start justify-between cursor-grab active:cursor-grabbing" data-drag-handle>
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
          <div className="flex items-center gap-2 cursor-grab active:cursor-grabbing" data-drag-handle>
            <Gauge className="h-4 w-4 text-[var(--muted)]" />
            <span className="font-semibold">Load Average</span>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
            <div>
              1m: <span className="font-mono">{host?.load.one?.toFixed(2) ?? "—"}</span>
            </div>
            <div>
              5m: <span className="font-mono">{host?.load.five?.toFixed(2) ?? "—"}</span>
            </div>
            <div>
              15m: <span className="font-mono">{host?.load.fifteen?.toFixed(2) ?? "—"}</span>
            </div>
          </div>
          <div className="text-xs text-muted mt-2">
            Uptime: {((host?.uptimeSec ?? 0) / 3600).toFixed(0)} h
          </div>
        </Card>
      ),
      dockerSummary: (
        <Card className="p-4">
          <div className="flex items-center gap-2 cursor-grab active:cursor-grabbing" data-drag-handle>
            <Boxes className="h-4 w-4 text-[var(--muted)]" />
            <span className="font-semibold">Docker</span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <div>
              Total: <span className="font-semibold">{doc?.containers.total ?? "—"}</span>
            </div>
            <div>
              Running: <span className="font-semibold text-emerald-600">{doc?.containers.running ?? "—"}</span>
            </div>
            <div>
              Paused: <span className="font-semibold">{doc?.containers.paused ?? "—"}</span>
            </div>
            <div>
              Stopped: <span className="font-semibold text-slate-600">&nbsp;{doc?.containers.stopped ?? "—"}</span>
            </div>
          </div>
          <div className="text-xs text-muted mt-2">
            Engine: {doc?.serverVersion ?? "—"} • {doc?.driver ?? "—"} • CPU: {doc?.ncpu ?? "—"} • RAM host: {bytes(doc?.memTotal)}
          </div>
        </Card>
      ),
    }),
    [metrics, histCpu, histMem, host, doc]
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
      order.map((id) => ({
        id,
        node: tilesMap[id as keyof typeof tilesMap],
      })),
    [order, tilesMap]
  );

  const SkeletonTile = () => (
    <Card className="p-4 flex flex-col justify-between h-[160px]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
      <div className="space-y-2 mt-2">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-6 w-full mt-3" />
    </Card>
  );

  const isLoadingMetrics = !metrics || !ready;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setLive((v) => !v)} className="h-9" disabled={!hostId}>
            {live ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
            {live ? "Pausar" : "Reanudar"}
          </Button>
          <Button variant="outline" onClick={() => setOpenConfig(true)} className="h-9 w-9 flex items-center justify-center" title="Configurar tarjetas">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* aviso sin host */}
      {!hostId && (
        <Card className="p-3 text-sm text-amber-700 bg-amber-50 border-amber-200">
          Selecciona primero un servidor Docker para ver las métricas en vivo.
        </Card>
      )}

      {/* grid de métricas */}
      {hostId ? (
        isLoadingMetrics ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {visibleIds.map((id) => (
              <SkeletonTile key={id} />
            ))}
          </div>
        ) : (
          <DndSortableGrid items={items} order={order} onOrderChange={(ids) => prefs.setOrder(ids)} className="sm:grid-cols-2 lg:grid-cols-3" />
        )
      ) : null}

      {/* --- NUEVAS GRÁFICAS DOCKER --- */}
      {hostId && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Tendencias Docker</h2>

          {/* Gráfica: contenedores running vs stopped */}
          <Card className="p-4">
            <div className="text-sm font-semibold mb-2">Contenedores: Running vs Stopped</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={runningSeries}>
                <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="running" fill="#2ca02c" name="Running" />
                <Bar dataKey="stopped" fill="#d62728" name="Stopped" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Gráfica: CPU y Memoria % del host (proxy) */}
          <Card className="p-4">
            <div className="text-sm font-semibold mb-2">CPU % & Memoria % del Host Docker</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={cpuSeries}>
                <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tickFormatter={(v) => v + "%"} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="cpuPercent" stroke="#1f77b4" name="CPU %" />
                <Line type="monotone" dataKey="memPercent" stroke="#ff7f0e" name="Memoria %" />
              </LineChart>
            </ResponsiveContainer>
          </Card>

        </div>
      )}

      {/* Modal config */}
      <Modal open={openConfig} onClose={() => setOpenConfig(false)} title="Configurar tarjetas del dashboard">
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Activa o desactiva las tarjetas que quieres ver. El orden lo puedes cambiar arrastrando en el dashboard.
          </p>

          <div className="flex flex-wrap gap-2">
            {(ALL_IDS as readonly string[]).map((k) => {
              const active = prefs.tiles[k as keyof typeof prefs.tiles];
              return (
                <button
                  key={k}
                  onClick={() => prefs.toggle(k as any)}
                  className={`px-3 py-1 rounded-full text-sm border transition ${active
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : "bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700"
                    }`}
                >
                  {k}
                </button>
              );
            })}
          </div>

          <div className="text-xs text-muted pt-2">Consejo: puedes ocultar varias para probar el rendimiento en tiempo real.</div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpenConfig(false)}>Cerrar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
