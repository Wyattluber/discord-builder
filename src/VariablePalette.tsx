// The variable palette: every variable with the value it has right now
// on this server (bot name, server name, current load…), grouped. A click
// inserts it into the field that opened the palette, or the last one that
// had focus. Without a target it copies the placeholder instead.

import { useState } from "react";
import { Check, Image as ImageIcon, X } from "lucide-react";
import type { TemplateVariable } from "./types";
import { useSyntax } from "./context";
import { wrapVariable } from "./syntax";

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

const isImage = (name: string) => /avatar|icon|image/i.test(name);

export function VariablePalette({ variables, hasTarget, onPick, onClose }: {
  variables: TemplateVariable[];
  /** Whether a field is aimed at; without one a click copies the placeholder. */
  hasTarget: boolean;
  onPick: (placeholder: string) => void;
  onClose: () => void;
}) {
  const syntax = useSyntax();
  const [q, setQ] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const query = q.trim().toLowerCase();
  const filtered = query
    ? variables.filter((v) => v.name.toLowerCase().includes(query) || (v.description ?? "").toLowerCase().includes(query))
    : variables;

  const pick = (v: TemplateVariable) => {
    const placeholder = wrapVariable(v.name, syntax);
    if (hasTarget) { onPick(placeholder); return; }
    navigator.clipboard?.writeText(placeholder).catch(() => {});
    setCopied(v.name);
    setTimeout(() => setCopied((c) => (c === v.name ? null : c)), 1200);
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border/60 bg-card">
      <div className="flex items-center gap-2 border-b border-border/40 px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Variables</span>
        <span className="text-[11px] text-muted-foreground/70">
          {hasTarget ? "Click to insert" : "Click to copy"}
        </span>
        <button type="button" onClick={onClose} aria-label="Close" className="ml-auto rounded p-1 text-muted-foreground hover:bg-muted/50 hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="px-3 pt-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search…"
          className="h-7 w-full rounded border border-border/60 bg-background px-2 text-xs outline-none placeholder:text-muted-foreground/60 focus:border-dbx-accent-500"
        />
      </div>
      <div className="max-h-[22rem] overflow-y-auto overscroll-contain px-1 py-2">
        {groupVariables(filtered).map(([group, items]) => (
          <div key={group} className="mb-2 last:mb-0">
            <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70">{group}</div>
            {items.map((v) => {
              const sample = String(v.sample ?? "").replace(/\n/g, " ");
              return (
                <button
                  key={v.name}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(v)}
                  title={v.description}
                  className="group flex w-full items-baseline gap-3 rounded px-2 py-1.5 text-left transition-colors hover:bg-dbx-accent-500/10"
                >
                  <span className="flex shrink-0 items-center gap-1 font-mono text-[11px] text-dbx-accent-300">
                    {isImage(v.name) && <ImageIcon className="h-3 w-3 text-muted-foreground" />}
                    {wrapVariable(v.name, syntax)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-right text-[11px] text-muted-foreground group-hover:text-foreground">
                    {copied === v.name
                      ? <span className="inline-flex items-center gap-1 text-emerald-300"><Check className="h-3 w-3" /> Copied</span>
                      : isImage(v.name) ? "image" : sample || "empty"}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
        {filtered.length === 0 && <p className="px-2 py-3 text-xs text-muted-foreground">No matching variables.</p>}
      </div>
    </div>
  );
}
