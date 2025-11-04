"use client";

import { useEffect, useState, useCallback } from "react";
import { DockerHosts, api } from "@/app/libs/api";
import { useDockerHost } from "@/app/store/docker-host";
import SelectPicker, { SelectOption } from "../ui/SelectPicker";

type HostRow = { id: string; name: string; enabled?: boolean };

export default function ServerSelect() {
  const { hostId, setHostId } = useDockerHost();
  const [hosts, setHosts] = useState<HostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [probing, setProbing] = useState(false);

  // sonda con timeout para que NO bloquee el render
  async function probeHost(h: HostRow, timeoutMs = 1800): Promise<boolean> {
    try {
      // usamos el helper api() para aprovechar headers y base
      await api(`/docker/${h.id}/containers`, { timeoutMs });
      return true;
    } catch {
      return false;
    }
  }

  const fetchHosts = useCallback(async () => {
    setLoading(true);
    try {
      // 1) pido a la API
      const list = await DockerHosts.list();
      const enabled = (list || []).filter((h: HostRow) => h.enabled ?? true);

      // 2) PINTAR YA MISMO lo que vino
      setHosts(enabled);
      setLoading(false);

      // 3) Validar en background
      setProbing(true);
      const results = await Promise.all(
        enabled.map(async (h) => ({
          host: h,
          ok: await probeHost(h),
        }))
      );
      setProbing(false);

      const alive = results.filter((r) => r.ok).map((r) => r.host);

      // si no quedó ninguno vivo, dejamos los enabled originales para no dejarlo vacío
      if (alive.length) {
        setHosts(alive);

        // corregir selección si la actual murió
        if (!alive.find((h) => h.id === hostId)) {
          setHostId(alive[0].id);
        }
      } else {
        // no hay vivos → al menos conserva los enabled
        if (enabled.length && !enabled.find((h) => h.id === hostId)) {
          setHostId(enabled[0].id);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [hostId, setHostId]);

  useEffect(() => {
    fetchHosts();

    // si otro lado de la app emite "docker-hosts:updated", refrescamos
    const handler = () => fetchHosts();
    if (typeof window !== "undefined") {
      window.addEventListener("docker-hosts:updated", handler);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("docker-hosts:updated", handler);
      }
    };
  }, [fetchHosts]);

  if (loading) {
    return <div className="text-sm text-muted">Cargando servidores…</div>;
  }

  if (!hosts.length) {
    return <div className="text-sm text-muted">Sin servidores disponibles</div>;
  }

  const options: SelectOption[] = hosts.map((h) => ({
    value: h.id,
    label: h.name,
    hint: h.id,
  }));

  return (
    <div className="flex items-center gap-2">
      <SelectPicker
        options={options}
        value={hostId}
        onChange={(val) => setHostId(val)}
        placeholder="Selecciona un servidor"
        widthClass="min-w-[260px]"
      />
      {probing ? (
        <span className="text-[11px] text-slate-400">validando…</span>
      ) : null}
    </div>
  );
}
