'use client';

export function RingGauge({ value, size = 56, stroke = 8, label }: { value: number; size?: number; stroke?: number; label?: string }) {
  const v = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - v / 100);
  return (
    <div className="relative" style={{ width: size, height: size }} title={label ?? `${v.toFixed(1)}%`}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} stroke="var(--surface-border)" strokeWidth={stroke} fill="none" />
        <circle cx={size/2} cy={size/2} r={r} stroke="var(--accent)" strokeWidth={stroke} fill="none"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-xs font-semibold">{Math.round(v)}%</div>
    </div>
  );
}

export function Spark({ points, width=120, height=28 }: { points: number[]; width?: number; height?: number }) {
  const pad = 2; const min=0, max=100;
  const pts = points.length ? points : [0];
  const step = pts.length>1 ? (width - pad*2)/(pts.length-1) : 0;
  const path = pts.map((v,i)=>{
    const x = pad + i*step;
    const y = pad + (height-pad*2) * (1 - (v - min)/(max-min));
    return `${i?'L':'M'}${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height}>
      <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
