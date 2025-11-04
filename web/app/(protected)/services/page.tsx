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
import { useDockerHost } from "@/app/store/docker-host";
import { Card } from "@/app/components/ui/Card"; // 👈 tu Card

type Op = "start" | "stop" | "restart";

const PROTECTED = PROTECTED_CONTAINERS.reduce<Set<string>>((set, name) => {
  set.add(name);
  return set;
}, new Set<string>());

const getFirstName = (c: any) => (c.Names?.[0] || "").replace(/^\//, "");
const isProtected = (c: any) => PROTECTED.has(getFirstName(c));

export default function ServicesPage() {
  const { hostId } = useDockerHost();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<{ id: string; op: Op } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const showToast = useToastStore.getState().showToast;

  const delayedSetLoading = (value: boolean, delay: number, cb?: () => void) => {
    setTimeout(() => {
      setLoading(value);
      cb?.();
    }, delay);
  };

  const refresh = useCallback(async () => {
    if (!hostId) return;
    delayedSetLoading(true, 0);
    setError(null);
    try {
      const data = await Containers.list(hostId);
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
    const target = items.find((c) => c.Id === id);
    if (target && isProtected(target)) {
      showToast("Este contenedor está protegido y no admite acciones.", "warning");
      return Promise.resolve();
    }
    setPending({ id, op });
    return Promise.resolve();
  };

  const runConfirmedOp = async () => {
    if (!pending || !hostId) return;
    setConfirmLoading(true);
    try {
      if (pending.op === "start") await Containers.start(pending.id, hostId);
      if (pending.op === "stop") await Containers.stop(pending.id, hostId);
      if (pending.op === "restart") await Containers.restart(pending.id, hostId);
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
      start: { title: "Iniciar contenedor", desc: "¿Deseas iniciar este contenedor?", cta: "Iniciar" },
      stop: { title: "Detener contenedor", desc: "¿Deseas detener este contenedor?", cta: "Detener" },
      restart: { title: "Reiniciar contenedor", desc: "¿Deseas reiniciar este contenedor?", cta: "Reiniciar" },
    };
    return map[pending.op];
  }, [pending]);

  return (
    <div className="space-y-4">
      {/* Header */}
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
          {loading ? "Actualizando…" : (
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

      {/* GRID */}
      <div className="grid gap-3">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
            <div
              key={`s-${i}`}
              className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm w-full max-w-[1100px] mx-auto flex flex-col gap-4"
            >
              {/* header */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <Skeleton className="h-2.5 w-2.5 rounded-full" />
                  <Skeleton className="h-5 w-48" />
                </div>
                <Skeleton className="h-7 w-28 rounded-full" />
              </div>

              {/* info grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="space-y-2 sm:col-span-2 lg:col-span-3">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>

              {/* footer */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <div className="flex gap-2">
                  <Skeleton className="h-7 w-20 rounded-md" />
                  <Skeleton className="h-7 w-28 rounded-md" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-20 rounded-lg" />
                  <Skeleton className="h-8 w-20 rounded-lg" />
                  <Skeleton className="h-8 w-20 rounded-lg" />
                </div>
              </div>
            </div>
          ))
          : items.map((c) => <ContainerCard key={c.Id} c={c} onOp={onOp} />)}
      </div>

      {!loading && !error && hostId && !items.length && (
        <Card className="text-sm text-slate-500">No hay contenedores.</Card>
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
