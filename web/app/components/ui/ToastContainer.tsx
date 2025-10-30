"use client";
import { useToastStore } from "@/app/store/toast-store";
import { useEffect, useState } from "react";
import { CheckCircle2, Info, AlertTriangle, XCircle } from "lucide-react";

type ToastItemProps = {
  id: number;
  message: string;
  severity: "success" | "error" | "info" | "warning";
  onDone: () => void; // llamado cuando termina la animación de salida
  autoCloseMs?: number; // default 3000
};

function ToastItem({
  id,
  message,
  severity,
  onDone,
  autoCloseMs = 3000,
}: ToastItemProps) {
  const [show, setShow] = useState(false); // controla enter/exit

  // Animación de entrada
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 10); // pequeño delay para que aplique la transition
    return () => clearTimeout(t);
  }, []);

  // Auto-cierre → dispara animación de salida
  useEffect(() => {
    const t = setTimeout(() => setShow(false), autoCloseMs);
    return () => clearTimeout(t);
  }, [autoCloseMs]);

  // Cuando termina la transición y ya no está "show", notificamos para remover del store
  const handleTransitionEnd = () => {
    if (!show) onDone();
  };

  const colors = {
    success: "bg-emerald-500 text-white",
    error: "bg-red-500 text-white",
    info: "bg-blue-500 text-white",
    warning: "bg-yellow-500 text-slate-900",
  }[severity];

  const Icon = {
    success: CheckCircle2,
    error: XCircle,
    info: Info,
    warning: AlertTriangle,
  }[severity];

  return (
    <div
      role="status"
      aria-live="polite"
      onTransitionEnd={handleTransitionEnd}
      className={[
        "pointer-events-auto",
        "rounded-md shadow-lg px-4 py-3",
        "flex items-start gap-2",
        "transform transition-all duration-300 ease-out",
        // enter/exit
        show ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0",
        colors,
        "w-[300px] sm:w-[360px]",
      ].join(" ")}
    >
      <Icon className="h-5 w-5 shrink-0 mt-0.5" />
      <div className="text-sm leading-5 wrap-break-words">{message}</div>
    </div>
  );
}

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div
      className={[
        "fixed top-20 right-4 z-10000",
        "flex flex-col gap-2",
        "pointer-events-none", // no bloquea clics fuera
      ].join(" ")}
    >
      {toasts.map((t) => (
        <ToastItem
          key={t.id}
          id={t.id}
          message={t.message}
          severity={t.severity}
          onDone={() => removeToast(t.id)} // se remueve tras animar salida
          autoCloseMs={3000}
        />
      ))}
    </div>
  );
}
