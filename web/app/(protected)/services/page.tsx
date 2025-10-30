"use client";
import ContainerCard from "@/app/components/containers/ContainerCard";
import { Containers } from "@/app/libs/api";
import { useEffect, useState, useCallback, useMemo } from "react";
import Spinner from "@/app/components/ui/Spinner";
import { Skeleton } from "@/app/components/ui/Skeleton";
import ConfirmDialog from "@/app/components/ui/ConfirmDialog";
import { useToastStore } from "@/app/store/toast-store";
import { PROTECTED_CONTAINERS } from "@/app/shared/constants/protected-containers";
import { RotateCw } from "lucide-react";
import Button from "@/app/components/ui/Button";
import { useDockerHost } from "@/app/store/docker-host"; // ⬅️ host seleccionado
// (Opcional) Si quieres mostrar estado del scheduler arriba, deja esta import
// import SchedulerCard from "@/app/components/containers/scheduler/SchedulerCard";
// import ScheduleStatus from "@/app/components/containers/scheduler/ScheduleStatus";

type Op = "start" | "stop" | "restart";

// 👇 contenedores que NO deben aparecer ni permitir acciones
const PROTECTED = PROTECTED_CONTAINERS.reduce<Set<string>>((set, name) => {
  set.add(name);
  return set;
}, new Set<string>());

// obtiene el nombre “visible” del contenedor (de la API Docker)
const getFirstName = (c: any) => (c.Names?.[0] || "").replace(/^\//, "");
const isProtected = (c: any) => PROTECTED.has(getFirstName(c));

export default function ServicesPage() {
  const { hostId } = useDockerHost(); // ⬅️ leer host actual (persistido en localStorage)
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pending, setPending] = useState<{ id: string; op: Op } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const showToast = useToastStore.getState().showToast;

  const delayedSetLoading = (
    value: boolean,
    delay: number,
    cb?: () => void
  ) => {
    setTimeout(() => {
      setLoading(value);
      cb?.();
    }, delay);
  };

  // 🔁 refresh ahora depende de hostId
  const refresh = useCallback(async () => {
    if (!hostId) return;
    delayedSetLoading(true, 0);
    setError(null);
    try {
      const data = await Containers.list(hostId); // ⬅️ pasa hostId
      // ❗ filtra aquí para que nunca lleguen al estado
      const filtered = (data || []).filter((c: any) => !isProtected(c));
      setItems(filtered);
    } catch (e: any) {
      setError(e.message ?? "Error");
    } finally {
      delayedSetLoading(false, 2000);
    }
  }, [hostId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onOp = (id: string, op: Op) => {
    // 🛡️ bloqueo adicional por si alguien llama onOp directo
    const target = items.find((c) => c.Id === id);
    if (target && isProtected(target)) {
      showToast(
        "Este contenedor está protegido y no admite acciones.",
        "warning"
      );
      return Promise.resolve();
    }
    setPending({ id, op });
    return Promise.resolve();
  };

  const runConfirmedOp = async () => {
    if (!pending || !hostId) return;
    setConfirmLoading(true);
    try {
      if (pending.op === "start") await Containers.start(hostId, pending.id); // ⬅️ hostId
      if (pending.op === "stop") await Containers.stop(hostId, pending.id); // ⬅️ hostId
      if (pending.op === "restart")
        await Containers.restart(hostId, pending.id); // ⬅️ hostId
      showToast(`Contenedor ${pending.op}ed correctamente`, "success");
      await refresh();
    } catch (e: any) {
      showToast(e?.message || "Operación fallida", "error");
      console.error(e);
    } finally {
      setPending(null);
      delayedSetLoading(false, 0);
      setConfirmLoading(false);
    }
  };

  const dialogCopy = useMemo(() => {
    if (!pending) return { title: "", desc: "", cta: "" };
    const map: Record<Op, { title: string; desc: string; cta: string }> = {
      start: {
        title: "Iniciar contenedor",
        desc: "¿Deseas iniciar este contenedor?",
        cta: "Iniciar",
      },
      stop: {
        title: "Detener contenedor",
        desc: "¿Deseas detener este contenedor?",
        cta: "Detener",
      },
      restart: {
        title: "Reiniciar contenedor",
        desc: "¿Deseas reiniciar este contenedor?",
        cta: "Reiniciar",
      },
    };
    return map[pending.op];
  }, [pending]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Servicios</h1>
          {hostId && (
            <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700">
              Host: {hostId}
            </span>
          )}
          {loading && <Spinner label="Cargando servicios..." />}
        </div>
        <Button
          onClick={refresh}
          disabled={loading || !hostId}
          className="px-2 py-2 rounded-lg text-white bg-black disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            "Actualizando…"
          ) : (
            <>
              <RotateCw className="h-4 w-4 mr-1" />
              Refrescar
            </>
          )}
        </Button>
      </div>

      {!hostId && (
        <p className="text-sm text-slate-500">
          Selecciona un servidor en el menú para cargar los contenedores.
        </p>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="grid gap-3">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={`s-${i}`}
                className="rounded-lg border border-slate-200 p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-12 w-20 rounded-md" />
                    <Skeleton className="h-12 w-20 rounded-md" />
                    <Skeleton className="h-12 w-20 rounded-md" />
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))
          : items.map((c) => <ContainerCard key={c.Id} c={c} onOp={onOp} />)}
      </div>

      {!loading && !error && hostId && !items.length && (
        <p className="text-sm text-slate-500">No hay contenedores.</p>
      )}

      <ConfirmDialog
        open={!!pending}
        title={dialogCopy.title}
        description={dialogCopy.desc}
        confirmText={dialogCopy.cta}
        cancelText="Cancelar"
        loading={confirmLoading}
        onCancel={() => !confirmLoading && setPending(null)}
        onConfirm={runConfirmedOp}
      />
    </div>
  );
}
