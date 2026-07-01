"use client";

import { useState } from "react";
import { reorderItems } from "@/lib/list-reorder";

export function useListDragReorder<T>(items: T[], onChange: (items: T[]) => void) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function getItemProps(index: number) {
    const dragClass = dragIndex === index ? "opacity-60" : "";
    return {
      dragClass,
      draggable: true as const,
      onDragStart: () => setDragIndex(index),
      onDragOver: (e: React.DragEvent) => e.preventDefault(),
      onDrop: () => {
        if (dragIndex !== null && dragIndex !== index) {
          onChange(reorderItems(items, dragIndex, index));
        }
        setDragIndex(null);
      },
      onDragEnd: () => setDragIndex(null),
    };
  }

  return { dragIndex, getItemProps };
}

export function DragHandle() {
  return (
    <span
      className="shrink-0 cursor-grab rounded border border-dark-border px-1.5 text-xs text-muted active:cursor-grabbing"
      aria-hidden
    >
      ⋮⋮
    </span>
  );
}
