"use client";
import React, { useEffect, useMemo, useRef } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Item = { id: string; node: React.ReactNode };

export default function DndSortableGrid({
  items,
  order,
  onOrderChange,
  className = "",
}: {
  items: Item[];
  order: string[];
  onOrderChange?: (ids: string[]) => void;
  className?: string;
}) {
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const map = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const ordered = useMemo(
    () => order.map((id) => map.get(id)).filter(Boolean) as Item[],
    [order, map]
  );

  const onDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id));
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const oldIndex = order.indexOf(String(active.id));
    const newIndex = order.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    onOrderChange?.(arrayMove(order, oldIndex, newIndex));
  };

  // el contenido real de la card activa para el overlay
  const activeNode = activeId ? map.get(activeId)?.node : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={ordered.map((i) => i.id)}
        strategy={rectSortingStrategy}
      >
        <div
          className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-3 ${className}`}
        >
          {ordered.map(({ id, node }) => (
            <SortableCard key={id} id={id}>
              {node}
            </SortableCard>
          ))}
        </div>
      </SortableContext>

      {/* 👇 Muestra la MISMA card mientras se arrastra */}
      <DragOverlay>
        {activeNode ? (
          <div
            className="pointer-events-none rounded-xl border shadow-2xl opacity-95 scale-[0.98] bg-r(--surface-bg)"
            // si tu Card ya pinta fondo/borde, puedes quitar estos estilos
          >
            {activeNode}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function SortableCard({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const hostRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const handle = host.querySelector<HTMLElement>("[data-drag-handle]");
    if (handle) setActivatorNodeRef(handle);
    else setActivatorNodeRef(host);
  }, [setActivatorNodeRef]);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : undefined,
    cursor: "default",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div ref={hostRef} {...listeners}>
        {children}
      </div>
    </div>
  );
}
