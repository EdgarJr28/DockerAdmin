"use client";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/app/components/ui/Card";
import Button from "@/app/components/ui/Button";
import { Scheduler, Containers } from "@/app/libs/api";
import { useToastStore } from "@/app/store/toast-store";
import { CronMode, parseTime, toCron } from "@/app/utils/cron";
import { Clock3, Info, CheckCircle2 } from "lucide-react";

import { useDockerHost } from "@/app/store/docker-host";
import SelectPicker, { SelectOption } from "../../ui/SelectPicker";

interface SchedulerCardProps {
  task?: {
    id: string;
    expr: string;
    target: string;
    timezone?: string;
    enabled?: boolean;
  } | null;
  onSaved?: () => void;
}

function isLikelyCron(expr: string) {
  const parts = expr.trim().split(/\s+/);
  return parts.length >= 5 && parts.length <= 6;
}

export default function SchedulerCard({ task, onSaved }: SchedulerCardProps) {
  const showToast = useToastStore((s) => s.showToast);
  const isEditing = !!task;

  const { hostId } = useDockerHost();

  // Estados principales
  const [mode, setMode] = useState<CronMode | "custom">("daily");
  const [time, setTime] = useState("03:00");
  const [{ hour, minute }, setHM] = useState(() => parseTime("03:00"));
  const [days, setDays] = useState<number[]>([1]);
  const [eachN, setEachN] = useState(6);
  const [monthDay, setMonthDay] = useState(1);

  const [expr, setExpr] = useState("");
  const [target, setTarget] = useState("");
  const [timezone, setTimezone] = useState("America/Bogota");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<null | { type: "save" | "disable" }>(null);

  // Containers
  const [allContainers, setAllContainers] = useState<any[]>([]);
  const [scheduledTargets, setScheduledTargets] = useState<Set<string>>(new Set());
  const [showHidden, setShowHidden] = useState(false);
  const [loadingContainers, setLoadingContainers] = useState(false);

  // Inicializar si viene en modo edición
  useEffect(() => {
    if (isEditing && task) {
      setExpr(task.expr);
      setTarget(task.target);
      setTimezone(task.timezone ?? "America/Bogota");
      setMode("custom");
    }
  }, [isEditing, task]);

  // Cargar cron existentes (para marcar “ya programados”)
  useEffect(() => {
    (async () => {
      try {
        const items = await Scheduler.list();
        setScheduledTargets(
          new Set(items.map((i: any) => (i?.target || "").trim()).filter(Boolean))
        );
      } catch (e) {
        // opcional: manejar error
      }
    })();
  }, []);

  // Cargar contenedores del host activo
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!hostId) return;
      setLoadingContainers(true);
      try {
        const all = await Containers.list(hostId); // ⇐ host-aware
        if (!alive) return;
        setAllContainers(Array.isArray(all) ? all : []);
      } catch (e) {
        if (alive) setAllContainers([]);
      } finally {
        if (alive) setLoadingContainers(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [hostId]);

  // Opciones para el SelectPicker (filtrando admin-board)
  const containerOptions: SelectOption[] = useMemo(() => {
    const base = allContainers
      .map((c: any) => {
        const name = (c.Names?.[0] || "").replace(/^\//, "");
        const running = (c.State || "").toLowerCase() === "running";
        return { c, name, running };
      })
      .filter(({ name }) => !!name && !name.includes("admin-board"));

    // Si no mostramos "ya programados", filtramos esos nombres
    const filtered = showHidden
      ? base
      : base.filter(({ name }) => !scheduledTargets.has(name));

    // Mapear a opciones UI-only
    const opts: SelectOption[] = filtered.map(({ c, name, running }) => ({
      value: name,
      label: name,
      rightDotClass: running ? "bg-emerald-500" : "bg-red-500",
      // Si mostramos "ya programados", los incluimos deshabilitados y con texto
      disabled: showHidden ? scheduledTargets.has(name) : false,
      rightText: showHidden && scheduledTargets.has(name) ? "ya tiene cron" : undefined,
    }));

    return opts.sort((a, b) => a.label.localeCompare(b.label));
  }, [allContainers, showHidden, scheduledTargets]);

  // Sincronizar hora/minuto
  useEffect(() => setHM(parseTime(time)), [time]);

  // Autogenerar cron según modo
  useEffect(() => {
    if (mode === "custom") return;
    let cron = "";
    if (mode === "everyMinutes") cron = toCron({ mode, n: eachN });
    else if (mode === "everyHours") cron = toCron({ mode, n: eachN, minute });
    else if (mode === "daily") cron = toCron({ mode, hour, minute });
    else if (mode === "weekly") cron = toCron({ mode, hour, minute, days });
    else if (mode === "monthly") cron = toCron({ mode, hour, minute, day: monthDay });
    setExpr(cron);
  }, [mode, hour, minute, days, eachN, monthDay]);

  const canSave = isLikelyCron(expr) && target.trim().length > 0;

  // Guardar / Actualizar
  const onSave = async () => {
    setSaving(true);
    try {
      if (isEditing && task) {
        await Scheduler.update(task.id, { expr: expr.trim(), timezone });
        showToast(`Tarea de ${task.target} actualizada`, "success");
      } else {
        await Scheduler.create(expr.trim(), target.trim(), timezone);
        showToast("Programación creada", "success");
      }
      onSaved?.();
    } catch (e: any) {
      setError(e.message ?? "Error al guardar");
      showToast("Error al guardar", "error");
    } finally {
      setSaving(false);
      setPendingAction(null);
    }
  };

  // Eliminar tarea
  const onDisable = async () => {
    if (!task) return;
    setSaving(true);
    try {
      await Scheduler.remove(task.id);
      showToast("Tarea eliminada", "info");
    } catch (e: any) {
      showToast("Error al eliminar", "error");
    } finally {
      setSaving(false);
      setPendingAction(null);
    }
  };

  const applyPreset = (p: string) => {
    setMode("custom");
    setExpr(p);
  };

  return (
    <div className="p-4 surface rounded-xl border space-y-5">
      <div className="flex items-center gap-2">
        <Clock3 className="h-5 w-5 text-(--muted)" />
        <h3 className="font-semibold">
          {isEditing ? `Editar cron de ${task?.target}` : "Nueva tarea programada"}
        </h3>
      </div>

      {error && (
        <div className="text-sm border border-red-300 bg-red-50 text-red-700 rounded px-3 py-2">
          {error}
        </div>
      )}

      {/* Selector de contenedor (UI-only SelectPicker) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Container objetivo</label>
          {!isEditing && (
            <label className="text-xs flex items-center gap-2">
              <input
                type="checkbox"
                checked={showHidden}
                onChange={(e) => setShowHidden(e.target.checked)}
              />
              Mostrar también los ya programados
            </label>
          )}
        </div>

        {/* En edición, bloqueado */}
        {isEditing ? (
          <div className="rounded-lg border px-3 py-2 text-sm bg-gray-50 dark:bg-slate-800/50 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            {task?.target}
          </div>
        ) : (
          <SelectPicker
            options={loadingContainers ? [] : containerOptions}
            value={target}
            onChange={(val) => setTarget(val)}
            placeholder={
              loadingContainers
                ? "Cargando contenedores…"
                : hostId
                ? "Selecciona un contenedor"
                : "Selecciona primero un servidor"
            }
            widthClass="w-full"
            disabled={saving || loadingContainers || !hostId}
          />
        )}
      </div>

      {/* Editor cron */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium">Modo</label>
          <select
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            value={mode}
            onChange={(e) => setMode(e.target.value as CronMode | "custom")}
          >
            <option value="daily">Diario</option>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensual</option>
            <option value="everyHours">Cada N horas</option>
            <option value="everyMinutes">Cada N minutos</option>
            <option value="custom">Personalizado</option>
          </select>
        </div>

        {mode !== "everyMinutes" && mode !== "custom" && (
          <div>
            <label className="text-sm font-medium">Hora</label>
            <input
              type="time"
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        )}
      </div>

      <div>
        <label className="text-sm font-medium">Expresión CRON</label>
        <input
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm font-mono"
          placeholder="0 3 * * *"
          value={expr}
          onChange={(e) => {
            setExpr(e.target.value);
            if (mode !== "custom") setMode("custom");
          }}
        />
        {!isLikelyCron(expr) && expr.trim() !== "" && (
          <p className="mt-1 text-xs text-amber-700">Formato cron poco probable. Verifica.</p>
        )}
      </div>

      {/* Presets */}
      {!isEditing && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 text-muted">
            <Info className="h-3.5 w-3.5" /> Presets:
          </span>
          <button onClick={() => applyPreset("0 3 * * *")} className="px-2 py-1 rounded-full border hover:bg-slate-50">
            Diario 03:00
          </button>
          <button onClick={() => applyPreset("0 */6 * * *")} className="px-2 py-1 rounded-full border hover:bg-slate-50">
            Cada 6 horas
          </button>
          <button onClick={() => applyPreset("0 0 * * 0")} className="px-2 py-1 rounded-full border hover:bg-slate-50">
            Domingos 00:00
          </button>
        </div>
      )}

      {/* Acciones */}
      <div className="flex gap-2">
        <Button onClick={() => setPendingAction({ type: "save" })} disabled={!canSave || saving}>
          {saving ? "Guardando…" : isEditing ? "Actualizar programación" : "Guardar programación"}
        </Button>
      </div>
    </div>
  );
}
