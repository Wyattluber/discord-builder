// Reusable form fields for the builder cards: a markdown textarea with a
// toolbar (variables, emoji, formatting) + live char counter, a plain text
// field, a labelled switch, a segmented toggle, and a lightweight popover.

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { AtSign, Bold, Hash, Heading, Image as ImageIcon, Italic, List, Loader2, Paperclip, Percent, Smile, Strikethrough, Upload } from "lucide-react";
import { Button, Input, Switch, Textarea } from "./ui";
import type { TemplateVariable } from "./types";
import { useBuilderIntegrations, usePalette, useSyntax, type UserLite } from "./context";
import { closingVariablePattern, partialVariablePattern, variablePattern, wrapVariable } from "./syntax";
import { MediaPicker } from "./MediaPicker";
import type { UnicodeEmoji } from "./emoji-data";
import { Images } from "lucide-react";

// The unicode emoji dataset is loaded the first time a picker opens and
// then kept; the toolbar itself must not carry it.
type EmojiSearch = (query: string) => UnicodeEmoji[];
let emojiSearch: EmojiSearch | null = null;
let emojiSearchLoading: Promise<EmojiSearch> | null = null;
function loadEmojiSearch(): Promise<EmojiSearch> {
  if (emojiSearch) return Promise.resolve(emojiSearch);
  emojiSearchLoading ??= import("./emoji-data").then((m) => (emojiSearch = m.searchEmojis));
  return emojiSearchLoading;
}

/** Uploads an image and resolves to its public URL. Injected by the host app. */
export type UploadImageFn = (file: File) => Promise<string>;
/** Uploads any file and resolves to a marker URL. Injected by the host app. */
export type UploadFileFn = (file: File) => Promise<string>;

export function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{children}</label>;
}

// ── popover ──────────────────────────────────────────────────────
export function Popover({
  trigger,
  children,
  align = "end",
}: {
  trigger: ReactNode;
  children: (close: () => void) => ReactNode;
  align?: "start" | "end";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <span onClick={() => setOpen((o) => !o)}>{trigger}</span>
      {open && (
        <div
          // No scrolling here: every panel below brings its own scroll area,
          // and a second one around it produced a bar inside a bar plus a
          // sideways bar once the first one claimed its width.
          className={`absolute z-50 mt-1 rounded-md border border-border/60 bg-popover p-2 shadow-lg ${
            align === "end" ? "right-0" : "left-0"
          }`}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

function ToolbarButton({ title, onClick, children }: { title: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      // Taller, not wider, on touch: a 32px tap target that still leaves the
      // whole toolbar on one row inside a nested card.
      className="flex h-8 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted/50 hover:text-foreground sm:h-6"
    >
      {children}
    </button>
  );
}

function customEmojiUrl(id: string, animated: boolean) {
  return `https://cdn.discordapp.com/emojis/${id}.${animated ? "gif" : "png"}`;
}

/** Variables whose value is an image URL get a small picture marker. */
function isImageVariable(name: string) {
  return /avatar|icon|image/i.test(name);
}

// Group template variables by their `group`, preserving first-seen order.
function groupVariables(vars: TemplateVariable[]): [string, TemplateVariable[]][] {
  const order: string[] = [];
  const map = new Map<string, TemplateVariable[]>();
  for (const v of vars) {
    const g = v.group ?? "Variables";
    if (!map.has(g)) { map.set(g, []); order.push(g); }
    map.get(g)!.push(v);
  }
  return order.map((g) => [g, map.get(g)!] as [string, TemplateVariable[]]);
}

// Emoji picker: the unicode set and the server's own emoji as two tabs, so
// neither list has to be scrolled past to reach the other. The server tab
// only exists where there are server emoji; a pick writes <:name:id>.
export function EmojiGrid({ onPick }: { onPick: (e: string) => void }) {
  const { emojis } = useBuilderIntegrations();
  const server = emojis ?? [];
  const [tab, setTab] = useState<"standard" | "server">("standard");
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const [search, setSearch] = useState<EmojiSearch | null>(emojiSearch);
  useEffect(() => {
    if (search) return;
    let active = true;
    loadEmojiSearch().then((fn) => { if (active) setSearch(() => fn); });
    return () => { active = false; };
  }, [search]);

  const uni = search ? search(q) : [];
  const srv = query ? server.filter((e) => e.name.toLowerCase().includes(query)) : server;
  const showing = server.length > 0 ? tab : "standard";

  return (
    <div className="w-[min(18rem,calc(100vw-3rem))]">
      {server.length > 0 && (
        <div className="mb-1.5 flex gap-1 rounded-md bg-muted/30 p-0.5 text-xs">
          {([["standard", "Standard"], ["server", `Server (${server.length})`]] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-pressed={showing === id}
              className={`flex-1 rounded px-2 py-1 font-medium transition-colors ${
                showing === id ? "bg-dbx-accent-600 text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={showing === "server" ? "Search server emoji…" : "Search emoji…"}
        className="mb-1.5 h-7 text-xs"
      />
      {/* pr-1 keeps the scrollbar off the last column */}
      <div className="max-h-52 overflow-y-auto overscroll-contain pr-1">
        {showing === "standard" ? (
          !search ? (
            <p className="flex items-center gap-1.5 px-1 py-2 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Loading emoji…</p>
          ) : uni.length > 0 ? (
            <div className="grid grid-cols-7 justify-items-center gap-0.5 sm:grid-cols-8">
              {uni.map((e) => (
                <button key={e.char} type="button" title={e.keywords} onClick={() => onPick(e.char)} className="flex h-8 w-8 items-center justify-center rounded text-base hover:bg-muted/50 sm:h-7 sm:w-7">{e.char}</button>
              ))}
            </div>
          ) : (
            <p className="px-1 py-2 text-xs text-muted-foreground">No emoji found.</p>
          )
        ) : srv.length > 0 ? (
          <div className="grid grid-cols-7 justify-items-center gap-0.5 sm:grid-cols-8">
            {srv.map((e) => (
              <button key={e.id} type="button" title={e.name} onClick={() => onPick(`<${e.animated ? "a" : ""}:${e.name}:${e.id}>`)} className="flex h-8 w-8 items-center justify-center rounded hover:bg-muted/50 sm:h-7 sm:w-7">
                <img src={customEmojiUrl(e.id, e.animated)} alt={e.name} loading="lazy" onError={(ev) => { ev.currentTarget.style.visibility = "hidden"; }} className="h-6 w-6 object-contain" />
              </button>
            ))}
          </div>
        ) : (
          <p className="px-1 py-2 text-xs text-muted-foreground">No server emoji found.</p>
        )}
      </div>
    </div>
  );
}

function ChannelPicker({ onPick }: { onPick: (id: string) => void }) {
  const { channels } = useBuilderIntegrations();
  const [q, setQ] = useState("");
  const list = (channels ?? []).filter((c) => c.name.toLowerCase().includes(q.toLowerCase().trim())).slice(0, 60);
  return (
    <div className="w-[min(14rem,calc(100vw-3rem))]">
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search channels…" className="mb-1 h-7 text-xs" />
      <div className="max-h-48 overflow-auto overscroll-contain">
        {list.map((c) => (
          <button key={c.id} type="button" onClick={() => onPick(c.id)} className="block w-full truncate rounded px-1 py-1 text-left text-xs hover:bg-muted/50"># {c.name}</button>
        ))}
        {list.length === 0 && <p className="px-1 py-2 text-xs text-muted-foreground">No channels found.</p>}
      </div>
    </div>
  );
}

function UserPicker({ onPick }: { onPick: (id: string) => void }) {
  const { searchUsers } = useBuilderIntegrations();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<UserLite[]>([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!searchUsers || q.trim().length < 2) { setResults([]); return; }
    let active = true;
    setBusy(true);
    const t = setTimeout(async () => {
      try { const r = await searchUsers(q.trim()); if (active) setResults(r); }
      catch { if (active) setResults([]); }
      finally { if (active) setBusy(false); }
    }, 300);
    return () => { active = false; clearTimeout(t); };
  }, [q, searchUsers]);
  return (
    <div className="w-[min(15rem,calc(100vw-3rem))]">
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search users…" className="mb-1 h-7 text-xs" />
      <div className="max-h-48 overflow-auto overscroll-contain">
        {busy && <p className="px-1 py-2 text-xs text-muted-foreground">Searching…</p>}
        {!busy && results.map((u) => (
          <button key={u.id} type="button" onClick={() => onPick(u.id)} className="flex w-full items-center gap-2 rounded px-1 py-1 text-left text-xs hover:bg-muted/50">
            {u.avatar ? <img src={u.avatar} alt="" className="h-5 w-5 rounded-full" /> : <span className="h-5 w-5 rounded-full bg-muted" />}
            <span className="truncate">{u.name}</span>
          </button>
        ))}
        {!busy && q.trim().length >= 2 && results.length === 0 && <p className="px-1 py-2 text-xs text-muted-foreground">No users found.</p>}
      </div>
    </div>
  );
}

// ── markdown field with toolbar + counter ────────────────────────
export function MarkdownField({
  label = "Content",
  value,
  onChange,
  variables,
  rows = 4,
  max = 4000,
  placeholder,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  variables?: TemplateVariable[];
  rows?: number;
  max?: number;
  placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const { channels, searchUsers } = useBuilderIntegrations();
  const palette = usePalette();
  const syntax = useSyntax();

  // Variable autocomplete: typing the opening mark ("%") opens a suggestion
  // list at the caret, filtered by what follows. Enter/Tab inserts, Escape
  // dismisses.
  const [ac, setAc] = useState<{ prefix: string; start: number } | null>(null);
  const [acIndex, setAcIndex] = useState(0);
  const acMatches = ac && variables
    ? variables.filter((v) => v.name.toLowerCase().startsWith(ac.prefix.toLowerCase())).slice(0, 8)
    : [];

  function refreshAutocomplete(text: string, caret: number) {
    if (!variables || variables.length === 0) { setAc(null); return; }
    // Suggest only inside a variable that is still being typed: an opening
    // mark with word characters up to the caret. Finished placeholders before
    // the caret are blanked out first, so their closing mark never counts as
    // the start of a new one, and a stray % in running text ("100%") does not
    // flip the reading of every mark after it, which counting marks used to do.
    const before = text.slice(0, caret).replace(variablePattern(syntax, "g"), (m) => ' '.repeat(m.length));
    const m = partialVariablePattern(syntax).exec(before);
    if (!m) { setAc(null); return; }
    // The caret sitting inside a finished variable is editing, not typing a new one
    if (closingVariablePattern(syntax).test(text.slice(caret))) { setAc(null); return; }
    setAc({ prefix: m[1], start: caret - m[1].length - syntax.open.length });
    setAcIndex(0);
  }

  function acceptVariable(name: string) {
    if (!ac) return;
    const caret = ac.start + syntax.open.length + ac.prefix.length;
    const placeholder = wrapVariable(name, syntax);
    onChange(`${value.slice(0, ac.start)}${placeholder}${value.slice(caret)}`.slice(0, max));
    setAc(null);
    focusAt(ac.start + placeholder.length);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (!ac || acMatches.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setAcIndex((i) => (i + 1) % acMatches.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setAcIndex((i) => (i - 1 + acMatches.length) % acMatches.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      acceptVariable(acMatches[acIndex].name);
    } else if (e.key === "Escape") {
      setAc(null);
    }
  }

  function focusAt(pos: number) {
    requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  }

  function insert(text: string) {
    const el = ref.current;
    if (!el) {
      onChange(value + text);
      return;
    }
    const s = el.selectionStart ?? value.length;
    const e = el.selectionEnd ?? value.length;
    onChange(value.slice(0, s) + text + value.slice(e));
    focusAt(s + text.length);
  }

  function wrap(token: string, token2 = token) {
    const el = ref.current;
    if (!el) return;
    const s = el.selectionStart ?? 0;
    const e = el.selectionEnd ?? 0;
    const sel = value.slice(s, e) || "text";
    onChange(value.slice(0, s) + token + sel + token2 + value.slice(e));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + token.length, s + token.length + sel.length);
    });
  }

  function prefixLine(prefix: string) {
    const el = ref.current;
    const s = el?.selectionStart ?? 0;
    const lineStart = value.lastIndexOf("\n", s - 1) + 1;
    onChange(value.slice(0, lineStart) + prefix + value.slice(lineStart));
    focusAt(s + prefix.length);
  }

  return (
    <div className="min-w-0 space-y-1">
      {/* Narrow cards would push the toolbar past the card edge, so label and
          toolbar wrap onto their own rows instead of scrolling sideways. */}
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <FieldLabel>
          {label} <span className="ml-1 font-normal normal-case text-muted-foreground/60">· {value.length}/{max}</span>
        </FieldLabel>
        <div className="flex flex-wrap items-center justify-end gap-0.5">
          {variables && variables.length > 0 && (
            // Opens the palette next to the preview
            <ToolbarButton title="Variables" onClick={palette.open}><Percent className="h-3.5 w-3.5" /></ToolbarButton>
          )}
          <Popover trigger={<ToolbarButton title="Insert emoji" onClick={() => {}}><Smile className="h-3.5 w-3.5" /></ToolbarButton>}>
            {(close) => <EmojiGrid onPick={(e) => { insert(e); close(); }} />}
          </Popover>
          {searchUsers ? (
            <Popover trigger={<ToolbarButton title="Mention a user" onClick={() => {}}><AtSign className="h-3.5 w-3.5" /></ToolbarButton>}>
              {(close) => <UserPicker onPick={(id) => { insert(`<@${id}>`); close(); }} />}
            </Popover>
          ) : (
            <ToolbarButton title="Mention" onClick={() => insert("<@USER_ID>")}><AtSign className="h-3.5 w-3.5" /></ToolbarButton>
          )}
          {channels && channels.length > 0 ? (
            <Popover trigger={<ToolbarButton title="Mention a channel" onClick={() => {}}><Hash className="h-3.5 w-3.5" /></ToolbarButton>}>
              {(close) => <ChannelPicker onPick={(id) => { insert(`<#${id}>`); close(); }} />}
            </Popover>
          ) : (
            <ToolbarButton title="Channel" onClick={() => insert("<#CHANNEL_ID>")}><Hash className="h-3.5 w-3.5" /></ToolbarButton>
          )}
          <span className="mx-0.5 h-4 w-px bg-border/60" />
          <ToolbarButton title="Bold" onClick={() => wrap("**")}><Bold className="h-3.5 w-3.5" /></ToolbarButton>
          <ToolbarButton title="Italic" onClick={() => wrap("*")}><Italic className="h-3.5 w-3.5" /></ToolbarButton>
          <ToolbarButton title="Strikethrough" onClick={() => wrap("~~")}><Strikethrough className="h-3.5 w-3.5" /></ToolbarButton>
          <ToolbarButton title="Heading" onClick={() => prefixLine("## ")}><Heading className="h-3.5 w-3.5" /></ToolbarButton>
          <ToolbarButton title="Bullet list" onClick={() => prefixLine("- ")}><List className="h-3.5 w-3.5" /></ToolbarButton>
        </div>
      </div>
      <div className="relative">
        <Textarea
          ref={ref}
          rows={rows}
          value={value}
          placeholder={placeholder}
          onChange={(e) => {
            const v = e.target.value.slice(0, max);
            onChange(v);
            refreshAutocomplete(v, e.target.selectionStart ?? v.length);
          }}
          onKeyDown={onKeyDown}
          onBlur={() => setAc(null)}
          onClick={(e) => refreshAutocomplete(value, (e.target as HTMLTextAreaElement).selectionStart ?? 0)}
        />
        {ac && acMatches.length > 0 && (
          <div className="absolute left-0 top-full z-50 mt-1 w-96 max-w-[calc(100vw-3rem)] rounded-md border border-border/60 bg-popover p-1 shadow-lg">
            {acMatches.map((v, i) => (
              <button
                key={v.name}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => acceptVariable(v.name)}
                className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs ${
                  i === acIndex ? "bg-muted/50" : "hover:bg-muted/50"
                }`}
              >
                {isImageVariable(v.name) && <ImageIcon className="h-3 w-3 shrink-0 text-muted-foreground" />}
                <span className="shrink-0 font-mono font-semibold text-amber-300">{wrapVariable(v.name, syntax)}</span>
                <span className="shrink-0 rounded bg-dbx-accent-500/15 px-1 py-px text-[9px] font-bold uppercase tracking-wide text-dbx-accent-300">
                  {v.group ?? "Message"}
                </span>
                {v.description && (
                  <span className="ml-auto min-w-0 truncate text-right text-[10px] text-muted-foreground">{v.description}</span>
                )}
              </button>
            ))}
            <p className="border-t border-border/60 px-2 pb-0.5 pt-1 text-[10px] text-muted-foreground">
              Enter to insert, Esc to close
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  max,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  max?: number;
}) {
  return (
    <div className="space-y-1">
      <FieldLabel>
        {label}
        {max != null && <span className="ml-1 font-normal normal-case text-muted-foreground/60">· {value.length}/{max}</span>}
      </FieldLabel>
      <Input value={value} placeholder={placeholder} onChange={(e) => onChange(max != null ? e.target.value.slice(0, max) : e.target.value)} />
    </div>
  );
}

export function SwitchRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-2 py-1">
      <span className="min-w-0 text-xs text-muted-foreground">{label}</span>
      <span className="shrink-0"><Switch checked={checked} onCheckedChange={onChange} /></span>
    </label>
  );
}

export function SegmentToggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-md border border-border/60 bg-muted/20 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
            value === o.value ? "bg-dbx-accent-600 text-white" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ── image field: URL input + upload button + thumbnail preview ───
export function ImageField({
  label,
  value,
  onChange,
  onUpload,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onUpload?: UploadImageFn;
  placeholder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const { media } = useBuilderIntegrations();

  async function handleFile(file?: File | null) {
    if (!file || !onUpload) return;
    setBusy(true);
    setError(null);
    try {
      const url = await onUpload(file);
      onChange(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const isImg = /^https?:\/\/.+/.test(value);
  return (
    <div className="space-y-1">
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-start gap-2">
        {isImg ? (
          <img src={value} alt="" className="h-12 w-12 shrink-0 rounded border border-border/60 object-cover" />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded border border-border/60 bg-muted/30 text-muted-foreground">
            <ImageIcon className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0 flex-1 space-y-1.5">
          <Input value={value} placeholder={placeholder ?? "https://…/image.png"} onChange={(e) => onChange(e.target.value)} />
          <div className="flex flex-wrap gap-1.5">
            {onUpload && (
              <>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
                <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
                  {busy ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Upload className="mr-1 h-3 w-3" />}
                  {busy ? "Uploading…" : "Upload image"}
                </Button>
              </>
            )}
            {media && (
              <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
                <Images className="mr-1 h-3 w-3" /> Library
              </Button>
            )}
          </div>
          {error && <p className="text-[11px] text-red-400">{error}</p>}
        </div>
      </div>
      {media && <MediaPicker media={media} open={pickerOpen} onOpenChange={setPickerOpen} onSelect={onChange} />}
    </div>
  );
}

// ── file field: any file, upload + filename display ──────────────
export function FileField({
  label,
  value,
  onChange,
  onUpload,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onUpload?: UploadFileFn;
  placeholder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file?: File | null) {
    if (!file || !onUpload) return;
    setBusy(true);
    setError(null);
    try {
      onChange(await onUpload(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const fileName = value.replace(/^attachment:\/\//, "").split("/").pop() || "";
  return (
    <div className="space-y-1">
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/20 px-2 py-1.5">
        <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate text-sm">{fileName || <span className="text-muted-foreground">No file</span>}</span>
        {onUpload && (
          <>
            <input ref={inputRef} type="file" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
              {busy ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Upload className="mr-1 h-3 w-3" />}
              {busy ? "Uploading…" : "Upload file"}
            </Button>
          </>
        )}
      </div>
      <Input value={value} placeholder={placeholder ?? "attachment://file.png"} onChange={(e) => onChange(e.target.value)} />
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}
