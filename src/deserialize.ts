// Raw Discord API JSON → model. Used to load an existing message back into the
// builder for editing. Tolerant: unknown component types are skipped.

import { uid } from "./constants";
import {
  BUTTON_STYLE_VALUES,
  type ButtonNode,
  type ButtonStyleName,
  type ContainerChild,
  type MessageModel,
  type RootNode,
  type SectionAccessory,
} from "./types";

type Raw = Record<string, any>;

const STYLE_BY_VALUE: Record<number, ButtonStyleName> = Object.fromEntries(
  Object.entries(BUTTON_STYLE_VALUES).map(([k, v]) => [v, k as ButtonStyleName]),
) as Record<number, ButtonStyleName>;

function emojiToString(e?: Raw): string | undefined {
  if (!e) return undefined;
  if (e.id) return `<${e.animated ? "a" : ""}:${e.name}:${e.id}>`;
  return e.name;
}

function buttonFromApi(c: Raw): ButtonNode {
  const style = STYLE_BY_VALUE[c.style] ?? "secondary";
  const b: ButtonNode = { id: uid("btn"), style };
  if (c.label) b.label = c.label;
  const emoji = emojiToString(c.emoji);
  if (emoji) b.emoji = emoji;
  if (style === "link") b.url = c.url ?? "https://";
  else b.customId = c.custom_id ?? "";
  if (c.disabled) b.disabled = true;
  return b;
}

function accessoryFromApi(a: Raw): SectionAccessory {
  if (a?.type === 2) return { kind: "button", button: buttonFromApi(a) };
  return {
    kind: "thumbnail",
    url: a?.media?.url ?? "",
    description: a?.description,
    spoiler: !!a?.spoiler,
  };
}

function childFromApi(c: Raw): ContainerChild | null {
  switch (c?.type) {
    case 10:
      return { type: "text", id: uid("txt"), content: c.content ?? "" };
    case 14:
      return { type: "separator", id: uid("sep"), divider: c.divider !== false, spacing: c.spacing === 2 ? "large" : "small" };
    case 9:
      return {
        type: "section",
        id: uid("sec"),
        texts: (c.components ?? []).filter((x: Raw) => x.type === 10).map((x: Raw) => x.content ?? ""),
        accessory: accessoryFromApi(c.accessory),
      };
    case 12:
      return {
        type: "media_gallery",
        id: uid("gal"),
        items: (c.items ?? []).map((it: Raw) => ({
          id: uid("img"),
          url: it?.media?.url ?? "",
          description: it?.description,
          spoiler: !!it?.spoiler,
        })),
      };
    case 13:
      return { type: "file", id: uid("file"), url: c.file?.url ?? "attachment://", spoiler: !!c.spoiler };
    case 1:
      return {
        type: "action_row",
        id: uid("row"),
        buttons: (c.components ?? []).filter((x: Raw) => x.type === 2).map(buttonFromApi),
      };
    default:
      return null;
  }
}

function rootFromApi(c: Raw): RootNode | null {
  if (c?.type === 17) {
    return {
      type: "container",
      id: uid("ctr"),
      accentColor: typeof c.accent_color === "number" ? c.accent_color : null,
      spoiler: !!c.spoiler,
      children: (c.components ?? []).map(childFromApi).filter(Boolean) as ContainerChild[],
    };
  }
  return childFromApi(c);
}

/**
 * Accepts either a `{ components: [...] }` payload or a bare components array.
 * Returns an empty model on malformed input rather than throwing.
 */
export function deserialize(input: unknown): MessageModel {
  let arr: Raw[] = [];
  if (Array.isArray(input)) arr = input as Raw[];
  else if (input && Array.isArray((input as Raw).components)) arr = (input as Raw).components;
  const components = arr.map(rootFromApi).filter(Boolean) as RootNode[];
  return { components };
}
