export default function Sparkline({ data }: { data: number[] }) {
    const w = 120, h = 36, pad = 4;
    const min = Math.min(...data), max = Math.max(...data);
    const norm = (v: number) => (h - 2 * pad) * (1 - (v - min) / (Math.max(1, max - min))) + pad;
    const step = (w - 2 * pad) / (data.length - 1 || 1);
    const d = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${pad + i * step} ${norm(v)}`).join(' ');
    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-32 h-9">
            <path d={d} className="stroke-slate-900 fill-none" strokeWidth="2" />
            <path d={`${d} L ${w - pad} ${h - pad} L ${pad} ${h - pad} Z`} className="fill-slate-900/10" />
        </svg>
    );
}
