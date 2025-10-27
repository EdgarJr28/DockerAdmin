// components/ui/Spinner.tsx
type SpinnerProps = { className?: string; label?: string; };
export default function Spinner({ className, label = 'Cargando...' }: SpinnerProps) {
    return (
        <span role="status" aria-live="polite" className="inline-flex items-center gap-2">
            <span
                className={[
                    'inline-block animate-spin rounded-full border-2',
                    'border-[color:var(--surface-border)] border-t-[var(--accent)]', // aro con tus vars
                    'h-4 w-4', className ?? ''
                ].join(' ')}
            />
            <span className="sr-only">{label}</span>
        </span>
    );
}
