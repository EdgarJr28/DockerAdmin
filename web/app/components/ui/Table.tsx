export function Table({ children }: { children: React.ReactNode }) {
    return <div className="overflow-x-auto rounded-xl border bg-white">{children}</div>;
}
export function THeader({ children }: { children: React.ReactNode }) {
    return <div className="min-w-[640px] grid grid-cols-5 px-4 py-2 text-xs font-semibold text-slate-600 border-b">{children}</div>;
}
export function TRow({ children }: { children: React.ReactNode }) {
    return <div className="min-w-[640px] grid grid-cols-5 px-4 py-3 text-sm border-b last:border-0">{children}</div>;
}
