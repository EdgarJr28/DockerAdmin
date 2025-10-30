const API = process.env.NEXT_PUBLIC_API_URL!;
const KEY = process.env.NEXT_PUBLIC_API_KEY || "";
const DEFAULT_HOST_ID = process.env.NEXT_PUBLIC_DOCKER_HOST_ID || "ins-wayuu"; // fallback razonable

type Opts = RequestInit & {
  json?: any;
  text?: boolean;
  /** timeout opcional en ms (crea un AbortController interno) */
  timeoutMs?: number;
};

function resolveHostId(explicit?: string) {
  if (explicit) return explicit;
  if (typeof window !== "undefined") {
    try {
      const v = window.localStorage?.getItem("docker.hostId");
      if (v) return v;
    } catch {}
  }
  return DEFAULT_HOST_ID;
}

export async function api(path: string, opts: Opts = {}) {
  const headers = new Headers(opts.headers);
  if (KEY) headers.set("x-api-key", KEY);
  if (opts.json !== undefined) {
    headers.set("Content-Type", "application/json");
    opts.body = JSON.stringify(opts.json);
  }

  // --- Soporte de timeout + compose con opts.signal ---
  let controller: AbortController | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let signal: AbortSignal | undefined = opts.signal ?? undefined;

  if (opts.timeoutMs && !signal) {
    controller = new AbortController();
    signal = controller.signal;
    timeoutId = setTimeout(() => controller?.abort(), opts.timeoutMs);
  }

  try {
    const res = await fetch(`${API}${path}`, {
      ...opts,
      headers,
      cache: "no-store",
      signal,
    });

    if (!res.ok) {
      let detail = "";
      try {
        detail = await res.text();
      } catch {}
      throw new Error(
        `HTTP ${res.status}${detail ? `: ${detail.slice(0, 200)}` : ""}`
      );
    }

    if (res.status === 204) return null;
    if (opts.text) return res.text();

    try {
      return await res.json();
    } catch {
      return await res.text();
    }
  } catch (e: any) {
    if (e?.name === "AbortError") throw e;
    throw new Error(e?.message || "Network error");
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

/* -------------------- Docker Hosts (lista para el selector) -------------------- */
export const DockerHosts = {
  list: () =>
    api("/docker/hosts") as Promise<Array<{ id: string; name: string }>>,
};

/* -------------------- Contenedores (host-aware, con default) -------------------- */
export const Containers = {
  /** Lista contenedores del host activo (o el que pases) */
  list: (hostId?: string) =>
    api(`/docker/${resolveHostId(hostId)}/containers`) as Promise<any[]>,

  /** Acciones sobre un contenedor específico (host-aware) */
  start: (id: string, hostId?: string) =>
    api(`/docker/${resolveHostId(hostId)}/containers/${id}/start`, {
      method: "POST",
    }),

  stop: (id: string, hostId?: string) =>
    api(`/docker/${resolveHostId(hostId)}/containers/${id}/stop`, {
      method: "POST",
    }),

  restart: (id: string, hostId?: string) =>
    api(`/docker/${resolveHostId(hostId)}/containers/${id}/restart`, {
      method: "POST",
    }),

  /** Stats (acepta signal/timeout) */
  stats: (
    id: string,
    opts?: Pick<Opts, "signal" | "timeoutMs">,
    hostId?: string
  ) =>
    api(`/docker/${resolveHostId(hostId)}/containers/${id}/stats`, {
      ...opts,
    }) as Promise<any>,

  /** URL SSE de logs (útil para EventSource) */
  logsUrl: (id: string, hostId?: string) =>
    `${API}/docker/${resolveHostId(hostId)}/containers/${id}/logs`,
};

/* -------------------- Scheduler (host-aware + legacy) -------------------- */
export const Scheduler = {
  /** LEGACY: lista todas las tareas (de todos los hosts) */
  listAll: async () =>
    api("/scheduler/list") as Promise<
      Array<{
        id: string;
        enabled: boolean;
        expr: string;
        target: string;
        timezone?: string;
        createdAt?: string;
        updatedAt?: string;
        hostId?: string; // puede venir ya poblado del backend
        targetKind?: string; // 'container' | 'url' | 'script'
      }>
    >,

  /** NUEVO: lista tareas de un host específico */
  listByHost: (hostId?: string) =>
    api(`/scheduler/${resolveHostId(hostId)}/list/by-host`) as Promise<
      Array<{
        id: string;
        enabled: boolean;
        expr: string;
        target: string;
        timezone?: string;
        createdAt?: string;
        updatedAt?: string;
        hostId: string;
        targetKind?: string;
      }>
    >,

  /** LEGACY: crear sin ruta de host (usa DEFAULT o el de localStorage si lo mandas en body) */
  createLegacy: (
    expr: string,
    target: string,
    timezone?: string,
    options?: {
      enabled?: boolean;
      hostId?: string;
      targetKind?: "container" | "url" | "script";
    }
  ) =>
    api("/scheduler", {
      method: "POST",
      json: {
        expr,
        target,
        timezone,
        enabled: options?.enabled ?? true,
        hostId: options?.hostId ?? resolveHostId(),
        targetKind: options?.targetKind ?? "container",
      },
    }),

  /** NUEVO: crear para el host actual (o uno explícito) */
  createForHost: (
    expr: string,
    target: string,
    timezone?: string,
    hostId?: string,
    options?: { enabled?: boolean; targetKind?: "container" | "url" | "script" }
  ) =>
    api(`/scheduler/${resolveHostId(hostId)}`, {
      method: "POST",
      json: {
        expr,
        target,
        timezone,
        enabled: options?.enabled ?? true,
        targetKind: options?.targetKind ?? "container",
      },
    }),

  /** LEGACY: obtener por id (sin validar host) */
  getLegacy: (id: string) => api(`/scheduler/${id}`),

  /** NUEVO: obtener por id dentro de un host */
  getInHost: (id: string, hostId?: string) =>
    api(`/scheduler/${resolveHostId(hostId)}/${id}`),

  /** Actualizar tarea (elige ruta host-aware si pasas hostId, si no legacy) */
  update: (
    id: string,
    dto: Partial<{
      expr: string;
      target: string;
      timezone: string;
      enabled: boolean;
      hostId: string; // opcional: si lo pones, se usa ruta host-aware
      targetKind: "container" | "url" | "script";
    }>
  ) => {
    const hid = dto.hostId; // si viene, usamos la ruta nueva
    const payload = { ...dto };
    // Evita “mover” la tarea de host desde el cliente sin endpoint dedicado:
    delete (payload as any).hostId;

    if (hid) {
      return api(`/scheduler/${resolveHostId(hid)}/${id}`, {
        method: "PATCH",
        json: payload,
      });
    }
    return api(`/scheduler/${id}`, { method: "PATCH", json: payload });
  },

  /** enable/disable/remove con soporte host-aware si pasas hostId */
  enable: (id: string, hostId?: string) =>
    hostId
      ? api(`/scheduler/${resolveHostId(hostId)}/${id}/enable`, {
          method: "POST",
        })
      : api(`/scheduler/${id}/enable`, { method: "POST" }),

  disable: (id: string, hostId?: string) =>
    hostId
      ? api(`/scheduler/${resolveHostId(hostId)}/${id}/disable`, {
          method: "POST",
        })
      : api(`/scheduler/${id}/disable`, { method: "POST" }),

  remove: (id: string, hostId?: string) =>
    hostId
      ? api(`/scheduler/${resolveHostId(hostId)}/${id}`, { method: "DELETE" })
      : api(`/scheduler/${id}`, { method: "DELETE" }),

  /** Helper: mantiene compatibilidad con componentes viejos que solo leen “la primera habilitada” */
  get: async () => {
    const list = (await api("/scheduler/list")) as Array<any>;
    if (!list.length) return { enabled: false };
    const enabled = list.find((s: any) => s.enabled) ?? list[0];
    return {
      enabled: !!enabled.enabled,
      expr: enabled.expr,
      target: enabled.target,
      timezone: enabled.timezone,
      hostId: enabled.hostId,
      targetKind: enabled.targetKind,
    };
  },
};

/* -------------------- Métricas (host-aware con fallback a legacy) -------------------- */
export const Metrics = {
  /** Métricas del host (REST). Intenta /metrics/:hostId/host y, si no existe, usa /metrics/host */
  host: async (signal?: AbortSignal, hostId?: string) => {
    const hid = resolveHostId(hostId);
    try {
      return await api(`/metrics/${hid}/host`, { signal });
    } catch (e: any) {
      // compatibilidad con backend antiguo sin hostId
      if (String(e?.message || "").includes("HTTP 404")) {
        return api(`/metrics/host`, { signal });
      }
      throw e;
    }
  },

  /** Métricas de Docker (REST). Igual que arriba, con fallback */
  docker: async (signal?: AbortSignal, hostId?: string) => {
    const hid = resolveHostId(hostId);
    try {
      return await api(`/metrics/${hid}/docker`, { signal });
    } catch (e: any) {
      if (String(e?.message || "").includes("HTTP 404")) {
        return api(`/metrics/docker`, { signal });
      }
      throw e;
    }
  },
};
