// hooks/useContainerStats.ts
"use client";
import { useEffect, useRef, useState } from "react";
import { Containers } from "@/app/libs/api";
import { parseStats } from "@/app/libs/parse-stats";

type Opts = { intervalMs?: number; enabled?: boolean };

export function useContainerStats(id: string, opts: Opts = {}) {
  const { intervalMs = 3000, enabled = true } = opts;
  const [data, setData] = useState<ReturnType<typeof parseStats> | null>(null);
  const [loading, setLoading] = useState(!!enabled);
  const [error, setErr] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // si no hay id o está deshabilitado, limpiar todo
    if (!id || !enabled) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
      setLoading(false);
      return;
    }

    let mounted = true;

    const tick = async () => {
      // aborta petición anterior si aún vive
      if (abortRef.current) abortRef.current.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      try {
        if (!mounted) return;
        setLoading(true);
        const raw = await Containers.stats(id, { signal: ac.signal });
        if (!mounted) return;
        setData(parseStats(raw));
        setErr(null);
      } catch (e: any) {
        if (!mounted) return;
        // Ignora aborts esperados al cerrar modal
        if (e?.name !== "AbortError")
          setErr(e?.message || "Error obteniendo stats");
      } finally {
        if (!mounted) return;
        setLoading(false);
        // reprograma siguiente tick
        timerRef.current = setTimeout(tick, intervalMs);
      }
    };

    // primer tick
    tick();

    return () => {
      mounted = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    };
  }, [id, enabled, intervalMs]);

  return { data, loading, error };
}
