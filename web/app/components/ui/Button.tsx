// components/ui/Button.tsx
type Variant = 'primary' | 'outline' | 'danger';

export default function Button(
    { className, children, ...p }:
        React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }
) {
    const v = (p as any).variant as Variant ?? 'primary';
    const base =
        'inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition ' +
        'disabled:opacity-60 disabled:cursor-not-allowed';

    const styles = {
        // usa tu --accent como color de acción, buen contraste en ambos temas
        primary: 'bg-[var(--accent)] text-[var(--bg)] hover:opacity-90',
        // borde y texto con tus vars; hover con un tinte del borde
        outline: 'border border-[color:var(--surface-border)] text-[var(--text)] hover:bg-[color:var(--surface-border)]/20',
        // puedes dejar danger rojo “sistema” o definir --danger en @theme si prefieres
        danger: 'bg-red-600 text-white hover:opacity-90',
    }[v];

    return (
        <button {...p} className={`${base} ${styles} ${className ?? ''}`}>
            {children}
        </button>
    );
}
