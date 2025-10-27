'use client';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL!;

export default function LogsPage() {
    const { id } = useParams<{ id: string }>();
    const search = useSearchParams();
    const name = search.get('name') ?? '';
    const [lines, setLines] = useState('');

    useEffect(() => {
        if (!id) return;
        const es = new EventSource(`${API}/docker/containers/${id}/logs`);
        es.onmessage = (ev) => setLines((p) => p + ev.data);
        es.onerror = () => es.close();
        return () => es.close();
    }, [id]);

    return (
        <div className="space-y-3">
            <h1 className="text-2xl font-semibold">{name || 'Logs del servicio'}</h1>
            <p className="text-sm text-slate-500">ID del contenedor: <span className="font-mono">{id}</span></p>
            <pre className="bg-black text-green-200 rounded-xl p-4 h-[70vh] overflow-auto">
                {lines || 'Esperando logs...'}
            </pre>
        </div>
    );
}
