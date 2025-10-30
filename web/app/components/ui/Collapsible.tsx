"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

type Props = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  defaultOpen?: boolean;
  onToggle?: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
};

export default function Collapsible({
  title,
  subtitle,
  defaultOpen = false,
  onToggle,
  children,
  className = "",
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState<number | "auto">(0);

  useEffect(() => {
    if (open) {
      // medida real para animar
      const h = contentRef.current?.scrollHeight ?? 0;
      setHeight(h);
      // reset a auto al final de la animación para que crezca con el contenido
      const t = setTimeout(() => setHeight("auto"), 250);
      return () => clearTimeout(t);
    } else {
      // colapsar: medimos y luego ponemos 0 para animar
      const h = contentRef.current?.scrollHeight ?? 0;
      setHeight(h);
      requestAnimationFrame(() => setHeight(0));
    }
  }, [open]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    onToggle?.(next);
  };

  return (
    <div className={`surface rounded-2xl ${className}`}>
      {/* Header */}
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-4 py-3 rounded-2xl text-left hover:bg-(--surface-border)/40 focus:outline-none focus:ring-2 focus:ring-(--accent)"
      >
        <div className="min-w-0">
          <div className="font-semibold truncate">{title}</div>
          {subtitle && (
            <div className="text-xs text-muted truncate mt-0.5">{subtitle}</div>
          )}
        </div>
        <ChevronDown
          className={`h-5 w-5 shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Content (animado) */}
      <div
        className="overflow-hidden transition-[max-height,opacity,transform] duration-200 ease-out px-4 pb-4"
        style={{
          maxHeight: height === "auto" ? undefined : height,
          opacity: open ? 1 : 0,
          transform: open ? "translateY(0)" : "translateY(-4px)",
        }}
        aria-hidden={!open}
      >
        <div ref={contentRef}>{children}</div>
      </div>
    </div>
  );
}
