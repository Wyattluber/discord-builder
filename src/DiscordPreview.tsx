// Live, Discord-styled preview of a message model: Components V2 blocks, or a
// classic message with its text, embeds and buttons.
// Pure presentation: takes the model + optional template variables and renders
// something close to how Discord shows it.

import { createContext, useContext } from "react";
import { ExternalLink } from "lucide-react";
import { Markdown, renderInline, previewVars, type Mentions, type PreviewVars } from "./markdown";
import { PERCENT_PLACEHOLDERS, variablePattern, type PlaceholderSyntax } from "./syntax";
import { messageFormat } from "./constants";
import { isEmptyEmbed } from "./serialize";
import type {
  ActionRowNode,
  ButtonNode,
  ContainerChild,
  EmbedField,
  EmbedNode,
  MessageModel,
  RootNode,
  SectionAccessory,
  TemplateVariable,
} from "./types";


// Mention id→name maps for the preview (resolves <#id> to the channel name etc.).
const MentionsCtx = createContext<Mentions | undefined>(undefined);

const BTN_CLASS: Record<ButtonNode["style"], string> = {
  primary: "bg-[#5865f2] text-white",
  secondary: "bg-[#4e5058] text-white",
  success: "bg-[#248046] text-white",
  danger: "bg-[#da373c] text-white",
  link: "bg-[#4e5058] text-white",
};

function hex(color?: number | null): string | undefined {
  if (color == null) return undefined;
  return `#${color.toString(16).padStart(6, "0")}`;
}

function ButtonEmoji({ emoji }: { emoji: string }) {
  const m = emoji.match(/^<(a?):(\w+):(\d+)>$/);
  if (m) return <img src={`https://cdn.discordapp.com/emojis/${m[3]}.${m[1] === "a" ? "gif" : "png"}`} alt="" className="h-4 w-4" />;
  return <span>{emoji}</span>;
}

function PreviewButton({ b }: { b: ButtonNode }) {
  const cls = `inline-flex items-center gap-1 rounded-[3px] px-3 py-1.5 text-sm font-medium ${BTN_CLASS[b.style]} ${b.disabled ? "opacity-50" : ""}`;
  const inner = (
    <>
      {b.emoji && <ButtonEmoji emoji={b.emoji} />}
      {b.label}
      {b.style === "link" && <ExternalLink className="h-3 w-3 opacity-70" />}
    </>
  );
  // Link buttons are real, clickable links in the preview/feed.
  if (b.style === "link" && b.url && /^https?:\/\//.test(b.url) && !b.disabled) {
    return <a href={b.url} target="_blank" rel="noreferrer" className={cls}>{inner}</a>;
  }
  return <span className={cls}>{inner}</span>;
}

/** A variable inside a URL becomes its sample, so %guildIcon% shows the icon, not "thumb". */
function resolveUrl(url: string | undefined, vars: PreviewVars): string {
  return (url ?? "").replace(variablePattern(vars.syntax, "g"), (m, name: string) =>
    (vars.values[name] != null ? String(vars.values[name]) : m));
}

function Accessory({ a, vars }: { a: SectionAccessory; vars: PreviewVars }) {
  if (a.kind === "button") return <PreviewButton b={a.button} />;
  const url = resolveUrl(a.url, vars);
  return url && /^https?:\/\//.test(url) ? (
    <img src={url} alt={a.description ?? ""} className="h-16 w-16 rounded object-cover" />
  ) : (
    <div className="flex h-16 w-16 items-center justify-center rounded bg-black/30 text-[10px] text-muted-foreground">
      thumb
    </div>
  );
}

function ImageTile({ url: raw, label, vars }: { url: string; label?: string; vars: PreviewVars }) {
  const url = resolveUrl(raw, vars);
  return url && /^https?:\/\//.test(url) ? (
    <img src={url} alt={label ?? ""} className="max-h-48 rounded object-cover" />
  ) : (
    <div className="flex h-24 items-center justify-center rounded bg-black/30 text-xs text-muted-foreground">
      {label || "image"}
    </div>
  );
}

function Child({ node, vars }: { node: ContainerChild; vars: PreviewVars }) {
  const mentions = useContext(MentionsCtx);
  switch (node.type) {
    case "text":
      return (
        <div className="text-sm text-[#dbdee1]">
          <Markdown text={node.content} vars={vars} mentions={mentions} />
        </div>
      );
    case "separator":
      return node.divider ? (
        <hr className={`border-white/10 ${node.spacing === "large" ? "my-3" : "my-1.5"}`} />
      ) : (
        <div className={node.spacing === "large" ? "h-3" : "h-1.5"} />
      );
    case "section":
      return (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 break-words text-sm text-[#dbdee1]">
            {node.texts.map((t, i) => (
              <Markdown key={i} text={t} vars={vars} mentions={mentions} />
            ))}
          </div>
          <div className="shrink-0">
            <Accessory a={node.accessory} vars={vars} />
          </div>
        </div>
      );
    case "media_gallery":
      return (
        <div className="flex flex-wrap gap-1.5">
          {node.items.map((it) => (
            <ImageTile key={it.id} url={it.url} label={it.description} vars={vars} />
          ))}
        </div>
      );
    case "file":
      return (
        <div className="rounded border border-white/10 bg-black/20 px-3 py-2 text-xs text-[#dbdee1]">
          📎 {node.url.replace(/^attachment:\/\//, "")}
          {node.spoiler && <span className="ml-1 text-muted-foreground">(spoiler)</span>}
        </div>
      );
    case "action_row":
      return (
        <div className="flex flex-wrap gap-2">
          {node.buttons.map((b) => (
            <PreviewButton key={b.id} b={b} />
          ))}
        </div>
      );
  }
}

function Root({ node, vars, footnote }: { node: RootNode; vars: PreviewVars; footnote?: string | null }) {
  if (node.type === "container") {
    const color = hex(node.accentColor);
    return (
      <div
        className="space-y-2 rounded-[4px] bg-[#2b2d31] p-3"
        style={color ? { borderLeft: `4px solid ${color}` } : undefined}
      >
        {node.children.map((c) => (
          <Child key={c.id} node={c} vars={vars} />
        ))}
        {footnote && (
          <>
            <div className="h-px bg-[#3f4147]" />
            <div className="text-xs text-[#949ba4]">{renderInline(footnote.replace(/^-# /, ""), vars, "fn")}</div>
          </>
        )}
      </div>
    );
  }
  return (
    <>
      <Child node={node} vars={vars} />
      {footnote && <div className="text-xs text-[#949ba4]">{renderInline(footnote.replace(/^-# /, ""), vars, "fn")}</div>}
    </>
  );
}

// ── classic embeds ───────────────────────────────────────────────
const isHttp = (url: string) => /^https?:\/\//.test(url);

/** Consecutive inline fields share a row, up to three; any other field takes a row of its own. */
function fieldRows(fields: EmbedField[]): EmbedField[][] {
  const rows: EmbedField[][] = [];
  for (const f of fields) {
    const last = rows[rows.length - 1];
    if (f.inline && last && last.length < 3 && last[0].inline) last.push(f);
    else rows.push([f]);
  }
  return rows;
}

/** A small round picture (author and footer icons); grey while its URL is not one yet. */
function Icon({ url, size }: { url: string; size: string }) {
  return isHttp(url)
    ? <img src={url} alt="" className={`${size} shrink-0 rounded-full object-cover`} />
    : <span className={`${size} shrink-0 rounded-full bg-black/30`} />;
}

function Embed({ embed: e, vars }: { embed: EmbedNode; vars: PreviewVars }) {
  const mentions = useContext(MentionsCtx);
  const titleUrl = resolveUrl(e.url, vars);
  const authorUrl = resolveUrl(e.author.url, vars);
  const image = resolveUrl(e.imageUrl, vars);
  const thumb = resolveUrl(e.thumbnailUrl, vars);
  const fields = e.fields.filter((f) => f.name.trim() || f.value.trim());
  const footer = e.footer.text.trim();
  const authorName = <>{renderInline(e.author.name, vars, `au${e.id}`, mentions)}</>;
  const title = <>{renderInline(e.title, vars, `ti${e.id}`, mentions)}</>;

  return (
    <div className="flex max-w-[520px] overflow-hidden rounded-[4px] bg-[#2b2d31]">
      <div className="w-1 shrink-0" style={{ background: hex(e.color) ?? "#1e1f22" }} />
      <div className="min-w-0 flex-1 px-3 pb-3 pt-2">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1 space-y-1.5 break-words">
            {e.author.name.trim() && (
              <div className="flex items-center gap-2 text-[13px] font-semibold text-white">
                {e.author.iconUrl.trim() && <Icon url={resolveUrl(e.author.iconUrl, vars)} size="h-6 w-6" />}
                {isHttp(authorUrl)
                  ? <a href={authorUrl} target="_blank" rel="noreferrer" className="hover:underline">{authorName}</a>
                  : <span>{authorName}</span>}
              </div>
            )}
            {e.title.trim() && (e.url.trim() ? (
              isHttp(titleUrl)
                ? <a href={titleUrl} target="_blank" rel="noreferrer" className="block text-sm font-semibold text-[#00a8fc] hover:underline">{title}</a>
                : <div className="text-sm font-semibold text-[#00a8fc]">{title}</div>
            ) : (
              <div className="text-sm font-semibold text-white">{title}</div>
            ))}
            {e.description.trim() && (
              <div className="text-[13px] text-[#dbdee1]">
                <Markdown text={e.description} vars={vars} mentions={mentions} />
              </div>
            )}
            {fields.length > 0 && (
              <div className="space-y-2 pt-0.5">
                {fieldRows(fields).map((row) => (
                  <div key={row[0].id} className="grid gap-3" style={{ gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))` }}>
                    {row.map((f) => (
                      <div key={f.id} className="min-w-0 text-[13px]">
                        <div className="font-semibold text-white">{renderInline(f.name, vars, `fn${f.id}`, mentions)}</div>
                        <div className="text-[#dbdee1]"><Markdown text={f.value} vars={vars} mentions={mentions} /></div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
          {e.thumbnailUrl.trim() && (
            isHttp(thumb)
              ? <img src={thumb} alt="" className="h-20 w-20 shrink-0 rounded object-cover" />
              : <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded bg-black/30 text-[10px] text-muted-foreground">thumb</div>
          )}
        </div>
        {e.imageUrl.trim() && (
          isHttp(image)
            ? <img src={image} alt="" className="mt-3 max-h-72 max-w-full rounded object-contain" />
            : <div className="mt-3 flex h-24 items-center justify-center rounded bg-black/30 text-xs text-muted-foreground">image</div>
        )}
        {(footer || e.timestamp) && (
          <div className="mt-2 flex items-center gap-2 text-[11px] font-medium text-[#dbdee1]">
            {footer && e.footer.iconUrl.trim() && <Icon url={resolveUrl(e.footer.iconUrl, vars)} size="h-5 w-5" />}
            <span className="min-w-0 break-words">
              {footer && renderInline(e.footer.text, vars, `ft${e.id}`, mentions)}
              {footer && e.timestamp && <span className="mx-1">•</span>}
              {e.timestamp && `Today at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
            </span>
          </div>
        )}
        {isEmptyEmbed(e) && !e.timestamp && <div className="text-xs text-muted-foreground">Empty embed</div>}
      </div>
    </div>
  );
}

/** A classic message as Discord stacks it: the text, the embeds, then the buttons. */
function EmbedMessage({ model, vars, footnote }: { model: MessageModel; vars: PreviewVars; footnote?: string | null }) {
  const mentions = useContext(MentionsCtx);
  const content = model.content ?? "";
  const embeds = model.embeds ?? [];
  const rows = model.components.filter((n): n is ActionRowNode => n.type === "action_row");
  return (
    <div className="space-y-2">
      {!content.trim() && embeds.length === 0 && rows.length === 0 && (
        <div className="text-sm text-muted-foreground">Empty message</div>
      )}
      {content.trim() && (
        <div className="text-sm text-[#dbdee1]">
          <Markdown text={content} vars={vars} mentions={mentions} />
        </div>
      )}
      {embeds.map((e) => <Embed key={e.id} embed={e} vars={vars} />)}
      {rows.map((row) => <Child key={row.id} node={row} vars={vars} />)}
      {footnote && <div className="text-xs text-[#949ba4]">{renderInline(footnote.replace(/^-# /, ""), vars, "fn")}</div>}
    </div>
  );
}

// Renders just the component stack (no avatar/header wrapper), used to display
// a received message inside the channel feed.
export function MessageComponents({ model, variables, mentions, syntax = PERCENT_PLACEHOLDERS }: { model: MessageModel; variables?: TemplateVariable[]; mentions?: Mentions; syntax?: PlaceholderSyntax }) {
  const vars = previewVars(variables, syntax);
  return (
    <MentionsCtx.Provider value={mentions}>
      {messageFormat(model) === "embeds" ? (
        <EmbedMessage model={model} vars={vars} />
      ) : (
        <div className="space-y-2">
          {model.components.map((node) => <Root key={node.id} node={node} vars={vars} />)}
        </div>
      )}
    </MentionsCtx.Provider>
  );
}

// No default identity here: the host app passes the real bot name and avatar
// fetched from the running instance. Until that arrives, a loading ellipsis
// is shown instead of a made-up name.
export function DiscordPreview({
  model,
  variables,
  mentions,
  botName,
  botAvatar,
  watermark,
  syntax = PERCENT_PLACEHOLDERS,
  className = "",
}: {
  model: MessageModel;
  variables?: TemplateVariable[];
  mentions?: Mentions;
  /** How variables are written; defaults to %name%. */
  syntax?: PlaceholderSyntax;
  botName?: string;
  botAvatar?: string;
  /** Free-plan mark appended by the bot. Preview shows it so nobody designs
   *  a message, sends it, and finds an extra line they did not put there. */
  watermark?: string | null;
  className?: string;
}) {
  const vars = previewVars(variables, syntax);
  return (
    <MentionsCtx.Provider value={mentions}>
    <div className={`rounded-lg bg-[#313338] p-4 ${className}`}>
      <div className="flex gap-3">
        {botAvatar ? (
          <img src={botAvatar} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
        ) : (
          <div className="h-10 w-10 shrink-0 rounded-full bg-[#5865f2]" />
        )}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-sm font-medium text-white">{botName ?? "…"}</span>
            <span className="rounded bg-[#5865f2] px-1 text-[10px] font-semibold text-white">APP</span>
            <span className="text-xs text-muted-foreground">Today</span>
          </div>
          {messageFormat(model) === "embeds" ? (
            <EmbedMessage model={model} vars={vars} footnote={watermark} />
          ) : (
            <div className="space-y-2">
              {model.components.length === 0 ? (
                <div className="text-sm text-muted-foreground">Empty message</div>
              ) : (
                model.components.map((node, i) => (
                  <Root
                    key={node.id}
                    node={node}
                    vars={vars}
                    footnote={watermark && i === model.components.length - 1 ? watermark : null}
                  />
                ))
              )}
              {watermark && model.components.length === 0 && (
                <div className="text-xs text-[#949ba4]">{watermark}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    </MentionsCtx.Provider>
  );
}
