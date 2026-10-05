// Discord "Components V2" message model.
//
// This file is pure TypeScript with zero React / discord.js dependencies so it
// can be copied into any project. The model is a builder-friendly tree; the
// serializer (./serialize) turns it into the raw Discord API JSON that you send
// over REST or via discord.js `channel.send({ components, flags })`.
//
// API component type numbers (for reference):
//   1 ActionRow · 2 Button · 9 Section · 10 TextDisplay · 11 Thumbnail
//   12 MediaGallery · 13 File · 14 Separator · 17 Container

export type Id = string;

// ── buttons ──────────────────────────────────────────────────────
export const BUTTON_STYLE_VALUES = {
  primary: 1,
  secondary: 2,
  success: 3,
  danger: 4,
  link: 5,
} as const;

export type ButtonStyleName = keyof typeof BUTTON_STYLE_VALUES;

/**
 * Click behaviour, as the host app defines it. Not part of the Discord payload:
 * the builder carries this through the model untouched, the serializer drops it,
 * and the host stores it keyed by customId to execute in its interactionCreate
 * handler. The shape is whatever that host's editor writes (see
 * `integrations.actionEditor`); `ButtonAction` below is the one the shipped
 * editor uses.
 */
export type ButtonActionData = Record<string, unknown>;

export type ButtonActionType = "none" | "send_channel" | "send_dm" | "reply";

/** The action shape of the shipped editor (ButtonActions.tsx). */
export type ButtonAction = {
  type: ButtonActionType;
  /** Target channel for `send_channel`. */
  channelId?: string;
  /** Plain-text message the bot sends (supports %variables%, incl. %user%). */
  content?: string;
  /** When true, the response is a full builder message (`model`) instead of `content`. */
  rich?: boolean;
  /** Rich response, edited in a nested builder (serialized on send). */
  model?: MessageModel;
  /** For `reply`: visible only to the clicker (default true). */
  ephemeral?: boolean;
};

export interface ButtonNode {
  id: Id;
  style: ButtonStyleName;
  label?: string;
  /** Unicode emoji (e.g. "🎉") or a custom emoji literal "<:name:id>". */
  emoji?: string;
  /** Used for every style except `link`. */
  customId?: string;
  /** Used only for the `link` style. */
  url?: string;
  disabled?: boolean;
  /** Optional click behaviour executed by the bot (see ButtonActionData). */
  action?: ButtonActionData;
}

// ── leaf blocks ──────────────────────────────────────────────────
export interface TextNode {
  type: "text";
  id: Id;
  content: string;
}

export type SeparatorSpacing = "small" | "large";

export interface SeparatorNode {
  type: "separator";
  id: Id;
  divider: boolean;
  spacing: SeparatorSpacing;
}

export interface ThumbnailAccessory {
  kind: "thumbnail";
  url: string;
  description?: string;
  spoiler?: boolean;
}

export interface ButtonAccessory {
  kind: "button";
  button: ButtonNode;
}

export type SectionAccessory = ThumbnailAccessory | ButtonAccessory;

export interface SectionNode {
  type: "section";
  id: Id;
  /** 1-3 lines of text shown left of the accessory. */
  texts: string[];
  accessory: SectionAccessory;
}

export interface MediaItem {
  id: Id;
  url: string;
  description?: string;
  spoiler?: boolean;
}

export interface MediaGalleryNode {
  type: "media_gallery";
  id: Id;
  items: MediaItem[];
}

export interface FileNode {
  type: "file";
  id: Id;
  /** Must reference an attached file, e.g. "attachment://image.png". */
  url: string;
  spoiler?: boolean;
}

export interface ActionRowNode {
  type: "action_row";
  id: Id;
  buttons: ButtonNode[];
}

// ── container (root only) ────────────────────────────────────────
export interface ContainerNode {
  type: "container";
  id: Id;
  /** 0xRRGGBB accent bar, or null for none. */
  accentColor?: number | null;
  spoiler?: boolean;
  children: ContainerChild[];
}

/** Anything that may live inside a container (containers cannot nest). */
export type ContainerChild =
  | TextNode
  | SectionNode
  | SeparatorNode
  | MediaGalleryNode
  | FileNode
  | ActionRowNode;

/** Any top-level block. */
export type RootNode = ContainerNode | ContainerChild;

export type AnyNode = RootNode;

export interface MessageModel {
  components: RootNode[];
}

// ── template variables ───────────────────────────────────────────
// The builder can offer %variables% to insert into text fields, and the
// preview substitutes the sample value so the author sees a realistic result.
export interface TemplateVariable {
  /** Name without the percent signs, e.g. "prize". */
  name: string;
  /** Sample value used in the live preview. */
  sample?: string;
  /** Short human description shown in the inserter. */
  description?: string;
  /** Group heading in the inserter (e.g. "Global", "This message"). */
  group?: string;
}
