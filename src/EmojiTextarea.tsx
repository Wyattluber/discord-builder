// A textarea look-alike that shows custom emoji (<:name:id>, <a:name:id>) as
// their images while the value stays the plain text the bot sends. A real
// textarea can't hold images, so this is a contentEditable box whose DOM is
// drawn from the value: text nodes for text, one atomic element per emoji. All
// positions handed in and out are offsets into the value, where an emoji counts
// as its full token. Enter, paste, cut and undo go through the value so the DOM
// never drifts from it; plain typing stays native for caret, IME and spellcheck.

import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, type KeyboardEvent } from "react";

const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const TOKEN = /<(a?):(\w{2,32}):(\d{17,20})>/g;

type Segment = { text: string } | { token: string; name: string; id: string; animated: boolean };

/** Splits text into plain runs and custom emoji tokens. */
export function splitEmoji(value: string): Segment[] {
  const out: Segment[] = [];
  let last = 0;
  for (const m of value.matchAll(TOKEN)) {
    const at = m.index ?? 0;
    if (at > last) out.push({ text: value.slice(last, at) });
    out.push({ token: m[0], animated: m[1] === "a", name: m[2], id: m[3] });
    last = at + m[0].length;
  }
  if (last < value.length) out.push({ text: value.slice(last) });
  return out;
}

// ── DOM <-> value ────────────────────────────────────────────────

const tokenOf = (n: Node): string | undefined => (n.nodeType === 1 ? (n as HTMLElement).dataset.token : undefined);
const isTail = (n: Node) => n.nodeType === 1 && (n as HTMLElement).dataset.tail != null;

// What a node stands for in the value
function nodeLength(n: Node): number {
  if (n.nodeType === 3) return (n.nodeValue ?? "").length;
  const token = tokenOf(n);
  if (token != null) return token.length;
  if (n.nodeName === "BR") return isTail(n) ? 0 : 1;
  let len = 0;
  n.childNodes.forEach((c) => { len += nodeLength(c); });
  return len;
}

function serialize(root: HTMLElement): string {
  let s = "";
  const walk = (node: Node) => {
    node.childNodes.forEach((n) => {
      if (n.nodeType === 3) s += (n.nodeValue ?? "").replace(/ /g, " ");
      else if (tokenOf(n) != null) s += tokenOf(n);
      else if (n.nodeName === "BR") { if (!isTail(n)) s += "\n"; }
      else if (n.nodeType === 1) walk(n);
    });
  };
  walk(root);
  return s;
}

const SIZE = "height:1.375em;width:auto;vertical-align:-0.3em;margin:0 0.05em";

function emojiNode(seg: Extract<Segment, { token: string }>): HTMLElement {
  const img = document.createElement("img");
  img.src = `https://cdn.discordapp.com/emojis/${seg.id}.${seg.animated ? "gif" : "png"}?size=48`;
  img.alt = `:${seg.name}:`;
  img.title = `:${seg.name}:`;
  img.draggable = false;
  img.dataset.token = seg.token;
  img.style.cssText = `display:inline-block;${SIZE}`;
  // Unknown ID or an emoji the CDN doesn't have: show the name, marked
  img.onerror = () => {
    const chip = document.createElement("span");
    chip.textContent = `:${seg.name}:`;
    chip.title = "Emoji not found: wrong ID, or deleted";
    chip.contentEditable = "false";
    chip.dataset.token = seg.token;
    chip.style.cssText = "padding:0 0.2em;border-radius:0.25em;background:rgba(239,68,68,0.15);color:rgb(248,113,113)";
    img.replaceWith(chip);
  };
  return img;
}

function render(root: HTMLElement, value: string) {
  const frag = document.createDocumentFragment();
  for (const seg of splitEmoji(value)) {
    frag.appendChild("text" in seg ? document.createTextNode(seg.text) : emojiNode(seg));
  }
  // A last line break only shows when something follows it
  if (value.endsWith("\n")) {
    const br = document.createElement("br");
    br.dataset.tail = "";
    frag.appendChild(br);
  }
  root.replaceChildren(frag);
}

// The DOM is exactly what render() makes of the value: no browser-made
// <div>/<br>, and no typed token still sitting there as text.
function isCanonical(root: HTMLElement, value: string): boolean {
  const dom: (string | { token: string })[] = [];
  const nodes = Array.from(root.childNodes);
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    if (n.nodeType === 3) {
      const t = n.nodeValue ?? "";
      if (typeof dom[dom.length - 1] === "string") dom[dom.length - 1] += t;
      else if (t) dom.push(t);
    } else if (tokenOf(n) != null) dom.push({ token: tokenOf(n)! });
    else if (isTail(n) && i === nodes.length - 1) continue;
    else return false;
  }
  const want = splitEmoji(value);
  if (want.length !== dom.length) return false;
  for (let i = 0; i < want.length; i++) {
    const w = want[i], d = dom[i];
    if ("text" in w ? w.text !== d : typeof d === "string" || d.token !== w.token) return false;
  }
  const last = nodes[nodes.length - 1];
  return value.endsWith("\n") === !!(last && isTail(last));
}

// DOM point -> value offset
function offsetOf(root: HTMLElement, node: Node, offset: number): number {
  // A point inside an emoji element counts as right after it
  for (let p: Node | null = node; p && p !== root; p = p.parentNode) {
    if (p !== node && tokenOf(p) != null && p.parentNode) {
      node = p.parentNode;
      offset = Array.prototype.indexOf.call(p.parentNode.childNodes, p) + 1;
      break;
    }
  }
  let total = 0;
  let done = false;
  const visit = (cur: Node) => {
    if (done) return;
    if (cur === node) {
      if (cur.nodeType === 3) total += offset;
      else if (tokenOf(cur) != null) total += offset > 0 ? nodeLength(cur) : 0;
      else for (let i = 0; i < offset && i < cur.childNodes.length; i++) total += nodeLength(cur.childNodes[i]);
      done = true;
      return;
    }
    if (cur.nodeType === 3 || tokenOf(cur) != null || cur.nodeName === "BR") { total += nodeLength(cur); return; }
    for (const c of Array.from(cur.childNodes)) { visit(c); if (done) return; }
  };
  visit(root);
  return total;
}

// Value offset -> DOM point (in the canonical DOM). Inside a token snaps to before it.
function pointAt(root: HTMLElement, pos: number): [Node, number] {
  let rest = pos;
  const nodes = Array.from(root.childNodes);
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    const len = nodeLength(n);
    if (n.nodeType === 3) {
      if (rest <= len) return [n, rest];
    } else if (rest < len || rest === 0) {
      return [root, i];
    }
    rest -= len;
  }
  return [root, nodes.length];
}

export interface Selection { start: number; end: number }

function readSelection(root: HTMLElement): Selection | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const r = sel.getRangeAt(0);
  if (!root.contains(r.startContainer) || !root.contains(r.endContainer)) return null;
  const a = offsetOf(root, r.startContainer, r.startOffset);
  const b = offsetOf(root, r.endContainer, r.endOffset);
  return { start: Math.min(a, b), end: Math.max(a, b) };
}

function writeSelection(root: HTMLElement, start: number, end = start) {
  const sel = window.getSelection();
  if (!sel) return;
  const [sn, so] = pointAt(root, start);
  const [en, eo] = pointAt(root, end);
  const r = document.createRange();
  r.setStart(sn, so);
  r.setEnd(en, eo);
  sel.removeAllRanges();
  sel.addRange(r);
}

// ── component ────────────────────────────────────────────────────

export interface EmojiTextareaHandle {
  focus(): void;
  /** The selection as value offsets; the last one while the field is not focused. */
  getSelection(): Selection;
  /** Replaces the value as one undo step, focuses and selects start..end. */
  edit(next: string, start: number, end?: number): void;
}

interface Snapshot { value: string; sel: Selection }

export const EmojiTextarea = forwardRef<EmojiTextareaHandle, {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  max?: number;
  placeholder?: string;
  ariaLabel?: string;
  onKeyDown?: (e: KeyboardEvent<HTMLDivElement>) => void;
  onBlur?: () => void;
  /** After typing and clicks, with the caret offset (variable autocomplete). */
  onCaret?: (value: string, caret: number) => void;
  className?: string;
}>(function EmojiTextarea({ value, onChange, rows = 4, max, placeholder, ariaLabel, onKeyDown, onBlur, onCaret, className = "" }, ref) {
  const root = useRef<HTMLDivElement>(null);
  const lastSel = useRef<Selection>({ start: value.length, end: value.length });
  const pending = useRef<Selection | null>(null);
  const composing = useRef(false);
  const history = useRef<{ past: Snapshot[]; future: Snapshot[]; typedAt: number }>({ past: [], future: [], typedAt: 0 });
  const valueRef = useRef(value);
  valueRef.current = value;

  const clip = (v: string) => (max != null && v.length > max ? v.slice(0, max) : v);
  const focused = () => !!root.current && document.activeElement === root.current;

  function currentSelection(): Selection {
    const el = root.current;
    const s = el && focused() ? readSelection(el) : null;
    if (s) lastSel.current = s;
    return lastSel.current;
  }

  // Redraws when the DOM isn't what the value says, keeping the selection
  function sync(v: string) {
    const el = root.current;
    if (!el || composing.current) return;
    const sel = pending.current ?? (focused() ? readSelection(el) : null);
    const redraw = !isCanonical(el, v);
    if (redraw) render(el, v);
    if ((redraw || pending.current) && sel && focused()) {
      const s = Math.min(sel.start, v.length), e = Math.min(sel.end, v.length);
      writeSelection(el, s, e);
      lastSel.current = { start: s, end: e };
    }
    pending.current = null;
  }

  useBrowserLayoutEffect(() => { sync(value); }, [value]);

  // Remember where the caret was, for toolbar buttons that take the focus
  useEffect(() => {
    const onSel = () => {
      const el = root.current;
      if (!el || !focused()) return;
      const s = readSelection(el);
      if (s) lastSel.current = s;
    };
    document.addEventListener("selectionchange", onSel);
    return () => document.removeEventListener("selectionchange", onSel);
  }, []);

  // One change: kind "type" merges with the typing right before it into one undo step
  function commit(next: string, kind: "type" | "edit", before: Snapshot) {
    next = clip(next);
    if (next === valueRef.current) { sync(next); return; }
    const h = history.current;
    const now = Date.now();
    if (kind === "edit" || now - h.typedAt > 800 || h.past.length === 0) {
      h.past.push(before);
      if (h.past.length > 200) h.past.shift();
    }
    h.typedAt = kind === "type" ? now : 0;
    h.future = [];
    onChange(next);
  }

  function replaceSelection(text: string) {
    const v = valueRef.current;
    const sel = currentSelection();
    const next = clip(v.slice(0, sel.start) + text + v.slice(sel.end));
    pending.current = { start: Math.min(sel.start + text.length, next.length), end: Math.min(sel.start + text.length, next.length) };
    commit(next, "edit", { value: v, sel });
  }

  function step(from: "past" | "future") {
    const h = history.current;
    const snap = h[from].pop();
    if (!snap) return;
    (from === "past" ? h.future : h.past).push({ value: valueRef.current, sel: currentSelection() });
    h.typedAt = 0;
    pending.current = snap.sel;
    if (snap.value === valueRef.current) sync(snap.value);
    else onChange(snap.value);
  }

  useImperativeHandle(ref, () => ({
    focus: () => root.current?.focus(),
    getSelection: currentSelection,
    edit(next, start, end = start) {
      const v = valueRef.current;
      const before = { value: v, sel: currentSelection() };
      root.current?.focus();
      next = clip(next);
      pending.current = { start: Math.min(start, next.length), end: Math.min(end, next.length) };
      commit(next, "edit", before);
    },
  }));

  function handleInput() {
    const el = root.current;
    if (!el || composing.current) return;
    const before = { value: valueRef.current, sel: lastSel.current };
    const next = clip(serialize(el));
    const sel = readSelection(el);
    if (sel) lastSel.current = sel;
    commit(next, "type", before);
    onCaret?.(next, lastSel.current.end);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(e);
    if (e.defaultPrevented) return;
    const mod = (e.ctrlKey || e.metaKey) && !e.altKey;
    const key = e.key.toLowerCase();
    if (mod && key === "z") { e.preventDefault(); step(e.shiftKey ? "future" : "past"); return; }
    if (mod && key === "y") { e.preventDefault(); step("future"); return; }
    if (e.key === "Enter" && !composing.current) { e.preventDefault(); replaceSelection("\n"); }
  }

  const minHeight = `calc(${rows} * 1.25rem + 1rem + 2px)`;

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={root}
        role="textbox"
        aria-multiline="true"
        aria-label={ariaLabel}
        contentEditable
        suppressContentEditableWarning
        spellCheck
        className={`w-full overflow-hidden rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground outline-none focus:border-dbx-accent-500 ${className}`}
        // Inline, not utility classes: without pre-wrap the browser collapses
        // spaces and line breaks while editing, which would change the value
        style={{ minHeight, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onBlur={onBlur}
        onClick={() => onCaret?.(valueRef.current, currentSelection().end)}
        onCompositionStart={() => { composing.current = true; }}
        onCompositionEnd={() => { composing.current = false; handleInput(); }}
        onPaste={(e) => {
          e.preventDefault();
          replaceSelection(e.clipboardData.getData("text/plain").replace(/\r\n?/g, "\n"));
        }}
        onCopy={(e) => {
          const s = currentSelection();
          if (s.start === s.end) return;
          e.preventDefault();
          e.clipboardData.setData("text/plain", valueRef.current.slice(s.start, s.end));
        }}
        onCut={(e) => {
          const s = currentSelection();
          if (s.start === s.end) return;
          e.preventDefault();
          e.clipboardData.setData("text/plain", valueRef.current.slice(s.start, s.end));
          replaceSelection("");
        }}
        onDrop={(e) => e.preventDefault()}
      />
      {value === "" && placeholder && (
        <span
          className="select-none text-sm text-muted-foreground/60"
          style={{ position: "absolute", left: "0.75rem", top: "0.5rem", pointerEvents: "none", whiteSpace: "pre-wrap" }}
        >
          {placeholder}
        </span>
      )}
    </div>
  );
});
