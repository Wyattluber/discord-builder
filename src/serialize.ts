// Model → raw Discord API JSON, plus validation.
//
// `serialize(model)` returns `{ flags, components }` ready to spread into a
// REST/discord.js send call:  channel.send(serialize(model))
// A model in embed format returns `{ content?, embeds, components }` instead:
// no flag, the embeds, and only the action rows under them.
//
// Pure TypeScript. No React, no discord.js.

import { IS_COMPONENTS_V2, LIMITS, messageFormat } from "./constants";
import {
  BUTTON_STYLE_VALUES,
  type ActionRowNode,
  type ButtonNode,
  type ContainerChild,
  type EmbedNode,
  type MessageModel,
  type RootNode,
  type SectionAccessory,
} from "./types";

export interface SerializedMessage {
  /** IS_COMPONENTS_V2 on a Components V2 message; absent on a classic one. */
  flags?: number;
  /** Classic message only: the text above the embeds, when there is any. */
  content?: string;
  /** Classic message only; an `embeds` array is what marks the format. */
  embeds?: unknown[];
  components: unknown[];
}

export interface ValidationIssue {
  level: "error" | "warning";
  path: string;
  message: string;
}

// ── emoji ────────────────────────────────────────────────────────
function emojiToApi(raw?: string) {
  if (!raw) return undefined;
  const m = raw.match(/^<(a?):(\w+):(\d+)>$/);
  if (m) return { name: m[2], id: m[3], animated: m[1] === "a" };
  return { name: raw };
}

// ── buttons ──────────────────────────────────────────────────────
function buttonToApi(b: ButtonNode) {
  const out: Record<string, unknown> = { type: 2, style: BUTTON_STYLE_VALUES[b.style] };
  if (b.label) out.label = b.label;
  const emoji = emojiToApi(b.emoji);
  if (emoji) out.emoji = emoji;
  if (b.style === "link") {
    if (b.url) out.url = b.url;
  } else if (b.customId) {
    out.custom_id = b.customId;
  }
  if (b.disabled) out.disabled = true;
  return out;
}

function accessoryToApi(a: SectionAccessory) {
  if (a.kind === "thumbnail") {
    const out: Record<string, unknown> = { type: 11, media: { url: a.url } };
    if (a.description) out.description = a.description;
    if (a.spoiler) out.spoiler = true;
    return out;
  }
  return buttonToApi(a.button);
}

// ── leaf blocks ──────────────────────────────────────────────────
function childToApi(node: ContainerChild): Record<string, unknown> {
  switch (node.type) {
    case "text":
      return { type: 10, content: node.content };
    case "separator":
      return { type: 14, divider: node.divider, spacing: node.spacing === "large" ? 2 : 1 };
    case "section":
      return {
        type: 9,
        components: node.texts.map((t) => ({ type: 10, content: t })),
        accessory: accessoryToApi(node.accessory),
      };
    case "media_gallery":
      return {
        type: 12,
        items: node.items.map((it) => {
          const item: Record<string, unknown> = { media: { url: it.url } };
          if (it.description) item.description = it.description;
          if (it.spoiler) item.spoiler = true;
          return item;
        }),
      };
    case "file": {
      const out: Record<string, unknown> = { type: 13, file: { url: node.url } };
      if (node.spoiler) out.spoiler = true;
      return out;
    }
    case "action_row":
      return { type: 1, components: node.buttons.map(buttonToApi) };
  }
}

function rootToApi(node: RootNode): Record<string, unknown> {
  if (node.type === "container") {
    const out: Record<string, unknown> = {
      type: 17,
      components: node.children.map(childToApi),
    };
    if (node.accentColor != null) out.accent_color = node.accentColor;
    if (node.spoiler) out.spoiler = true;
    return out;
  }
  return childToApi(node);
}

// ── embeds ───────────────────────────────────────────────────────
// Only what is set is written. An author without a name and a footer without
// text are left out, because Discord requires those; the timestamp is the
// literal "now", which the runtime turns into the send time.
function embedToApi(e: EmbedNode): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (e.author.name) {
    const author: Record<string, unknown> = { name: e.author.name };
    if (e.author.url) author.url = e.author.url;
    if (e.author.iconUrl) author.icon_url = e.author.iconUrl;
    out.author = author;
  }
  if (e.title) out.title = e.title;
  if (e.url) out.url = e.url;
  if (e.description) out.description = e.description;
  if (e.fields.length > 0) {
    out.fields = e.fields.map((f) => {
      const field: Record<string, unknown> = { name: f.name, value: f.value };
      if (f.inline) field.inline = true;
      return field;
    });
  }
  if (e.imageUrl) out.image = { url: e.imageUrl };
  if (e.thumbnailUrl) out.thumbnail = { url: e.thumbnailUrl };
  if (e.footer.text) {
    const footer: Record<string, unknown> = { text: e.footer.text };
    if (e.footer.iconUrl) footer.icon_url = e.footer.iconUrl;
    out.footer = footer;
  }
  if (e.timestamp) out.timestamp = "now";
  if (e.color != null) out.color = e.color;
  return out;
}

export function serialize(model: MessageModel): SerializedMessage {
  if (messageFormat(model) === "embeds") {
    return {
      ...(model.content ? { content: model.content } : {}),
      embeds: (model.embeds ?? []).map(embedToApi),
      // Without the V2 flag Discord takes nothing but action rows here
      components: model.components.filter((n) => n.type === "action_row").map(rootToApi),
    };
  }
  return {
    flags: IS_COMPONENTS_V2,
    components: model.components.map(rootToApi),
  };
}

/** Pretty JSON of just the components array (handy for copy / storage). */
export function serializeJson(model: MessageModel, indent = 2): string {
  return JSON.stringify(serialize(model), null, indent);
}

// ── validation ───────────────────────────────────────────────────
/** Every node the message carries, children included; Discord caps the total. */
export function countComponents(nodes: RootNode[]): number {
  let n = 0;
  for (const node of nodes) {
    n += 1;
    if (node.type === "container") n += node.children.length;
    if (node.type === "section") n += node.texts.length;
    if (node.type === "action_row") n += node.buttons.length;
    if (node.type === "media_gallery") n += node.items.length;
  }
  return n;
}

/** The characters Discord counts toward its 6000 across all embeds of a message. */
export function countEmbedChars(embeds: EmbedNode[]): number {
  let n = 0;
  for (const e of embeds) {
    n += e.title.length + e.description.length + e.author.name.length + e.footer.text.length;
    for (const f of e.fields) n += f.name.length + f.value.length;
  }
  return n;
}

/** An embed that would show nothing: no text, no fields, no picture, no author or footer. */
export function isEmptyEmbed(e: EmbedNode): boolean {
  return !e.title.trim() && !e.description.trim() && e.fields.length === 0
    && !e.imageUrl.trim() && !e.thumbnailUrl.trim()
    && !e.author.name.trim() && !e.footer.text.trim();
}

function tooLong(text: string, max: number, what: string, path: string, issues: ValidationIssue[]) {
  if (text.length > max) issues.push({ level: "error", path, message: `${what} is longer than ${max} characters.` });
}

function validateEmbedMessage(model: MessageModel, issues: ValidationIssue[]) {
  const content = model.content ?? "";
  const embeds = model.embeds ?? [];
  const rows = model.components.filter((n): n is ActionRowNode => n.type === "action_row");

  if (!content.trim() && embeds.every(isEmptyEmbed) && rows.length === 0) {
    issues.push({ level: "error", path: "Message", message: "The message is empty. Add text, an embed or buttons." });
  }
  tooLong(content, LIMITS.contentChars, "Message text", "Message", issues);
  if (embeds.length > LIMITS.embeds) {
    issues.push({ level: "error", path: "Message", message: `Too many embeds: ${embeds.length} of ${LIMITS.embeds}.` });
  }
  const chars = countEmbedChars(embeds);
  if (chars > LIMITS.embedTotalChars) {
    issues.push({ level: "error", path: "Message", message: `Too much text in the embeds: ${chars} of ${LIMITS.embedTotalChars} characters.` });
  }

  embeds.forEach((e, i) => {
    const path = `Embed ${i + 1}`;
    if (isEmptyEmbed(e)) issues.push({ level: "warning", path, message: "The embed is empty." });
    tooLong(e.author.name, LIMITS.embedAuthorNameChars, "Author name", path, issues);
    tooLong(e.title, LIMITS.embedTitleChars, "Title", path, issues);
    tooLong(e.description, LIMITS.embedDescriptionChars, "Description", path, issues);
    tooLong(e.footer.text, LIMITS.embedFooterChars, "Footer", path, issues);
    if (!e.author.name.trim() && (e.author.url || e.author.iconUrl)) {
      issues.push({ level: "warning", path, message: "The author link and icon only show with a name." });
    }
    if (!e.footer.text.trim() && e.footer.iconUrl) {
      issues.push({ level: "warning", path, message: "The footer icon only shows with footer text." });
    }
    if (e.fields.length > LIMITS.embedFields) {
      issues.push({ level: "error", path, message: `Too many fields: ${e.fields.length} of ${LIMITS.embedFields}.` });
    }
    e.fields.forEach((f, j) => {
      const fieldPath = `${path} › field ${j + 1}`;
      if (!f.name.trim() || !f.value.trim()) issues.push({ level: "warning", path: fieldPath, message: "Field needs a name and a value." });
      tooLong(f.name, LIMITS.embedFieldNameChars, "Field name", fieldPath, issues);
      tooLong(f.value, LIMITS.embedFieldValueChars, "Field value", fieldPath, issues);
    });
  });

  if (rows.length < model.components.length) {
    issues.push({ level: "warning", path: "Message", message: "Only action rows are sent with embeds." });
  }
  if (rows.length > LIMITS.actionRows) {
    issues.push({ level: "error", path: "Message", message: `Too many action rows: ${rows.length} of ${LIMITS.actionRows}.` });
  }
  rows.forEach((row, i) => validateChild(row, `Action row ${i + 1}`, issues));
}

function validateButton(b: ButtonNode, path: string, issues: ValidationIssue[]) {
  if (!b.label && !b.emoji) {
    issues.push({ level: "error", path, message: "Button needs a label or an emoji." });
  }
  if (b.label && b.label.length > LIMITS.buttonLabelChars) {
    issues.push({ level: "error", path, message: `Button label is longer than ${LIMITS.buttonLabelChars} characters.` });
  }
  if (b.style === "link") {
    if (!b.url || !/^https?:\/\/.+/.test(b.url)) {
      issues.push({ level: "error", path, message: "Link button needs a valid URL starting with https://." });
    }
  } else if (!b.customId) {
    issues.push({ level: "error", path, message: "Button needs a custom ID." });
  }
}

function validateChild(node: ContainerChild, path: string, issues: ValidationIssue[]) {
  switch (node.type) {
    case "text":
      if (!node.content.trim()) issues.push({ level: "warning", path, message: "Text is empty." });
      if (node.content.length > LIMITS.textDisplayChars)
        issues.push({ level: "error", path, message: `Text is longer than ${LIMITS.textDisplayChars} characters.` });
      break;
    case "section":
      if (node.texts.length < 1 || node.texts.length > LIMITS.sectionTexts)
        issues.push({ level: "error", path, message: `Section needs 1 to ${LIMITS.sectionTexts} text lines.` });
      if (node.accessory.kind === "thumbnail") {
        if (!node.accessory.url || !/^https?:\/\/.+/.test(node.accessory.url))
          issues.push({ level: "error", path, message: "Section thumbnail needs a valid image URL." });
      } else {
        validateButton(node.accessory.button, `${path} › accessory`, issues);
      }
      break;
    case "action_row":
      if (node.buttons.length < 1 || node.buttons.length > LIMITS.actionRowButtons)
        issues.push({ level: "error", path, message: `Action row needs 1 to ${LIMITS.actionRowButtons} buttons.` });
      node.buttons.forEach((b, i) => validateButton(b, `${path} › button ${i + 1}`, issues));
      break;
    case "media_gallery":
      if (node.items.length < 1 || node.items.length > LIMITS.galleryItems)
        issues.push({ level: "error", path, message: `Media gallery needs 1 to ${LIMITS.galleryItems} images.` });
      node.items.forEach((it, i) => {
        if (!it.url || !/^https?:\/\/.+/.test(it.url))
          issues.push({ level: "error", path: `${path} › image ${i + 1}`, message: "Image needs a valid URL." });
      });
      break;
    case "file":
      if (!node.url || !/^(attachment|https?):\/\/.+/.test(node.url))
        issues.push({ level: "error", path, message: "File needs an attachment:// or https:// URL." });
      break;
    case "separator":
      break;
  }
}

export function validate(model: MessageModel): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (messageFormat(model) === "embeds") {
    validateEmbedMessage(model, issues);
    return issues;
  }
  if (model.components.length === 0) {
    issues.push({ level: "error", path: "Message", message: "The message is empty. Add a block." });
  }
  const total = countComponents(model.components);
  if (total > LIMITS.totalComponents) {
    issues.push({
      level: "error",
      path: "Message",
      message: `Too many components: ${total} of ${LIMITS.totalComponents}.`,
    });
  }
  model.components.forEach((node, i) => {
    const path = `Block ${i + 1}`;
    if (node.type === "container") {
      if (node.children.length === 0)
        issues.push({ level: "warning", path, message: "The container is empty." });
      node.children.forEach((c, j) => validateChild(c, `${path} › ${j + 1}`, issues));
    } else {
      validateChild(node, path, issues);
    }
  });
  return issues;
}
