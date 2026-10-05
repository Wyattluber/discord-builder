// The editor body shown inside each expanded block card. Container-level props
// (accent / spoiler) live in ContainerProps; its children are rendered by the
// orchestrator so they can nest visually.

import { Plus, Trash2 } from "lucide-react";
import { Button } from "./ui";
import { DiscordActionEditor } from "./ButtonActions";
import { ACCENT_PRESETS, BUTTON_STYLE_OPTIONS, LIMITS, hexOf, makeButton, uid } from "./constants";
import { useBuilderIntegrations } from "./context";
import { FieldLabel, FileField, ImageField, MarkdownField, SegmentToggle, SwitchRow, TextField, type UploadFileFn, type UploadImageFn } from "./fields";
import type {
  ActionRowNode,
  ButtonNode,
  ButtonStyleName,
  ContainerNode,
  FileNode,
  MediaGalleryNode,
  RootNode,
  SectionNode,
  SeparatorNode,
  TemplateVariable,
  TextNode,
} from "./types";

// ── button editor ────────────────────────────────────────────────
export function ButtonEditor({ button, onChange, variables }: { button: ButtonNode; onChange: (b: ButtonNode) => void; variables?: TemplateVariable[] }) {
  const set = (patch: Partial<ButtonNode>) => onChange({ ...button, ...patch });
  const { savedActions, actionEditor } = useBuilderIntegrations();
  // The click behaviour is the host's vocabulary; ours is only the default.
  const ActionEditor = actionEditor ?? DiscordActionEditor;
  const listId = `saved-actions-${button.id}`;
  const applySaved = (customId: string) => {
    const s = (savedActions ?? []).find((x) => x.customId === customId);
    if (s) set({ customId: s.customId, action: s.action });
  };
  const matchesSaved = (savedActions ?? []).some((s) => s.customId === (button.customId ?? "").trim());
  return (
    <div className="space-y-2 rounded-md border border-border/60 bg-muted/20 p-2">
      <div className="space-y-1">
        <FieldLabel>Style</FieldLabel>
        <SegmentToggle
          options={BUTTON_STYLE_OPTIONS}
          value={button.style}
          onChange={(style: ButtonStyleName) => {
            if (style === "link") set({ style, url: button.url ?? "https://", customId: undefined, action: undefined });
            else set({ style, customId: button.customId ?? "", url: undefined });
          }}
        />
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <TextField label="Label" value={button.label ?? ""} onChange={(v) => set({ label: v })} placeholder="Click me" max={LIMITS.buttonLabelChars} />
        <TextField label="Emoji" value={button.emoji ?? ""} onChange={(v) => set({ emoji: v || undefined })} placeholder="🎉" />
      </div>
      {button.style === "link" ? (
        <TextField label="URL" value={button.url ?? ""} onChange={(v) => set({ url: v })} placeholder="https://example.com" />
      ) : (
        <div className="space-y-1">
          {savedActions && savedActions.length > 0 && (
            <div className="flex items-center gap-2">
              <select
                value=""
                onChange={(e) => { if (e.target.value) applySaved(e.target.value); }}
                className="h-8 flex-1 rounded-md border border-border/60 bg-background px-2 text-xs"
                title="Use a saved button action"
              >
                <option value="">Use a saved action…</option>
                {savedActions.map((s) => (
                  <option key={s.customId} value={s.customId}>{s.label || s.customId}</option>
                ))}
              </select>
            </div>
          )}
          <FieldLabel>Custom ID (identifies the button for the bot)</FieldLabel>
          <input
            list={listId}
            value={button.customId ?? ""}
            onChange={(e) => set({ customId: e.target.value })}
            placeholder="my_button_id"
            className="h-8 w-full rounded-md border border-border/60 bg-background px-2 text-xs"
          />
          <datalist id={listId}>
            {(savedActions ?? []).map((s) => (
              <option key={s.customId} value={s.customId}>{s.label || s.customId}</option>
            ))}
          </datalist>
          {matchesSaved && (
            <button
              type="button"
              onClick={() => applySaved((button.customId ?? "").trim())}
              className="text-[11px] text-dbx-accent-400 hover:underline"
            >
              A saved action uses this ID. Load it
            </button>
          )}
        </div>
      )}
      {button.style !== "link" && (
        <ActionEditor
          action={button.action}
          onChange={(action) => set({ action })}
          variables={variables}
        />
      )}
      <SwitchRow label="Disabled" checked={!!button.disabled} onChange={(v) => set({ disabled: v })} />
    </div>
  );
}

// ── container props (children rendered by the orchestrator) ──────
export function ContainerProps({ node, onChange }: { node: ContainerNode; onChange: (n: ContainerNode) => void }) {
  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <FieldLabel>Accent color</FieldLabel>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => onChange({ ...node, accentColor: null })}
            className={`h-6 rounded border px-2 text-[11px] ${node.accentColor == null ? "border-dbx-accent-500 text-dbx-accent-300" : "border-border/60 text-muted-foreground"}`}
          >
            None
          </button>
          {ACCENT_PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              title={p.name}
              onClick={() => onChange({ ...node, accentColor: p.value })}
              className={`h-6 w-6 rounded border ${node.accentColor === p.value ? "ring-2 ring-white" : "border-black/30"}`}
              style={{ background: hexOf(p.value) }}
            />
          ))}
          <input
            type="color"
            value={hexOf(node.accentColor) ?? "#9b59b6"}
            onChange={(e) => onChange({ ...node, accentColor: parseInt(e.target.value.slice(1), 16) })}
            className="h-6 w-8 cursor-pointer rounded border border-border/60 bg-transparent"
          />
        </div>
      </div>
      <SwitchRow label="Spoiler (blur until clicked)" checked={!!node.spoiler} onChange={(v) => onChange({ ...node, spoiler: v })} />
    </div>
  );
}

// ── per-type bodies ──────────────────────────────────────────────
function TextBody({ node, onChange, variables }: { node: TextNode; onChange: (n: TextNode) => void; variables?: TemplateVariable[] }) {
  return <MarkdownField value={node.content} onChange={(content) => onChange({ ...node, content })} variables={variables} rows={5} placeholder="## Heading&#10;Body text with **bold**…" />;
}

function SeparatorBody({ node, onChange }: { node: SeparatorNode; onChange: (n: SeparatorNode) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
      <SwitchRow label="Divider line" checked={node.divider} onChange={(v) => onChange({ ...node, divider: v })} />
      <div className="flex items-center gap-2">
        <FieldLabel>Spacing</FieldLabel>
        <SegmentToggle
          options={[{ value: "small", label: "Small" }, { value: "large", label: "Large" }]}
          value={node.spacing}
          onChange={(spacing) => onChange({ ...node, spacing })}
        />
      </div>
    </div>
  );
}

function SectionBody({ node, onChange, variables, onUpload }: { node: SectionNode; onChange: (n: SectionNode) => void; variables?: TemplateVariable[]; onUpload?: UploadImageFn }) {
  const setText = (i: number, v: string) => onChange({ ...node, texts: node.texts.map((t, k) => (k === i ? v : t)) });
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {node.texts.map((t, i) => (
          <div key={i} className="flex items-start gap-1">
            <div className="min-w-0 flex-1">
              <MarkdownField label={`Text line ${i + 1}`} value={t} onChange={(v) => setText(i, v)} variables={variables} rows={2} />
            </div>
            {node.texts.length > 1 && (
              <Button variant="ghost" size="icon" className="mt-5" onClick={() => onChange({ ...node, texts: node.texts.filter((_, k) => k !== i) })}>
                <Trash2 className="h-4 w-4 text-red-400" />
              </Button>
            )}
          </div>
        ))}
        {node.texts.length < LIMITS.sectionTexts && (
          <Button variant="outline" size="sm" onClick={() => onChange({ ...node, texts: [...node.texts, ""] })}>
            <Plus className="mr-1 h-3 w-3" /> Add line
          </Button>
        )}
      </div>

      <div className="space-y-1">
        <FieldLabel>Accessory</FieldLabel>
        <SegmentToggle
          options={[{ value: "button", label: "Button" }, { value: "thumbnail", label: "Thumbnail" }]}
          value={node.accessory.kind}
          onChange={(kind) =>
            onChange({ ...node, accessory: kind === "button" ? { kind: "button", button: makeButton("secondary") } : { kind: "thumbnail", url: "https://" } })
          }
        />
      </div>

      {node.accessory.kind === "button" ? (
        <ButtonEditor button={node.accessory.button} variables={variables} onChange={(button) => onChange({ ...node, accessory: { kind: "button", button } })} />
      ) : (
        (() => {
          const thumb = node.accessory;
          return (
            <div className="space-y-2">
              <ImageField label="Thumbnail image" value={thumb.url} onUpload={onUpload} onChange={(url) => onChange({ ...node, accessory: { ...thumb, url } })} />
              <TextField label="Description (alt text)" value={thumb.description ?? ""} onChange={(description) => onChange({ ...node, accessory: { ...thumb, description } })} />
            </div>
          );
        })()
      )}
    </div>
  );
}

function ActionRowBody({ node, onChange, variables }: { node: ActionRowNode; onChange: (n: ActionRowNode) => void; variables?: TemplateVariable[] }) {
  return (
    <div className="space-y-3">
      {node.buttons.map((b, i) => (
        <div key={b.id} className="space-y-1">
          <div className="flex items-center justify-between">
            <FieldLabel>Button {i + 1}</FieldLabel>
            {node.buttons.length > 1 && (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onChange({ ...node, buttons: node.buttons.filter((_, k) => k !== i) })}>
                <Trash2 className="h-3.5 w-3.5 text-red-400" />
              </Button>
            )}
          </div>
          <ButtonEditor button={b} variables={variables} onChange={(nb) => onChange({ ...node, buttons: node.buttons.map((x, k) => (k === i ? nb : x)) })} />
        </div>
      ))}
      {node.buttons.length < LIMITS.actionRowButtons && (
        <Button variant="outline" size="sm" onClick={() => onChange({ ...node, buttons: [...node.buttons, makeButton("primary")] })}>
          <Plus className="mr-1 h-3 w-3" /> Add button
        </Button>
      )}
    </div>
  );
}

function MediaGalleryBody({ node, onChange, onUpload }: { node: MediaGalleryNode; onChange: (n: MediaGalleryNode) => void; onUpload?: UploadImageFn }) {
  const setItem = (i: number, patch: Partial<MediaGalleryNode["items"][number]>) =>
    onChange({ ...node, items: node.items.map((it, k) => (k === i ? { ...it, ...patch } : it)) });
  return (
    <div className="space-y-3">
      {node.items.map((it, i) => (
        <div key={it.id} className="space-y-2 rounded-md border border-border/60 bg-muted/20 p-2">
          <div className="flex items-center justify-between">
            <FieldLabel>Image {i + 1}</FieldLabel>
            {node.items.length > 1 && (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onChange({ ...node, items: node.items.filter((_, k) => k !== i) })}>
                <Trash2 className="h-3.5 w-3.5 text-red-400" />
              </Button>
            )}
          </div>
          <ImageField label="Image" value={it.url} onUpload={onUpload} onChange={(url) => setItem(i, { url })} />
          <TextField label="Description (optional)" value={it.description ?? ""} onChange={(description) => setItem(i, { description })} max={1024} />
          <SwitchRow label="Spoiler" checked={!!it.spoiler} onChange={(spoiler) => setItem(i, { spoiler })} />
        </div>
      ))}
      {node.items.length < LIMITS.galleryItems && (
        <Button variant="outline" size="sm" onClick={() => onChange({ ...node, items: [...node.items, { id: uid("img"), url: "https://" }] })}>
          <Plus className="mr-1 h-3 w-3" /> Add image
        </Button>
      )}
    </div>
  );
}

function FileBody({ node, onChange, onUploadFile }: { node: FileNode; onChange: (n: FileNode) => void; onUploadFile?: UploadFileFn }) {
  return (
    <div className="space-y-2">
      <FileField label="File" value={node.url} onUpload={onUploadFile} onChange={(url) => onChange({ ...node, url })} />
      <p className="text-[11px] text-muted-foreground">
        {onUploadFile
          ? "Upload a file, or paste an attachment:// reference. Uploaded files are attached automatically when sent."
          : "Use a file attached when sending, for example attachment://image.png"}
      </p>
      <SwitchRow label="Spoiler" checked={!!node.spoiler} onChange={(spoiler) => onChange({ ...node, spoiler })} />
    </div>
  );
}

// Body for any non-container block (container handled by the orchestrator).
export function BlockBody({
  node,
  onChange,
  variables,
  onUpload,
  onUploadFile,
}: {
  node: Exclude<RootNode, ContainerNode>;
  onChange: (n: RootNode) => void;
  variables?: TemplateVariable[];
  onUpload?: UploadImageFn;
  onUploadFile?: UploadFileFn;
}) {
  switch (node.type) {
    case "text":
      return <TextBody node={node} onChange={onChange} variables={variables} />;
    case "separator":
      return <SeparatorBody node={node} onChange={onChange} />;
    case "section":
      return <SectionBody node={node} onChange={onChange} variables={variables} onUpload={onUpload} />;
    case "action_row":
      return <ActionRowBody node={node} onChange={onChange} variables={variables} />;
    case "media_gallery":
      return <MediaGalleryBody node={node} onChange={onChange} onUpload={onUpload} />;
    case "file":
      return <FileBody node={node} onChange={onChange} onUploadFile={onUploadFile} />;
  }
}
