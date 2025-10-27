'use client';
import Badge from '@/app/components/ui/Badge';
import { Card } from '@/app/components/ui/Card';
import Spinner from '@/app/components/ui/Spinner';
import { Skeleton } from '@/app/components/ui/Skeleton';
import { useEffect, useState } from 'react';

type Row = { name: string; url: string; status: number; latencyMs: number; ok: boolean; };

export default function ApisPage() {
    const [rows, setRows] = useState<Row[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                // TODO: reemplazar con tu endpoint real /status/apis
                // const res = await fetch('/status/apis');
                // const data: Row[] = await res.json();
                // setRows(data);

                // Mock:
                await new Promise(r => setTimeout(r, 900));
                setRows([
                    { name: 'Users', url: 'https://api.example.com/users', status: 200, latencyMs: 120, ok: true },
                    { name: 'Payments', url: 'https://api.example.com/pay', status: 503, latencyMs: 0, ok: false },
                    { name: 'Search', url: 'https://api.example.com/search', status: 200, latencyMs: 180, ok: true },
                ]);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">Estado de APIs</h1>
                {loading && <Spinner label="Cargando APIs..." />}
            </div>

            <div className="grid gap-2">
                {loading ? (
                    // Skeletons mientras carga
                    Array.from({ length: 3 }).map((_, i) => (
                        <Card key={`skeleton-${i}`} className="flex items-center justify-between p-3">
                            <div className="flex items-center gap-3 w-full">
                                <Skeleton className="h-4 w-4 rounded-full" />
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-64 ml-2" />
                            </div>
                            <Skeleton className="h-4 w-16" />
                        </Card>
                    ))
                ) : (
                    rows.map(r => (
                        <Card key={r.name} className="flex items-center justify-between text-sm p-3">
                            <div className="flex items-center gap-3">
                                <Badge ok={r.ok} />
                                <div className="font-semibold">{r.name}</div>
                                <div className="text-slate-500 truncate max-w-[40ch]">{r.url}</div>
                            </div>
                            <div className="text-slate-700">{r.ok ? `${r.latencyMs} ms` : `HTTP ${r.status}`}</div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
