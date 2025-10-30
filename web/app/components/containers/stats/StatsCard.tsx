"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useContainerStats } from "@/app/hooks/useContainerStats";
import { Card } from "@/app/components/ui/Card";
import {
  Cpu,
  MemoryStick,
  Activity,
  ArrowDown,
  ArrowUp,
  CircleDot,
} from "lucide-react";

type Props = {
  id: string;
  enabled?: boolean;
  intervalMs?: number;
};

export default function StatsCard({
  id,
  enabled = true,
  intervalMs = 3000,
}: Props) {
  const { data, error } = useContainerStats(id, { intervalMs, enabled });

  // ===== Derivados seguros =====
  const cpu = data?.cpuPercent ?? null;

  const memUsage = data?.memUsage ?? null;
  const memLimit = data?.memLimit ?? null;
  const memPct =
    memUsage != null && memLimit && memLimit > 0
      ? (memUsage / memLimit) * 100
      : null;

  const rx = data?.rxBytes ?? null;
  const tx = data?.txBytes ?? null;
  const pids = data?.pids ?? null;
  const readAt = data?.read ? new Date(data.read) : null;

  // ===== Historial corto para sparkline (local al componente) =====
  // guardamos últimas N muestras para CPU/MEM (no persistente)
  const N = 20;
  const [cpuHist, setCpuHist] = useState<number[]>([]);
  const [memHist, setMemHist] = useState<number[]>([]);
  const lastStampRef = useRef<string | null>(null);

  useEffect(() => {
    if (!data?.read) return;
    // evita duplicar si la misma muestra llega dos veces
    if (lastStampRef.current === data.read) return;
    lastStampRef.current = data.read;

    setCpuHist((arr) =>
      [...arr, Math.max(0, Math.min(100, cpu ?? 0))].slice(-N)
    );
    setMemHist((arr) =>
      [...arr, Math.max(0, Math.min(100, memPct ?? 0))].slice(-N)
    );
  }, [data?.read, cpu, memPct]);

  // ===== Utils =====
  const fmtPct = (n: number | null, d = 1) =>
    n == null || Number.isNaN(n) ? "—" : `${n.toFixed(d)}%`;

  const fmtBytes = (n: number | null) => {
    if (n == null || !Number.isFinite(n)) return "—";
    const kb = 1024,
      mb = kb * 1024,
      gb = mb * 1024;
    if (n >= gb) return (n / gb).toFixed(1) + " GB";
    if (n >= mb) return (n / mb).toFixed(1) + " MB";
    if (n >= kb) return (n / kb).toFixed(1) + " KB";
    return n + " B";
  };

  // Barra circular con CSS `conic-gradient`
  const Circle = ({ value }: { value: number | null }) => {
    const v =
      value == null || Number.isNaN(value)
        ? 0
        : Math.max(0, Math.min(100, value));
    return (
      <div
        className="h-12 w-12 rounded-full grid place-items-center"
        style={{
          background: `conic-gradient(var(--accent) ${
            v * 3.6
          }deg, var(--surface-border) 0)`,
        }}
        aria-label={`progreso ${v.toFixed(0)}%`}
        title={`${v.toFixed(1)}%`}
      >
        <div className="h-10 w-10 rounded-full bg-var(--surface-bg) grid place-items-center text-xs font-semibold">
          {v.toFixed(0)}%
        </div>
      </div>
    );
  };

  // Sparkline simple SVG
  const Spark = ({ points }: { points: number[] }) => {
    const w = 120,
      h = 28,
      pad = 2;
    const min = 0,
      max = 100;
    const pts = points.length ? points : [0];
    const step = pts.length > 1 ? (w - pad * 2) / (pts.length - 1) : 0;
    const path = pts
      .map((v, i) => {
        const x = pad + i * step;
        const y = pad + (h - pad * 2) * (1 - (v - min) / (max - min));
        return `${i === 0 ? "M" : "L"}${x},${y}`;
      })
      .join(" ");
    return (
      <svg width={w} height={h} className="overflow-visible">
        <path
          d={path}
          fill="none"
          stroke="currentColor"
          className="text-var(--accent)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    );
  };

  // Badge “live”
  const LiveDot = () => (
    <span className="inline-flex items-center gap-1 text-xs text-muted">
      <span className="relative inline-flex">
        <span className="h-2 w-2 rounded-full bg-var(--accent)]inline-block" />
        <span className="absolute inset-0 rounded-full animate-ping bg-var(--accent)/40" />
      </span>
      {readAt ? readAt.toLocaleTimeString() : "—"}
    </span>
  );

  // ===== UI =====
  return (
    <Card className="text-sm">
      {/* Header compacto */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CircleDot className="h-4 w-4 text-var(--muted)" />
          <span className="font-semibold">Métricas</span>
        </div>
        <LiveDot />
      </div>

      {error && <div className="mb-3 text-xs text-red-600">{error}</div>}

      {/* Tiles principales */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* CPU */}
        <div className="surface rounded-xl p-3 flex items-center gap-3">
          <div className="shrink-0">
            <Circle value={cpu} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-var(--muted)" />
              <span className="font-medium">CPU</span>
            </div>
            <div className="text-xs text-muted">Uso actual</div>
            <div className="mt-1">
              <Spark points={cpuHist} />
            </div>
          </div>
        </div>

        {/* Memoria */}
        <div className="surface rounded-xl p-3 flex items-center gap-3">
          <div className="shrink-0">
            <Circle value={memPct} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <MemoryStick className="h-4 w-4 text-var(--muted)" />
              <span className="font-medium">Memoria</span>
            </div>
            <div className="text-xs text-muted">
              {fmtBytes(memUsage)} / {fmtBytes(memLimit)}
            </div>
            <div className="mt-1">
              <Spark points={memHist} />
            </div>
          </div>
        </div>

        {/* Procesos & estado */}
        <div className="surface rounded-xl p-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-var(--muted)" />
            <span className="font-medium">Procesos</span>
          </div>
          <div className="mt-1 text-2xl font-semibold leading-tight">
            {pids ?? "—"}
          </div>
          <div className="text-xs text-muted mt-1">PIDs activos</div>
        </div>
      </div>

      {/* Red */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
        <div className="surface rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowDown className="h-4 w-4 text-var(--muted)" />
            <span className="font-medium">Descarga</span>
          </div>
          <div className="font-semibold">{fmtBytes(rx)}</div>
        </div>
        <div className="surface rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowUp className="h-4 w-4 text-var(--muted)" />
            <span className="font-medium">Subida</span>
          </div>
          <div className="font-semibold">{fmtBytes(tx)}</div>
        </div>
      </div>
    </Card>
  );
}
