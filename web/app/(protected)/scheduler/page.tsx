"use client";

import SchedulerCard from "@/app/components/containers/scheduler/SchedulerCard";
import SchedulesList from "@/app/components/containers/scheduler/ScheduleStatus";
import { CalendarClock } from "lucide-react";

export default function SchedulerPage() {
  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-(--muted)" />
          <h1 className="text-2xl font-bold">Tareas programadas</h1>
        </div>
      </div>
      {/* Lista de tareas configuradas */}
      <SchedulesList />
    </div>
  );
}
