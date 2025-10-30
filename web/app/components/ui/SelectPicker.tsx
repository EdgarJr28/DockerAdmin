"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";

export type SelectOption = {
  value: string;
  label: string;
  /** Texto secundario opcional (ej. id, ruta, alias) */
  hint?: string;
  /** Muestra un indicador a la derecha: puntico o texto */
  rightDotClass?: string; // ej. "bg-emerald-500" | "bg-red-500"
  rightText?: string; // ej. "running", "stopped"
  disabled?: boolean;
};

type Props = {
  /** Opciones a renderizar (UI-only) */
  options: SelectOption[];
  /** Valor seleccionado (controlado) */
  value?: string;
  /** Emite el nuevo valor (value y la opción completa) */
  onChange: (value: string, option: SelectOption) => void;

  /** Placeholder cuando no hay selección */
  placeholder?: string;
  /** Deshabilitar control */
  disabled?: boolean;
  /** Habilitar búsqueda interna (por label/hint) */
  searchable?: boolean;
  /** Texto mostrado cuando no hay resultados */
  emptyText?: string;

  /** Clases utilitarias (Tailwind) */
  className?: string; // wrapper
  widthClass?: string; // ancho del control (por defecto min-w)
  buttonClassName?: string; // botón
  panelClassName?: string; // panel
};

export default function SelectPicker({
  options,
  value,
  onChange,
  placeholder = "Selecciona…",
  disabled,
  searchable = true,
  emptyText = "Sin resultados",
  className,
  widthClass = "min-w-[220px]",
  buttonClassName,
  panelClassName,
}: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const btnRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const selected = useMemo(
    () => options.find((o) => o.value === value),
    [options, value]
  );

  const filtered = useMemo(() => {
    const qn = q.trim().toLowerCase();
    if (!searchable || !qn) return options;
    return options.filter((o) => {
      const L = o.label.toLowerCase();
      const H = (o.hint || "").toLowerCase();
      return L.includes(qn) || H.includes(qn);
    });
  }, [options, q, searchable]);

  // Cerrar al click fuera
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!open) return;
      const p = panelRef.current;
      const b = btnRef.current;
      if (p && p.contains(e.target as Node)) return;
      if (b && b.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  // Foco al abrir
  useEffect(() => {
    if (open && searchable) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
    if (open) {
      // coloca el foco activo en el seleccionado actual
      const idx = filtered.findIndex((o) => o.value === selected?.value);
      setActiveIndex(idx >= 0 ? idx : 0);
    } else {
      setQ("");
      setActiveIndex(-1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Navegación con teclado
  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
      scrollIntoView(activeIndex + 1);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      scrollIntoView(activeIndex - 1);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const opt = filtered[activeIndex];
      if (opt && !opt.disabled) {
        onChange(opt.value, opt);
        setOpen(false);
      }
      return;
    }
  }

  function scrollIntoView(idx: number) {
    const list = listRef.current;
    if (!list) return;
    const el = list.querySelector<HTMLElement>(`[data-idx="${idx}"]`);
    if (!el) return;
    const listRect = list.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    if (elRect.top < listRect.top) {
      list.scrollTop -= listRect.top - elRect.top;
    } else if (elRect.bottom > listRect.bottom) {
      list.scrollTop += elRect.bottom - listRect.bottom;
    }
  }

  const label =
    selected?.label || (disabled ? "—" : open ? "Seleccionando…" : placeholder);

  return (
    <div className={className} onKeyDown={onKeyDown}>
      <div className={`relative ${widthClass}`}>
        <button
          ref={btnRef}
          type="button"
          disabled={disabled}
          onClick={() => setOpen((v) => !v)}
          className={
            buttonClassName ||
            "w-full rounded-lg border px-3 py-2 text-sm bg-(--surface-bg) text-left hover:bg-slate-50 disabled:opacity-60"
          }
        >
          <div className="flex items-center justify-between gap-2">
            <span className="truncate">
              {label}
              {selected?.hint && (
                <span className="ml-2 text-xs text-muted">{selected.hint}</span>
              )}
            </span>
            <svg
              className={`h-4 w-4 transition ${
                open ? "rotate-180" : "rotate-0"
              }`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z" />
            </svg>
          </div>
        </button>

        {open && (
          <div
            ref={panelRef}
            className={
              panelClassName ||
              "absolute z-50 mt-1 w-full rounded-lg border bg-(--surface-bg) shadow-lg"
            }
          >
            {searchable && (
              <div className="p-2 border-b">
                <input
                  ref={inputRef}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar…"
                  className="w-full rounded-md border px-2 py-1.5 text-sm"
                />
              </div>
            )}

            <div ref={listRef} className="max-h-56 overflow-auto">
              {filtered.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted">{emptyText}</div>
              ) : (
                filtered.map((o, i) => {
                  const selected = o.value === value;
                  const disabled = !!o.disabled;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      data-idx={i}
                      disabled={disabled}
                      className={[
                        "w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-3",
                        selected ? "bg-blue-100" : "hover:bg-blue-50",
                        disabled ? "opacity-50 cursor-not-allowed" : "",
                        activeIndex === i
                          ? "outline outline-1 outline-blue-300"
                          : "",
                      ].join(" ")}
                      onClick={() => {
                        if (disabled) return;
                        onChange(o.value, o);
                        setOpen(false);
                      }}
                    >
                      <span className="truncate">
                        {o.label}
                        {o.hint && (
                          <span className="ml-2 text-xs text-muted">
                            {o.hint}
                          </span>
                        )}
                      </span>

                      {o.rightText ? (
                        <span className="text-[11px] text-muted">
                          {o.rightText}
                        </span>
                      ) : o.rightDotClass ? (
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${o.rightDotClass}`}
                        />
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
