// app/libs/api.ts

const API = process.env.NEXT_PUBLIC_API_URL!;
const KEY = process.env.NEXT_PUBLIC_API_KEY || "";
const DEFAULT_HOST_ID =
  process.env.NEXT_PUBLIC_DOCKER_HOST_ID || "ins-wayuu"; // fallback razonable

type Opts = RequestInit & {
  json?: any;
  text?: boolean;
  /** timeout opcional en ms (crea un AbortController interno) */
  timeoutMs?: number;
};

/* =========================================
   AUTH HELPER
   ========================================= */

const TOKEN_KEY = "kc_token";
const REFRESH_KEY = "kc_refresh";
const PROFILE_KEY = "kc_profile";

export const Auth = {
  getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(TOKEN_KEY);
  },

  getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(REFRESH_KEY);
  },

  setTokens(access: string, refresh?: string) {
    if (typeof window === "undefined") return;
    if (!access) return;

    window.localStorage.setItem(TOKEN_KEY, access);
    if (refresh) {
      window.localStorage.setItem(REFRESH_KEY, refresh);
    }

    // compat con tu código viejo
    document.cookie = `auth=${access}; path=/; max-age=3600`;
  },

  setProfile(profile: any) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  },

  getProfile<T = any>(): T | null {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  clear() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
    window.localStorage.removeItem(PROFILE_KEY);
    document.cookie = "auth=; path=/; max-age=0";
  },

  /**
   * Login contra tu Nest (/auth/login) que a su vez habla con Keycloak
   * Esperamos algo así:
   *  { ok: true, token, refreshToken, profile }
   */
  async login(username: string, password: string) {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || "Credenciales inválidas");
    }

    const data = await res.json();

    // soportar nombres distintos:
    const access =
      data.accessToken || data.token || data.access_token;
    const refresh =
      data.refreshToken || data.refresh_token;

    if (!access) {
      throw new Error("La API no devolvió un token de acceso válido");
    }

    Auth.setTokens(access, refresh);

    if (data.profile) {
      Auth.setProfile(data.profile);
    }

    return data;
  },

  logout(redirect = true) {
    Auth.clear();
    if (redirect && typeof window !== "undefined") {
      window.location.href = "/login";
    }
  },
};

/* =========================================
   HELPERS BASE
   ========================================= */

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

/**
 * Wrapper general que:
 * - Pone API KEY
 * - Pone Authorization si hay token
 * - Maneja 401 y limpia sesión
 * - Formatea errores de Nest para el toast
 */
export async function api(path: string, opts: Opts = {}) {
  const headers = new Headers(opts.headers);

  // API Key
  if (KEY) headers.set("x-api-key", KEY);

  // Token si lo hay
  const token = Auth.getAccessToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // JSON body
  if (opts.json !== undefined) {
    headers.set("Content-Type", "application/json");
    opts.body = JSON.stringify(opts.json);
  }

  // timeout
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

    // OK
    if (res.ok) {
      if (res.status === 204) return null;
      if (opts.text) return res.text();
      try {
        return await res.json();
      } catch {
        return await res.text();
      }
    }

    // 401 → limpiar sesión
    if (res.status === 401) {
      Auth.clear();
      if (typeof window !== "undefined") {
        if (!window.location.pathname.startsWith("/login")) {
          window.location.href = "/login";
        }
      }
      throw new Error("No autorizado. Inicia sesión nuevamente.");
    }

    // Otro error → intentar formatear
    const ct = res.headers.get("content-type") || "";
    let message = "Ocurrió un error en el servidor.";
    if (ct.includes("application/json")) {
      const errData = await res.json().catch(() => null);
      if (errData) {
        message =
          typeof errData.message === "string"
            ? errData.message
            : Array.isArray(errData.message)
            ? errData.message.join(", ")
            : message;
      }
    } else {
      message = await res.text().catch(() => message);
    }

    const err = new Error(message);
    (err as any).status = res.status;
    throw err;
  } catch (e: any) {
    if (e?.name === "AbortError") {
      throw new Error("La solicitud tardó demasiado y fue cancelada.");
    }
    throw e;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

/* =========================================
   DOCKER HOSTS (para el selector)
   ========================================= */

export const DockerHosts = {
  list: () =>
    api("/docker/hosts") as Promise<
      Array<{ id: string; name: string; enabled?: boolean }>
    >,
};

/* =========================================
   CONTENEDORES
   ========================================= */

export const Containers = {
  list: (hostId?: string) =>
    api(`/docker/${resolveHostId(hostId)}/containers`) as Promise<any[]>,

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

  stats: (
    id: string,
    opts?: Pick<Opts, "signal" | "timeoutMs">,
    hostId?: string
  ) =>
    api(`/docker/${resolveHostId(hostId)}/containers/${id}/stats`, {
      ...opts,
    }) as Promise<any>,

  logsUrl: (id: string, hostId?: string) =>
    `${API}/docker/${resolveHostId(hostId)}/containers/${id}/logs`,
};

/* =========================================
   SCHEDULER
   ========================================= */

export const Scheduler = {
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
        hostId?: string;
        targetKind?: string;
      }>
    >,

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

  getLegacy: (id: string) => api(`/scheduler/${id}`),

  getInHost: (id: string, hostId?: string) =>
    api(`/scheduler/${resolveHostId(hostId)}/${id}`),

  update: (
    id: string,
    dto: Partial<{
      expr: string;
      target: string;
      timezone: string;
      enabled: boolean;
      hostId: string;
      targetKind: "container" | "url" | "script";
    }>
  ) => {
    const hid = dto.hostId;
    const payload = { ...dto };
    delete (payload as any).hostId;

    if (hid) {
      return api(`/scheduler/${resolveHostId(hid)}/${id}`, {
        method: "PATCH",
        json: payload,
      });
    }
    return api(`/scheduler/${id}`, { method: "PATCH", json: payload });
  },

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
      ? api(`/scheduler/${resolveHostId(hostId)}/${id}`, {
          method: "DELETE",
        })
      : api(`/scheduler/${id}`, { method: "DELETE" }),

  /** helper para componentes viejos */
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

/* =========================================
   MÉTRICAS
   ========================================= */

export const Metrics = {
  host: async (signal?: AbortSignal, hostId?: string) => {
    const hid = resolveHostId(hostId);
    try {
      return await api(`/metrics/${hid}/host`, { signal });
    } catch (e: any) {
      if (String(e?.message || "").includes("404")) {
        return api(`/metrics/host`, { signal });
      }
      throw e;
    }
  },

  docker: async (signal?: AbortSignal, hostId?: string) => {
    const hid = resolveHostId(hostId);
    try {
      return await api(`/metrics/${hid}/docker`, { signal });
    } catch (e: any) {
      if (String(e?.message || "").includes("404")) {
        return api(`/metrics/docker`, { signal });
      }
      throw e;
    }
  },
};

/* =========================================
   HOSTS (REST)
   ========================================= */

export const Hosts = {
  list: async () => {
    return api("/docker-hosts");
  },

  create: async (data: any) => {
    return api("/docker-hosts", {
      method: "POST",
      json: data,
    });
  },

  update: async (code: string, data: any) => {
    return api(`/docker-hosts/${code}`, {
      method: "PATCH",
      json: data,
    });
  },

  remove: async (code: string) => {
    return api(`/docker-hosts/${code}`, {
      method: "DELETE",
    });
  },

  test: async (data: {
    baseUrl: string;
    basicUser?: string;
    basicPass?: string;
  }) => {
    return api("/docker-hosts/test", {
      method: "POST",
      json: data,
      timeoutMs: 7000,
    });
  },
};
