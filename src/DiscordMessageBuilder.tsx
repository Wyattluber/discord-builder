// The standalone Components V2 message builder (SCNX-style inline cards).
//
// Controlled component:  <DiscordMessageBuilder value={model} onChange={setModel} />
// Optional `variables` enables %var% insertion + preview substitution.
//
// Each block is an expandable card whose body IS its editor. Containers nest
// their children visually. Reorder within a list by dragging the ⠿ handle.

import { useMemo, useRef, useState } from "react";
import { Percent } from "lucide-react";
import { BlockBody, ContainerProps } from "./BlockBody";
import type { UploadFileFn, UploadImageFn } from "./fields";
import { BuilderContext, PaletteContext, SyntaxContext, type BuilderIntegrations, type PaletteApi } from "./context";
import { PERCENT_PLACEHOLDERS, type PlaceholderSyntax } from "./syntax";
import { VariablePalette } from "./VariablePalette";
import { BlockCard, type DragProps, type MoveProps } from "./BlockCard";
import { AddComponentBar, AddComponentCards, BLOCK_ICONS } from "./AddComponent";
import { DiscordPreview } from "./DiscordPreview";
import { useIsCompact } from "./useCompact";
import {
  BLOCK_LABELS,
  type BlockKind,
  CHILD_BLOCK_KINDS,
  LIMITS,
  ROOT_BLOCK_KINDS,
  hexOf,
  makeBlock,
  makeChildBlock,
} from "./constants";
import { applyVariableSamples, mergeVariables } from "./presets";
import { countComponents, validate } from "./serialize";
import type { ContainerChild, ContainerNode, MessageModel, RootNode, TemplateVariable } from "./types";

const ROOT_ZONE = "root";

function summarize(node: RootNode): string {
  switch (node.type) {
    case "container":
      return `${node.children.length} block${node.children.length !== 1 ? "s" : ""}`;
    case "text":
      return node.content.split("\n")[0]?.slice(0, 40) || "(empty)";
    case "section":
      return node.texts[0]?.slice(0, 40) || "(empty)";
    case "separator":
      return node.divider ? "divider" : "spacing";
    case "action_row":
      return `${node.buttons.length} button${node.buttons.length !== 1 ? "s" : ""}`;
    case "media_gallery":
      return `${node.items.length} image${node.items.length !== 1 ? "s" : ""}`;
    case "file":
      return node.url.replace(/^attachment:\/\//, "") || "file";
  }
}

function reorderList<T extends { id: string }>(list: T[], fromId: string, toId: string, pos: "before" | "after"): T[] {
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

export interface DiscordMessageBuilderProps {
  value: MessageModel;
  onChange: (model: MessageModel) => void;
  variables?: TemplateVariable[];
  /** How a variable is written in a text; defaults to %name%. */
  syntax?: PlaceholderSyntax;
  /** Real values for variable samples (bot name, guild name, …), fetched
   *  from the live instance by the host app. Keys are variable names. */
  sampleOverrides?: Record<string, string>;
  /** Enables the upload button on image fields; resolves to a public URL. */
  onUploadImage?: UploadImageFn;
  /** Enables the upload button on file blocks; resolves to a marker URL. */
  onUploadFile?: UploadFileFn;
  /** Bot identity shown in the preview header. */
  botName?: string;
  botAvatar?: string;
  /** Rendered under the message: what the bot appends on the free plan. */
  watermark?: string | null;
  /** Optional channel list, user search and server emojis for the pickers. */
  integrations?: BuilderIntegrations;
  className?: string;
}

type DropPos = "before" | "after";

export function DiscordMessageBuilder({ value, onChange, variables, syntax = PERCENT_PLACEHOLDERS, sampleOverrides, onUploadImage, onUploadFile, botName, botAvatar, watermark, integrations, className = "" }: DiscordMessageBuilderProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [drag, setDrag] = useState<{ zone: string; id: string } | null>(null);
  const [over, setOver] = useState<{ zone: string; id: string; pos: DropPos } | null>(null);
  // Single-column layout: editor and preview share the width as tabs.
  const compact = useIsCompact();
  const [pane, setPane] = useState<"editor" | "preview">("editor");

  // Variable palette: open next to the preview, aimed at the markdown field
  // that asked for it or was focused last. The target lives in a ref so a
  // focus change never re-renders the whole editor.
  const [paletteOpen, setPaletteOpen] = useState(false);
  const paletteTarget = useRef<((text: string) => void) | null>(null);
  const [hasTarget, setHasTarget] = useState(false);
  const paletteApi = useMemo<PaletteApi>(() => ({
    open: (insert) => { paletteTarget.current = insert; setHasTarget(true); setPaletteOpen(true); },
    aim: (insert) => { paletteTarget.current = insert; setHasTarget(true); },
  }), []);

  // Exactly what the host offered, deduped, with live values from
  // sampleOverrides replacing the placeholder samples. The builder adds no
  // variables of its own: without `variables` there is nothing to insert and
  // every variable affordance stays hidden.
  const allVariables = useMemo(
    () => applyVariableSamples(
      mergeVariables(variables).map((v) => ({ ...v, group: v.group ?? "This message" })),
      sampleOverrides,
    ),
    [variables, sampleOverrides],
  );
  // Resolve channel mentions (<#id>) to names in the preview.
  const previewMentions = useMemo(
    () => ({ channels: Object.fromEntries((integrations?.channels ?? []).map((c) => [c.id, c.name])) }),
    [integrations?.channels],
  );

  const set = (components: RootNode[]) => onChange({ components });
  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // ── tree mutations ─────────────────────────────────────────────
  function updateNode(id: string, next: RootNode) {
    set(
      value.components.map((node) => {
        if (node.id === id) return next;
        if (node.type === "container") return { ...node, children: node.children.map((c) => (c.id === id ? (next as ContainerChild) : c)) };
        return node;
      }),
    );
  }

  function deleteNode(id: string) {
    set(
      value.components
        .filter((n) => n.id !== id)
        .map((n) => (n.type === "container" ? { ...n, children: n.children.filter((c) => c.id !== id) } : n)),
    );
  }

  function addRoot(kind: BlockKind) {
    const block = makeBlock(kind);
    set([...value.components, block]);
  }

  function addChild(containerId: string, kind: BlockKind) {
    const child = makeChildBlock(kind as Exclude<BlockKind, "container">);
    set(value.components.map((n) => (n.id === containerId && n.type === "container" ? { ...n, children: [...n.children, child] } : n)));
  }

  // ── drag reordering (within a single zone, applied once on drop) ──
  function reorder(zone: string, fromId: string, toId: string, pos: DropPos) {
    if (zone === ROOT_ZONE) set(reorderList(value.components, fromId, toId, pos));
    else set(value.components.map((n) => (n.id === zone && n.type === "container" ? { ...n, children: reorderList(n.children, fromId, toId, pos) } : n)));
  }

  // ── arrow reordering (the touch-friendly path, same zones as dragging) ──
  function siblingsOf(zone: string): { id: string }[] {
    if (zone === ROOT_ZONE) return value.components;
    const container = value.components.find((n) => n.id === zone && n.type === "container");
    return container?.type === "container" ? container.children : [];
  }

  function moveNode(zone: string, id: string, dir: -1 | 1) {
    const shift = <T extends { id: string }>(list: T[]): T[] => {
      const from = list.findIndex((x) => x.id === id);
      const to = from + dir;
      if (from < 0 || to < 0 || to >= list.length) return list;
      const copy = [...list];
      [copy[from], copy[to]] = [copy[to], copy[from]];
      return copy;
    };
    if (zone === ROOT_ZONE) set(shift(value.components));
    else set(value.components.map((n) => (n.id === zone && n.type === "container" ? { ...n, children: shift(n.children) } : n)));
  }

  function movePropsFor(zone: string, id: string): MoveProps {
    const list = siblingsOf(zone);
    const i = list.findIndex((x) => x.id === id);
    return {
      canUp: i > 0,
      canDown: i >= 0 && i < list.length - 1,
      up: () => moveNode(zone, id, -1),
      down: () => moveNode(zone, id, 1),
    };
  }

  function dragPropsFor(zone: string, id: string): DragProps {
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
        if (active && over && over.zone === zone && over.id === id) reorder(zone, drag!.id, id, over.pos);
        setDrag(null);
        setOver(null);
      },
      onDragEnd: () => { setDrag(null); setOver(null); },
    };
  }

  // ── render one block (recurses for containers) ─────────────────
  function renderBlock(node: RootNode, zone: string) {
    const isCollapsed = collapsed.has(node.id);
    const Icon = BLOCK_ICONS[node.type];

    if (node.type === "container") {
      const container = node as ContainerNode;
      const accent = hexOf(container.accentColor);
      return (
        <BlockCard
          key={node.id}
          icon={Icon}
          title={BLOCK_LABELS.container}
          summary={summarize(node)}
          accentDot={accent}
          accentBorder={accent}
          collapsed={isCollapsed}
          onToggle={() => toggle(node.id)}
          onDelete={() => deleteNode(node.id)}
          drag={dragPropsFor(zone, node.id)}
          move={movePropsFor(zone, node.id)}
          compact={compact}
        >
          <div className="space-y-3">
            <ContainerProps node={container} onChange={(n) => updateNode(node.id, n)} />
            <div className="divide-y divide-border/40 rounded-md border border-border/50">
              {container.children.length === 0 ? (
                <p className="px-3 py-2 text-xs text-muted-foreground">Empty container. Add a block below.</p>
              ) : (
                container.children.map((child) => renderBlock(child, container.id))
              )}
              <div className="px-3 py-2">
                <AddComponentBar kinds={CHILD_BLOCK_KINDS} onAdd={(k) => addChild(container.id, k)} />
              </div>
            </div>
          </div>
        </BlockCard>
      );
    }

    return (
      <BlockCard
        key={node.id}
        icon={Icon}
        title={BLOCK_LABELS[node.type]}
        summary={summarize(node)}
        collapsed={isCollapsed}
        onToggle={() => toggle(node.id)}
        onDelete={() => deleteNode(node.id)}
        drag={dragPropsFor(zone, node.id)}
        move={movePropsFor(zone, node.id)}
        compact={compact}
      >
        <BlockBody node={node} onChange={(n) => updateNode(node.id, n)} variables={allVariables} onUpload={onUploadImage} onUploadFile={onUploadFile} />
      </BlockCard>
    );
  }

  const issues = validate(value);
  const errors = issues.filter((i) => i.level === "error");
  const warnings = issues.filter((i) => i.level === "warning");
  const total = countComponents(value.components);

  // Below `lg` both panes claim the full width, so only one is shown at a time.
  const showEditor = !compact || pane === "editor";
  const showPreview = !compact || pane === "preview";

  return (
    <BuilderContext.Provider value={integrations ?? {}}>
    <SyntaxContext.Provider value={syntax}>
    <PaletteContext.Provider value={paletteApi}>
    <div className={className}>
      {compact && (
        <div className="mb-3 flex rounded-lg border border-border/60 bg-card p-1 text-sm">
          {(["editor", "preview"] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setPane(id)}
              aria-pressed={pane === id}
              className={`flex-1 rounded-md py-2 font-medium capitalize transition-colors ${
                pane === id ? "bg-dbx-accent-600 text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {id}
              {/* Errors live in the preview pane – surface them on the tab so
                  they are not hidden behind a switch. */}
              {id === "preview" && errors.length > 0 && (
                <span className={`ml-1.5 rounded px-1.5 py-0.5 text-[11px] ${pane === id ? "bg-white/20" : "bg-red-500/15 text-red-400"}`}>
                  {errors.length}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
      {/* grid-cols-1 (= minmax(0,1fr)) and not the implicit auto column: an
          auto track is at least as wide as its min-content, which on a phone
          pushes the whole editor past the dialog edge. */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
      <div className={showEditor ? "space-y-3" : "hidden"}>
        {compact && paletteOpen && (
          <VariablePalette
            variables={allVariables}
            hasTarget={hasTarget}
            onPick={(t) => paletteTarget.current?.(t)}
            onClose={() => setPaletteOpen(false)}
          />
        )}
        {/* One panel, blocks as rows. Rows are the list; the panel is the frame. */}
        <div className="divide-y divide-border/40 overflow-hidden rounded-lg border border-border/60 bg-card">
          {value.components.map((node) => renderBlock(node, ROOT_ZONE))}
          {value.components.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No blocks yet. Add one below.
            </p>
          )}
        </div>
        <AddComponentCards kinds={ROOT_BLOCK_KINDS} onAdd={addRoot} />
      </div>

      <div className={`space-y-2 lg:sticky lg:top-4 lg:self-start ${showPreview ? "" : "hidden"}`}>
        {!compact && paletteOpen && (
          <VariablePalette
            variables={allVariables}
            hasTarget={hasTarget}
            onPick={(t) => paletteTarget.current?.(t)}
            onClose={() => setPaletteOpen(false)}
          />
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Preview</span>
          <span className="flex items-center gap-3 text-xs text-muted-foreground">
            {!paletteOpen && allVariables.length > 0 && (
              <button type="button" onClick={() => setPaletteOpen(true)} className="flex items-center gap-1 text-dbx-accent-300 hover:text-dbx-accent-200">
                <Percent className="h-3 w-3" /> Variables
              </button>
            )}
            <span className={total > LIMITS.totalComponents ? "text-red-400" : ""}>
              {total} / {LIMITS.totalComponents} components
            </span>
          </span>
        </div>
        <DiscordPreview model={value} variables={allVariables} syntax={syntax} mentions={previewMentions} botName={botName} botAvatar={botAvatar} watermark={watermark} />
        <p className="text-[11px] leading-snug text-muted-foreground/70">
          Discord may show the message slightly differently on some devices.
        </p>
        {(errors.length > 0 || warnings.length > 0) && (
          <div className="space-y-1 rounded-lg border border-border/50 bg-card p-2 text-xs">
            {errors.map((e, i) => (
              <div key={`e${i}`} className="text-red-400">● {e.path}: {e.message}</div>
            ))}
            {warnings.map((w, i) => (
              <div key={`w${i}`} className="text-amber-400">● {w.path}: {w.message}</div>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
    </PaletteContext.Provider>
    </SyntaxContext.Provider>
    </BuilderContext.Provider>
  );
}
