"use client";

import Modal from "@/app/components/ui/Modal";
import SchedulerCard from "@/app/components/containers/scheduler/SchedulerCard";

type Sched = {
  id: string;
  enabled: boolean;
  expr: string;
  target: string;
  timezone?: string;
};

interface SchedulerModalProps {
  open: boolean;
  onClose: () => void;
  task?: Sched | null;
}

export default function SchedulerModal({
  open,
  onClose,
  task,
}: SchedulerModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={task ? "Editar tarea programada" : "Nueva tarea programada"}
      footer={
        <button
          onClick={onClose}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          Cerrar
        </button>
      }
    >
      <div className="max-h-[75vh] overflow-y-auto">
        <SchedulerCard task={task ?? undefined} />
      </div>
    </Modal>
  );
}
