"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Card } from "@/app/components/ui/Card";
import Button from "@/app/components/ui/Button";
import { Play, Pause, Copy, Trash2, WrapText, ChevronsDown } from "lucide-react";
import { getSocket } from "@/app/libs/socket";
import { useDockerHost } from "@/app/store/docker-host";

export default function LogsPage() {
  const { id } = useParams<{ id: string }>();
  const search = useSearchParams();
  const name = search.get("name") ?? "";
  const { hostId } = useDockerHost();

  const [chunks, setChunks] = useState<string[]>([]);
  const [follow, setFollow] = useState(true);
  const [wrap, setWrap] = useState(false);
  const containerRef = useRef<HTMLPreElement | null>(null);

  const MAX_LINES = 5000;
  const text = useMemo(() => chunks.join(""), [chunks]);
  const totalLines = useMemo(() => text.match(/\n/g)?.length ?? 0, [text]);

  useEffect(() => {
    if (!id || !hostId) return;

    const socket = getSocket("/docker");

    // suscribirse a logs
    socket.emit("logs:subscribe", { hostId, containerId: id });

    const handleData = (msg: any) => {
      const line = msg.text?.endsWith("\n") ? msg.text : msg.text + "\n";
      setChunks((prev) => {
        const next = [...prev, line];
        const joined = next.join("");
        const lines = joined.split("\n");
        if (lines.length > MAX_LINES) {
          const trimmed = lines.slice(lines.length - MAX_LINES).join("\n");
          return [trimmed.endsWith("\n") ? trimmed : trimmed + "\n"];
        }
        return next;
      });
    };

    const handleError = (msg: any) => {
      console.error("logs:error", msg);
    };

    socket.on("logs:data", handleData);
    socket.on("logs:error", handleError);

    // limpiar al salir
    return () => {
      socket.emit("logs:unsubscribe", { hostId, containerId: id });
      socket.off("logs:data", handleData);
      socket.off("logs:error", handleError);
    };
  }, [id, hostId]);

  // auto-scroll al fondo
  useEffect(() => {
    if (!follow) return;
    const el = containerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [text, follow]);

  // detectar scroll manual (pausa follow)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 4;
      setFollow(atBottom);
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch { }
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
          <h1 className="text-2xl font-semibold truncate">{name || "Logs del servicio"}</h1>
          <p className="text-sm text-slate-500">
            ID: <span className="font-mono">{id}</span> • Líneas: {totalLines}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setFollow((v) => !v)} title={follow ? "Pausar seguimiento" : "Seguir al final"}>
            {follow ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />} {follow ? "Pausar" : "Seguir"}
          </Button>
          <Button variant="outline" onClick={() => setWrap((v) => !v)} title="Ajuste de línea">
            <WrapText className="h-4 w-4 mr-1" /> {wrap ? "Wrap: ON" : "Wrap: OFF"}
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
        <div className="px-4 py-2 text-xs text-muted border-b flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="relative inline-flex">
              <span className="h-2 w-2 rounded-full bg-[var(--accent)] inline-block" />
              <span className="absolute inset-0 rounded-full animate-ping bg-[var(--accent)]/40" />
            </span>
            Consola en vivo
          </span>
          <span className="font-mono text-[11px]">{new Date().toLocaleTimeString()}</span>
        </div>

        <pre
          ref={containerRef}
          className={[
            "h-[70vh] overflow-auto bg-[#0b0f19] text-[#d3fbd8] px-4 py-3 font-mono text-[12px] leading-5",
            wrap ? "whitespace-pre-wrap break-words" : "whitespace-pre",
          ].join(" ")}
        >
          {text || "Esperando logs…"}
        </pre>
      </Card>
    </div>
  );
}
