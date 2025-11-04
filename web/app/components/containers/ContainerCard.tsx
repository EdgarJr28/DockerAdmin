"use client";
import { useState } from "react";
import Link from "next/link";
import ContainerActions from "./ContainerActions";
import { getName, shortId } from "@/app/libs/utils";
import StatsModal from "./stats/StatsModal";
import Button from "@/app/components/ui/Button";
import { Card } from "@/app/components/ui/Card";

export default function ContainerCard({
  c,
  onOp,
}: {
  c: any;
  onOp: (id: string, op: "start" | "stop" | "restart") => Promise<void>;
}) {
  const name = getName(c);
  const isRunning = (c.State || "").toLowerCase() === "running";
  const [openStats, setOpenStats] = useState(false);

  const statusColor = isRunning
    ? "text-emerald-600 bg-emerald-50 border-emerald-200"
    : "text-red-600 bg-red-50 border-red-200";

  return (
    <Card
      className="
        bg-white 
        border border-slate-200 
        rounded-2xl
        shadow-sm hover:shadow-md hover:border-slate-300
        p-6 sm:p-7
        transition-all duration-150
        w-full
        max-w-[1100px]
        mx-auto
        flex flex-col gap-4
      "
    >
      {/* ───────── HEADER ───────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className={`h-2.5 w-2.5 rounded-full ${isRunning ? "bg-green-500" : "bg-red-500"
              }`}
          />
          <h2 className="font-semibold text-lg truncate">{name}</h2>
        </div>

        <div
          className={`text-xs font-medium px-3 py-1 rounded-full border ${statusColor}`}
        >
          {isRunning ? "En ejecución" : "Detenido"}
        </div>
      </div>

      {/* ───────── INFO PRINCIPAL ───────── */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 text-sm">
        <div>
          <span className="text-slate-400 block text-xs uppercase">
            Imagen
          </span>
          <span className="font-mono text-slate-700 truncate">{c.Image}</span>
        </div>

        <div>
          <span className="text-slate-400 block text-xs uppercase">ID</span>
          <span className="font-mono text-slate-700">{shortId(c.Id)}</span>
        </div>

        <div>
          <span className="text-slate-400 block text-xs uppercase">
            Estado
          </span>
          <span className="text-slate-700">{c.State}</span>
        </div>

        <div>
          <span className="text-slate-400 block text-xs uppercase">
            Último estado
          </span>
          <span className="text-slate-700">{c.Status}</span>
        </div>

        {c.Command && (
          <div className="sm:col-span-2 lg:col-span-3">
            <span className="text-slate-400 block text-xs uppercase">
              Comando
            </span>
            <span className="font-mono text-slate-600 text-xs break-all">
              {c.Command}
            </span>
          </div>
        )}
      </div>

      {/* ───────── FOOTER ───────── */}
      <div className="flex flex-wrap items-center justify-between border-t border-slate-100 pt-4 mt-2">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <Link
            href={`/containers/${c.Id}/logs?name=${encodeURIComponent(name)}`}
            className="underline text-slate-600 hover:text-blue-600 transition-colors"
          >
            Ver logs
          </Link>

          <Button
            variant="outline"
            className="px-3 py-1 text-xs"
            onClick={() => setOpenStats(true)}
          >
            Estadísticas 📊
          </Button>
        </div>

        <div className="flex gap-2 mt-3 sm:mt-0">
          <ContainerActions
            isRunning={isRunning}
            onAction={(op) => onOp(c.Id, op)}
          />
        </div>
      </div>

      {/* Modal de estadísticas */}
      <StatsModal
        id={c.Id}
        name={name}
        open={openStats}
        onClose={() => setOpenStats(false)}
      />
    </Card>
  );
}
