"use client";

type ContainerRow = {
  Id: string;
  Names?: string[];
  Image?: string;
  State?: string;
  Status?: string;
  Ports?: { PrivatePort: number; PublicPort?: number; Type: string }[];
};

export function DockerContainersTable({
  hostId,
  containers,
}: {
  hostId: string;
  containers: ContainerRow[];
}) {
  const base = process.env.NEXT_PUBLIC_API_URL!;
  const key = process.env.NEXT_PUBLIC_API_KEY || "";

  async function action(id: string, cmd: "start" | "stop" | "restart") {
    await fetch(`${base}/docker/${hostId}/containers/${id}/${cmd}`, {
      method: "POST",
      headers: { "x-api-key": key },
    });
    // si quieres refrescar después, acá puedes re-disparar el fetch
  }

  return (
    <div className="bg-white/5 border border-slate-200/10 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200/10 flex items-center justify-between">
        <h2 className="font-semibold text-sm">Contenedores Docker</h2>
        <span className="text-xs text-muted">
          {containers.length} encontrados
        </span>
      </div>
      <table className="min-w-full text-sm">
        <thead className="bg-slate-900/30 text-left text-xs uppercase tracking-wide text-slate-400">
          <tr>
            <th className="px-4 py-2">Nombre</th>
            <th className="px-4 py-2">Imagen</th>
            <th className="px-4 py-2">Estado</th>
            <th className="px-4 py-2">Puertos</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {containers.map((c) => {
            const name =
              c.Names?.[0]?.replace(/^\//, "") ?? c.Id.slice(0, 12);
            return (
              <tr key={c.Id} className="border-t border-slate-200/5">
                <td className="px-4 py-2">{name}</td>
                <td className="px-4 py-2">{c.Image ?? "—"}</td>
                <td className="px-4 py-2">
                  <span
                    className={
                      c.State === "running"
                        ? "inline-flex items-center px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-200 text-xs"
                        : "inline-flex items-center px-2 py-1 rounded-full bg-slate-500/15 text-slate-200 text-xs"
                    }
                  >
                    {c.State ?? "—"}
                  </span>
                </td>
                <td className="px-4 py-2 text-xs text-slate-200/80">
                  {c.Ports?.length
                    ? c.Ports.map((p) =>
                        p.PublicPort
                          ? `${p.PublicPort}→${p.PrivatePort}/${p.Type}`
                          : `${p.PrivatePort}/${p.Type}`
                      ).join(", ")
                    : "—"}
                </td>
                <td className="px-4 py-2 space-x-2">
                  {c.State !== "running" ? (
                    <button
                      onClick={() => action(c.Id, "start")}
                      className="text-xs px-3 py-1 rounded bg-emerald-600 text-white"
                    >
                      Start
                    </button>
                  ) : (
                    <button
                      onClick={() => action(c.Id, "stop")}
                      className="text-xs px-3 py-1 rounded bg-amber-500 text-white"
                    >
                      Stop
                    </button>
                  )}
                  <button
                    onClick={() => action(c.Id, "restart")}
                    className="text-xs px-3 py-1 rounded bg-slate-600 text-white"
                  >
                    Restart
                  </button>
                </td>
              </tr>
            );
          })}
          {!containers.length && (
            <tr>
              <td
                colSpan={5}
                className="px-4 py-6 text-center text-slate-400 text-sm"
              >
                Sin contenedores para este host.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
