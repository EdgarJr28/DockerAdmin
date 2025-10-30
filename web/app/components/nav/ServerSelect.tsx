// src/app/components/nav/ServerSelect.tsx
"use client";

import { useEffect, useState } from "react";

import { DockerHosts } from "@/app/libs/api";
import { useDockerHost } from "@/app/store/docker-host";
import SelectPicker, { SelectOption } from "../ui/SelectPicker";

type HostRow = { id: string; name: string; enabled?: boolean };

export default function ServerSelect() {
  const { hostId, setHostId } = useDockerHost();
  const [hosts, setHosts] = useState<HostRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const list = await DockerHosts.list();
        if (!alive) return;
        const enabled = (list || []).filter((h: HostRow) => h.enabled ?? true);
        setHosts(enabled);

        // Si no hay host seleccionado o ya no existe, selecciona el primero
        if (enabled.length && !enabled.find((h) => h.id === hostId)) {
          setHostId(enabled[0].id);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []); // carga una sola vez

  if (loading) {
    return <div className="text-sm text-muted">Cargando servidores…</div>;
  }

  if (!hosts.length) {
    return <div className="text-sm text-muted">Sin servidores disponibles</div>;
  }

  const options: SelectOption[] = hosts.map((h) => ({
    value: h.id,
    label: h.name,
    hint: h.id, // muestra el id en pequeño al lado del nombre
  }));

  return (
    <SelectPicker
      options={options}
      value={hostId}
      onChange={(val) => setHostId(val)}
      placeholder="Selecciona un servidor"
      widthClass="min-w-[260px]"
    />
  );
}
