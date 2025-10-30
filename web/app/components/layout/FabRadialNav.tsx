"use client";
import { useMemo, useState } from "react";
import Link from "next/link";

type Item = { label: string; href: string; emoji?: string };

const ITEMS: Item[] = [
  { label: "Dashboard", href: "/dashboard", emoji: "📊" },
  { label: "Servicios", href: "/services", emoji: "🐳" },
  { label: "APIs", href: "/apis", emoji: "🔌" },
  { label: "Scheduler", href: "/scheduler", emoji: "⏰" }, // ✅ nuevo
];

export default function FabRadialNav() {
  const [open, setOpen] = useState(false);

  // posiciones polares → cartesianas
  const positions = useMemo(() => {
    const radius = 100; // distancia desde el FAB
    const startDeg = -200; // arranca hacia la izquierda
    const spread = 120; // abanico de 120° hacia arriba
    const steps = Math.max(ITEMS.length - 1, 1);
    return ITEMS.map((_, i) => {
      const angle = (startDeg + (spread / steps) * i) * (Math.PI / 170);
      return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
    });
  }, []);

  return (
    <>
      {/* backdrop clickeable cuando está abierto */}
      <button
        aria-label="Cerrar menú"
        className={`fixed inset-0 z-40 bg-black/20 transition-opacity ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
      />

      {/* contenedor FAB */}
      <div className="fixed z-50 bottom-16 right-6">
        <div className="relative">
          {ITEMS.map((it, idx) => (
            <Link
              key={it.href}
              href={it.href}
              aria-label={it.label}
              onClick={() => setOpen(false)}
              className={`
                group
                absolute inline-flex items-center justify-center
                h-14 w-14 rounded-full bg-white border shadow-lg
                text-base transition-all duration-300 will-change-transform
                ${open ? "opacity-100" : "opacity-0 pointer-events-none"}
                hover:scale-110 hover:duration-300 hover:bg-slate-50
                focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
              `}
              style={{
                transform: open
                  ? `translate(${positions[idx].x}px, ${positions[idx].y}px)`
                  : "translate(0,0)",
              }}
            >
              <span className="select-none">{it.emoji ?? "•"}</span>

              {/* tooltip */}
              <span
                className={`
                  absolute -left-2 -translate-x-full whitespace-nowrap
                  bg-black text-white text-xs py-1 px-2 rounded-lg shadow
                  opacity-0 md:group-hover:opacity-100
                  transition-opacity duration-150 pointer-events-none
                `}
              >
                {it.label}
              </span>
            </Link>
          ))}

          {/* botón principal */}
          <button
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Abrir menú"
            className={`
              inline-flex items-center justify-center
              h-14 w-14 rounded-full
              bg-slate-900 dark:bg-slate-100 text-white dark:text-black shadow-xl
              hover:opacity-90 transition
              focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
            `}
          >
            <span
              className={`text-2xl transition-transform ${
                open ? "rotate-45" : "rotate-0"
              }`}
            >
              ＋
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
