// "Add component" UI: a row of pills at the root level and a compact inline
// button bar inside a container.

import { Box, Image as ImageIcon, LayoutPanelTop, Minus, MousePointerClick, Paperclip, Plus, Type } from "lucide-react";
import { BLOCK_DESCRIPTIONS, BLOCK_LABELS, type BlockKind } from "./constants";

export const BLOCK_ICONS: Record<BlockKind, typeof Box> = {
  container: Box,
  text: Type,
  section: LayoutPanelTop,
  separator: Minus,
  media_gallery: ImageIcon,
  file: Paperclip,
  action_row: MousePointerClick,
};

/** Root level: one row of pills, the description on hover. Flat, like the
 *  block list above it, instead of a grid of icon cards. */
export function AddComponentCards({ kinds, onAdd }: { kinds: readonly BlockKind[]; onAdd: (k: BlockKind) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 flex items-center text-xs text-muted-foreground"><Plus className="mr-1 h-3.5 w-3.5" /> Add</span>
      {kinds.map((k) => {
        const Icon = BLOCK_ICONS[k];
        return (
          <button
            key={k}
            type="button"
            onClick={() => onAdd(k)}
            title={BLOCK_DESCRIPTIONS[k]}
            className="flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-dbx-accent-500/60 hover:bg-dbx-accent-500/10 hover:text-foreground"
          >
            <Icon className="h-3.5 w-3.5 text-dbx-accent-400" />
            {BLOCK_LABELS[k]}
          </button>
        );
      })}
    </div>
  );
}

export function AddComponentBar({ kinds, onAdd }: { kinds: readonly BlockKind[]; onAdd: (k: BlockKind) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {kinds.map((k) => {
        const Icon = BLOCK_ICONS[k];
        return (
          <button
            key={k}
            type="button"
            onClick={() => onAdd(k)}
            className="flex items-center gap-1.5 rounded-md border border-border/60 bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-dbx-accent-500/60 hover:text-foreground"
          >
            <Icon className="h-3.5 w-3.5" />
            {BLOCK_LABELS[k]}
          </button>
        );
      })}
      <span className="flex items-center text-[11px] text-muted-foreground/60">
        <Plus className="mr-0.5 h-3 w-3" /> Add inside
      </span>
    </div>
  );
}
