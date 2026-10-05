// One block as a flat row in the editor list: a grip on the left edge
// that lights up on hover and drag, chevron, icon, title, a summary while
// collapsed, and the delete control that only shows on hover. The editor
// body opens below the row. Container rows carry their accent color on
// the grip edge and nest their children as an indented list.

import { useRef, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronDown, GripVertical, Trash2, type LucideIcon } from "lucide-react";

export interface DragProps {
  onDragStart: (e: React.DragEvent, cardEl: HTMLElement | null) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  dragging: boolean;
  /** When this card is the current drop target, where the item will land. */
  overPos: "before" | "after" | null;
}

/** Touch browsers never dispatch HTML5 drag events from a finger, so on small
 *  screens the grip is replaced by these two buttons. */
export interface MoveProps {
  up: () => void;
  down: () => void;
  canUp: boolean;
  canDown: boolean;
}

export function BlockCard({
  icon: Icon,
  title,
  summary,
  accentDot,
  accentBorder,
  collapsed,
  onToggle,
  onDelete,
  drag,
  move,
  compact = false,
  children,
  headerExtra,
}: {
  icon: LucideIcon;
  title: string;
  summary?: string;
  accentDot?: string;
  accentBorder?: string;
  collapsed: boolean;
  onToggle: () => void;
  onDelete: () => void;
  drag?: DragProps;
  move?: MoveProps;
  /** Small viewport: arrow buttons instead of dragging, larger tap targets. */
  compact?: boolean;
  children?: ReactNode;
  headerExtra?: ReactNode;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const dragEnabled = !!drag && !compact;
  // ~40px hit area on touch, unchanged density on the desktop layout.
  const iconBtn = compact
    ? "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded"
    : "inline-flex shrink-0 items-center justify-center rounded p-1";

  return (
    <div
      ref={cardRef}
      onDragOver={dragEnabled ? (e) => drag!.onDragOver(e) : undefined}
      onDrop={dragEnabled ? (e) => drag!.onDrop(e) : undefined}
      className={`group/row relative transition-opacity ${drag?.dragging ? "opacity-40" : ""} ${collapsed ? "" : "bg-white/[0.02]"}`}
    >
      {/* Edge: the accent color of a container, otherwise a quiet line that
          turns violet while the row is hovered or dragged */}
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 left-0 w-0.5 transition-colors ${
          accentBorder ? "" : "bg-border/60 group-hover/row:bg-dbx-accent-500"
        }`}
        style={accentBorder ? { background: accentBorder } : undefined}
      />
      {drag?.overPos === "before" && <div className="pointer-events-none absolute -top-px left-3 right-3 z-10 h-0.5 rounded bg-dbx-accent-400" />}
      {drag?.overPos === "after" && <div className="pointer-events-none absolute -bottom-px left-3 right-3 z-10 h-0.5 rounded bg-dbx-accent-400" />}

      <div className={`flex items-center pl-2 pr-1.5 ${compact ? "gap-0.5 py-1" : "gap-1.5 py-1.5"}`}>
        {dragEnabled && (
          <button
            type="button"
            draggable
            onDragStart={(e) => drag!.onDragStart(e, cardRef.current)}
            onDragEnd={() => drag!.onDragEnd()}
            title="Drag to reorder"
            className="cursor-grab text-muted-foreground/40 transition-colors group-hover/row:text-muted-foreground hover:!text-foreground active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}
        {compact && move && (
          <>
            <button type="button" onClick={move.up} disabled={!move.canUp} title="Move up" aria-label="Move up" className={`${iconBtn} text-muted-foreground hover:text-foreground disabled:opacity-25`}>
              <ArrowUp className="h-4 w-4" />
            </button>
            <button type="button" onClick={move.down} disabled={!move.canDown} title="Move down" aria-label="Move down" className={`${iconBtn} text-muted-foreground hover:text-foreground disabled:opacity-25`}>
              <ArrowDown className="h-4 w-4" />
            </button>
          </>
        )}
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-2 py-1 text-left"
          aria-label={collapsed ? "Expand" : "Collapse"}
        >
          <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${collapsed ? "-rotate-90" : ""}`} />
          <Icon className="h-4 w-4 shrink-0 text-dbx-accent-400" />
          <span className="truncate text-sm font-medium">{title}</span>
          {accentDot && <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: accentDot }} />}
          {summary && collapsed && <span className="truncate text-xs text-muted-foreground">{summary}</span>}
        </button>
        <span className={`flex shrink-0 items-center ${compact ? "gap-0.5" : "gap-1 opacity-0 transition-opacity group-hover/row:opacity-100 focus-within:opacity-100"}`}>
          {headerExtra}
          <button
            type="button"
            onClick={onDelete}
            title="Delete"
            aria-label="Delete"
            className={`${iconBtn} text-muted-foreground hover:bg-red-500/10 hover:text-red-400`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </span>
      </div>
      {/* The desktop indent lines the body up under the title; on a phone that
          indent plus a nested container would squeeze the fields off-screen. */}
      {!collapsed && children && <div className={`pb-3 ${compact ? "pl-3 pr-2" : "px-3 pl-9"}`}>{children}</div>}
    </div>
  );
}
