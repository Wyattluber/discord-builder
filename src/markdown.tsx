// A small Discord-flavoured markdown renderer for the preview pane.
// Supports the subset Discord actually renders: headings, subtext (-#),
// bold / italic / underline / strike / code, blockquotes, lists, links,
// mentions, custom emoji, timestamps, and %variables%.
//
// This is preview-only and intentionally forgiving; it is not a spec-perfect
// parser.

import React from "react";
import type { TemplateVariable } from "./types";
import { PERCENT_PLACEHOLDERS, variablePattern, wrapVariable, type PlaceholderSyntax } from "./syntax";

type VarMap = Record<string, string>;

/**
 * What the preview needs to resolve variables: the sample values plus the
 * syntax they are written in. Carried as one object so every renderer below
 * passes it along unchanged.
 */
export interface PreviewVars {
  values: VarMap;
  syntax: PlaceholderSyntax;
}
export interface Mentions {
  users?: Record<string, string>;
  roles?: Record<string, string>;
  channels?: Record<string, string>;
}

export function variablesToMap(vars?: TemplateVariable[], syntax: PlaceholderSyntax = PERCENT_PLACEHOLDERS): VarMap {
  const map: VarMap = {};
  for (const v of vars ?? []) {
    const sample = v.sample ?? wrapVariable(v.name, syntax);
    map[v.name] = sample;
    // The bot resolves both camelCase and snake_case (guildName / guild_name),
    // so the preview should too, otherwise a snake_case var looks unresolved.
    const snake = v.name.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
    if (snake !== v.name && !(snake in map)) map[snake] = sample;
  }
  return map;
}

/** Sample values plus syntax, ready to hand to the renderers below. */
export function previewVars(vars?: TemplateVariable[], syntax: PlaceholderSyntax = PERCENT_PLACEHOLDERS): PreviewVars {
  return { values: variablesToMap(vars, syntax), syntax };
}

const MENTION_CLS = "bg-[#3e4374] font-medium text-[#dee0fc] hover:bg-[#5865f2]";

// ── inline ───────────────────────────────────────────────────────
interface Matcher {
  re: RegExp;
  build: (m: RegExpExecArray, key: string, vars: PreviewVars, mentions?: Mentions) => React.ReactNode;
}

function pill(key: string, label: string, cls: string) {
  return (
    <span key={key} className={`rounded px-1 ${cls}`}>
      {label}
    </span>
  );
}

const MATCHERS: Matcher[] = [
  // ``…`` before `…`: Discord's double-backtick inline code (may contain single backticks).
  { re: /``(.+?)``/, build: (m, k) => <code key={k} className="rounded bg-black/40 px-1 py-0.5 font-mono text-[0.85em]">{m[1]}</code> },
  { re: /`([^`]+)`/, build: (m, k) => <code key={k} className="rounded bg-black/40 px-1 py-0.5 font-mono text-[0.85em]">{m[1]}</code> },
  // ***…*** before **…**: otherwise the bold matcher eats two of the three
  // stars and the third shows up as a stray character.
  { re: /\*\*\*([\s\S]+?)\*\*\*/, build: (m, k, v, mn) => <strong key={k}><em>{renderInline(m[1], v, k, mn)}</em></strong> },
  { re: /\*\*([\s\S]+?)\*\*/, build: (m, k, v, mn) => <strong key={k}>{renderInline(m[1], v, k, mn)}</strong> },
  { re: /__([\s\S]+?)__/, build: (m, k, v, mn) => <u key={k}>{renderInline(m[1], v, k, mn)}</u> },
  { re: /~~([\s\S]+?)~~/, build: (m, k, v, mn) => <s key={k}>{renderInline(m[1], v, k, mn)}</s> },
  { re: /\*([\s\S]+?)\*/, build: (m, k, v, mn) => <em key={k}>{renderInline(m[1], v, k, mn)}</em> },
  { re: /_([\s\S]+?)_/, build: (m, k, v, mn) => <em key={k}>{renderInline(m[1], v, k, mn)}</em> },
  {
    re: /\[([^\]]+)\]\(([^)]+)\)/,
    // Discord links to http(s) only; anything else (javascript:, data:) is
    // shown as the text it is, never handed to the browser as a link
    build: (m, k, v, mn) => (/^https?:\/\//i.test(m[2].trim())
      ? (
        <a key={k} href={m[2].trim()} target="_blank" rel="noreferrer" className="text-[#00a8fc] hover:underline">
          {renderInline(m[1], v, k, mn)}
        </a>
      )
      : <span key={k}>{renderInline(m[1], v, k, mn)}</span>),
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
      const cp = (s: string) => s.codePointAt(0)!.toString(16);
      return (
        <img
          key={k}
          src={`https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg/${cp(m[1])}-${cp(m[2])}.svg`}
          alt={m[0]}
          className="inline h-[1.2em] w-[1.2em] align-text-bottom"
        />
      );
    },
  },
  {
    re: /<(a?):(\w+):(\d+)>/,
    build: (m, k) => (
      <img
        key={k}
        src={`https://cdn.discordapp.com/emojis/${m[3]}.${m[1] === "a" ? "gif" : "png"}`}
        alt={`:${m[2]}:`}
        className="inline h-5 w-5 align-text-bottom"
      />
    ),
  },
  {
    re: /(?!)/, // replaced per syntax in matchersFor()
    build: (m, k, v, mn) => {
      if (!(m[1] in v.values)) return pill(k, wrapVariable(m[1], v.syntax), "bg-amber-500/20 text-amber-300");
      // Render the substituted value as markdown (bold, mentions, emoji, …) with
      // newlines as line breaks, so the preview matches how Discord shows it.
      // The tinted wrapper marks the stretch as variable output; hovering it
      // reveals which variable produced it.
      const lines = String(v.values[m[1]]).split("\n");
      return (
        <span key={k} title={wrapVariable(m[1], v.syntax)} className="rounded bg-dbx-accent-500/20 px-0.5">
          {lines.map((ln, i) => (
            <React.Fragment key={i}>{i > 0 && <br />}{renderInline(ln, v, `${k}_${i}`, mn)}</React.Fragment>
          ))}
        </span>
      );
    },
  },
];

// The variable matcher is the last entry and the only syntax-dependent one, so
// each syntax gets its own matcher list, built once.
const matcherCache = new Map<string, Matcher[]>();

function matchersFor(syntax: PlaceholderSyntax): Matcher[] {
  const key = `${syntax.open}|${syntax.close}`;
  let list = matcherCache.get(key);
  if (!list) {
    list = MATCHERS.map((m, i) => (i === MATCHERS.length - 1 ? { ...m, re: variablePattern(syntax) } : m));
    matcherCache.set(key, list);
  }
  return list;
}

function formatTimestamp(unix: string, style?: string): string {
  const ms = parseInt(unix, 10) * 1000;
  if (!Number.isFinite(ms)) return "<timestamp>";
  const d = new Date(ms);
  if (style === "R") {
    const diff = ms - Date.now();
    const abs = Math.abs(diff);
    const units: [number, string][] = [
      [86400000, "day"],
      [3600000, "hour"],
      [60000, "minute"],
      [1000, "second"],
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

export function renderInline(text: string, vars: PreviewVars, keyPrefix = "i", mentions?: Mentions): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let rest = text;
  let idx = 0;
  let guard = 0;

  while (rest.length > 0 && guard < 5000) {
    guard += 1;
    let best: { at: number; m: RegExpExecArray; matcher: Matcher } | null = null;
    for (const matcher of matchersFor(vars.syntax)) {
      const m = matcher.re.exec(rest);
      if (m && (best === null || m.index < best.at)) best = { at: m.index, m, matcher };
    }
    if (!best) {
      out.push(<React.Fragment key={`${keyPrefix}_t${idx}`}>{rest}</React.Fragment>);
      break;
    }
    if (best.at > 0) {
      out.push(<React.Fragment key={`${keyPrefix}_t${idx}`}>{rest.slice(0, best.at)}</React.Fragment>);
      idx += 1;
    }
    out.push(best.matcher.build(best.m, `${keyPrefix}_m${idx}`, vars, mentions));
    idx += 1;
    rest = rest.slice(best.at + best.m[0].length);
  }
  return out;
}

// ── block level ──────────────────────────────────────────────────
// Renders one non-code stretch of text (lists, quotes, headings, plain lines).
function renderTextSegment(seg: string, keyPrefix: string, vars: PreviewVars, mentions: Mentions | undefined, blocks: React.ReactNode[]) {
  const lines = seg.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // bullet list (consume consecutive items)
    if (/^\s*[-*]\s+/.test(line) && !/^-#\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i]) && !/^-#\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i += 1;
      }
      blocks.push(
        <ul key={`${keyPrefix}b${i}`} className="my-0.5 list-disc pl-5">
          {items.map((it, k) => (
            <li key={k}>{renderInline(it, vars, `${keyPrefix}li${i}_${k}`, mentions)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    blocks.push(<LineBlock key={`${keyPrefix}b${i}`} line={line} vars={vars} mentions={mentions} />);
    i += 1;
  }
}

export function Markdown({ text, vars, mentions }: { text: string; vars: PreviewVars; mentions?: Mentions }) {
  const blocks: React.ReactNode[] = [];

  // Discord code fences open and close anywhere, including on the same line
  // (```foo```), so split the whole text on ``` first: even segments are
  // regular markdown, odd segments are code. An unclosed fence swallows the
  // rest as code, which is also what you want while still typing the block.
  const segments = (text ?? "").split("```");
  segments.forEach((seg, si) => {
    if (si % 2 === 1) {
      let body = seg;
      // "```lua\n…": a bare word before the first newline is the (hidden)
      // language tag. Only applies to multi-line blocks, like on Discord.
      const nl = body.indexOf("\n");
      if (nl !== -1 && /^[a-zA-Z0-9+_.#-]*$/.test(body.slice(0, nl))) body = body.slice(nl + 1);
      body = body.replace(/\n$/, "");
      blocks.push(
        <pre key={`s${si}`} className="my-1 overflow-x-auto rounded bg-black/40 p-2 font-mono text-[0.8em]">
          {body}
        </pre>,
      );
      return;
    }
    let textSeg = seg;
    // Swallow the line breaks that only exist to delimit the neighbouring
    // fences, so code blocks don't grow phantom blank lines around them.
    if (si > 0) textSeg = textSeg.replace(/^\n/, "");
    if (si < segments.length - 1) textSeg = textSeg.replace(/\n$/, "");
    if (textSeg === "") return;
    renderTextSegment(textSeg, `s${si}`, vars, mentions, blocks);
  });

  return <div className="leading-[1.375]">{blocks}</div>;
}

function LineBlock({ line, vars, mentions }: { line: string; vars: PreviewVars; mentions?: Mentions }) {
  if (line.trim() === "") return <div className="h-2" />;

  if (line.startsWith("-# "))
    return <div className="text-[0.8em] text-[#949ba4]">{renderInline(line.slice(3), vars, "i", mentions)}</div>;
  if (line.startsWith("### "))
    return <div className="mt-1 text-[1em] font-bold">{renderInline(line.slice(4), vars, "i", mentions)}</div>;
  if (line.startsWith("## "))
    return <div className="mt-1 text-[1.15em] font-bold">{renderInline(line.slice(3), vars, "i", mentions)}</div>;
  if (line.startsWith("# "))
    return <div className="mt-1 text-[1.35em] font-bold">{renderInline(line.slice(2), vars, "i", mentions)}</div>;
  if (line.startsWith("> "))
    return (
      <div className="border-l-2 border-[#4e5058] pl-2 text-[#dbdee1]">{renderInline(line.slice(2), vars, "i", mentions)}</div>
    );

  return <div>{renderInline(line, vars, "i", mentions)}</div>;
}
