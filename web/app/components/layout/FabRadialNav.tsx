'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';

type Item = { label: string; href: string; emoji?: string };
const ITEMS: Item[] = [
    { label: 'Dashboard', href: '/dashboard', emoji: '📊' },
    { label: 'Servicios', href: '/services', emoji: '🐳' },
    { label: 'APIs', href: '/apis', emoji: '🔌' },
    // { label: 'Settings',  href: '/settings',  emoji: '⚙️' },
];

export default function FabRadialNav() {
    const [open, setOpen] = useState(false);

    // posiciones polares → cartesianas
    const positions = useMemo(() => {
        const radius = 96;     // distancia desde el FAB
        const startDeg = -180; // empieza apuntando a la IZQUIERDA
        const spread = 90;   // abre 90° hasta arriba (-90°)
        return ITEMS.map((_, i) => {
            const angle = (startDeg + (spread / (ITEMS.length - 1 || 1)) * i) * (Math.PI / 180);
            return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
        });
    }, []);


    return (
        <>
            {/* backdrop clickeable cuando está abierto */}
            <button
                aria-label="Cerrar menú"
                className={`fixed inset-0 z-40 bg-black/20 transition-opacity ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setOpen(false)}
            />

            {/* contenedor FAB */}
            <div className="fixed z-50 bottom-16 right-6">
                {/* items radiales */}
                <div className="relative">
                    {ITEMS.map((it, idx) => (
                        <Link
                            key={it.href}
                            href={it.href}
                            aria-label={it.label}
                            className={`
                absolute inline-flex items-center justify-center hover:scale-110 hover:duration-300
                h-14 w-14 rounded-full bg-white border shadow-lg
                text-base transition-all duration-300
                ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}
                hover:bg-slate-50
              `}
                            style={{
                                transform: open
                                    ? `translate(${positions[idx].x}px, ${positions[idx].y}px)`
                                    : 'translate(0,0)',
                            }}
                            onClick={() => setOpen(false)}
                        >
                            <span className="select-none">{it.emoji ?? '•'}</span>
                            <span className="absolute -left-2 -translate-x-full whitespace-nowrap
                               bg-black text-white text-xs py-1 px-2 rounded-lg shadow
                               opacity-0 group-hover:opacity-100 hidden md:block">
                                {it.label}
                            </span>
                        </Link>
                    ))}

                    {/* botón principal */}
                    <button
                        onClick={() => setOpen(v => !v)}
                        aria-expanded={open}
                        aria-label="Abrir menú"
                        className={`
              inline-flex items-center justify-center
              h-14 w-14 rounded-full
              bg-slate-900 dark:bg-slate-400 text-white shadow-xl
              hover:opacity-90
              transition
            `}
                    >
                        <span className={`text-2xl transition-transform ${open ? 'rotate-45' : 'rotate-0'}`}>＋</span>
                    </button>
                </div>
            </div>
        </>
    );
}
