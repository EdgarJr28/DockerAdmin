"use client";
import { useEffect, useState } from "react";
import { Scheduler } from "@/app/libs/api";
import {
  CalendarClock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Pencil,
  Plus,
} from "lucide-react";
import Button from "../../ui/Button";
import Modal from "../../ui/Modal";
import ConfirmDialog from "../../ui/ConfirmDialog";
import SchedulerCard from "../scheduler/SchedulerCard";

type Sched = {
  id: string;
  enabled: boolean;
  expr: string;
  target: string;
  timezone?: string;
  createdAt?: string;
  updatedAt?: string;
};

async function nextRun(expr: string, tz?: string) {
  try {
    // @ts-ignore
    const parser = await import("cron-parser");
    const it = parser.parseExpression(expr, tz ? { tz } : {});
    return it.next().toDate().toLocaleString();
  } catch {
    return "";
  }
}

export default function SchedulesList() {
  const [items, setItems] = useState<Sched[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [nextMap, setNextMap] = useState<Record<string, string>>({});
  const [openModal, setOpenModal] = useState(false);
  const [editTask, setEditTask] = useState<Sched | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Confirmaciones
  const [confirmDelete, setConfirmDelete] = useState<null | Sched>(null);
  const [confirmToggle, setConfirmToggle] = useState<null | Sched>(null);

  // 🔄 Carga y cálculo de próximas ejecuciones
  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const list = await Scheduler.list();
      setItems(list);
      const pairs = await Promise.all(
        list.map(
          async (s) => [s.id, await nextRun(s.expr, s.timezone)] as const
        )
      );
      setNextMap(Object.fromEntries(pairs));
    } catch (e: any) {
      setErr(e.message ?? "No se pudo obtener la lista de tareas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // 🔁 Refresco suave sin mostrar “cargando…”
  const refresh = async () => {
    setRefreshing(true);
    try {
      const list = await Scheduler.list();
      setItems(list);
      const pairs = await Promise.all(
        list.map(
          async (s) => [s.id, await nextRun(s.expr, s.timezone)] as const
        )
      );
      setNextMap(Object.fromEntries(pairs));
    } catch {
      /* ignoramos errores menores */
    } finally {
      setRefreshing(false);
    }
  };

  // 🔀 Toggle ON/OFF (confirmado)
  const handleToggleConfirm = async () => {
    if (!confirmToggle) return;
    try {
      if (confirmToggle.enabled) await Scheduler.disable(confirmToggle.id);
      else await Scheduler.enable(confirmToggle.id);
      await refresh();
    } catch (e: any) {
      console.error(e);
    } finally {
      setConfirmToggle(null);
    }
  };

  // 🗑️ Eliminar tarea (confirmado)
  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    try {
      await Scheduler.remove(confirmDelete.id);
      await refresh();
    } catch (e: any) {
      console.error("Error eliminando tarea:", e);
    } finally {
      setConfirmDelete(null);
    }
  };

  // Abrir modal para crear/editar
  const openEditor = (task?: Sched) => {
    setEditTask(task ?? null);
    setOpenModal(true);
  };

  // Cerrar modal y refrescar lista
  const closeEditor = async () => {
    setOpenModal(false);
    setEditTask(null);
    await refresh();
  };

  const empty = !loading && !items.length && !err;

  return (
    <div className="surface rounded-xl border p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between w-xl">
        <div className="flex items-center gap-2">
          {loading && (
            <span className="text-xs text-(--muted)">actualizando…</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={refresh}
            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${
                refreshing ? "animate-spin text-blue-500" : ""
              }`}
            />{" "}
            Refrescar
          </Button>

          <Button
            variant="outline"
            onClick={() => openEditor()}
            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded"
          >
            <Plus className="h-4 w-4" /> Nueva tarea
          </Button>
        </div>
      </div>

      {/* Error */}
      {err && (
        <div className="text-sm rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-2">
          {err}
        </div>
      )}

      {/* Empty state */}
      {empty && (
        <div className="flex flex-col gap-1 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            No hay tareas configuradas.
          </div>
          <p className="text-xs text-slate-500">
            Aún no hay tareas programadas en el background.
          </p>
        </div>
      )}

      {/* Lista */}
      {!!items.length && (
        <div className="divide-y">
          {items.map((s) => (
            <div
              key={s.id}
              className="py-3 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {s.enabled ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  )}
                  <span className="font-medium">{s.target}</span>
                  <span className="text-xs text-slate-500">
                    {s.timezone ?? "—"}
                  </span>
                </div>

                <div className="mt-1 text-xs text-slate-600 font-mono">
                  Expr: {s.expr}
                  {nextMap[s.id] && (
                    <div className="text-xs text-slate-500">
                      Próxima ejecución:{" "}
                      <span className="font-medium text-slate-700">
                        {nextMap[s.id]}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Acciones */}
              <div className="flex gap-3 justify-end items-center">
                {/* Toggle con confirmación */}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={s.enabled}
                    onChange={() => setConfirmToggle(s)}
                  />
                  <div className="w-10 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:bg-emerald-500 transition-colors"></div>
                  <div className="absolute left-1 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5 shadow-sm"></div>
                </label>
                <span className="text-xs text-slate-600 w-14">
                  {s.enabled ? "Activo" : "Inactivo"}
                </span>

                {/* Editar */}
                <Button
                  variant="outline"
                  onClick={() => openEditor(s)}
                  title="Editar tarea programada"
                  className="text-xs px-2 py-1"
                >
                  <Pencil className="h-4 w-4" />
                </Button>

                {/* Eliminar con confirmación */}
                <Button
                  variant="outline"
                  onClick={() => setConfirmDelete(s)}
                  title="Eliminar tarea"
                  className="text-xs px-2 py-1 hover:border-red-500 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal con SchedulerCard */}
      <Modal
        open={openModal}
        onClose={closeEditor}
        title={editTask ? "Editar tarea programada" : "Nueva tarea programada"}
      >
        <div className="max-h-[75vh] overflow-y-auto">
          <SchedulerCard task={editTask} onSaved={closeEditor} />
        </div>
      </Modal>

      {/* Confirmación de eliminación */}
      <ConfirmDialog
        open={!!confirmDelete}
        title="Eliminar tarea programada"
        description={`¿Seguro que deseas eliminar la tarea "${
          confirmDelete?.target ?? ""
        }"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={handleDeleteConfirm}
      />

      {/* Confirmación de cambio de estado */}
      <ConfirmDialog
        open={!!confirmToggle}
        title="Cambiar estado"
        description={`¿Deseas ${
          confirmToggle?.enabled ? "desactivar" : "activar"
        } la tarea "${confirmToggle?.target}"?`}
        confirmText="Confirmar"
        cancelText="Cancelar"
        onCancel={() => setConfirmToggle(null)}
        onConfirm={handleToggleConfirm}
      />
    </div>
  );
}
