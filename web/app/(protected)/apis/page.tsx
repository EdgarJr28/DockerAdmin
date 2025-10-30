"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/app/components/ui/Card";
import Badge from "@/app/components/ui/Badge";
import Spinner from "@/app/components/ui/Spinner";
import { Skeleton } from "@/app/components/ui/Skeleton";
import Button from "@/app/components/ui/Button";
import {
  Pause,
  Play,
  RotateCw,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { APIS_STATUS_LIST } from "@/app/shared/constants/apis-status-list";

const DEFAULT_APIS = APIS_STATUS_LIST;

type Row = {
  name: string;
  url: string;
  status: number | null;
  latencyMs: number | null;
  ok: boolean | null;
  lastOk?: number | null;
};

type ProbeOpts = {
  timeoutMs?: number;
  signal?: AbortSignal;
  method?: "HEAD" | "GET";
};

async function probe(
  url: string,
  opts: ProbeOpts = {}
): Promise<{ status: number; latencyMs: number }> {
  // timeout por request (no el intervalo de polling)
  const { timeoutMs = 8000, signal, method = "HEAD" } = opts;
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  const t0 = performance.now();
  try {
    const res = await fetch(url, {
      method,
      signal: signal ?? ac.signal,
      cache: "no-store",
    });
    const t1 = performance.now();
    return { status: res.status, latencyMs: Math.max(1, Math.round(t1 - t0)) };
  } finally {
    clearTimeout(timer);
  }
}

export default function ApisPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const [live, setLive] = useState(true);
  const [intervalMs, setIntervalMs] = useState(30000); // ✅ por defecto 30s
  const [method, setMethod] = useState<"HEAD" | "GET">("HEAD");

  const tickRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0); // para forzar tick inmediato

  // carga inicial
  useEffect(() => {
    setLoading(true);
    const initial: Row[] = DEFAULT_APIS.map((a) => ({
      name: a.name,
      url: a.url,
      status: null,
      latencyMs: null,
      ok: null,
      lastOk: null,
    }));
    setRows(initial);
    setLoading(false);
  }, []);

  // polling
  useEffect(() => {
    if (!rows.length) return;
    let mounted = true;

    const runTick = async () => {
      try {
        const results = await Promise.all(
          rows.map(async (r) => {
            try {
              const { status, latencyMs } = await probe(r.url, {
                timeoutMs: 8000,
                method,
              });
              const ok = status >= 200 && status < 400;
              return {
                ...r,
                status,
                latencyMs,
                ok,
                lastOk: ok ? Date.now() : r.lastOk ?? null,
              };
            } catch {
              return { ...r, status: 0, latencyMs: null, ok: false };
            }
          })
        );
        if (!mounted) return;
        setRows(results);
      } finally {
        if (mounted && live) {
          tickRef.current = setTimeout(runTick, intervalMs);
        }
      }
    };

    if (live) runTick();

    return () => {
      mounted = false;
      if (tickRef.current) clearTimeout(tickRef.current);
    };
  }, [rows.length, live, intervalMs, method, refreshNonce]);

  const failing = useMemo(
    () => rows.filter((r) => r.ok === false).length,
    [rows]
  );

  const fmtLatency = (n: number | null) => (n == null ? "—" : `${n} ms`);
  const fmtStatus = (n: number | null) =>
    n == null ? "—" : n === 0 ? "timeout" : `HTTP ${n}`;

  const refreshNow = () => setRefreshNonce((n) => n + 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Estado de APIs</h1>
          {loading && <Spinner label="Cargando..." />}
          {!loading && (
            <span className="inline-flex items-center gap-2 text-xs text-muted">
              <span className="relative inline-flex">
                <span
                  className={`h-2 w-2 rounded-full ${
                    live ? "bg-var(--accent)" : "bg-slate-400"
                  } inline-block`}
                />
                {live && (
                  <span className="absolute inset-0 rounded-full animate-ping bg-var(--accent)/40" />
                )}
              </span>
              {live ? "Monitoreo en vivo" : "Pausado"}
            </span>
          )}
        </div>

        {/* Controles mejorados */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setLive((v) => !v)}
            title={live ? "Pausar" : "Reanudar"}
            className="h-9"
          >
            {live ? (
              <Pause className="h-4 w-4 mr-1" />
            ) : (
              <Play className="h-4 w-4 mr-1" />
            )}
            {live ? "Pausar" : "Reanudar"}
          </Button>

          <Button
            variant="outline"
            onClick={refreshNow}
            title="Refrescar ahora"
            className="h-9"
          >
            <RotateCw className="h-4 w-4 mr-1" />
            Refrescar
          </Button>
        </div>
      </div>

      {/* Resumen */}
      <Card className="p-3">
        <div className="text-sm flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> OK:{" "}
            {rows.filter((r) => r.ok).length}
          </span>
          <span className="inline-flex items-center gap-1">
            <AlertTriangle className="h-4 w-4 text-red-500" /> Fallando:{" "}
            {failing}
          </span>
          <span className="text-xs text-muted">Total: {rows.length}</span>
        </div>
      </Card>

      {/* Lista */}
      <div className="grid gap-2">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Card
                key={`s-${i}`}
                className="flex items-center justify-between p-3"
              >
                <div className="flex items-center gap-3 w-full">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-64 ml-2" />
                </div>
                <Skeleton className="h-4 w-16" />
              </Card>
            ))
          : rows.map((r) => (
              <Card key={r.name} className="p-0">
                <div className="flex items-center justify-between gap-3 p-3">
                  {/* Izquierda: badge + (nombre arriba, link abajo) */}
                  <div className="min-w-0 flex items-start gap-3 p-2">
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{r.name}</div>
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                        className=" mt-0.5 text-sm text-slate-500 truncate max-w-[48ch] inline-flex items-center gap-1 underline-offset-2 hover:underline"
                        title={r.url}
                      >
                        {"Link "}
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                      </a>
                    </div>
                  </div>

                  {/* Derecha: métrica y “último OK” */}
                  <div className="shrink-0 text-right">
                    <div
                      className={`text-sm ${
                        r.ok ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {r.ok
                        ? r.latencyMs == null
                          ? "—"
                          : `${r.latencyMs} ms`
                        : r.status == null
                        ? "—"
                        : r.status === 0
                        ? "timeout"
                        : `HTTP ${r.status}`}
                    </div>
                    <div className="text-[11px] text-muted">
                      {r.lastOk
                        ? `último OK: ${new Date(
                            r.lastOk
                          ).toLocaleTimeString()}`
                        : r.ok
                        ? "OK ahora"
                        : "sin OK reciente"}
                    </div>
                    <div className="pt-1">
                      <Badge ok={!!r.ok} />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
      </div>
    </div>
  );
}
