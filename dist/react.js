import {
  ACCENT_PRESETS,
  BLOCK_DESCRIPTIONS,
  BLOCK_LABELS,
  BUTTON_STYLE_OPTIONS,
  CHILD_BLOCK_KINDS,
  CLICKER_VARIABLES,
  DISCORD_VARIABLES,
  IS_COMPONENTS_V2,
  LIMITS,
  PERCENT_PLACEHOLDERS,
  ROOT_BLOCK_KINDS,
  applyVariableSamples,
  closingVariablePattern,
  countComponents,
  deserialize,
  emptyMessage,
  hexOf,
  makeBlock,
  makeButton,
  makeChildBlock,
  makeContainer,
  mergeVariables,
  partialVariablePattern,
  serialize,
  serializeJson,
  startingMessage,
  substituteVariables,
  uid,
  validate,
  variablePattern,
  wrapVariable
} from "./chunk-S64MESBS.js";

// src/DiscordMessageBuilder.tsx
import { useMemo, useRef as useRef3, useState as useState5 } from "react";
import { Percent as Percent2 } from "lucide-react";

// src/BlockBody.tsx
import { Plus, Trash2 as Trash22 } from "lucide-react";

// src/ui.tsx
import { forwardRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { jsx, jsxs } from "react/jsx-runtime";
var VARIANTS = {
  default: "bg-foreground text-background hover:opacity-90",
  secondary: "bg-muted text-foreground border border-border hover:bg-muted/70",
  outline: "border border-border bg-transparent text-foreground hover:bg-muted/60",
  ghost: "bg-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground",
  destructive: "bg-red-600 text-white hover:bg-red-500"
};
var SIZES = {
  default: "h-9 px-4 py-2 text-sm",
  sm: "h-8 px-3 text-xs",
  lg: "h-10 px-6 text-sm",
  icon: "h-9 w-9"
};
var Button = forwardRef(
  ({ className = "", variant = "default", size = "default", type = "button", ...props }, ref) => /* @__PURE__ */ jsx(
    "button",
    {
      ref,
      type,
      className: `inline-flex items-center justify-center gap-1.5 rounded-full font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`,
      ...props
    }
  )
);
Button.displayName = "Button";
var FIELD_CLS = "w-full rounded-lg border border-border bg-muted text-sm text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-dbx-accent-500 disabled:cursor-not-allowed disabled:opacity-50";
var Input = forwardRef(
  ({ className = "", ...props }, ref) => /* @__PURE__ */ jsx("input", { ref, className: `flex h-9 px-3 py-1 ${FIELD_CLS} ${className}`, ...props })
);
Input.displayName = "Input";
var Textarea = forwardRef(
  ({ className = "", ...props }, ref) => /* @__PURE__ */ jsx("textarea", { ref, className: `flex min-h-16 px-3 py-2 ${FIELD_CLS} ${className}`, ...props })
);
Textarea.displayName = "Textarea";
function Switch({ checked, onCheckedChange, disabled, className = "" }) {
  return /* @__PURE__ */ jsx(
    "button",
    {
      type: "button",
      role: "switch",
      "aria-checked": checked,
      disabled,
      onClick: () => onCheckedChange(!checked),
      className: `relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${checked ? "bg-emerald-500" : "bg-border"} ${className}`,
      children: /* @__PURE__ */ jsx("span", { className: `inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? "translate-x-[18px]" : "translate-x-0.5"}` })
    }
  );
}
function Skeleton({ className = "" }) {
  return /* @__PURE__ */ jsx("div", { className: `animate-pulse rounded-md bg-muted ${className}` });
}
function Modal({ open, onOpenChange, title, className = "", children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);
  if (!open) return null;
  return createPortal(
    /* @__PURE__ */ jsx(
      "div",
      {
        className: "fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:items-center",
        onMouseDown: (e) => {
          if (e.target === e.currentTarget) onOpenChange(false);
        },
        children: /* @__PURE__ */ jsxs(
          "div",
          {
            role: "dialog",
            "aria-modal": "true",
            "aria-label": title,
            className: `relative w-full rounded-xl border border-border bg-card p-4 text-foreground shadow-xl ${className}`,
            children: [
              /* @__PURE__ */ jsxs("div", { className: "mb-3 flex items-center justify-between gap-2", children: [
                title && /* @__PURE__ */ jsx("h2", { className: "text-sm font-semibold", children: title }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => onOpenChange(false),
                    "aria-label": "Close",
                    className: "ml-auto rounded p-1 text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                    children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
                  }
                )
              ] }),
              children
            ]
          }
        )
      }
    ),
    document.body
  );
}

// src/ButtonActions.tsx
import { Pencil } from "lucide-react";

// src/context.ts
import { createContext, useContext } from "react";
var BuilderContext = createContext({});
var useBuilderIntegrations = () => useContext(BuilderContext);
var SyntaxContext = createContext(PERCENT_PLACEHOLDERS);
var useSyntax = () => useContext(SyntaxContext);
var PaletteContext = createContext({ open: () => {
}, aim: () => {
} });
var usePalette = () => useContext(PaletteContext);

// src/fields.tsx
import { useEffect as useEffect3, useRef, useState as useState2 } from "react";
import { AtSign, Bold, Hash, Heading, Image as ImageIcon, Italic, List, Loader2 as Loader22, Paperclip, Percent, Smile, Strikethrough, Upload } from "lucide-react";

// src/MediaPicker.tsx
import { useEffect as useEffect2, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Fragment, jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
function fmtSize(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}
function MediaPicker({
  media,
  open,
  onOpenChange,
  onSelect,
  imagesOnly = true
}) {
  const Dialog = useBuilderIntegrations().modal ?? Modal;
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  useEffect2(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    media.list().then((a) => {
      if (active) setAssets(imagesOnly ? a.filter((x) => (x.type || "").startsWith("image/")) : a);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [open, media, imagesOnly]);
  async function remove(id) {
    setBusyId(id);
    try {
      await media.remove(id);
      setAssets((prev) => prev.filter((a) => a.id !== id));
    } finally {
      setBusyId(null);
    }
  }
  return /* @__PURE__ */ jsx2(Dialog, { open, onOpenChange, title: "Media library", className: "max-h-[85vh] max-w-3xl overflow-y-auto", children: /* @__PURE__ */ jsx2("div", { className: "space-y-2", children: loading ? /* @__PURE__ */ jsx2("div", { className: "grid grid-cols-3 gap-2 sm:grid-cols-4", children: Array.from({ length: 8 }).map((_, i) => /* @__PURE__ */ jsx2(Skeleton, { className: "h-28 w-full" }, i)) }) : assets.length === 0 ? /* @__PURE__ */ jsx2("p", { className: "py-8 text-center text-sm text-muted-foreground", children: "No uploads yet. Images you upload appear here." }) : /* @__PURE__ */ jsxs2(Fragment, { children: [
    /* @__PURE__ */ jsx2("p", { className: "text-[11px] text-muted-foreground", children: "Click an image to use it. A deleted image stops showing in messages that use it." }),
    /* @__PURE__ */ jsx2("div", { className: "grid grid-cols-3 gap-2 sm:grid-cols-4", children: assets.map((a) => /* @__PURE__ */ jsxs2("div", { className: "group relative overflow-hidden rounded-md border border-border/60", children: [
      /* @__PURE__ */ jsx2("button", { type: "button", onClick: () => {
        onSelect(a.url);
        onOpenChange(false);
      }, className: "block w-full", children: /* @__PURE__ */ jsx2("img", { src: a.url, alt: a.name ?? "", className: "h-28 w-full object-cover transition-transform group-hover:scale-105" }) }),
      /* @__PURE__ */ jsxs2("div", { className: "flex items-center justify-between gap-1 px-1.5 py-1 text-[10px] text-muted-foreground", children: [
        /* @__PURE__ */ jsx2("span", { className: "truncate", title: a.name ?? "", children: a.name || "image" }),
        /* @__PURE__ */ jsx2("span", { className: "shrink-0", children: fmtSize(a.size) })
      ] }),
      /* @__PURE__ */ jsx2(
        "button",
        {
          type: "button",
          onClick: () => remove(a.id),
          disabled: busyId === a.id,
          title: "Delete",
          className: "absolute right-1 top-1 rounded bg-black/60 p-1 opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100",
          children: busyId === a.id ? /* @__PURE__ */ jsx2(Loader2, { className: "h-3.5 w-3.5 animate-spin text-white" }) : /* @__PURE__ */ jsx2(Trash2, { className: "h-3.5 w-3.5 text-red-400" })
        }
      )
    ] }, a.id)) })
  ] }) }) });
}

// src/fields.tsx
import { Images } from "lucide-react";
import { Fragment as Fragment2, jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
var emojiSearch = null;
var emojiSearchLoading = null;
function loadEmojiSearch() {
  if (emojiSearch) return Promise.resolve(emojiSearch);
  emojiSearchLoading ??= import("./emoji-data-UGIFRFD7.js").then((m) => emojiSearch = m.searchEmojis);
  return emojiSearchLoading;
}
function FieldLabel({ children }) {
  return /* @__PURE__ */ jsx3("label", { className: "text-[11px] font-semibold uppercase tracking-wide text-muted-foreground", children });
}
function Popover({
  trigger,
  children,
  align = "end"
}) {
  const [open, setOpen] = useState2(false);
  const ref = useRef(null);
  useEffect3(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);
  return /* @__PURE__ */ jsxs3("div", { ref, className: "relative inline-block", children: [
    /* @__PURE__ */ jsx3("span", { onClick: () => setOpen((o) => !o), children: trigger }),
    open && /* @__PURE__ */ jsx3(
      "div",
      {
        className: `absolute z-50 mt-1 rounded-md border border-border/60 bg-popover p-2 shadow-lg ${align === "end" ? "right-0" : "left-0"}`,
        children: children(() => setOpen(false))
      }
    )
  ] });
}
function ToolbarButton({ title, onClick, children }) {
  return /* @__PURE__ */ jsx3(
    "button",
    {
      type: "button",
      title,
      onMouseDown: (e) => e.preventDefault(),
      onClick,
      className: "flex h-8 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted/50 hover:text-foreground sm:h-6",
      children
    }
  );
}
function customEmojiUrl(id, animated) {
  return `https://cdn.discordapp.com/emojis/${id}.${animated ? "gif" : "png"}`;
}
function isImageVariable(name) {
  return /avatar|icon|image/i.test(name);
}
function EmojiGrid({ onPick }) {
  const { emojis } = useBuilderIntegrations();
  const server = emojis ?? [];
  const [tab, setTab] = useState2("standard");
  const [q, setQ] = useState2("");
  const query = q.trim().toLowerCase();
  const [search, setSearch] = useState2(emojiSearch);
  useEffect3(() => {
    if (search) return;
    let active = true;
    loadEmojiSearch().then((fn) => {
      if (active) setSearch(() => fn);
    });
    return () => {
      active = false;
    };
  }, [search]);
  const uni = search ? search(q) : [];
  const srv = query ? server.filter((e) => e.name.toLowerCase().includes(query)) : server;
  const showing = server.length > 0 ? tab : "standard";
  return /* @__PURE__ */ jsxs3("div", { className: "w-[min(18rem,calc(100vw-3rem))]", children: [
    server.length > 0 && /* @__PURE__ */ jsx3("div", { className: "mb-1.5 flex gap-1 rounded-md bg-muted/30 p-0.5 text-xs", children: [["standard", "Standard"], ["server", `Server (${server.length})`]].map(([id, label]) => /* @__PURE__ */ jsx3(
      "button",
      {
        type: "button",
        onClick: () => setTab(id),
        "aria-pressed": showing === id,
        className: `flex-1 rounded px-2 py-1 font-medium transition-colors ${showing === id ? "bg-dbx-accent-600 text-white" : "text-muted-foreground hover:text-foreground"}`,
        children: label
      },
      id
    )) }),
    /* @__PURE__ */ jsx3(
      Input,
      {
        value: q,
        onChange: (e) => setQ(e.target.value),
        placeholder: showing === "server" ? "Search server emoji\u2026" : "Search emoji\u2026",
        className: "mb-1.5 h-7 text-xs"
      }
    ),
    /* @__PURE__ */ jsx3("div", { className: "max-h-52 overflow-y-auto overscroll-contain pr-1", children: showing === "standard" ? !search ? /* @__PURE__ */ jsxs3("p", { className: "flex items-center gap-1.5 px-1 py-2 text-xs text-muted-foreground", children: [
      /* @__PURE__ */ jsx3(Loader22, { className: "h-3 w-3 animate-spin" }),
      " Loading emoji\u2026"
    ] }) : uni.length > 0 ? /* @__PURE__ */ jsx3("div", { className: "grid grid-cols-7 justify-items-center gap-0.5 sm:grid-cols-8", children: uni.map((e) => /* @__PURE__ */ jsx3("button", { type: "button", title: e.keywords, onClick: () => onPick(e.char), className: "flex h-8 w-8 items-center justify-center rounded text-base hover:bg-muted/50 sm:h-7 sm:w-7", children: e.char }, e.char)) }) : /* @__PURE__ */ jsx3("p", { className: "px-1 py-2 text-xs text-muted-foreground", children: "No emoji found." }) : srv.length > 0 ? /* @__PURE__ */ jsx3("div", { className: "grid grid-cols-7 justify-items-center gap-0.5 sm:grid-cols-8", children: srv.map((e) => /* @__PURE__ */ jsx3("button", { type: "button", title: e.name, onClick: () => onPick(`<${e.animated ? "a" : ""}:${e.name}:${e.id}>`), className: "flex h-8 w-8 items-center justify-center rounded hover:bg-muted/50 sm:h-7 sm:w-7", children: /* @__PURE__ */ jsx3("img", { src: customEmojiUrl(e.id, e.animated), alt: e.name, loading: "lazy", onError: (ev) => {
      ev.currentTarget.style.visibility = "hidden";
    }, className: "h-6 w-6 object-contain" }) }, e.id)) }) : /* @__PURE__ */ jsx3("p", { className: "px-1 py-2 text-xs text-muted-foreground", children: "No server emoji found." }) })
  ] });
}
function ChannelPicker({ onPick }) {
  const { channels } = useBuilderIntegrations();
  const [q, setQ] = useState2("");
  const list = (channels ?? []).filter((c) => c.name.toLowerCase().includes(q.toLowerCase().trim())).slice(0, 60);
  return /* @__PURE__ */ jsxs3("div", { className: "w-[min(14rem,calc(100vw-3rem))]", children: [
    /* @__PURE__ */ jsx3(Input, { value: q, onChange: (e) => setQ(e.target.value), placeholder: "Search channels\u2026", className: "mb-1 h-7 text-xs" }),
    /* @__PURE__ */ jsxs3("div", { className: "max-h-48 overflow-auto overscroll-contain", children: [
      list.map((c) => /* @__PURE__ */ jsxs3("button", { type: "button", onClick: () => onPick(c.id), className: "block w-full truncate rounded px-1 py-1 text-left text-xs hover:bg-muted/50", children: [
        "# ",
        c.name
      ] }, c.id)),
      list.length === 0 && /* @__PURE__ */ jsx3("p", { className: "px-1 py-2 text-xs text-muted-foreground", children: "No channels found." })
    ] })
  ] });
}
function UserPicker({ onPick }) {
  const { searchUsers } = useBuilderIntegrations();
  const [q, setQ] = useState2("");
  const [results, setResults] = useState2([]);
  const [busy, setBusy] = useState2(false);
  useEffect3(() => {
    if (!searchUsers || q.trim().length < 2) {
      setResults([]);
      return;
    }
    let active = true;
    setBusy(true);
    const t = setTimeout(async () => {
      try {
        const r = await searchUsers(q.trim());
        if (active) setResults(r);
      } catch {
        if (active) setResults([]);
      } finally {
        if (active) setBusy(false);
      }
    }, 300);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [q, searchUsers]);
  return /* @__PURE__ */ jsxs3("div", { className: "w-[min(15rem,calc(100vw-3rem))]", children: [
    /* @__PURE__ */ jsx3(Input, { value: q, onChange: (e) => setQ(e.target.value), placeholder: "Search users\u2026", className: "mb-1 h-7 text-xs" }),
    /* @__PURE__ */ jsxs3("div", { className: "max-h-48 overflow-auto overscroll-contain", children: [
      busy && /* @__PURE__ */ jsx3("p", { className: "px-1 py-2 text-xs text-muted-foreground", children: "Searching\u2026" }),
      !busy && results.map((u) => /* @__PURE__ */ jsxs3("button", { type: "button", onClick: () => onPick(u.id), className: "flex w-full items-center gap-2 rounded px-1 py-1 text-left text-xs hover:bg-muted/50", children: [
        u.avatar ? /* @__PURE__ */ jsx3("img", { src: u.avatar, alt: "", className: "h-5 w-5 rounded-full" }) : /* @__PURE__ */ jsx3("span", { className: "h-5 w-5 rounded-full bg-muted" }),
        /* @__PURE__ */ jsx3("span", { className: "truncate", children: u.name })
      ] }, u.id)),
      !busy && q.trim().length >= 2 && results.length === 0 && /* @__PURE__ */ jsx3("p", { className: "px-1 py-2 text-xs text-muted-foreground", children: "No users found." })
    ] })
  ] });
}
function MarkdownField({
  label = "Content",
  value,
  onChange,
  variables,
  rows = 4,
  max = 4e3,
  placeholder
}) {
  const ref = useRef(null);
  const { channels, searchUsers } = useBuilderIntegrations();
  const palette = usePalette();
  const syntax = useSyntax();
  const [ac, setAc] = useState2(null);
  const [acIndex, setAcIndex] = useState2(0);
  const acMatches = ac && variables ? variables.filter((v) => v.name.toLowerCase().startsWith(ac.prefix.toLowerCase())).slice(0, 8) : [];
  function refreshAutocomplete(text, caret) {
    if (!variables || variables.length === 0) {
      setAc(null);
      return;
    }
    const before = text.slice(0, caret).replace(variablePattern(syntax, "g"), (m2) => " ".repeat(m2.length));
    const m = partialVariablePattern(syntax).exec(before);
    if (!m) {
      setAc(null);
      return;
    }
    if (closingVariablePattern(syntax).test(text.slice(caret))) {
      setAc(null);
      return;
    }
    setAc({ prefix: m[1], start: caret - m[1].length - syntax.open.length });
    setAcIndex(0);
  }
  function acceptVariable(name) {
    if (!ac) return;
    const caret = ac.start + syntax.open.length + ac.prefix.length;
    const placeholder2 = wrapVariable(name, syntax);
    onChange(`${value.slice(0, ac.start)}${placeholder2}${value.slice(caret)}`.slice(0, max));
    setAc(null);
    focusAt(ac.start + placeholder2.length);
  }
  function onKeyDown(e) {
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
  function focusAt(pos) {
    requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  }
  function insert(text) {
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
  function wrap(token, token2 = token) {
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
  function prefixLine(prefix) {
    const el = ref.current;
    const s = el?.selectionStart ?? 0;
    const lineStart = value.lastIndexOf("\n", s - 1) + 1;
    onChange(value.slice(0, lineStart) + prefix + value.slice(lineStart));
    focusAt(s + prefix.length);
  }
  return /* @__PURE__ */ jsxs3("div", { className: "min-w-0 space-y-1", children: [
    /* @__PURE__ */ jsxs3("div", { className: "flex flex-wrap items-center justify-between gap-x-2 gap-y-1", children: [
      /* @__PURE__ */ jsxs3(FieldLabel, { children: [
        label,
        " ",
        /* @__PURE__ */ jsxs3("span", { className: "ml-1 font-normal normal-case text-muted-foreground/60", children: [
          "\xB7 ",
          value.length,
          "/",
          max
        ] })
      ] }),
      /* @__PURE__ */ jsxs3("div", { className: "flex flex-wrap items-center justify-end gap-0.5", children: [
        variables && variables.length > 0 && // Opens the palette next to the preview, aimed at this field
        /* @__PURE__ */ jsx3(ToolbarButton, { title: "Variables", onClick: () => palette.open(insert), children: /* @__PURE__ */ jsx3(Percent, { className: "h-3.5 w-3.5" }) }),
        /* @__PURE__ */ jsx3(Popover, { trigger: /* @__PURE__ */ jsx3(ToolbarButton, { title: "Insert emoji", onClick: () => {
        }, children: /* @__PURE__ */ jsx3(Smile, { className: "h-3.5 w-3.5" }) }), children: (close) => /* @__PURE__ */ jsx3(EmojiGrid, { onPick: (e) => {
          insert(e);
          close();
        } }) }),
        searchUsers ? /* @__PURE__ */ jsx3(Popover, { trigger: /* @__PURE__ */ jsx3(ToolbarButton, { title: "Mention a user", onClick: () => {
        }, children: /* @__PURE__ */ jsx3(AtSign, { className: "h-3.5 w-3.5" }) }), children: (close) => /* @__PURE__ */ jsx3(UserPicker, { onPick: (id) => {
          insert(`<@${id}>`);
          close();
        } }) }) : /* @__PURE__ */ jsx3(ToolbarButton, { title: "Mention", onClick: () => insert("<@USER_ID>"), children: /* @__PURE__ */ jsx3(AtSign, { className: "h-3.5 w-3.5" }) }),
        channels && channels.length > 0 ? /* @__PURE__ */ jsx3(Popover, { trigger: /* @__PURE__ */ jsx3(ToolbarButton, { title: "Mention a channel", onClick: () => {
        }, children: /* @__PURE__ */ jsx3(Hash, { className: "h-3.5 w-3.5" }) }), children: (close) => /* @__PURE__ */ jsx3(ChannelPicker, { onPick: (id) => {
          insert(`<#${id}>`);
          close();
        } }) }) : /* @__PURE__ */ jsx3(ToolbarButton, { title: "Channel", onClick: () => insert("<#CHANNEL_ID>"), children: /* @__PURE__ */ jsx3(Hash, { className: "h-3.5 w-3.5" }) }),
        /* @__PURE__ */ jsx3("span", { className: "mx-0.5 h-4 w-px bg-border/60" }),
        /* @__PURE__ */ jsx3(ToolbarButton, { title: "Bold", onClick: () => wrap("**"), children: /* @__PURE__ */ jsx3(Bold, { className: "h-3.5 w-3.5" }) }),
        /* @__PURE__ */ jsx3(ToolbarButton, { title: "Italic", onClick: () => wrap("*"), children: /* @__PURE__ */ jsx3(Italic, { className: "h-3.5 w-3.5" }) }),
        /* @__PURE__ */ jsx3(ToolbarButton, { title: "Strikethrough", onClick: () => wrap("~~"), children: /* @__PURE__ */ jsx3(Strikethrough, { className: "h-3.5 w-3.5" }) }),
        /* @__PURE__ */ jsx3(ToolbarButton, { title: "Heading", onClick: () => prefixLine("## "), children: /* @__PURE__ */ jsx3(Heading, { className: "h-3.5 w-3.5" }) }),
        /* @__PURE__ */ jsx3(ToolbarButton, { title: "Bullet list", onClick: () => prefixLine("- "), children: /* @__PURE__ */ jsx3(List, { className: "h-3.5 w-3.5" }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs3("div", { className: "relative", children: [
      /* @__PURE__ */ jsx3(
        Textarea,
        {
          ref,
          rows,
          value,
          placeholder,
          onChange: (e) => {
            const v = e.target.value.slice(0, max);
            onChange(v);
            refreshAutocomplete(v, e.target.selectionStart ?? v.length);
          },
          onKeyDown,
          onBlur: () => setAc(null),
          onFocus: () => palette.aim(insert),
          onClick: (e) => refreshAutocomplete(value, e.target.selectionStart ?? 0)
        }
      ),
      ac && acMatches.length > 0 && /* @__PURE__ */ jsxs3("div", { className: "absolute left-0 top-full z-50 mt-1 w-96 max-w-[calc(100vw-3rem)] rounded-md border border-border/60 bg-popover p-1 shadow-lg", children: [
        acMatches.map((v, i) => /* @__PURE__ */ jsxs3(
          "button",
          {
            type: "button",
            onMouseDown: (e) => e.preventDefault(),
            onClick: () => acceptVariable(v.name),
            className: `flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs ${i === acIndex ? "bg-muted/50" : "hover:bg-muted/50"}`,
            children: [
              isImageVariable(v.name) && /* @__PURE__ */ jsx3(ImageIcon, { className: "h-3 w-3 shrink-0 text-muted-foreground" }),
              /* @__PURE__ */ jsx3("span", { className: "shrink-0 font-mono font-semibold text-amber-300", children: wrapVariable(v.name, syntax) }),
              /* @__PURE__ */ jsx3("span", { className: "shrink-0 rounded bg-dbx-accent-500/15 px-1 py-px text-[9px] font-bold uppercase tracking-wide text-dbx-accent-300", children: v.group ?? "Message" }),
              v.description && /* @__PURE__ */ jsx3("span", { className: "ml-auto min-w-0 truncate text-right text-[10px] text-muted-foreground", children: v.description })
            ]
          },
          v.name
        )),
        /* @__PURE__ */ jsx3("p", { className: "border-t border-border/60 px-2 pb-0.5 pt-1 text-[10px] text-muted-foreground", children: "Enter to insert, Esc to close" })
      ] })
    ] })
  ] });
}
function TextField({
  label,
  value,
  onChange,
  placeholder,
  max
}) {
  return /* @__PURE__ */ jsxs3("div", { className: "space-y-1", children: [
    /* @__PURE__ */ jsxs3(FieldLabel, { children: [
      label,
      max != null && /* @__PURE__ */ jsxs3("span", { className: "ml-1 font-normal normal-case text-muted-foreground/60", children: [
        "\xB7 ",
        value.length,
        "/",
        max
      ] })
    ] }),
    /* @__PURE__ */ jsx3(Input, { value, placeholder, onChange: (e) => onChange(max != null ? e.target.value.slice(0, max) : e.target.value) })
  ] });
}
function SwitchRow({ label, checked, onChange }) {
  return /* @__PURE__ */ jsxs3("label", { className: "flex cursor-pointer items-center justify-between gap-2 py-1", children: [
    /* @__PURE__ */ jsx3("span", { className: "min-w-0 text-xs text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx3("span", { className: "shrink-0", children: /* @__PURE__ */ jsx3(Switch, { checked, onCheckedChange: onChange }) })
  ] });
}
function SegmentToggle({
  options,
  value,
  onChange
}) {
  return /* @__PURE__ */ jsx3("div", { className: "flex flex-wrap gap-1 rounded-md border border-border/60 bg-muted/20 p-1", children: options.map((o) => /* @__PURE__ */ jsx3(
    "button",
    {
      type: "button",
      onClick: () => onChange(o.value),
      className: `rounded px-2.5 py-1 text-xs font-medium transition-colors ${value === o.value ? "bg-dbx-accent-600 text-white" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`,
      children: o.label
    },
    o.value
  )) });
}
function ImageField({
  label,
  value,
  onChange,
  onUpload,
  placeholder
}) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState2(false);
  const [error, setError] = useState2(null);
  const [pickerOpen, setPickerOpen] = useState2(false);
  const { media } = useBuilderIntegrations();
  async function handleFile(file) {
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
  return /* @__PURE__ */ jsxs3("div", { className: "space-y-1", children: [
    /* @__PURE__ */ jsx3(FieldLabel, { children: label }),
    /* @__PURE__ */ jsxs3("div", { className: "flex items-start gap-2", children: [
      isImg ? /* @__PURE__ */ jsx3("img", { src: value, alt: "", className: "h-12 w-12 shrink-0 rounded border border-border/60 object-cover" }) : /* @__PURE__ */ jsx3("div", { className: "flex h-12 w-12 shrink-0 items-center justify-center rounded border border-border/60 bg-muted/30 text-muted-foreground", children: /* @__PURE__ */ jsx3(ImageIcon, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsxs3("div", { className: "min-w-0 flex-1 space-y-1.5", children: [
        /* @__PURE__ */ jsx3(Input, { value, placeholder: placeholder ?? "https://\u2026/image.png", onChange: (e) => onChange(e.target.value) }),
        /* @__PURE__ */ jsxs3("div", { className: "flex flex-wrap gap-1.5", children: [
          onUpload && /* @__PURE__ */ jsxs3(Fragment2, { children: [
            /* @__PURE__ */ jsx3(
              "input",
              {
                ref: inputRef,
                type: "file",
                accept: "image/png,image/jpeg,image/gif,image/webp",
                className: "hidden",
                onChange: (e) => handleFile(e.target.files?.[0])
              }
            ),
            /* @__PURE__ */ jsxs3(Button, { type: "button", variant: "outline", size: "sm", disabled: busy, onClick: () => inputRef.current?.click(), children: [
              busy ? /* @__PURE__ */ jsx3(Loader22, { className: "mr-1 h-3 w-3 animate-spin" }) : /* @__PURE__ */ jsx3(Upload, { className: "mr-1 h-3 w-3" }),
              busy ? "Uploading\u2026" : "Upload image"
            ] })
          ] }),
          media && /* @__PURE__ */ jsxs3(Button, { type: "button", variant: "outline", size: "sm", onClick: () => setPickerOpen(true), children: [
            /* @__PURE__ */ jsx3(Images, { className: "mr-1 h-3 w-3" }),
            " Library"
          ] })
        ] }),
        error && /* @__PURE__ */ jsx3("p", { className: "text-[11px] text-red-400", children: error })
      ] })
    ] }),
    media && /* @__PURE__ */ jsx3(MediaPicker, { media, open: pickerOpen, onOpenChange: setPickerOpen, onSelect: onChange })
  ] });
}
function FileField({
  label,
  value,
  onChange,
  onUpload,
  placeholder
}) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState2(false);
  const [error, setError] = useState2(null);
  async function handleFile(file) {
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
  return /* @__PURE__ */ jsxs3("div", { className: "space-y-1", children: [
    /* @__PURE__ */ jsx3(FieldLabel, { children: label }),
    /* @__PURE__ */ jsxs3("div", { className: "flex items-center gap-2 rounded-md border border-border/60 bg-muted/20 px-2 py-1.5", children: [
      /* @__PURE__ */ jsx3(Paperclip, { className: "h-4 w-4 shrink-0 text-muted-foreground" }),
      /* @__PURE__ */ jsx3("span", { className: "min-w-0 flex-1 truncate text-sm", children: fileName || /* @__PURE__ */ jsx3("span", { className: "text-muted-foreground", children: "No file" }) }),
      onUpload && /* @__PURE__ */ jsxs3(Fragment2, { children: [
        /* @__PURE__ */ jsx3("input", { ref: inputRef, type: "file", className: "hidden", onChange: (e) => handleFile(e.target.files?.[0]) }),
        /* @__PURE__ */ jsxs3(Button, { type: "button", variant: "outline", size: "sm", disabled: busy, onClick: () => inputRef.current?.click(), children: [
          busy ? /* @__PURE__ */ jsx3(Loader22, { className: "mr-1 h-3 w-3 animate-spin" }) : /* @__PURE__ */ jsx3(Upload, { className: "mr-1 h-3 w-3" }),
          busy ? "Uploading\u2026" : "Upload file"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx3(Input, { value, placeholder: placeholder ?? "attachment://file.png", onChange: (e) => onChange(e.target.value) }),
    error && /* @__PURE__ */ jsx3("p", { className: "text-[11px] text-red-400", children: error })
  ] });
}

// src/ButtonActions.tsx
import { Fragment as Fragment3, jsx as jsx4, jsxs as jsxs4 } from "react/jsx-runtime";
var BUTTON_ACTION_OPTIONS = [
  { value: "none", label: "Nothing" },
  { value: "reply", label: "Private reply" },
  { value: "send_dm", label: "DM the user" },
  { value: "send_channel", label: "Post in a channel" }
];
function DiscordActionEditor({ action: raw, onChange, variables }) {
  const { channels, editRichMessage } = useBuilderIntegrations();
  const syntax = useSyntax();
  const action = raw ?? { type: "none" };
  const setAction = (patch) => onChange({ ...action, ...patch });
  return /* @__PURE__ */ jsxs4("div", { className: "space-y-2 rounded-md border border-border/60 bg-background/40 p-2", children: [
    /* @__PURE__ */ jsxs4("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx4(FieldLabel, { children: "On click" }),
      /* @__PURE__ */ jsx4(
        SegmentToggle,
        {
          options: BUTTON_ACTION_OPTIONS,
          value: action.type,
          onChange: (type) => setAction({ type })
        }
      )
    ] }),
    action.type !== "none" && /* @__PURE__ */ jsxs4(Fragment3, { children: [
      action.type === "send_channel" && /* @__PURE__ */ jsxs4("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsx4(FieldLabel, { children: "Channel" }),
        /* @__PURE__ */ jsxs4(
          "select",
          {
            value: action.channelId ?? "",
            onChange: (e) => setAction({ channelId: e.target.value || void 0 }),
            className: "h-8 w-full rounded-md border border-border/60 bg-background px-2 text-xs",
            children: [
              /* @__PURE__ */ jsx4("option", { value: "", children: "Choose a channel\u2026" }),
              (channels ?? []).map((c) => /* @__PURE__ */ jsxs4("option", { value: c.id, children: [
                "# ",
                c.name
              ] }, c.id))
            ]
          }
        )
      ] }),
      editRichMessage && /* @__PURE__ */ jsxs4("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsx4(FieldLabel, { children: "Response type" }),
        /* @__PURE__ */ jsx4(
          SegmentToggle,
          {
            options: [{ value: "text", label: "Text" }, { value: "rich", label: "Rich message" }],
            value: action.rich ? "rich" : "text",
            onChange: (v) => setAction({ rich: v === "rich" })
          }
        )
      ] }),
      action.rich && editRichMessage ? /* @__PURE__ */ jsxs4("div", { className: "flex items-center justify-between gap-2 rounded-md border border-border/60 bg-muted/20 px-2 py-1.5", children: [
        /* @__PURE__ */ jsx4("span", { className: "text-xs text-muted-foreground", children: action.model && action.model.components.length > 0 ? `Rich message \xB7 ${action.model.components.length} block${action.model.components.length === 1 ? "" : "s"}` : "No message yet" }),
        /* @__PURE__ */ jsxs4(
          Button,
          {
            variant: "outline",
            size: "sm",
            onClick: () => editRichMessage(action.model, (model) => setAction({ model })),
            children: [
              /* @__PURE__ */ jsx4(Pencil, { className: "mr-1 h-3 w-3" }),
              " ",
              action.model ? "Edit" : "Create",
              " message"
            ]
          }
        )
      ] }) : /* @__PURE__ */ jsx4(
        MarkdownField,
        {
          label: action.type === "send_dm" ? "DM message" : action.type === "reply" ? "Reply message" : "Message to post",
          value: action.content ?? "",
          onChange: (content) => setAction({ content }),
          variables,
          rows: 3,
          max: 2e3,
          placeholder: `Hey ${wrapVariable("user", syntax)}, thanks for clicking!`
        }
      ),
      action.type === "reply" && /* @__PURE__ */ jsx4(
        SwitchRow,
        {
          label: "Private reply (only the user who clicked sees it)",
          checked: action.ephemeral !== false,
          onChange: (v) => setAction({ ephemeral: v })
        }
      ),
      /* @__PURE__ */ jsx4("p", { className: "text-[11px] text-muted-foreground", children: "Needs a custom ID. The action is saved when the message is sent." })
    ] })
  ] });
}

// src/BlockBody.tsx
import { jsx as jsx5, jsxs as jsxs5 } from "react/jsx-runtime";
function ButtonEditor({ button, onChange, variables }) {
  const set = (patch) => onChange({ ...button, ...patch });
  const { savedActions, actionEditor } = useBuilderIntegrations();
  const ActionEditor = actionEditor ?? DiscordActionEditor;
  const listId = `saved-actions-${button.id}`;
  const applySaved = (customId) => {
    const s = (savedActions ?? []).find((x) => x.customId === customId);
    if (s) set({ customId: s.customId, action: s.action });
  };
  const matchesSaved = (savedActions ?? []).some((s) => s.customId === (button.customId ?? "").trim());
  return /* @__PURE__ */ jsxs5("div", { className: "space-y-2 rounded-md border border-border/60 bg-muted/20 p-2", children: [
    /* @__PURE__ */ jsxs5("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx5(FieldLabel, { children: "Style" }),
      /* @__PURE__ */ jsx5(
        SegmentToggle,
        {
          options: BUTTON_STYLE_OPTIONS,
          value: button.style,
          onChange: (style) => {
            if (style === "link") set({ style, url: button.url ?? "https://", customId: void 0, action: void 0 });
            else set({ style, customId: button.customId ?? "", url: void 0 });
          }
        }
      )
    ] }),
    /* @__PURE__ */ jsxs5("div", { className: "grid grid-cols-[minmax(0,1fr)_auto] gap-2", children: [
      /* @__PURE__ */ jsx5(TextField, { label: "Label", value: button.label ?? "", onChange: (v) => set({ label: v }), placeholder: "Click me", max: LIMITS.buttonLabelChars }),
      /* @__PURE__ */ jsx5(TextField, { label: "Emoji", value: button.emoji ?? "", onChange: (v) => set({ emoji: v || void 0 }), placeholder: "\u{1F389}" })
    ] }),
    button.style === "link" ? /* @__PURE__ */ jsx5(TextField, { label: "URL", value: button.url ?? "", onChange: (v) => set({ url: v }), placeholder: "https://example.com" }) : /* @__PURE__ */ jsxs5("div", { className: "space-y-1", children: [
      savedActions && savedActions.length > 0 && /* @__PURE__ */ jsx5("div", { className: "flex items-center gap-2", children: /* @__PURE__ */ jsxs5(
        "select",
        {
          value: "",
          onChange: (e) => {
            if (e.target.value) applySaved(e.target.value);
          },
          className: "h-8 flex-1 rounded-md border border-border/60 bg-background px-2 text-xs",
          title: "Use a saved button action",
          children: [
            /* @__PURE__ */ jsx5("option", { value: "", children: "Use a saved action\u2026" }),
            savedActions.map((s) => /* @__PURE__ */ jsx5("option", { value: s.customId, children: s.label || s.customId }, s.customId))
          ]
        }
      ) }),
      /* @__PURE__ */ jsx5(FieldLabel, { children: "Custom ID (identifies the button for the bot)" }),
      /* @__PURE__ */ jsx5(
        "input",
        {
          list: listId,
          value: button.customId ?? "",
          onChange: (e) => set({ customId: e.target.value }),
          placeholder: "my_button_id",
          className: "h-8 w-full rounded-md border border-border/60 bg-background px-2 text-xs"
        }
      ),
      /* @__PURE__ */ jsx5("datalist", { id: listId, children: (savedActions ?? []).map((s) => /* @__PURE__ */ jsx5("option", { value: s.customId, children: s.label || s.customId }, s.customId)) }),
      matchesSaved && /* @__PURE__ */ jsx5(
        "button",
        {
          type: "button",
          onClick: () => applySaved((button.customId ?? "").trim()),
          className: "text-[11px] text-dbx-accent-400 hover:underline",
          children: "A saved action uses this ID. Load it"
        }
      )
    ] }),
    button.style !== "link" && /* @__PURE__ */ jsx5(
      ActionEditor,
      {
        action: button.action,
        onChange: (action) => set({ action }),
        variables
      }
    ),
    /* @__PURE__ */ jsx5(SwitchRow, { label: "Disabled", checked: !!button.disabled, onChange: (v) => set({ disabled: v }) })
  ] });
}
function ContainerProps({ node, onChange }) {
  return /* @__PURE__ */ jsxs5("div", { className: "space-y-2", children: [
    /* @__PURE__ */ jsxs5("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx5(FieldLabel, { children: "Accent color" }),
      /* @__PURE__ */ jsxs5("div", { className: "flex flex-wrap items-center gap-1.5", children: [
        /* @__PURE__ */ jsx5(
          "button",
          {
            type: "button",
            onClick: () => onChange({ ...node, accentColor: null }),
            className: `h-6 rounded border px-2 text-[11px] ${node.accentColor == null ? "border-dbx-accent-500 text-dbx-accent-300" : "border-border/60 text-muted-foreground"}`,
            children: "None"
          }
        ),
        ACCENT_PRESETS.map((p) => /* @__PURE__ */ jsx5(
          "button",
          {
            type: "button",
            title: p.name,
            onClick: () => onChange({ ...node, accentColor: p.value }),
            className: `h-6 w-6 rounded border ${node.accentColor === p.value ? "ring-2 ring-white" : "border-black/30"}`,
            style: { background: hexOf(p.value) }
          },
          p.value
        )),
        /* @__PURE__ */ jsx5(
          "input",
          {
            type: "color",
            value: hexOf(node.accentColor) ?? "#9b59b6",
            onChange: (e) => onChange({ ...node, accentColor: parseInt(e.target.value.slice(1), 16) }),
            className: "h-6 w-8 cursor-pointer rounded border border-border/60 bg-transparent"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx5(SwitchRow, { label: "Spoiler (blur until clicked)", checked: !!node.spoiler, onChange: (v) => onChange({ ...node, spoiler: v }) })
  ] });
}
function TextBody({ node, onChange, variables }) {
  return /* @__PURE__ */ jsx5(MarkdownField, { value: node.content, onChange: (content) => onChange({ ...node, content }), variables, rows: 5, placeholder: "## Heading\nBody text with **bold**\u2026" });
}
function SeparatorBody({ node, onChange }) {
  return /* @__PURE__ */ jsxs5("div", { className: "flex flex-wrap items-center gap-x-6 gap-y-1", children: [
    /* @__PURE__ */ jsx5(SwitchRow, { label: "Divider line", checked: node.divider, onChange: (v) => onChange({ ...node, divider: v }) }),
    /* @__PURE__ */ jsxs5("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx5(FieldLabel, { children: "Spacing" }),
      /* @__PURE__ */ jsx5(
        SegmentToggle,
        {
          options: [{ value: "small", label: "Small" }, { value: "large", label: "Large" }],
          value: node.spacing,
          onChange: (spacing) => onChange({ ...node, spacing })
        }
      )
    ] })
  ] });
}
function SectionBody({ node, onChange, variables, onUpload }) {
  const setText = (i, v) => onChange({ ...node, texts: node.texts.map((t, k) => k === i ? v : t) });
  return /* @__PURE__ */ jsxs5("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsxs5("div", { className: "space-y-2", children: [
      node.texts.map((t, i) => /* @__PURE__ */ jsxs5("div", { className: "flex items-start gap-1", children: [
        /* @__PURE__ */ jsx5("div", { className: "min-w-0 flex-1", children: /* @__PURE__ */ jsx5(MarkdownField, { label: `Text line ${i + 1}`, value: t, onChange: (v) => setText(i, v), variables, rows: 2 }) }),
        node.texts.length > 1 && /* @__PURE__ */ jsx5(Button, { variant: "ghost", size: "icon", className: "mt-5", onClick: () => onChange({ ...node, texts: node.texts.filter((_, k) => k !== i) }), children: /* @__PURE__ */ jsx5(Trash22, { className: "h-4 w-4 text-red-400" }) })
      ] }, i)),
      node.texts.length < LIMITS.sectionTexts && /* @__PURE__ */ jsxs5(Button, { variant: "outline", size: "sm", onClick: () => onChange({ ...node, texts: [...node.texts, ""] }), children: [
        /* @__PURE__ */ jsx5(Plus, { className: "mr-1 h-3 w-3" }),
        " Add line"
      ] })
    ] }),
    /* @__PURE__ */ jsxs5("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx5(FieldLabel, { children: "Accessory" }),
      /* @__PURE__ */ jsx5(
        SegmentToggle,
        {
          options: [{ value: "button", label: "Button" }, { value: "thumbnail", label: "Thumbnail" }],
          value: node.accessory.kind,
          onChange: (kind) => onChange({ ...node, accessory: kind === "button" ? { kind: "button", button: makeButton("secondary") } : { kind: "thumbnail", url: "https://" } })
        }
      )
    ] }),
    node.accessory.kind === "button" ? /* @__PURE__ */ jsx5(ButtonEditor, { button: node.accessory.button, variables, onChange: (button) => onChange({ ...node, accessory: { kind: "button", button } }) }) : (() => {
      const thumb = node.accessory;
      return /* @__PURE__ */ jsxs5("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx5(ImageField, { label: "Thumbnail image", value: thumb.url, onUpload, onChange: (url) => onChange({ ...node, accessory: { ...thumb, url } }) }),
        /* @__PURE__ */ jsx5(TextField, { label: "Description (alt text)", value: thumb.description ?? "", onChange: (description) => onChange({ ...node, accessory: { ...thumb, description } }) })
      ] });
    })()
  ] });
}
function ActionRowBody({ node, onChange, variables }) {
  return /* @__PURE__ */ jsxs5("div", { className: "space-y-3", children: [
    node.buttons.map((b, i) => /* @__PURE__ */ jsxs5("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsxs5("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs5(FieldLabel, { children: [
          "Button ",
          i + 1
        ] }),
        node.buttons.length > 1 && /* @__PURE__ */ jsx5(Button, { variant: "ghost", size: "icon", className: "h-6 w-6", onClick: () => onChange({ ...node, buttons: node.buttons.filter((_, k) => k !== i) }), children: /* @__PURE__ */ jsx5(Trash22, { className: "h-3.5 w-3.5 text-red-400" }) })
      ] }),
      /* @__PURE__ */ jsx5(ButtonEditor, { button: b, variables, onChange: (nb) => onChange({ ...node, buttons: node.buttons.map((x, k) => k === i ? nb : x) }) })
    ] }, b.id)),
    node.buttons.length < LIMITS.actionRowButtons && /* @__PURE__ */ jsxs5(Button, { variant: "outline", size: "sm", onClick: () => onChange({ ...node, buttons: [...node.buttons, makeButton("primary")] }), children: [
      /* @__PURE__ */ jsx5(Plus, { className: "mr-1 h-3 w-3" }),
      " Add button"
    ] })
  ] });
}
function MediaGalleryBody({ node, onChange, onUpload }) {
  const setItem = (i, patch) => onChange({ ...node, items: node.items.map((it, k) => k === i ? { ...it, ...patch } : it) });
  return /* @__PURE__ */ jsxs5("div", { className: "space-y-3", children: [
    node.items.map((it, i) => /* @__PURE__ */ jsxs5("div", { className: "space-y-2 rounded-md border border-border/60 bg-muted/20 p-2", children: [
      /* @__PURE__ */ jsxs5("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs5(FieldLabel, { children: [
          "Image ",
          i + 1
        ] }),
        node.items.length > 1 && /* @__PURE__ */ jsx5(Button, { variant: "ghost", size: "icon", className: "h-6 w-6", onClick: () => onChange({ ...node, items: node.items.filter((_, k) => k !== i) }), children: /* @__PURE__ */ jsx5(Trash22, { className: "h-3.5 w-3.5 text-red-400" }) })
      ] }),
      /* @__PURE__ */ jsx5(ImageField, { label: "Image", value: it.url, onUpload, onChange: (url) => setItem(i, { url }) }),
      /* @__PURE__ */ jsx5(TextField, { label: "Description (optional)", value: it.description ?? "", onChange: (description) => setItem(i, { description }), max: 1024 }),
      /* @__PURE__ */ jsx5(SwitchRow, { label: "Spoiler", checked: !!it.spoiler, onChange: (spoiler) => setItem(i, { spoiler }) })
    ] }, it.id)),
    node.items.length < LIMITS.galleryItems && /* @__PURE__ */ jsxs5(Button, { variant: "outline", size: "sm", onClick: () => onChange({ ...node, items: [...node.items, { id: uid("img"), url: "https://" }] }), children: [
      /* @__PURE__ */ jsx5(Plus, { className: "mr-1 h-3 w-3" }),
      " Add image"
    ] })
  ] });
}
function FileBody({ node, onChange, onUploadFile }) {
  return /* @__PURE__ */ jsxs5("div", { className: "space-y-2", children: [
    /* @__PURE__ */ jsx5(FileField, { label: "File", value: node.url, onUpload: onUploadFile, onChange: (url) => onChange({ ...node, url }) }),
    /* @__PURE__ */ jsx5("p", { className: "text-[11px] text-muted-foreground", children: onUploadFile ? "Upload a file, or paste an attachment:// reference. Uploaded files are attached automatically when sent." : "Use a file attached when sending, for example attachment://image.png" }),
    /* @__PURE__ */ jsx5(SwitchRow, { label: "Spoiler", checked: !!node.spoiler, onChange: (spoiler) => onChange({ ...node, spoiler }) })
  ] });
}
function BlockBody({
  node,
  onChange,
  variables,
  onUpload,
  onUploadFile
}) {
  switch (node.type) {
    case "text":
      return /* @__PURE__ */ jsx5(TextBody, { node, onChange, variables });
    case "separator":
      return /* @__PURE__ */ jsx5(SeparatorBody, { node, onChange });
    case "section":
      return /* @__PURE__ */ jsx5(SectionBody, { node, onChange, variables, onUpload });
    case "action_row":
      return /* @__PURE__ */ jsx5(ActionRowBody, { node, onChange, variables });
    case "media_gallery":
      return /* @__PURE__ */ jsx5(MediaGalleryBody, { node, onChange, onUpload });
    case "file":
      return /* @__PURE__ */ jsx5(FileBody, { node, onChange, onUploadFile });
  }
}

// src/VariablePalette.tsx
import { useState as useState3 } from "react";
import { Check, Image as ImageIcon2, X as X2 } from "lucide-react";
import { jsx as jsx6, jsxs as jsxs6 } from "react/jsx-runtime";
function groupVariables(vars) {
  const order = [];
  const map = /* @__PURE__ */ new Map();
  for (const v of vars) {
    const g = v.group ?? "Variables";
    if (!map.has(g)) {
      map.set(g, []);
      order.push(g);
    }
    map.get(g).push(v);
  }
  return order.map((g) => [g, map.get(g)]);
}
var isImage = (name) => /avatar|icon|image/i.test(name);
function VariablePalette({ variables, hasTarget, onPick, onClose }) {
  const syntax = useSyntax();
  const [q, setQ] = useState3("");
  const [copied, setCopied] = useState3(null);
  const query = q.trim().toLowerCase();
  const filtered = query ? variables.filter((v) => v.name.toLowerCase().includes(query) || (v.description ?? "").toLowerCase().includes(query)) : variables;
  const pick = (v) => {
    const placeholder = wrapVariable(v.name, syntax);
    if (hasTarget) {
      onPick(placeholder);
      return;
    }
    navigator.clipboard?.writeText(placeholder).catch(() => {
    });
    setCopied(v.name);
    setTimeout(() => setCopied((c) => c === v.name ? null : c), 1200);
  };
  return /* @__PURE__ */ jsxs6("div", { className: "overflow-hidden rounded-lg border border-border/60 bg-card", children: [
    /* @__PURE__ */ jsxs6("div", { className: "flex items-center gap-2 border-b border-border/40 px-3 py-2", children: [
      /* @__PURE__ */ jsx6("span", { className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground", children: "Variables" }),
      /* @__PURE__ */ jsx6("span", { className: "text-[11px] text-muted-foreground/70", children: hasTarget ? "Click to insert" : "Click to copy" }),
      /* @__PURE__ */ jsx6("button", { type: "button", onClick: onClose, "aria-label": "Close", className: "ml-auto rounded p-1 text-muted-foreground hover:bg-muted/50 hover:text-foreground", children: /* @__PURE__ */ jsx6(X2, { className: "h-3.5 w-3.5" }) })
    ] }),
    /* @__PURE__ */ jsx6("div", { className: "px-3 pt-2", children: /* @__PURE__ */ jsx6(
      "input",
      {
        value: q,
        onChange: (e) => setQ(e.target.value),
        placeholder: "Search\u2026",
        className: "h-7 w-full rounded border border-border/60 bg-background px-2 text-xs outline-none placeholder:text-muted-foreground/60 focus:border-dbx-accent-500"
      }
    ) }),
    /* @__PURE__ */ jsxs6("div", { className: "max-h-[22rem] overflow-y-auto overscroll-contain px-1 py-2", children: [
      groupVariables(filtered).map(([group, items]) => /* @__PURE__ */ jsxs6("div", { className: "mb-2 last:mb-0", children: [
        /* @__PURE__ */ jsx6("div", { className: "px-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70", children: group }),
        items.map((v) => {
          const sample = String(v.sample ?? "").replace(/\n/g, " ");
          return /* @__PURE__ */ jsxs6(
            "button",
            {
              type: "button",
              onMouseDown: (e) => e.preventDefault(),
              onClick: () => pick(v),
              title: v.description,
              className: "group flex w-full items-baseline gap-3 rounded px-2 py-1.5 text-left transition-colors hover:bg-dbx-accent-500/10",
              children: [
                /* @__PURE__ */ jsxs6("span", { className: "flex shrink-0 items-center gap-1 font-mono text-[11px] text-dbx-accent-300", children: [
                  isImage(v.name) && /* @__PURE__ */ jsx6(ImageIcon2, { className: "h-3 w-3 text-muted-foreground" }),
                  wrapVariable(v.name, syntax)
                ] }),
                /* @__PURE__ */ jsx6("span", { className: "min-w-0 flex-1 truncate text-right text-[11px] text-muted-foreground group-hover:text-foreground", children: copied === v.name ? /* @__PURE__ */ jsxs6("span", { className: "inline-flex items-center gap-1 text-emerald-300", children: [
                  /* @__PURE__ */ jsx6(Check, { className: "h-3 w-3" }),
                  " Copied"
                ] }) : isImage(v.name) ? "image" : sample || "empty" })
              ]
            },
            v.name
          );
        })
      ] }, group)),
      filtered.length === 0 && /* @__PURE__ */ jsx6("p", { className: "px-2 py-3 text-xs text-muted-foreground", children: "No matching variables." })
    ] })
  ] });
}

// src/BlockCard.tsx
import { useRef as useRef2 } from "react";
import { ArrowDown, ArrowUp, ChevronDown, GripVertical, Trash2 as Trash23 } from "lucide-react";
import { Fragment as Fragment4, jsx as jsx7, jsxs as jsxs7 } from "react/jsx-runtime";
function BlockCard({
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
  headerExtra
}) {
  const cardRef = useRef2(null);
  const dragEnabled = !!drag && !compact;
  const iconBtn = compact ? "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded" : "inline-flex shrink-0 items-center justify-center rounded p-1";
  return /* @__PURE__ */ jsxs7(
    "div",
    {
      ref: cardRef,
      onDragOver: dragEnabled ? (e) => drag.onDragOver(e) : void 0,
      onDrop: dragEnabled ? (e) => drag.onDrop(e) : void 0,
      className: `group/row relative transition-opacity ${drag?.dragging ? "opacity-40" : ""} ${collapsed ? "" : "bg-white/[0.02]"}`,
      children: [
        /* @__PURE__ */ jsx7(
          "span",
          {
            "aria-hidden": true,
            className: `pointer-events-none absolute inset-y-0 left-0 w-0.5 transition-colors ${accentBorder ? "" : "bg-border/60 group-hover/row:bg-dbx-accent-500"}`,
            style: accentBorder ? { background: accentBorder } : void 0
          }
        ),
        drag?.overPos === "before" && /* @__PURE__ */ jsx7("div", { className: "pointer-events-none absolute -top-px left-3 right-3 z-10 h-0.5 rounded bg-dbx-accent-400" }),
        drag?.overPos === "after" && /* @__PURE__ */ jsx7("div", { className: "pointer-events-none absolute -bottom-px left-3 right-3 z-10 h-0.5 rounded bg-dbx-accent-400" }),
        /* @__PURE__ */ jsxs7("div", { className: `flex items-center pl-2 pr-1.5 ${compact ? "gap-0.5 py-1" : "gap-1.5 py-1.5"}`, children: [
          dragEnabled && /* @__PURE__ */ jsx7(
            "button",
            {
              type: "button",
              draggable: true,
              onDragStart: (e) => drag.onDragStart(e, cardRef.current),
              onDragEnd: () => drag.onDragEnd(),
              title: "Drag to reorder",
              className: "cursor-grab text-muted-foreground/40 transition-colors group-hover/row:text-muted-foreground hover:!text-foreground active:cursor-grabbing",
              children: /* @__PURE__ */ jsx7(GripVertical, { className: "h-4 w-4" })
            }
          ),
          compact && move && /* @__PURE__ */ jsxs7(Fragment4, { children: [
            /* @__PURE__ */ jsx7("button", { type: "button", onClick: move.up, disabled: !move.canUp, title: "Move up", "aria-label": "Move up", className: `${iconBtn} text-muted-foreground hover:text-foreground disabled:opacity-25`, children: /* @__PURE__ */ jsx7(ArrowUp, { className: "h-4 w-4" }) }),
            /* @__PURE__ */ jsx7("button", { type: "button", onClick: move.down, disabled: !move.canDown, title: "Move down", "aria-label": "Move down", className: `${iconBtn} text-muted-foreground hover:text-foreground disabled:opacity-25`, children: /* @__PURE__ */ jsx7(ArrowDown, { className: "h-4 w-4" }) })
          ] }),
          /* @__PURE__ */ jsxs7(
            "button",
            {
              type: "button",
              onClick: onToggle,
              className: "flex min-w-0 flex-1 items-center gap-2 py-1 text-left",
              "aria-label": collapsed ? "Expand" : "Collapse",
              children: [
                /* @__PURE__ */ jsx7(ChevronDown, { className: `h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${collapsed ? "-rotate-90" : ""}` }),
                /* @__PURE__ */ jsx7(Icon, { className: "h-4 w-4 shrink-0 text-dbx-accent-400" }),
                /* @__PURE__ */ jsx7("span", { className: "truncate text-sm font-medium", children: title }),
                accentDot && /* @__PURE__ */ jsx7("span", { className: "h-2.5 w-2.5 shrink-0 rounded-full", style: { background: accentDot } }),
                summary && collapsed && /* @__PURE__ */ jsx7("span", { className: "truncate text-xs text-muted-foreground", children: summary })
              ]
            }
          ),
          /* @__PURE__ */ jsxs7("span", { className: `flex shrink-0 items-center ${compact ? "gap-0.5" : "gap-1 opacity-0 transition-opacity group-hover/row:opacity-100 focus-within:opacity-100"}`, children: [
            headerExtra,
            /* @__PURE__ */ jsx7(
              "button",
              {
                type: "button",
                onClick: onDelete,
                title: "Delete",
                "aria-label": "Delete",
                className: `${iconBtn} text-muted-foreground hover:bg-red-500/10 hover:text-red-400`,
                children: /* @__PURE__ */ jsx7(Trash23, { className: "h-4 w-4" })
              }
            )
          ] })
        ] }),
        !collapsed && children && /* @__PURE__ */ jsx7("div", { className: `pb-3 ${compact ? "pl-3 pr-2" : "px-3 pl-9"}`, children })
      ]
    }
  );
}

// src/AddComponent.tsx
import { Box, Image as ImageIcon3, LayoutPanelTop, Minus, MousePointerClick, Paperclip as Paperclip2, Plus as Plus2, Type } from "lucide-react";
import { jsx as jsx8, jsxs as jsxs8 } from "react/jsx-runtime";
var BLOCK_ICONS = {
  container: Box,
  text: Type,
  section: LayoutPanelTop,
  separator: Minus,
  media_gallery: ImageIcon3,
  file: Paperclip2,
  action_row: MousePointerClick
};
function AddComponentCards({ kinds, onAdd }) {
  return /* @__PURE__ */ jsxs8("div", { className: "flex flex-wrap items-center gap-1.5", children: [
    /* @__PURE__ */ jsxs8("span", { className: "mr-1 flex items-center text-xs text-muted-foreground", children: [
      /* @__PURE__ */ jsx8(Plus2, { className: "mr-1 h-3.5 w-3.5" }),
      " Add"
    ] }),
    kinds.map((k) => {
      const Icon = BLOCK_ICONS[k];
      return /* @__PURE__ */ jsxs8(
        "button",
        {
          type: "button",
          onClick: () => onAdd(k),
          title: BLOCK_DESCRIPTIONS[k],
          className: "flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-dbx-accent-500/60 hover:bg-dbx-accent-500/10 hover:text-foreground",
          children: [
            /* @__PURE__ */ jsx8(Icon, { className: "h-3.5 w-3.5 text-dbx-accent-400" }),
            BLOCK_LABELS[k]
          ]
        },
        k
      );
    })
  ] });
}
function AddComponentBar({ kinds, onAdd }) {
  return /* @__PURE__ */ jsxs8("div", { className: "flex flex-wrap gap-1.5", children: [
    kinds.map((k) => {
      const Icon = BLOCK_ICONS[k];
      return /* @__PURE__ */ jsxs8(
        "button",
        {
          type: "button",
          onClick: () => onAdd(k),
          className: "flex items-center gap-1.5 rounded-md border border-border/60 bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-dbx-accent-500/60 hover:text-foreground",
          children: [
            /* @__PURE__ */ jsx8(Icon, { className: "h-3.5 w-3.5" }),
            BLOCK_LABELS[k]
          ]
        },
        k
      );
    }),
    /* @__PURE__ */ jsxs8("span", { className: "flex items-center text-[11px] text-muted-foreground/60", children: [
      /* @__PURE__ */ jsx8(Plus2, { className: "mr-0.5 h-3 w-3" }),
      " Add inside"
    ] })
  ] });
}

// src/DiscordPreview.tsx
import { createContext as createContext2, useContext as useContext2 } from "react";
import { ExternalLink } from "lucide-react";

// src/markdown.tsx
import React from "react";
import { jsx as jsx9, jsxs as jsxs9 } from "react/jsx-runtime";
function variablesToMap(vars, syntax = PERCENT_PLACEHOLDERS) {
  const map = {};
  for (const v of vars ?? []) {
    const sample = v.sample ?? wrapVariable(v.name, syntax);
    map[v.name] = sample;
    const snake = v.name.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
    if (snake !== v.name && !(snake in map)) map[snake] = sample;
  }
  return map;
}
function previewVars(vars, syntax = PERCENT_PLACEHOLDERS) {
  return { values: variablesToMap(vars, syntax), syntax };
}
var MENTION_CLS = "bg-[#3e4374] font-medium text-[#dee0fc] hover:bg-[#5865f2]";
function pill(key, label, cls) {
  return /* @__PURE__ */ jsx9("span", { className: `rounded px-1 ${cls}`, children: label }, key);
}
var MATCHERS = [
  // ``…`` before `…`: Discord's double-backtick inline code (may contain single backticks).
  { re: /``(.+?)``/, build: (m, k) => /* @__PURE__ */ jsx9("code", { className: "rounded bg-black/40 px-1 py-0.5 font-mono text-[0.85em]", children: m[1] }, k) },
  { re: /`([^`]+)`/, build: (m, k) => /* @__PURE__ */ jsx9("code", { className: "rounded bg-black/40 px-1 py-0.5 font-mono text-[0.85em]", children: m[1] }, k) },
  // ***…*** before **…**: otherwise the bold matcher eats two of the three
  // stars and the third shows up as a stray character.
  { re: /\*\*\*([\s\S]+?)\*\*\*/, build: (m, k, v, mn) => /* @__PURE__ */ jsx9("strong", { children: /* @__PURE__ */ jsx9("em", { children: renderInline(m[1], v, k, mn) }) }, k) },
  { re: /\*\*([\s\S]+?)\*\*/, build: (m, k, v, mn) => /* @__PURE__ */ jsx9("strong", { children: renderInline(m[1], v, k, mn) }, k) },
  { re: /__([\s\S]+?)__/, build: (m, k, v, mn) => /* @__PURE__ */ jsx9("u", { children: renderInline(m[1], v, k, mn) }, k) },
  { re: /~~([\s\S]+?)~~/, build: (m, k, v, mn) => /* @__PURE__ */ jsx9("s", { children: renderInline(m[1], v, k, mn) }, k) },
  { re: /\*([\s\S]+?)\*/, build: (m, k, v, mn) => /* @__PURE__ */ jsx9("em", { children: renderInline(m[1], v, k, mn) }, k) },
  { re: /_([\s\S]+?)_/, build: (m, k, v, mn) => /* @__PURE__ */ jsx9("em", { children: renderInline(m[1], v, k, mn) }, k) },
  {
    re: /\[([^\]]+)\]\(([^)]+)\)/,
    // Discord links to http(s) only; anything else (javascript:, data:) is
    // shown as the text it is, never handed to the browser as a link
    build: (m, k, v, mn) => /^https?:\/\//i.test(m[2].trim()) ? /* @__PURE__ */ jsx9("a", { href: m[2].trim(), target: "_blank", rel: "noreferrer", className: "text-[#00a8fc] hover:underline", children: renderInline(m[1], v, k, mn) }, k) : /* @__PURE__ */ jsx9("span", { children: renderInline(m[1], v, k, mn) }, k)
  },
  { re: /<t:(\d+)(?::([tTdDfFR]))?>/, build: (m, k) => pill(k, formatTimestamp(m[1], m[2]), "bg-[#414675] text-[#dee0fc]") },
  { re: /@(everyone|here)/, build: (m, k) => pill(k, `@${m[1]}`, MENTION_CLS) },
  { re: /<@&(\d+)>/, build: (m, k, _v, mn) => pill(k, `@${mn?.roles?.[m[1]] ?? "role"}`, MENTION_CLS) },
  { re: /<#(\d+)>/, build: (m, k, _v, mn) => pill(k, `#${mn?.channels?.[m[1]] ?? "channel"}`, MENTION_CLS) },
  { re: /<@!?(\d+)>/, build: (m, k, _v, mn) => pill(k, `@${mn?.users?.[m[1]] ?? "user"}`, MENTION_CLS) },
  // Flag emoji are two regional indicator letters. Discord draws them with
  // its own emoji set; Windows browsers have no flag glyphs and show "DE"
  // instead, so the preview uses the same Twemoji images Discord ships.
  {
    re: /([\u{1F1E6}-\u{1F1FF}])([\u{1F1E6}-\u{1F1FF}])/u,
    build: (m, k) => {
      const cp = (s) => s.codePointAt(0).toString(16);
      return /* @__PURE__ */ jsx9(
        "img",
        {
          src: `https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg/${cp(m[1])}-${cp(m[2])}.svg`,
          alt: m[0],
          className: "inline h-[1.2em] w-[1.2em] align-text-bottom"
        },
        k
      );
    }
  },
  {
    re: /<(a?):(\w+):(\d+)>/,
    build: (m, k) => /* @__PURE__ */ jsx9(
      "img",
      {
        src: `https://cdn.discordapp.com/emojis/${m[3]}.${m[1] === "a" ? "gif" : "png"}`,
        alt: `:${m[2]}:`,
        className: "inline h-5 w-5 align-text-bottom"
      },
      k
    )
  },
  {
    re: /(?!)/,
    // replaced per syntax in matchersFor()
    build: (m, k, v, mn) => {
      if (!(m[1] in v.values)) return pill(k, wrapVariable(m[1], v.syntax), "bg-amber-500/20 text-amber-300");
      const lines = String(v.values[m[1]]).split("\n");
      return /* @__PURE__ */ jsx9("span", { title: wrapVariable(m[1], v.syntax), className: "rounded bg-dbx-accent-500/20 px-0.5", children: lines.map((ln, i) => /* @__PURE__ */ jsxs9(React.Fragment, { children: [
        i > 0 && /* @__PURE__ */ jsx9("br", {}),
        renderInline(ln, v, `${k}_${i}`, mn)
      ] }, i)) }, k);
    }
  }
];
var matcherCache = /* @__PURE__ */ new Map();
function matchersFor(syntax) {
  const key = `${syntax.open}|${syntax.close}`;
  let list = matcherCache.get(key);
  if (!list) {
    list = MATCHERS.map((m, i) => i === MATCHERS.length - 1 ? { ...m, re: variablePattern(syntax) } : m);
    matcherCache.set(key, list);
  }
  return list;
}
function formatTimestamp(unix, style) {
  const ms = parseInt(unix, 10) * 1e3;
  if (!Number.isFinite(ms)) return "<timestamp>";
  const d = new Date(ms);
  if (style === "R") {
    const diff = ms - Date.now();
    const abs = Math.abs(diff);
    const units = [
      [864e5, "day"],
      [36e5, "hour"],
      [6e4, "minute"],
      [1e3, "second"]
    ];
    for (const [unitMs, name] of units) {
      if (abs >= unitMs) {
        const n = Math.round(abs / unitMs);
        return diff >= 0 ? `in ${n} ${name}${n !== 1 ? "s" : ""}` : `${n} ${name}${n !== 1 ? "s" : ""} ago`;
      }
    }
    return "just now";
  }
  if (style === "t" || style === "T") return d.toLocaleTimeString();
  if (style === "d" || style === "D") return d.toLocaleDateString();
  return d.toLocaleString();
}
function renderInline(text, vars, keyPrefix = "i", mentions) {
  const out = [];
  let rest = text;
  let idx = 0;
  let guard = 0;
  while (rest.length > 0 && guard < 5e3) {
    guard += 1;
    let best = null;
    for (const matcher of matchersFor(vars.syntax)) {
      const m = matcher.re.exec(rest);
      if (m && (best === null || m.index < best.at)) best = { at: m.index, m, matcher };
    }
    if (!best) {
      out.push(/* @__PURE__ */ jsx9(React.Fragment, { children: rest }, `${keyPrefix}_t${idx}`));
      break;
    }
    if (best.at > 0) {
      out.push(/* @__PURE__ */ jsx9(React.Fragment, { children: rest.slice(0, best.at) }, `${keyPrefix}_t${idx}`));
      idx += 1;
    }
    out.push(best.matcher.build(best.m, `${keyPrefix}_m${idx}`, vars, mentions));
    idx += 1;
    rest = rest.slice(best.at + best.m[0].length);
  }
  return out;
}
function renderTextSegment(seg, keyPrefix, vars, mentions, blocks) {
  const lines = seg.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^\s*[-*]\s+/.test(line) && !/^-#\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i]) && !/^-#\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i += 1;
      }
      blocks.push(
        /* @__PURE__ */ jsx9("ul", { className: "my-0.5 list-disc pl-5", children: items.map((it, k) => /* @__PURE__ */ jsx9("li", { children: renderInline(it, vars, `${keyPrefix}li${i}_${k}`, mentions) }, k)) }, `${keyPrefix}b${i}`)
      );
      continue;
    }
    blocks.push(/* @__PURE__ */ jsx9(LineBlock, { line, vars, mentions }, `${keyPrefix}b${i}`));
    i += 1;
  }
}
function Markdown({ text, vars, mentions }) {
  const blocks = [];
  const segments = (text ?? "").split("```");
  segments.forEach((seg, si) => {
    if (si % 2 === 1) {
      let body = seg;
      const nl = body.indexOf("\n");
      if (nl !== -1 && /^[a-zA-Z0-9+_.#-]*$/.test(body.slice(0, nl))) body = body.slice(nl + 1);
      body = body.replace(/\n$/, "");
      blocks.push(
        /* @__PURE__ */ jsx9("pre", { className: "my-1 overflow-x-auto rounded bg-black/40 p-2 font-mono text-[0.8em]", children: body }, `s${si}`)
      );
      return;
    }
    let textSeg = seg;
    if (si > 0) textSeg = textSeg.replace(/^\n/, "");
    if (si < segments.length - 1) textSeg = textSeg.replace(/\n$/, "");
    if (textSeg === "") return;
    renderTextSegment(textSeg, `s${si}`, vars, mentions, blocks);
  });
  return /* @__PURE__ */ jsx9("div", { className: "leading-[1.375]", children: blocks });
}
function LineBlock({ line, vars, mentions }) {
  if (line.trim() === "") return /* @__PURE__ */ jsx9("div", { className: "h-2" });
  if (line.startsWith("-# "))
    return /* @__PURE__ */ jsx9("div", { className: "text-[0.8em] text-[#949ba4]", children: renderInline(line.slice(3), vars, "i", mentions) });
  if (line.startsWith("### "))
    return /* @__PURE__ */ jsx9("div", { className: "mt-1 text-[1em] font-bold", children: renderInline(line.slice(4), vars, "i", mentions) });
  if (line.startsWith("## "))
    return /* @__PURE__ */ jsx9("div", { className: "mt-1 text-[1.15em] font-bold", children: renderInline(line.slice(3), vars, "i", mentions) });
  if (line.startsWith("# "))
    return /* @__PURE__ */ jsx9("div", { className: "mt-1 text-[1.35em] font-bold", children: renderInline(line.slice(2), vars, "i", mentions) });
  if (line.startsWith("> "))
    return /* @__PURE__ */ jsx9("div", { className: "border-l-2 border-[#4e5058] pl-2 text-[#dbdee1]", children: renderInline(line.slice(2), vars, "i", mentions) });
  return /* @__PURE__ */ jsx9("div", { children: renderInline(line, vars, "i", mentions) });
}

// src/DiscordPreview.tsx
import { Fragment as Fragment5, jsx as jsx10, jsxs as jsxs10 } from "react/jsx-runtime";
var MentionsCtx = createContext2(void 0);
var BTN_CLASS = {
  primary: "bg-[#5865f2] text-white",
  secondary: "bg-[#4e5058] text-white",
  success: "bg-[#248046] text-white",
  danger: "bg-[#da373c] text-white",
  link: "bg-[#4e5058] text-white"
};
function hex(color) {
  if (color == null) return void 0;
  return `#${color.toString(16).padStart(6, "0")}`;
}
function ButtonEmoji({ emoji }) {
  const m = emoji.match(/^<(a?):(\w+):(\d+)>$/);
  if (m) return /* @__PURE__ */ jsx10("img", { src: `https://cdn.discordapp.com/emojis/${m[3]}.${m[1] === "a" ? "gif" : "png"}`, alt: "", className: "h-4 w-4" });
  return /* @__PURE__ */ jsx10("span", { children: emoji });
}
function PreviewButton({ b }) {
  const cls = `inline-flex items-center gap-1 rounded-[3px] px-3 py-1.5 text-sm font-medium ${BTN_CLASS[b.style]} ${b.disabled ? "opacity-50" : ""}`;
  const inner = /* @__PURE__ */ jsxs10(Fragment5, { children: [
    b.emoji && /* @__PURE__ */ jsx10(ButtonEmoji, { emoji: b.emoji }),
    b.label,
    b.style === "link" && /* @__PURE__ */ jsx10(ExternalLink, { className: "h-3 w-3 opacity-70" })
  ] });
  if (b.style === "link" && b.url && /^https?:\/\//.test(b.url) && !b.disabled) {
    return /* @__PURE__ */ jsx10("a", { href: b.url, target: "_blank", rel: "noreferrer", className: cls, children: inner });
  }
  return /* @__PURE__ */ jsx10("span", { className: cls, children: inner });
}
function resolveUrl(url, vars) {
  return (url ?? "").replace(variablePattern(vars.syntax, "g"), (m, name) => vars.values[name] != null ? String(vars.values[name]) : m);
}
function Accessory({ a, vars }) {
  if (a.kind === "button") return /* @__PURE__ */ jsx10(PreviewButton, { b: a.button });
  const url = resolveUrl(a.url, vars);
  return url && /^https?:\/\//.test(url) ? /* @__PURE__ */ jsx10("img", { src: url, alt: a.description ?? "", className: "h-16 w-16 rounded object-cover" }) : /* @__PURE__ */ jsx10("div", { className: "flex h-16 w-16 items-center justify-center rounded bg-black/30 text-[10px] text-muted-foreground", children: "thumb" });
}
function ImageTile({ url: raw, label, vars }) {
  const url = resolveUrl(raw, vars);
  return url && /^https?:\/\//.test(url) ? /* @__PURE__ */ jsx10("img", { src: url, alt: label ?? "", className: "max-h-48 rounded object-cover" }) : /* @__PURE__ */ jsx10("div", { className: "flex h-24 items-center justify-center rounded bg-black/30 text-xs text-muted-foreground", children: label || "image" });
}
function Child({ node, vars }) {
  const mentions = useContext2(MentionsCtx);
  switch (node.type) {
    case "text":
      return /* @__PURE__ */ jsx10("div", { className: "text-sm text-[#dbdee1]", children: /* @__PURE__ */ jsx10(Markdown, { text: node.content, vars, mentions }) });
    case "separator":
      return node.divider ? /* @__PURE__ */ jsx10("hr", { className: `border-white/10 ${node.spacing === "large" ? "my-3" : "my-1.5"}` }) : /* @__PURE__ */ jsx10("div", { className: node.spacing === "large" ? "h-3" : "h-1.5" });
    case "section":
      return /* @__PURE__ */ jsxs10("div", { className: "flex items-start justify-between gap-3", children: [
        /* @__PURE__ */ jsx10("div", { className: "min-w-0 flex-1 break-words text-sm text-[#dbdee1]", children: node.texts.map((t, i) => /* @__PURE__ */ jsx10(Markdown, { text: t, vars, mentions }, i)) }),
        /* @__PURE__ */ jsx10("div", { className: "shrink-0", children: /* @__PURE__ */ jsx10(Accessory, { a: node.accessory, vars }) })
      ] });
    case "media_gallery":
      return /* @__PURE__ */ jsx10("div", { className: "flex flex-wrap gap-1.5", children: node.items.map((it) => /* @__PURE__ */ jsx10(ImageTile, { url: it.url, label: it.description, vars }, it.id)) });
    case "file":
      return /* @__PURE__ */ jsxs10("div", { className: "rounded border border-white/10 bg-black/20 px-3 py-2 text-xs text-[#dbdee1]", children: [
        "\u{1F4CE} ",
        node.url.replace(/^attachment:\/\//, ""),
        node.spoiler && /* @__PURE__ */ jsx10("span", { className: "ml-1 text-muted-foreground", children: "(spoiler)" })
      ] });
    case "action_row":
      return /* @__PURE__ */ jsx10("div", { className: "flex flex-wrap gap-2", children: node.buttons.map((b) => /* @__PURE__ */ jsx10(PreviewButton, { b }, b.id)) });
  }
}
function Root({ node, vars, footnote }) {
  if (node.type === "container") {
    const color = hex(node.accentColor);
    return /* @__PURE__ */ jsxs10(
      "div",
      {
        className: "space-y-2 rounded-[4px] bg-[#2b2d31] p-3",
        style: color ? { borderLeft: `4px solid ${color}` } : void 0,
        children: [
          node.children.map((c) => /* @__PURE__ */ jsx10(Child, { node: c, vars }, c.id)),
          footnote && /* @__PURE__ */ jsxs10(Fragment5, { children: [
            /* @__PURE__ */ jsx10("div", { className: "h-px bg-[#3f4147]" }),
            /* @__PURE__ */ jsx10("div", { className: "text-xs text-[#949ba4]", children: renderInline(footnote.replace(/^-# /, ""), vars, "fn") })
          ] })
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxs10(Fragment5, { children: [
    /* @__PURE__ */ jsx10(Child, { node, vars }),
    footnote && /* @__PURE__ */ jsx10("div", { className: "text-xs text-[#949ba4]", children: renderInline(footnote.replace(/^-# /, ""), vars, "fn") })
  ] });
}
function MessageComponents({ model, variables, mentions, syntax = PERCENT_PLACEHOLDERS }) {
  const vars = previewVars(variables, syntax);
  return /* @__PURE__ */ jsx10(MentionsCtx.Provider, { value: mentions, children: /* @__PURE__ */ jsx10("div", { className: "space-y-2", children: model.components.map((node) => /* @__PURE__ */ jsx10(Root, { node, vars }, node.id)) }) });
}
function DiscordPreview({
  model,
  variables,
  mentions,
  botName,
  botAvatar,
  watermark,
  syntax = PERCENT_PLACEHOLDERS,
  className = ""
}) {
  const vars = previewVars(variables, syntax);
  return /* @__PURE__ */ jsx10(MentionsCtx.Provider, { value: mentions, children: /* @__PURE__ */ jsx10("div", { className: `rounded-lg bg-[#313338] p-4 ${className}`, children: /* @__PURE__ */ jsxs10("div", { className: "flex gap-3", children: [
    botAvatar ? /* @__PURE__ */ jsx10("img", { src: botAvatar, alt: "", className: "h-10 w-10 shrink-0 rounded-full object-cover" }) : /* @__PURE__ */ jsx10("div", { className: "h-10 w-10 shrink-0 rounded-full bg-[#5865f2]" }),
    /* @__PURE__ */ jsxs10("div", { className: "min-w-0 flex-1", children: [
      /* @__PURE__ */ jsxs10("div", { className: "mb-1 flex items-center gap-2", children: [
        /* @__PURE__ */ jsx10("span", { className: "text-sm font-medium text-white", children: botName ?? "\u2026" }),
        /* @__PURE__ */ jsx10("span", { className: "rounded bg-[#5865f2] px-1 text-[10px] font-semibold text-white", children: "APP" }),
        /* @__PURE__ */ jsx10("span", { className: "text-xs text-muted-foreground", children: "Today" })
      ] }),
      /* @__PURE__ */ jsxs10("div", { className: "space-y-2", children: [
        model.components.length === 0 ? /* @__PURE__ */ jsx10("div", { className: "text-sm text-muted-foreground", children: "Empty message" }) : model.components.map((node, i) => /* @__PURE__ */ jsx10(
          Root,
          {
            node,
            vars,
            footnote: watermark && i === model.components.length - 1 ? watermark : null
          },
          node.id
        )),
        watermark && model.components.length === 0 && /* @__PURE__ */ jsx10("div", { className: "text-xs text-[#949ba4]", children: watermark })
      ] })
    ] })
  ] }) }) });
}

// src/useCompact.ts
import { useEffect as useEffect4, useState as useState4 } from "react";
function useMediaQuery(query) {
  const [matches, setMatches] = useState4(
    () => typeof window === "undefined" ? false : window.matchMedia(query).matches
  );
  useEffect4(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}
function useIsCompact() {
  return useMediaQuery("(max-width: 1023px)");
}

// src/DiscordMessageBuilder.tsx
import { jsx as jsx11, jsxs as jsxs11 } from "react/jsx-runtime";
var ROOT_ZONE = "root";
function summarize(node) {
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
function reorderList(list, fromId, toId, pos) {
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
function DiscordMessageBuilder({ value, onChange, variables, syntax = PERCENT_PLACEHOLDERS, sampleOverrides, onUploadImage, onUploadFile, botName, botAvatar, watermark, integrations, className = "" }) {
  const [collapsed, setCollapsed] = useState5(/* @__PURE__ */ new Set());
  const [drag, setDrag] = useState5(null);
  const [over, setOver] = useState5(null);
  const compact = useIsCompact();
  const [pane, setPane] = useState5("editor");
  const [paletteOpen, setPaletteOpen] = useState5(false);
  const paletteTarget = useRef3(null);
  const [hasTarget, setHasTarget] = useState5(false);
  const paletteApi = useMemo(() => ({
    open: (insert) => {
      paletteTarget.current = insert;
      setHasTarget(true);
      setPaletteOpen(true);
    },
    aim: (insert) => {
      paletteTarget.current = insert;
      setHasTarget(true);
    }
  }), []);
  const allVariables = useMemo(
    () => applyVariableSamples(
      mergeVariables(variables).map((v) => ({ ...v, group: v.group ?? "This message" })),
      sampleOverrides
    ),
    [variables, sampleOverrides]
  );
  const previewMentions = useMemo(
    () => ({ channels: Object.fromEntries((integrations?.channels ?? []).map((c) => [c.id, c.name])) }),
    [integrations?.channels]
  );
  const set = (components) => onChange({ components });
  const toggle = (id) => setCollapsed((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
  function updateNode(id, next) {
    set(
      value.components.map((node) => {
        if (node.id === id) return next;
        if (node.type === "container") return { ...node, children: node.children.map((c) => c.id === id ? next : c) };
        return node;
      })
    );
  }
  function deleteNode(id) {
    set(
      value.components.filter((n) => n.id !== id).map((n) => n.type === "container" ? { ...n, children: n.children.filter((c) => c.id !== id) } : n)
    );
  }
  function addRoot(kind) {
    const block = makeBlock(kind);
    set([...value.components, block]);
  }
  function addChild(containerId, kind) {
    const child = makeChildBlock(kind);
    set(value.components.map((n) => n.id === containerId && n.type === "container" ? { ...n, children: [...n.children, child] } : n));
  }
  function reorder(zone, fromId, toId, pos) {
    if (zone === ROOT_ZONE) set(reorderList(value.components, fromId, toId, pos));
    else set(value.components.map((n) => n.id === zone && n.type === "container" ? { ...n, children: reorderList(n.children, fromId, toId, pos) } : n));
  }
  function siblingsOf(zone) {
    if (zone === ROOT_ZONE) return value.components;
    const container = value.components.find((n) => n.id === zone && n.type === "container");
    return container?.type === "container" ? container.children : [];
  }
  function moveNode(zone, id, dir) {
    const shift = (list) => {
      const from = list.findIndex((x) => x.id === id);
      const to = from + dir;
      if (from < 0 || to < 0 || to >= list.length) return list;
      const copy = [...list];
      [copy[from], copy[to]] = [copy[to], copy[from]];
      return copy;
    };
    if (zone === ROOT_ZONE) set(shift(value.components));
    else set(value.components.map((n) => n.id === zone && n.type === "container" ? { ...n, children: shift(n.children) } : n));
  }
  function movePropsFor(zone, id) {
    const list = siblingsOf(zone);
    const i = list.findIndex((x) => x.id === id);
    return {
      canUp: i > 0,
      canDown: i >= 0 && i < list.length - 1,
      up: () => moveNode(zone, id, -1),
      down: () => moveNode(zone, id, 1)
    };
  }
  function dragPropsFor(zone, id) {
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
        const pos = e.clientY - rect.top < rect.height / 2 ? "before" : "after";
        setOver((prev) => prev && prev.zone === zone && prev.id === id && prev.pos === pos ? prev : { zone, id, pos });
      },
      onDrop: (e) => {
        e.preventDefault();
        if (active && over && over.zone === zone && over.id === id) reorder(zone, drag.id, id, over.pos);
        setDrag(null);
        setOver(null);
      },
      onDragEnd: () => {
        setDrag(null);
        setOver(null);
      }
    };
  }
  function renderBlock(node, zone) {
    const isCollapsed = collapsed.has(node.id);
    const Icon = BLOCK_ICONS[node.type];
    if (node.type === "container") {
      const container = node;
      const accent = hexOf(container.accentColor);
      return /* @__PURE__ */ jsx11(
        BlockCard,
        {
          icon: Icon,
          title: BLOCK_LABELS.container,
          summary: summarize(node),
          accentDot: accent,
          accentBorder: accent,
          collapsed: isCollapsed,
          onToggle: () => toggle(node.id),
          onDelete: () => deleteNode(node.id),
          drag: dragPropsFor(zone, node.id),
          move: movePropsFor(zone, node.id),
          compact,
          children: /* @__PURE__ */ jsxs11("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsx11(ContainerProps, { node: container, onChange: (n) => updateNode(node.id, n) }),
            /* @__PURE__ */ jsxs11("div", { className: "divide-y divide-border/40 rounded-md border border-border/50", children: [
              container.children.length === 0 ? /* @__PURE__ */ jsx11("p", { className: "px-3 py-2 text-xs text-muted-foreground", children: "Empty container. Add a block below." }) : container.children.map((child) => renderBlock(child, container.id)),
              /* @__PURE__ */ jsx11("div", { className: "px-3 py-2", children: /* @__PURE__ */ jsx11(AddComponentBar, { kinds: CHILD_BLOCK_KINDS, onAdd: (k) => addChild(container.id, k) }) })
            ] })
          ] })
        },
        node.id
      );
    }
    return /* @__PURE__ */ jsx11(
      BlockCard,
      {
        icon: Icon,
        title: BLOCK_LABELS[node.type],
        summary: summarize(node),
        collapsed: isCollapsed,
        onToggle: () => toggle(node.id),
        onDelete: () => deleteNode(node.id),
        drag: dragPropsFor(zone, node.id),
        move: movePropsFor(zone, node.id),
        compact,
        children: /* @__PURE__ */ jsx11(BlockBody, { node, onChange: (n) => updateNode(node.id, n), variables: allVariables, onUpload: onUploadImage, onUploadFile })
      },
      node.id
    );
  }
  const issues = validate(value);
  const errors = issues.filter((i) => i.level === "error");
  const warnings = issues.filter((i) => i.level === "warning");
  const total = countComponents(value.components);
  const showEditor = !compact || pane === "editor";
  const showPreview = !compact || pane === "preview";
  return /* @__PURE__ */ jsx11(BuilderContext.Provider, { value: integrations ?? {}, children: /* @__PURE__ */ jsx11(SyntaxContext.Provider, { value: syntax, children: /* @__PURE__ */ jsx11(PaletteContext.Provider, { value: paletteApi, children: /* @__PURE__ */ jsxs11("div", { className, children: [
    compact && /* @__PURE__ */ jsx11("div", { className: "mb-3 flex rounded-lg border border-border/60 bg-card p-1 text-sm", children: ["editor", "preview"].map((id) => /* @__PURE__ */ jsxs11(
      "button",
      {
        type: "button",
        onClick: () => setPane(id),
        "aria-pressed": pane === id,
        className: `flex-1 rounded-md py-2 font-medium capitalize transition-colors ${pane === id ? "bg-dbx-accent-600 text-white" : "text-muted-foreground hover:text-foreground"}`,
        children: [
          id,
          id === "preview" && errors.length > 0 && /* @__PURE__ */ jsx11("span", { className: `ml-1.5 rounded px-1.5 py-0.5 text-[11px] ${pane === id ? "bg-white/20" : "bg-red-500/15 text-red-400"}`, children: errors.length })
        ]
      },
      id
    )) }),
    /* @__PURE__ */ jsxs11("div", { className: "grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]", children: [
      /* @__PURE__ */ jsxs11("div", { className: showEditor ? "space-y-3" : "hidden", children: [
        compact && paletteOpen && /* @__PURE__ */ jsx11(
          VariablePalette,
          {
            variables: allVariables,
            hasTarget,
            onPick: (t) => paletteTarget.current?.(t),
            onClose: () => setPaletteOpen(false)
          }
        ),
        /* @__PURE__ */ jsxs11("div", { className: "divide-y divide-border/40 overflow-hidden rounded-lg border border-border/60 bg-card", children: [
          value.components.map((node) => renderBlock(node, ROOT_ZONE)),
          value.components.length === 0 && /* @__PURE__ */ jsx11("p", { className: "px-4 py-6 text-center text-sm text-muted-foreground", children: "No blocks yet. Add one below." })
        ] }),
        /* @__PURE__ */ jsx11(AddComponentCards, { kinds: ROOT_BLOCK_KINDS, onAdd: addRoot })
      ] }),
      /* @__PURE__ */ jsxs11("div", { className: `space-y-2 lg:sticky lg:top-4 lg:self-start ${showPreview ? "" : "hidden"}`, children: [
        !compact && paletteOpen && /* @__PURE__ */ jsx11(
          VariablePalette,
          {
            variables: allVariables,
            hasTarget,
            onPick: (t) => paletteTarget.current?.(t),
            onClose: () => setPaletteOpen(false)
          }
        ),
        /* @__PURE__ */ jsxs11("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx11("span", { className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground", children: "Preview" }),
          /* @__PURE__ */ jsxs11("span", { className: "flex items-center gap-3 text-xs text-muted-foreground", children: [
            !paletteOpen && allVariables.length > 0 && /* @__PURE__ */ jsxs11("button", { type: "button", onClick: () => setPaletteOpen(true), className: "flex items-center gap-1 text-dbx-accent-300 hover:text-dbx-accent-200", children: [
              /* @__PURE__ */ jsx11(Percent2, { className: "h-3 w-3" }),
              " Variables"
            ] }),
            /* @__PURE__ */ jsxs11("span", { className: total > LIMITS.totalComponents ? "text-red-400" : "", children: [
              total,
              " / ",
              LIMITS.totalComponents,
              " components"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx11(DiscordPreview, { model: value, variables: allVariables, syntax, mentions: previewMentions, botName, botAvatar, watermark }),
        /* @__PURE__ */ jsx11("p", { className: "text-[11px] leading-snug text-muted-foreground/70", children: "Discord may show the message slightly differently on some devices." }),
        (errors.length > 0 || warnings.length > 0) && /* @__PURE__ */ jsxs11("div", { className: "space-y-1 rounded-lg border border-border/50 bg-card p-2 text-xs", children: [
          errors.map((e, i) => /* @__PURE__ */ jsxs11("div", { className: "text-red-400", children: [
            "\u25CF ",
            e.path,
            ": ",
            e.message
          ] }, `e${i}`)),
          warnings.map((w, i) => /* @__PURE__ */ jsxs11("div", { className: "text-amber-400", children: [
            "\u25CF ",
            w.path,
            ": ",
            w.message
          ] }, `w${i}`))
        ] })
      ] })
    ] })
  ] }) }) }) });
}
export {
  BuilderContext,
  Button,
  CLICKER_VARIABLES,
  DISCORD_VARIABLES,
  DiscordActionEditor,
  DiscordMessageBuilder,
  DiscordPreview,
  EmojiGrid,
  IS_COMPONENTS_V2,
  Input,
  LIMITS,
  MessageComponents,
  Modal,
  PERCENT_PLACEHOLDERS,
  Popover,
  Skeleton,
  Switch,
  SyntaxContext,
  Textarea,
  applyVariableSamples,
  deserialize,
  emptyMessage,
  makeBlock,
  makeContainer,
  mergeVariables,
  serialize,
  serializeJson,
  startingMessage,
  substituteVariables,
  validate,
  variablePattern,
  wrapVariable
};
