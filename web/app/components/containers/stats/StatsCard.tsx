"use client";
import { useEffect, useRef, useState } from "react";
import { useContainerStats } from "@/app/hooks/useContainerStats";
import { Card } from "@/app/components/ui/Card";
import { Skeleton } from "@/app/components/ui/Skeleton";
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

  // delay de 1 segundo para mostrar skeleton
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 1000);
    return () => clearTimeout(t);
  }, []);

  const cpu = data?.cpuPercent ?? null;
  const memUsage = data?.memUsage ?? null;
  const memLimit = data?.memLimit ?? null;
  const memPct =
    memUsage && memLimit && memLimit > 0
      ? (memUsage / memLimit) * 100
      : null;

  const rx = data?.rxBytes ?? null;
  const tx = data?.txBytes ?? null;
  const pids = data?.pids ?? null;
  const readAt = data?.read ? new Date(data.read) : null;

  const N = 20;
  const [cpuHist, setCpuHist] = useState<number[]>([]);
  const [memHist, setMemHist] = useState<number[]>([]);
  const lastStampRef = useRef<string | null>(null);

  useEffect(() => {
    if (!data?.read) return;
    if (lastStampRef.current === data.read) return;
    lastStampRef.current = data.read;

    setCpuHist((arr) =>
      [...arr, Math.max(0, Math.min(100, cpu ?? 0))].slice(-N)
    );
    setMemHist((arr) =>
      [...arr, Math.max(0, Math.min(100, memPct ?? 0))].slice(-N)
    );
  }, [data?.read, cpu, memPct]);

  const fmtBytes = (n: number | null) => {
    if (!n || !Number.isFinite(n)) return "—";
    const kb = 1024, mb = kb * 1024, gb = mb * 1024;
    if (n >= gb) return (n / gb).toFixed(1) + " GB";
    if (n >= mb) return (n / mb).toFixed(1) + " MB";
    if (n >= kb) return (n / kb).toFixed(1) + " KB";
    return n + " B";
  };

  const Circle = ({ value }: { value: number | null }) => {
    const v = value ? Math.max(0, Math.min(100, value)) : 0;
    return (
      <div
        className="h-12 w-12 rounded-full grid place-items-center"
        style={{
          background: `conic-gradient(var(--accent) ${
            v * 3.6
          }deg, var(--surface-border) 0)`,
        }}
      >
        <div className="h-10 w-10 rounded-full bg-[var(--surface-bg)] grid place-items-center text-xs font-semibold">
          {v.toFixed(0)}%
        </div>
      </div>
    );
  };

  const Spark = ({ points }: { points: number[] }) => {
    const w = 120,
      h = 28,
      pad = 2;
    const pts = points.length ? points : [0];
    const step = pts.length > 1 ? (w - pad * 2) / (pts.length - 1) : 0;
    const path = pts
      .map((v, i) => {
        const x = pad + i * step;
        const y = pad + (h - pad * 2) * (1 - v / 100);
        return `${i === 0 ? "M" : "L"}${x},${y}`;
      })
      .join(" ");
    return (
      <svg width={w} height={h} className="overflow-visible">
        <path
          d={path}
          fill="none"
          stroke="currentColor"
          className="text-[var(--accent)]"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    );
  };

  const LiveDot = () => (
    <span className="inline-flex items-center gap-1 text-xs text-muted">
      <span className="relative inline-flex">
        <span className="h-2 w-2 rounded-full bg-[var(--accent)] inline-block" />
        <span className="absolute inset-0 rounded-full animate-ping bg-[var(--accent)]/40" />
      </span>
      {readAt ? readAt.toLocaleTimeString() : "—"}
    </span>
  );

  // === SKELETON ===
  if (!ready || (!data && !error)) {
    return (
      <Card className="text-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CircleDot className="h-4 w-4 text-[var(--muted)]" />
            <span className="font-semibold">Métricas</span>
          </div>
          <Skeleton className="h-4 w-16" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="surface rounded-xl p-3 flex items-center gap-3"
            >
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-5 w-full" />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="surface rounded-xl p-3 flex items-center justify-between"
            >
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  // === UI real ===
  return (
    <Card className="text-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CircleDot className="h-4 w-4 text-[var(--muted)]" />
          <span className="font-semibold">Métricas</span>
        </div>
        <LiveDot />
      </div>

      {error && <div className="mb-3 text-xs text-red-600">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="surface rounded-xl p-3 flex items-center gap-3">
          <div className="shrink-0">
            <Circle value={cpu} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-[var(--muted)]" />
              <span className="font-medium">CPU</span>
            </div>
            <div className="text-xs text-muted">Uso actual</div>
            <div className="mt-1">
              <Spark points={cpuHist} />
            </div>
          </div>
        </div>

        <div className="surface rounded-xl p-3 flex items-center gap-3">
          <div className="shrink-0">
            <Circle value={memPct} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <MemoryStick className="h-4 w-4 text-[var(--muted)]" />
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

        <div className="surface rounded-xl p-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[var(--muted)]" />
            <span className="font-medium">Procesos</span>
          </div>
          <div className="mt-1 text-2xl font-semibold leading-tight">
            {pids ?? "—"}
          </div>
          <div className="text-xs text-muted mt-1">PIDs activos</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
        <div className="surface rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowDown className="h-4 w-4 text-[var(--muted)]" />
            <span className="font-medium">Descarga</span>
          </div>
          <div className="font-semibold">{fmtBytes(rx)}</div>
        </div>
        <div className="surface rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowUp className="h-4 w-4 text-[var(--muted)]" />
            <span className="font-medium">Subida</span>
          </div>
          <div className="font-semibold">{fmtBytes(tx)}</div>
        </div>
      </div>
    </Card>
  );
}
