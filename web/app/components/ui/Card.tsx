export function Card({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={`surface bg-slate-200 rounded-xl border p-4 ${className || ''}`} {...p} />;
}
