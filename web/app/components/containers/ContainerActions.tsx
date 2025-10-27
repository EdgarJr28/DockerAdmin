'use client';
import { useState } from 'react';

export default function ContainerActions({
    isRunning,
    onAction,
}: {
    isRunning: boolean;
    onAction: (op: 'start' | 'stop' | 'restart') => Promise<void> | void;
}) {
    const [loading, setLoading] = useState<null | 'start' | 'stop' | 'restart'>(null);

    async function run(op: 'start' | 'stop' | 'restart') {
        try {
            setLoading(op);
            await onAction(op);
        } finally {
            setLoading(null);
        }
    }

    const btn = 'px-3 py-1.5 rounded-lg border text-sm disabled:opacity-60 disabled:cursor-not-allowed';

    return (
        <div className="flex gap-2">
            {isRunning ? (
                // Está corriendo → mostramos "Reiniciar"
                <button
                    disabled={!!loading}
                    onClick={() => run('restart')}
                    className={`${btn} border-amber-500 text-amber-700`}
                >
                    {loading === 'restart' ? '...' : 'Reiniciar'}
                </button>
            ) : (
                // No corriendo → mostramos "Iniciar"
                <button
                    disabled={!!loading}
                    onClick={() => run('start')}
                    className={`${btn} bg-slate-900 text-white border-slate-900`}
                >
                    {loading === 'start' ? '...' : 'Iniciar'}
                </button>
            )}

            <button
                disabled={!!loading || !isRunning}
                onClick={() => run('stop')}
                className={btn}
            >
                {loading === 'stop' ? '...' : 'Detener'}
            </button>
        </div>
    );
}
