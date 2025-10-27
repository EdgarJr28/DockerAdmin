// components/ui/ConfirmDialog.tsx
'use client';
import { useEffect } from 'react';
import Spinner from '@/app/components/ui/Spinner';
import Button from '@/app/components/ui/Button';

type Variant = 'primary' | 'outline' | 'danger';
type Props = {
    open: boolean; title?: string; description?: string;
    confirmText?: string; cancelText?: string;
    onConfirm: () => void | Promise<void>; onCancel: () => void;
    loading?: boolean; confirmVariant?: Variant;
};

export default function ConfirmDialog({
    open, title = '¿Confirmar acción?', description,
    confirmText = 'Confirmar', cancelText = 'Cancelar',
    onConfirm, onCancel, loading = false, confirmVariant = 'primary',
}: Props) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open, onCancel]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center" aria-modal role="dialog">
            <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
            <div className="relative z-10 w-full max-w-md rounded-2xl p-5 shadow-xl surface">
                <h2 className="text-lg font-semibold text-main">{title}</h2>
                {description && <p className="mt-1 text-sm text-muted">{description}</p>}

                <div className="mt-5 flex items-center justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                        {cancelText}
                    </Button>
                    <Button type="button" variant={confirmVariant} onClick={onConfirm} disabled={loading}>
                        {loading && <span className="mr-2"><Spinner className="h-4 w-4" label="…" /></span>}
                        {confirmText}
                    </Button>
                </div>
            </div>
        </div>
    );
}
