// Model → raw Discord API JSON, plus validation.
//
// `serialize(model)` returns `{ flags, components }` ready to spread into a
// REST/discord.js send call:  channel.send(serialize(model))
//
// Pure TypeScript. No React, no discord.js.

import { IS_COMPONENTS_V2, LIMITS } from "./constants";
import {
  BUTTON_STYLE_VALUES,
  type ButtonNode,
  type ContainerChild,
  type MessageModel,
  type RootNode,
  type SectionAccessory,
} from "./types";

export interface SerializedMessage {
  flags: number;
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

export function serialize(model: MessageModel): SerializedMessage {
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
