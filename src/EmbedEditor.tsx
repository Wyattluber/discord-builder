// The editor for a classic message: the text above, up to 10 embeds, and the
// action rows under them. Built from the block editor's pieces: rows in one
// frame (BlockCard), the accent swatches, the markdown field, the image field
// with upload. Discord always shows buttons under the embeds, so embeds and
// rows each reorder among themselves only.

import { useState, type ReactNode } from "react";
import { PanelLeft, Plus, TextCursorInput } from "lucide-react";
import { Button } from "./ui";
import { BlockBody, ColorField } from "./BlockBody";
import { BlockCard } from "./BlockCard";
import { AddPill, AddRow, BLOCK_ICONS } from "./AddComponent";
import { FieldLabel, ImageField, MarkdownField, SwitchRow, TextField, type UploadImageFn } from "./fields";
import { BLOCK_DESCRIPTIONS, BLOCK_LABELS, LIMITS, hexOf, makeActionRow, makeEmbed, makeEmbedField } from "./constants";
import { movePropsIn, reorderList, useDragReorder } from "./reorder";
import type { DragProps } from "./BlockCard";
import type { ActionRowNode, EmbedField, EmbedNode, MessageModel, TemplateVariable } from "./types";

const EMBEDS_ZONE = "embeds";
const ROWS_ZONE = "rows";

function summarizeEmbed(e: EmbedNode): string {
  const line = (e.title || e.description.split("\n")[0] || e.author.name || e.footer.text).slice(0, 40);
  return line || (e.imageUrl || e.thumbnailUrl ? "image" : "(empty)");
}

/** A labelled box for the parts of an embed that have parts of their own. */
function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-2 rounded-md border border-border/60 bg-muted/20 p-2">
      <FieldLabel>{title}</FieldLabel>
      {children}
    </div>
  );
}

function FieldBody({ field, onChange, variables }: { field: EmbedField; onChange: (f: EmbedField) => void; variables?: TemplateVariable[] }) {
  const set = (patch: Partial<EmbedField>) => onChange({ ...field, ...patch });
  return (
    <div className="space-y-2">
      <TextField label="Name" value={field.name} onChange={(name) => set({ name })} max={LIMITS.embedFieldNameChars} />
      <MarkdownField label="Value" value={field.value} onChange={(value) => set({ value })} variables={variables} rows={2} max={LIMITS.embedFieldValueChars} />
      <SwitchRow label="Inline (side by side)" checked={field.inline} onChange={(inline) => set({ inline })} />
    </div>
  );
}

type DragFor = ReturnType<typeof useDragReorder>;

function EmbedBody({
  embed,
  onChange,
  variables,
  onUpload,
  compact,
  dragFor,
  collapsed,
  toggle,
}: {
  embed: EmbedNode;
  onChange: (e: EmbedNode) => void;
  variables?: TemplateVariable[];
  onUpload?: UploadImageFn;
  compact: boolean;
  dragFor: DragFor;
  collapsed: Set<string>;
  toggle: (id: string) => void;
}) {
  const set = (patch: Partial<EmbedNode>) => onChange({ ...embed, ...patch });
  const setFields = (fields: EmbedField[]) => set({ fields });
  const zone = `fields:${embed.id}`;
  const fieldDrag = (id: string): DragProps =>
    dragFor(zone, id, (fromId, toId, pos) => setFields(reorderList(embed.fields, fromId, toId, pos)));

  return (
    <div className="space-y-3">
      <ColorField label="Color" value={embed.color} onChange={(color) => set({ color })} />

      <Group title="Author">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <TextField label="Name" value={embed.author.name} onChange={(name) => set({ author: { ...embed.author, name } })} max={LIMITS.embedAuthorNameChars} />
          <TextField label="Link" value={embed.author.url} onChange={(url) => set({ author: { ...embed.author, url } })} placeholder="https://example.com" />
        </div>
        <ImageField label="Icon" value={embed.author.iconUrl} onUpload={onUpload} onChange={(iconUrl) => set({ author: { ...embed.author, iconUrl } })} />
      </Group>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <TextField label="Title" value={embed.title} onChange={(title) => set({ title })} max={LIMITS.embedTitleChars} />
        <TextField label="Title link" value={embed.url} onChange={(url) => set({ url })} placeholder="https://example.com" />
      </div>
      <MarkdownField label="Description" value={embed.description} onChange={(description) => set({ description })} variables={variables} rows={4} max={LIMITS.embedDescriptionChars} />

      <div className="space-y-1.5">
        <FieldLabel>
          Fields <span className="ml-1 font-normal normal-case text-muted-foreground/60">· {embed.fields.length}/{LIMITS.embedFields}</span>
        </FieldLabel>
        {embed.fields.length > 0 && (
          <div className="divide-y divide-border/40 rounded-md border border-border/50">
            {embed.fields.map((f) => (
              <BlockCard
                key={f.id}
                icon={TextCursorInput}
                title="Field"
                summary={f.name.slice(0, 40) || "(empty)"}
                collapsed={collapsed.has(f.id)}
                onToggle={() => toggle(f.id)}
                onDelete={() => setFields(embed.fields.filter((x) => x.id !== f.id))}
                drag={fieldDrag(f.id)}
                move={movePropsIn(embed.fields, f.id, setFields)}
                compact={compact}
              >
                <FieldBody field={f} variables={variables} onChange={(next) => setFields(embed.fields.map((x) => (x.id === f.id ? next : x)))} />
              </BlockCard>
            ))}
          </div>
        )}
        {embed.fields.length < LIMITS.embedFields && (
          <Button variant="outline" size="sm" onClick={() => setFields([...embed.fields, makeEmbedField()])}>
            <Plus className="mr-1 h-3 w-3" /> Add field
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <ImageField label="Image" value={embed.imageUrl} onUpload={onUpload} onChange={(imageUrl) => set({ imageUrl })} />
        <ImageField label="Thumbnail" value={embed.thumbnailUrl} onUpload={onUpload} onChange={(thumbnailUrl) => set({ thumbnailUrl })} />
      </div>

      <Group title="Footer">
        <TextField label="Text" value={embed.footer.text} onChange={(text) => set({ footer: { ...embed.footer, text } })} max={LIMITS.embedFooterChars} />
        <ImageField label="Icon" value={embed.footer.iconUrl} onUpload={onUpload} onChange={(iconUrl) => set({ footer: { ...embed.footer, iconUrl } })} />
      </Group>
      <SwitchRow label="Show the time it was sent" checked={embed.timestamp} onChange={(timestamp) => set({ timestamp })} />
    </div>
  );
}

export function EmbedEditor({
  model,
  onChange,
  variables,
  onUploadImage,
  compact,
}: {
  model: MessageModel;
  onChange: (model: MessageModel) => void;
  variables?: TemplateVariable[];
  onUploadImage?: UploadImageFn;
  compact: boolean;
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const dragFor = useDragReorder();
  const content = model.content ?? "";
  const embeds = model.embeds ?? [];
  const rows = model.components.filter((n): n is ActionRowNode => n.type === "action_row");

  const emit = (patch: { content?: string; embeds?: EmbedNode[]; rows?: ActionRowNode[] }) =>
    onChange({ format: "embeds", content: patch.content ?? content, embeds: patch.embeds ?? embeds, components: patch.rows ?? rows });
  const setEmbeds = (next: EmbedNode[]) => emit({ embeds: next });
  const setRows = (next: ActionRowNode[]) => emit({ rows: next });
  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const canAddEmbed = embeds.length < LIMITS.embeds;
  const canAddRow = rows.length < LIMITS.actionRows;

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border/60 bg-card px-3 py-2.5">
        <MarkdownField
          label="Message text"
          value={content}
          onChange={(c) => emit({ content: c })}
          variables={variables}
          rows={2}
          max={LIMITS.contentChars}
          placeholder="Shown above the embeds"
        />
      </div>

      {/* One panel like the block list: the embeds, then the rows of buttons */}
      <div className="divide-y divide-border/40 overflow-hidden rounded-lg border border-border/60 bg-card">
        {embeds.map((e) => (
          <BlockCard
            key={e.id}
            icon={PanelLeft}
            title="Embed"
            summary={summarizeEmbed(e)}
            accentDot={hexOf(e.color)}
            accentBorder={hexOf(e.color)}
            collapsed={collapsed.has(e.id)}
            onToggle={() => toggle(e.id)}
            onDelete={() => setEmbeds(embeds.filter((x) => x.id !== e.id))}
            drag={dragFor(EMBEDS_ZONE, e.id, (fromId, toId, pos) => setEmbeds(reorderList(embeds, fromId, toId, pos)))}
            move={movePropsIn(embeds, e.id, setEmbeds)}
            compact={compact}
          >
            <EmbedBody
              embed={e}
              onChange={(next) => setEmbeds(embeds.map((x) => (x.id === e.id ? next : x)))}
              variables={variables}
              onUpload={onUploadImage}
              compact={compact}
              dragFor={dragFor}
              collapsed={collapsed}
              toggle={toggle}
            />
          </BlockCard>
        ))}
        {rows.map((row) => (
          <BlockCard
            key={row.id}
            icon={BLOCK_ICONS.action_row}
            title={BLOCK_LABELS.action_row}
            summary={`${row.buttons.length} button${row.buttons.length !== 1 ? "s" : ""}`}
            collapsed={collapsed.has(row.id)}
            onToggle={() => toggle(row.id)}
            onDelete={() => setRows(rows.filter((x) => x.id !== row.id))}
            drag={dragFor(ROWS_ZONE, row.id, (fromId, toId, pos) => setRows(reorderList(rows, fromId, toId, pos)))}
            move={movePropsIn(rows, row.id, setRows)}
            compact={compact}
          >
            <BlockBody node={row} variables={variables} onChange={(next) => setRows(rows.map((x) => (x.id === row.id ? (next as ActionRowNode) : x)))} />
          </BlockCard>
        ))}
        {embeds.length === 0 && rows.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">No embeds yet. Add one below.</p>
        )}
      </div>

      {(canAddEmbed || canAddRow) && (
        <AddRow>
          {canAddEmbed && (
            <AddPill icon={PanelLeft} label="Embed" title="A box with a color bar, text, fields and images." onClick={() => setEmbeds([...embeds, makeEmbed()])} />
          )}
          {canAddRow && (
            <AddPill icon={BLOCK_ICONS.action_row} label={BLOCK_LABELS.action_row} title={BLOCK_DESCRIPTIONS.action_row} onClick={() => setRows([...rows, makeActionRow()])} />
          )}
        </AddRow>
      )}
    </div>
  );
}
