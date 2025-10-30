"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Card } from "@/app/components/ui/Card";
import Button from "@/app/components/ui/Button";
import {
  Play,
  Pause,
  Copy,
  Trash2,
  WrapText,
  ChevronsDown,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL!;

export default function LogsPage() {
  const { id } = useParams<{ id: string }>();
  const search = useSearchParams();
  const name = search.get("name") ?? "";

  // Estado
  const [chunks, setChunks] = useState<string[]>([]);
  const [follow, setFollow] = useState(true); // auto-scroll
  const [wrap, setWrap] = useState(false); // word-wrap
  const containerRef = useRef<HTMLPreElement | null>(null);
  const sseRef = useRef<EventSource | null>(null);

  // Parámetros de buffer
  const MAX_LINES = 5000; // ajusta según gusto
  const text = useMemo(() => chunks.join(""), [chunks]);
  const totalLines = useMemo(() => text.match(/\n/g)?.length ?? 0, [text]);

  // Conectar SSE
  useEffect(() => {
    if (!id) return;

    // Cierra previo
    sseRef.current?.close();

    const connect = () => {
      const es = new EventSource(`${API}/docker/containers/${id}/logs`);
      sseRef.current = es;

      es.onmessage = (ev) => {
        // Asegura salto de línea entre eventos si hace falta
        const data = ev.data.endsWith("\n") ? ev.data : ev.data + "\n";
        setChunks((prev) => {
          // Mantener tamaño por líneas máx.
          // Un approach simple: si nos pasamos, cortamos del inicio
          const next = [...prev, data];

          // Para contar líneas eficientemente, podemos mirar sólo el final reciente.
          // Pero aquí simplificamos: si nos pasamos, truncamos el texto
          let joined = next.join("");
          const lines = joined.split("\n");
          if (lines.length > MAX_LINES) {
            const trimmed = lines.slice(lines.length - MAX_LINES).join("\n");
            return [trimmed.endsWith("\n") ? trimmed : trimmed + "\n"];
          }
          return next;
        });
      };

      es.onerror = () => {
        es.close();
        // Reintento simple tras 2s
        setTimeout(() => {
          if (sseRef.current === es) connect();
        }, 2000);
      };
    };

    connect();
    return () => sseRef.current?.close();
  }, [id]);

  // Auto-scroll al fondo cuando hay nuevos logs y follow = true
  useEffect(() => {
    if (!follow) return;
    const el = containerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [text, follow]);

  // Detectar si el usuario hace scroll hacia arriba => pausa follow
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 4;
      // si no está al fondo, desactiva follow; si vuelve abajo, reactívalo
      setFollow(atBottom);
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  };

  const clearAll = () => setChunks([]);

  const jumpBottom = () => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    setFollow(true);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold truncate">
            {name || "Logs del servicio"}
          </h1>
          <p className="text-sm text-slate-500">
            ID: <span className="font-mono">{id}</span> • Líneas: {totalLines}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setFollow((v) => !v)}
            title={follow ? "Pausar seguimiento" : "Seguir al final"}
          >
            {follow ? (
              <Pause className="h-4 w-4 mr-1" />
            ) : (
              <Play className="h-4 w-4 mr-1" />
            )}{" "}
            {follow ? "Pausar" : "Seguir"}
          </Button>
          <Button
            variant="outline"
            onClick={() => setWrap((v) => !v)}
            title="Ajuste de línea"
          >
            <WrapText className="h-4 w-4 mr-1" />{" "}
            {wrap ? "Wrap: ON" : "Wrap: OFF"}
          </Button>
          <Button variant="outline" onClick={copyAll} title="Copiar todo">
            <Copy className="h-4 w-4 mr-1" /> Copiar
          </Button>
          <Button variant="danger" onClick={clearAll} title="Limpiar consola">
            <Trash2 className="h-4 w-4 mr-1" /> Limpiar
          </Button>
          <Button variant="outline" onClick={jumpBottom} title="Ir al final">
            <ChevronsDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="px-4 py-2 text-xs text-muted border-b border-var(--surface-border) flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="relative inline-flex">
              <span className="h-2 w-2 rounded-full bg-var(--accent) inline-block" />
              <span className="absolute inset-0 rounded-full animate-ping bg-var(--accent)/40" />
            </span>
            Consola en vivo
          </span>
          <span className="font-mono text-[11px]">
            {new Date().toLocaleTimeString()}
          </span>
        </div>

        <pre
          ref={containerRef}
          className={[
            // base estilo terminal
            "h-[70vh] overflow-auto",
            "bg-[#0b0f19] text-[#d3fbd8]", // fondo/verde-terminal (ajústalo si prefieres tus vars)
            "px-4 py-3",
            "font-mono text-[12px] leading-5",
            wrap ? "whitespace-pre-wrap wrap-break-words" : "whitespace-pre",
          ].join(" ")}
        >
          {text || "Esperando logs…"}
        </pre>
      </Card>
    </div>
  );
}
