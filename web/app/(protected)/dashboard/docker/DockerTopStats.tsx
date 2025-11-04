"use client";

type Props = {
  containersRunning: number;
  containersTotal: number;
  cpuPercent?: number;
  memPercent?: number;
  dockerVersion?: string;
};

export function DockerTopStats({
  containersRunning,
  containersTotal,
  cpuPercent,
  memPercent,
  dockerVersion,
}: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white/5 border border-slate-200/10 rounded-xl p-4">
        <p className="text-xs text-slate-400 mb-1">Contenedores</p>
        <p className="text-2xl font-semibold">
          {containersRunning}/{containersTotal}
        </p>
        <p className="text-xs text-slate-500">running / total</p>
      </div>
      <div className="bg-white/5 border border-slate-200/10 rounded-xl p-4">
        <p className="text-xs text-slate-400 mb-1">CPU host</p>
        <p className="text-2xl font-semibold">
          {cpuPercent != null ? `${cpuPercent.toFixed(1)}%` : "--"}
        </p>
      </div>
      <div className="bg-white/5 border border-slate-200/10 rounded-xl p-4">
        <p className="text-xs text-slate-400 mb-1">Mem host</p>
        <p className="text-2xl font-semibold">
          {memPercent != null ? `${memPercent.toFixed(1)}%` : "--"}
        </p>
      </div>
      <div className="bg-white/5 border border-slate-200/10 rounded-xl p-4">
        <p className="text-xs text-slate-400 mb-1">Docker</p>
        <p className="text-2xl font-semibold">
          {dockerVersion ? dockerVersion : "—"}
        </p>
      </div>
    </div>
  );
}
