// Defaults, limits, and node factories for the Components V2 builder.
// Pure TypeScript, safe to copy alongside types.ts into any project.

import type {
  ActionRowNode,
  ButtonNode,
  ButtonStyleName,
  ContainerChild,
  ContainerNode,
  FileNode,
  Id,
  MediaGalleryNode,
  RootNode,
  SectionNode,
  SeparatorNode,
  TextNode,
} from "./types";

/** Flag you must set when sending a Components V2 message (1 << 15). */
export const IS_COMPONENTS_V2 = 32768;

/** Discord's documented per-message ceilings (used for soft warnings). */
export const LIMITS = {
  totalComponents: 40,
  actionRowButtons: 5,
  sectionTexts: 3,
  galleryItems: 10,
  textDisplayChars: 4000,
  buttonLabelChars: 80,
} as const;

export const BUTTON_STYLE_OPTIONS: { value: ButtonStyleName; label: string }[] = [
  { value: "primary", label: "Blurple" },
  { value: "secondary", label: "Grey" },
  { value: "success", label: "Green" },
  { value: "danger", label: "Red" },
  { value: "link", label: "Link" },
];

export const ACCENT_PRESETS: { name: string; value: number }[] = [
  { name: "Brand", value: 0x9b59b6 },
  { name: "Blurple", value: 0x5865f2 },
  { name: "Green", value: 0x57f287 },
  { name: "Yellow", value: 0xfee75c },
  { name: "Red", value: 0xed4245 },
  { name: "Dark", value: 0x2f3136 },
];

// ── id generation ────────────────────────────────────────────────
let fallbackCounter = 0;
export function uid(prefix = "n"): Id {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return `${prefix}_${c.randomUUID()}`;
  fallbackCounter += 1;
  return `${prefix}_${fallbackCounter}_${Math.floor(Math.random() * 1e9)}`;
}

// ── factories ────────────────────────────────────────────────────
export function makeButton(style: ButtonStyleName = "primary"): ButtonNode {
  return {
    id: uid("btn"),
    style,
    label: "",
    ...(style === "link" ? { url: "" } : { customId: "" }),
  };
}

export function makeText(content = ""): TextNode {
  return { type: "text", id: uid("txt"), content };
}

export function makeSeparator(): SeparatorNode {
  return { type: "separator", id: uid("sep"), divider: true, spacing: "small" };
}

export function makeSection(): SectionNode {
  return {
    type: "section",
    id: uid("sec"),
    texts: [""],
    accessory: { kind: "button", button: makeButton("secondary") },
  };
}

export function makeActionRow(): ActionRowNode {
  return { type: "action_row", id: uid("row"), buttons: [makeButton("primary")] };
}

export function makeMediaGallery(): MediaGalleryNode {
  return {
    type: "media_gallery",
    id: uid("gal"),
    items: [{ id: uid("img"), url: "https://" }],
  };
}

export function makeFile(): FileNode {
  return { type: "file", id: uid("file"), url: "attachment://" };
}

export function makeContainer(): ContainerNode {
  return {
    type: "container",
    id: uid("ctr"),
    accentColor: ACCENT_PRESETS[0].value,
    children: [makeText("")],
  };
}

/** Block kinds that may be added at the top level. */
export const ROOT_BLOCK_KINDS = [
  "container",
  "text",
  "section",
  "separator",
  "media_gallery",
  "file",
  "action_row",
] as const;

/** Block kinds allowed inside a container (everything except nested containers). */
export const CHILD_BLOCK_KINDS = [
  "text",
  "section",
  "separator",
  "media_gallery",
  "file",
  "action_row",
] as const;

export type BlockKind = (typeof ROOT_BLOCK_KINDS)[number];

export const BLOCK_LABELS: Record<BlockKind, string> = {
  container: "Container",
  text: "Text display",
  section: "Section",
  separator: "Separator",
  media_gallery: "Media gallery",
  file: "File",
  action_row: "Action row",
};

export const BLOCK_DESCRIPTIONS: Record<BlockKind, string> = {
  container: "Groups blocks in a box with an accent color.",
  text: "Text with Discord markdown.",
  section: "Text with a button or thumbnail next to it.",
  separator: "Space or a divider line between blocks.",
  media_gallery: "One or more images in a gallery.",
  file: "Attaches a file to the message.",
  action_row: "A row of up to 5 buttons.",
};

export function makeBlock(kind: BlockKind): RootNode {
  switch (kind) {
    case "container":
      return makeContainer();
    case "text":
      return makeText();
    case "section":
      return makeSection();
    case "separator":
      return makeSeparator();
    case "media_gallery":
      return makeMediaGallery();
    case "file":
      return makeFile();
    case "action_row":
      return makeActionRow();
  }
}

export function makeChildBlock(kind: Exclude<BlockKind, "container">): ContainerChild {
  return makeBlock(kind) as ContainerChild;
}

/** A starter message: one branded container holding an empty text block. */
export function emptyMessage(): { components: RootNode[] } {
  return { components: [makeContainer()] };
}

/** A minimal starter: a single text block (for plain messages). */
export function startingMessage(): { components: RootNode[] } {
  return { components: [makeText("")] };
}

/** A color number as a CSS hex string, or undefined when there is none. */
export function hexOf(color?: number | null): string | undefined {
  return color != null ? `#${color.toString(16).padStart(6, "0")}` : undefined;
}
