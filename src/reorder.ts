// Reordering for the editor's lists: dragging by the grip on a wide screen,
// the arrow buttons on a touch screen. Each list is a "zone"; a drag only
// moves within its own zone and is applied once, on drop.

import { useState } from "react";
import type { DragProps, MoveProps } from "./BlockCard";

export type DropPos = "before" | "after";

export function reorderList<T extends { id: string }>(list: T[], fromId: string, toId: string, pos: DropPos): T[] {
  const from = list.findIndex((x) => x.id === fromId);
  if (from < 0) return list;
  const copy = [...list];
  const [moved] = copy.splice(from, 1);
  let to = copy.findIndex((x) => x.id === toId);
  if (to < 0) return list;
  if (pos === "after") to += 1;
  copy.splice(to, 0, moved);
  return copy;
}

/** The arrow buttons for one item: swap with its neighbour, hand the new list to `apply`. */
export function movePropsIn<T extends { id: string }>(list: T[], id: string, apply: (next: T[]) => void): MoveProps {
  const i = list.findIndex((x) => x.id === id);
  const shift = (dir: -1 | 1) => {
    const to = i + dir;
    if (i < 0 || to < 0 || to >= list.length) return;
    const copy = [...list];
    [copy[i], copy[to]] = [copy[to], copy[i]];
    apply(copy);
  };
  return { canUp: i > 0, canDown: i >= 0 && i < list.length - 1, up: () => shift(-1), down: () => shift(1) };
}

/**
 * The drag state shared by every zone of one editor. Returns the props for
 * one item; `onReorder` gets the dragged id, the target id and the side.
 */
export function useDragReorder() {
  const [drag, setDrag] = useState<{ zone: string; id: string } | null>(null);
  const [over, setOver] = useState<{ zone: string; id: string; pos: DropPos } | null>(null);

  return function dragPropsFor(zone: string, id: string, onReorder: (fromId: string, toId: string, pos: DropPos) => void): DragProps {
    const active = !!drag && drag.zone === zone && drag.id !== id;
    return {
      dragging: drag?.id === id,
      overPos: over && over.zone === zone && over.id === id ? over.pos : null,
      onDragStart: (e, cardEl) => {
        setDrag({ zone, id });
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", id);
        if (cardEl) e.dataTransfer.setDragImage(cardEl, 20, 16);
      },
      // Only show a drop marker while hovering; never reorder mid-drag.
      onDragOver: (e) => {
        if (!active) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        const rect = e.currentTarget.getBoundingClientRect();
        const pos: DropPos = e.clientY - rect.top < rect.height / 2 ? "before" : "after";
        setOver((prev) => (prev && prev.zone === zone && prev.id === id && prev.pos === pos ? prev : { zone, id, pos }));
      },
      onDrop: (e) => {
        e.preventDefault();
        if (active && over && over.zone === zone && over.id === id) onReorder(drag!.id, id, over.pos);
        setDrag(null);
        setOver(null);
      },
      onDragEnd: () => { setDrag(null); setOver(null); },
    };
  };
}
