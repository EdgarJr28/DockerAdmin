const API = process.env.NEXT_PUBLIC_API_URL!;
const KEY = process.env.NEXT_PUBLIC_API_KEY || '';

type Opts = RequestInit & { json?: any; text?: boolean };

export async function api(path: string, opts: Opts = {}) {
    const headers = new Headers(opts.headers);
    if (KEY) headers.set('x-api-key', KEY);
    if (opts.json) { headers.set('Content-Type', 'application/json'); opts.body = JSON.stringify(opts.json); }
    const res = await fetch(`${API}${path}`, { ...opts, headers, cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return opts.text ? res.text() : res.json();
}

// --- helpers de contenedores ---
export const Containers = {
    list: () => api('/docker/containers') as Promise<any[]>,
    start: (id: string) => api(`/docker/containers/${id}/start`, { method: 'POST' }),
    stop: (id: string) => api(`/docker/containers/${id}/stop`, { method: 'POST' }),
    restart: (id: string) => api(`/docker/containers/${id}/restart`, { method: 'POST' }),
    logsUrl: (id: string) => `${process.env.NEXT_PUBLIC_API_URL}/docker/containers/${id}/logs`,
};


// src/app/libs/api.ts
export const Scheduler = {
    get: async () => {
        const res = await api('/scheduler', { cache: 'no-store' });
        if (!res.ok) throw new Error('No se pudo obtener el scheduler');
        return res.json() as Promise<{ enabled: boolean; expr?: string; target?: string }>;
    },
    set: async (expr: string, target: string) => {
        const res = await api('/scheduler', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ expr, target }),
        });
        if (!res.ok) throw new Error('No se pudo programar el reinicio');
        return res.json();
    },
    disable: async () => {
        const res = await api('/scheduler', { method: 'DELETE' });
        if (!res.ok) throw new Error('No se pudo desactivar el cron');
        return res.json();
    },
};
