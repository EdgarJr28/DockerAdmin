export default function Progress({ value }: { value: number }) {
    return (
        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-slate-900" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
        </div>
    );
}
