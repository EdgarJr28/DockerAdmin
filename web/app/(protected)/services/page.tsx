'use client';
import ContainerCard from '@/app/components/containers/ContainerCard';
import { Containers } from '@/app/libs/api';
import { useEffect, useState, useCallback } from 'react';
import Spinner from '@/app/components/ui/Spinner';
import { Skeleton } from '@/app/components/ui/Skeleton';
import ConfirmDialog from '@/app/components/ui/ConfirmDialog';
import SchedulerCard from '@/app/components/containers/scheduler/SchedulerCard';

type Op = 'start' | 'stop' | 'restart';

export default function ServicesPage() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Estado para confirmación
    const [pending, setPending] = useState<{ id: string; op: Op } | null>(null);
    const [confirmLoading, setConfirmLoading] = useState(false);

    const delayedSetLoading = (value: boolean, delay: number) => {
        setTimeout(() => {
            setLoading(value);
        }, delay);
    };

    const refresh = useCallback(async () => {
        delayedSetLoading(true, 0);
        setError(null);
        try {
            const data = await Containers.list();
            setItems(data);
        } catch (e: any) {
            setError(e.message ?? 'Error');
        } finally {
            delayedSetLoading(false, 2000);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    // Intercepta la operación para pedir confirmación
    const onOp = (id: string, op: Op) => {
        setPending({ id, op });
        return Promise.resolve(); // cumple el tipo
    };

    // Ejecuta la operación tras confirmar
    const runConfirmedOp = async () => {
        if (!pending) return;
        setConfirmLoading(true);
        try {
            if (pending.op === 'start') await Containers.start(pending.id);
            if (pending.op === 'stop') await Containers.stop(pending.id);
            if (pending.op === 'restart') await Containers.restart(pending.id);
            await refresh();
        } catch (e) {
            // puedes setear error si quieres mostrarlo arriba
            console.error(e);
        } finally {
            setPending(null);
            delayedSetLoading(false, 0);
        }
    };

    // Texto dinámico según op
    const dialogCopy = (() => {
        if (!pending) return { title: '', desc: '', cta: '' };
        const map: Record<Op, { title: string; desc: string; cta: string }> = {
            start: { title: 'Iniciar contenedor', desc: '¿Deseas iniciar este contenedor?', cta: 'Iniciar' },
            stop: { title: 'Detener contenedor', desc: '¿Deseas detener este contenedor?', cta: 'Detener' },
            restart: { title: 'Reiniciar contenedor', desc: '¿Deseas reiniciar este contenedor?', cta: 'Reiniciar' },
        };
        return map[pending.op];
    })();

    return (
        <div className="space-y-4">
             <SchedulerCard />
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold">Servicios</h1>
                    {loading && <Spinner label="Cargando servicios..." />}
                </div>

                <button
                    onClick={refresh}
                    disabled={loading}
                    className="px-3 py-2 rounded-lg text-white bg-black disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {loading ? 'Actualizando…' : 'Refrescar'}
                </button>
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <div className="grid gap-3">
                {loading
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <div key={`s-${i}`} className="rounded-lg border border-slate-200 p-4">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-4 w-4 rounded-full" />
                                    <Skeleton className="h-4 w-40" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-12 w-20 rounded-md" />
                                    <Skeleton className="h-12 w-20 rounded-md" />
                                    <Skeleton className="h-12 w-20 rounded-md" />
                                </div>
                            </div>
                            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                            </div>
                        </div>
                    ))
                    : items.map((c) => (
                        <ContainerCard key={c.Id} c={c} onOp={onOp} />
                    ))}
            </div>

            {!loading && !error && !items.length && (
                <p className="text-sm text-slate-500">No hay contenedores.</p>
            )}

            {/* Modal de confirmación */}
            <ConfirmDialog
                open={!!pending}
                title={dialogCopy.title}
                description={dialogCopy.desc}
                confirmText={dialogCopy.cta}
                cancelText="Cancelar"
                loading={confirmLoading}
                onCancel={() => !confirmLoading && setPending(null)}
                onConfirm={runConfirmedOp}
            />
        </div>
    );
}
