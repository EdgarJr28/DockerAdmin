'use client';
import { useEffect, useMemo, useState } from 'react';
import Spinner from '@/app/components/ui/Spinner';
import ConfirmDialog from '@/app/components/ui/ConfirmDialog';
import { Scheduler } from '@/app/libs/api';

function isLikelyCron(expr: string) {
    // Validación ligera (5 o 6 campos). El backend debe validar “en serio”.
    const parts = expr.trim().split(/\s+/);
    return parts.length >= 5 && parts.length <= 6;
}

export default function SchedulerCard() {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [enabled, setEnabled] = useState(false);
    const [expr, setExpr] = useState('');
    const [target, setTarget] = useState('');

    // confirm dialog
    const [pendingAction, setPendingAction] = useState<null | { type: 'save' | 'disable' }>(null);

    const canSave = useMemo(
        () => isLikelyCron(expr) && target.trim().length > 0,
        [expr, target]
    );

    const load = async () => {
        setLoading(true); setError(null);
        try {
            const data = await Scheduler.get();
            setEnabled(!!data.enabled);
            setExpr(data.expr ?? '');
            setTarget(data.target ?? '');
        } catch (e: any) {
            setError(e.message ?? 'Error al cargar scheduler');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const onSave = async () => {
        setSaving(true);
        try {
            await Scheduler.set(expr.trim(), target.trim());
            await load();
        } catch (e: any) {
            setError(e.message ?? 'Error al guardar');
        } finally {
            setSaving(false);
            setPendingAction(null);
        }
    };

    const onDisable = async () => {
        setSaving(true);
        try {
            await Scheduler.disable();
            await load();
        } catch (e: any) {
            setError(e.message ?? 'Error al desactivar');
        } finally {
            setSaving(false);
            setPendingAction(null);
        }
    };

    return (
        <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-lg">Reinicio programado (cron)</h2>
                    {loading && <Spinner label="Cargando scheduler..." />}
                </div>
                {enabled ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">Activo</span>
                ) : (
                    <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">Inactivo</span>
                )}
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="grid gap-3 md:grid-cols-2">
                <div>
                    <label className="text-sm font-medium">Expresión CRON</label>
                    <input
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        placeholder="0 3 * * *"
                        value={expr}
                        onChange={(e) => setExpr(e.target.value)}
                    />
                    {!isLikelyCron(expr) && expr.trim() !== '' && (
                        <p className="mt-1 text-xs text-amber-700">Formato cron poco probable (5-6 campos). Verifica.</p>
                    )}
                    <p className="mt-1 text-xs text-slate-500">Ej: <code>0 3 * * *</code> reinicia a las 03:00 todos los días.</p>
                </div>

                <div>
                    <label className="text-sm font-medium">Container objetivo</label>
                    <input
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        placeholder="mi-container-id-o-nombre"
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                    />
                    <p className="mt-1 text-xs text-slate-500">Debe coincidir con el ID/nombre que tu API espera.</p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={() => setPendingAction({ type: 'save' })}
                    disabled={!canSave || loading || saving}
                    className="rounded-lg bg-black text-white px-3 py-2 text-sm disabled:opacity-60"
                >
                    {saving && pendingAction?.type === 'save' ? 'Guardando…' : 'Guardar programación'}
                </button>

                <button
                    onClick={() => setPendingAction({ type: 'disable' })}
                    disabled={!enabled || loading || saving}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 disabled:opacity-60"
                >
                    {saving && pendingAction?.type === 'disable' ? 'Desactivando…' : 'Desactivar'}
                </button>
            </div>

            <ConfirmDialog
                open={!!pendingAction}
                title={pendingAction?.type === 'disable' ? 'Desactivar cron' : 'Guardar programación'}
                description={
                    pendingAction?.type === 'disable'
                        ? '¿Deseas desactivar el reinicio programado?'
                        : `¿Programar reinicio de "${target}" con "${expr}"?`
                }
                confirmText={pendingAction?.type === 'disable' ? 'Desactivar' : 'Confirmar'}
                cancelText="Cancelar"
                loading={saving}
                onCancel={() => !saving && setPendingAction(null)}
                onConfirm={pendingAction?.type === 'disable' ? onDisable : onSave}
            />
        </div>
    );
}
