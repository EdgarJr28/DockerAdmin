import { useEffect, useRef } from "react";

export function usePolling(
  fn: (signal: AbortSignal) => Promise<void>,
  delayMs: number,
  enabled: boolean,
  opts?: { immediate?: boolean }
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const runningRef = useRef(false);
  const fnRef = useRef(fn);

  // Mantén siempre la última versión de fn sin reiniciar el efecto
  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  useEffect(() => {
    // helpers
    const clearTimer = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    const schedule = () => {
      if (!enabled) return; // no programar si está deshabilitado
      clearTimer(); // evita timers en paralelo
      timeoutRef.current = setTimeout(tick, delayMs);
    };

    const tick = async () => {
      if (!enabled) return; // si se deshabilitó, detén
      if (runningRef.current) return; // ya hay una ejecución en curso
      runningRef.current = true;

      // aborta request anterior (si la hubiera)
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      try {
        await fnRef.current(ac.signal);
      } catch {
        // ignorar AbortError/otros errores de red
      } finally {
        runningRef.current = false;
        // programa el siguiente SOLO al terminar
        schedule();
      }
    };

    // inicio/paro del ciclo
    if (!enabled) {
      clearTimer();
      abortRef.current?.abort();
      runningRef.current = false;
      return; // cleanup abajo también lo haría, pero salimos ya
    }

    // enabled === true
    if (opts?.immediate) {
      // dispara de una vez; el siguiente se agenda en finally
      tick();
    } else {
      schedule();
    }

    // cleanup al cambiar delay/enabled o desmontar
    return () => {
      clearTimer();
      abortRef.current?.abort();
      runningRef.current = false;
    };
  }, [delayMs, enabled, opts?.immediate]);
}
