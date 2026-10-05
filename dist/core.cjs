"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/core.ts
var core_exports = {};
__export(core_exports, {
  ACCENT_PRESETS: () => ACCENT_PRESETS,
  BLOCK_DESCRIPTIONS: () => BLOCK_DESCRIPTIONS,
  BLOCK_LABELS: () => BLOCK_LABELS,
  BUTTON_STYLE_OPTIONS: () => BUTTON_STYLE_OPTIONS,
  BUTTON_STYLE_VALUES: () => BUTTON_STYLE_VALUES,
  CHILD_BLOCK_KINDS: () => CHILD_BLOCK_KINDS,
  CLICKER_VARIABLES: () => CLICKER_VARIABLES,
  DISCORD_VARIABLES: () => DISCORD_VARIABLES,
  IS_COMPONENTS_V2: () => IS_COMPONENTS_V2,
  LIMITS: () => LIMITS,
  PERCENT_PLACEHOLDERS: () => PERCENT_PLACEHOLDERS,
  ROOT_BLOCK_KINDS: () => ROOT_BLOCK_KINDS,
  applyVariableSamples: () => applyVariableSamples,
  closingVariablePattern: () => closingVariablePattern,
  countComponents: () => countComponents,
  deserialize: () => deserialize,
  emptyMessage: () => emptyMessage,
  hexOf: () => hexOf,
  makeActionRow: () => makeActionRow,
  makeBlock: () => makeBlock,
  makeButton: () => makeButton,
  makeChildBlock: () => makeChildBlock,
  makeContainer: () => makeContainer,
  makeFile: () => makeFile,
  makeMediaGallery: () => makeMediaGallery,
  makeSection: () => makeSection,
  makeSeparator: () => makeSeparator,
  makeText: () => makeText,
  mergeVariables: () => mergeVariables,
  partialVariablePattern: () => partialVariablePattern,
  serialize: () => serialize,
  serializeJson: () => serializeJson,
  startingMessage: () => startingMessage,
  substituteVariables: () => substituteVariables,
  uid: () => uid,
  validate: () => validate,
  variablePattern: () => variablePattern,
  wrapVariable: () => wrapVariable
});
module.exports = __toCommonJS(core_exports);

// src/types.ts
var BUTTON_STYLE_VALUES = {
  primary: 1,
  secondary: 2,
  success: 3,
  danger: 4,
  link: 5
};

// src/constants.ts
var IS_COMPONENTS_V2 = 32768;
var LIMITS = {
  totalComponents: 40,
  actionRowButtons: 5,
  sectionTexts: 3,
  galleryItems: 10,
  textDisplayChars: 4e3,
  buttonLabelChars: 80
};
var BUTTON_STYLE_OPTIONS = [
  { value: "primary", label: "Blurple" },
  { value: "secondary", label: "Grey" },
  { value: "success", label: "Green" },
  { value: "danger", label: "Red" },
  { value: "link", label: "Link" }
];
var ACCENT_PRESETS = [
  { name: "Brand", value: 10181046 },
  { name: "Blurple", value: 5793266 },
  { name: "Green", value: 5763719 },
  { name: "Yellow", value: 16705372 },
  { name: "Red", value: 15548997 },
  { name: "Dark", value: 3092790 }
];
var fallbackCounter = 0;
function uid(prefix = "n") {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return `${prefix}_${c.randomUUID()}`;
  fallbackCounter += 1;
  return `${prefix}_${fallbackCounter}_${Math.floor(Math.random() * 1e9)}`;
}
function makeButton(style = "primary") {
  return {
    id: uid("btn"),
    style,
    label: "",
    ...style === "link" ? { url: "" } : { customId: "" }
  };
}
function makeText(content = "") {
  return { type: "text", id: uid("txt"), content };
}
function makeSeparator() {
  return { type: "separator", id: uid("sep"), divider: true, spacing: "small" };
}
function makeSection() {
  return {
    type: "section",
    id: uid("sec"),
    texts: [""],
    accessory: { kind: "button", button: makeButton("secondary") }
  };
}
function makeActionRow() {
  return { type: "action_row", id: uid("row"), buttons: [makeButton("primary")] };
}
function makeMediaGallery() {
  return {
    type: "media_gallery",
    id: uid("gal"),
    items: [{ id: uid("img"), url: "https://" }]
  };
}
function makeFile() {
  return { type: "file", id: uid("file"), url: "attachment://" };
}
function makeContainer() {
  return {
    type: "container",
    id: uid("ctr"),
    accentColor: ACCENT_PRESETS[0].value,
    children: [makeText("")]
  };
}
var ROOT_BLOCK_KINDS = [
  "container",
  "text",
  "section",
  "separator",
  "media_gallery",
  "file",
  "action_row"
];
var CHILD_BLOCK_KINDS = [
  "text",
  "section",
  "separator",
  "media_gallery",
  "file",
  "action_row"
];
var BLOCK_LABELS = {
  container: "Container",
  text: "Text display",
  section: "Section",
  separator: "Separator",
  media_gallery: "Media gallery",
  file: "File",
  action_row: "Action row"
};
var BLOCK_DESCRIPTIONS = {
  container: "Groups blocks in a box with an accent color.",
  text: "Text with Discord markdown.",
  section: "Text with a button or thumbnail next to it.",
  separator: "Space or a divider line between blocks.",
  media_gallery: "One or more images in a gallery.",
  file: "Attaches a file to the message.",
  action_row: "A row of up to 5 buttons."
};
function makeBlock(kind) {
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
function makeChildBlock(kind) {
  return makeBlock(kind);
}
function emptyMessage() {
  return { components: [makeContainer()] };
}
function startingMessage() {
  return { components: [makeText("")] };
}
function hexOf(color) {
  return color != null ? `#${color.toString(16).padStart(6, "0")}` : void 0;
}

// src/serialize.ts
function emojiToApi(raw) {
  if (!raw) return void 0;
  const m = raw.match(/^<(a?):(\w+):(\d+)>$/);
  if (m) return { name: m[2], id: m[3], animated: m[1] === "a" };
  return { name: raw };
}
function buttonToApi(b) {
  const out = { type: 2, style: BUTTON_STYLE_VALUES[b.style] };
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
function accessoryToApi(a) {
  if (a.kind === "thumbnail") {
    const out = { type: 11, media: { url: a.url } };
    if (a.description) out.description = a.description;
    if (a.spoiler) out.spoiler = true;
    return out;
  }
  return buttonToApi(a.button);
}
function childToApi(node) {
  switch (node.type) {
    case "text":
      return { type: 10, content: node.content };
    case "separator":
      return { type: 14, divider: node.divider, spacing: node.spacing === "large" ? 2 : 1 };
    case "section":
      return {
        type: 9,
        components: node.texts.map((t) => ({ type: 10, content: t })),
        accessory: accessoryToApi(node.accessory)
      };
    case "media_gallery":
      return {
        type: 12,
        items: node.items.map((it) => {
          const item = { media: { url: it.url } };
          if (it.description) item.description = it.description;
          if (it.spoiler) item.spoiler = true;
          return item;
        })
      };
    case "file": {
      const out = { type: 13, file: { url: node.url } };
      if (node.spoiler) out.spoiler = true;
      return out;
    }
    case "action_row":
      return { type: 1, components: node.buttons.map(buttonToApi) };
  }
}
function rootToApi(node) {
  if (node.type === "container") {
    const out = {
      type: 17,
      components: node.children.map(childToApi)
    };
    if (node.accentColor != null) out.accent_color = node.accentColor;
    if (node.spoiler) out.spoiler = true;
    return out;
  }
  return childToApi(node);
}
function serialize(model) {
  return {
    flags: IS_COMPONENTS_V2,
    components: model.components.map(rootToApi)
  };
}
function serializeJson(model, indent = 2) {
  return JSON.stringify(serialize(model), null, indent);
}
function countComponents(nodes) {
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
function validateButton(b, path, issues) {
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
function validateChild(node, path, issues) {
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
        validateButton(node.accessory.button, `${path} \u203A accessory`, issues);
      }
      break;
    case "action_row":
      if (node.buttons.length < 1 || node.buttons.length > LIMITS.actionRowButtons)
        issues.push({ level: "error", path, message: `Action row needs 1 to ${LIMITS.actionRowButtons} buttons.` });
      node.buttons.forEach((b, i) => validateButton(b, `${path} \u203A button ${i + 1}`, issues));
      break;
    case "media_gallery":
      if (node.items.length < 1 || node.items.length > LIMITS.galleryItems)
        issues.push({ level: "error", path, message: `Media gallery needs 1 to ${LIMITS.galleryItems} images.` });
      node.items.forEach((it, i) => {
        if (!it.url || !/^https?:\/\/.+/.test(it.url))
          issues.push({ level: "error", path: `${path} \u203A image ${i + 1}`, message: "Image needs a valid URL." });
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
function validate(model) {
  const issues = [];
  if (model.components.length === 0) {
    issues.push({ level: "error", path: "Message", message: "The message is empty. Add a block." });
  }
  const total = countComponents(model.components);
  if (total > LIMITS.totalComponents) {
    issues.push({
      level: "error",
      path: "Message",
      message: `Too many components: ${total} of ${LIMITS.totalComponents}.`
    });
  }
  model.components.forEach((node, i) => {
    const path = `Block ${i + 1}`;
    if (node.type === "container") {
      if (node.children.length === 0)
        issues.push({ level: "warning", path, message: "The container is empty." });
      node.children.forEach((c, j) => validateChild(c, `${path} \u203A ${j + 1}`, issues));
    } else {
      validateChild(node, path, issues);
    }
  });
  return issues;
}

// src/deserialize.ts
var STYLE_BY_VALUE = Object.fromEntries(
  Object.entries(BUTTON_STYLE_VALUES).map(([k, v]) => [v, k])
);
function emojiToString(e) {
  if (!e) return void 0;
  if (e.id) return `<${e.animated ? "a" : ""}:${e.name}:${e.id}>`;
  return e.name;
}
function buttonFromApi(c) {
  const style = STYLE_BY_VALUE[c.style] ?? "secondary";
  const b = { id: uid("btn"), style };
  if (c.label) b.label = c.label;
  const emoji = emojiToString(c.emoji);
  if (emoji) b.emoji = emoji;
  if (style === "link") b.url = c.url ?? "https://";
  else b.customId = c.custom_id ?? "";
  if (c.disabled) b.disabled = true;
  return b;
}
function accessoryFromApi(a) {
  if (a?.type === 2) return { kind: "button", button: buttonFromApi(a) };
  return {
    kind: "thumbnail",
    url: a?.media?.url ?? "",
    description: a?.description,
    spoiler: !!a?.spoiler
  };
}
function childFromApi(c) {
  switch (c?.type) {
    case 10:
      return { type: "text", id: uid("txt"), content: c.content ?? "" };
    case 14:
      return { type: "separator", id: uid("sep"), divider: c.divider !== false, spacing: c.spacing === 2 ? "large" : "small" };
    case 9:
      return {
        type: "section",
        id: uid("sec"),
        texts: (c.components ?? []).filter((x) => x.type === 10).map((x) => x.content ?? ""),
        accessory: accessoryFromApi(c.accessory)
      };
    case 12:
      return {
        type: "media_gallery",
        id: uid("gal"),
        items: (c.items ?? []).map((it) => ({
          id: uid("img"),
          url: it?.media?.url ?? "",
          description: it?.description,
          spoiler: !!it?.spoiler
        }))
      };
    case 13:
      return { type: "file", id: uid("file"), url: c.file?.url ?? "attachment://", spoiler: !!c.spoiler };
    case 1:
      return {
        type: "action_row",
        id: uid("row"),
        buttons: (c.components ?? []).filter((x) => x.type === 2).map(buttonFromApi)
      };
    default:
      return null;
  }
}
function rootFromApi(c) {
  if (c?.type === 17) {
    return {
      type: "container",
      id: uid("ctr"),
      accentColor: typeof c.accent_color === "number" ? c.accent_color : null,
      spoiler: !!c.spoiler,
      children: (c.components ?? []).map(childFromApi).filter(Boolean)
    };
  }
  return childFromApi(c);
}
function deserialize(input) {
  let arr = [];
  if (Array.isArray(input)) arr = input;
  else if (input && Array.isArray(input.components)) arr = input.components;
  const components = arr.map(rootFromApi).filter(Boolean);
  return { components };
}

// src/syntax.ts
var PERCENT_PLACEHOLDERS = { open: "%", close: "%" };
var escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function wrapVariable(name, syntax = PERCENT_PLACEHOLDERS) {
  return `${syntax.open}${name}${syntax.close}`;
}
function variablePattern(syntax = PERCENT_PLACEHOLDERS, flags = "") {
  return new RegExp(`${escape(syntax.open)}(\\w+)${escape(syntax.close)}`, flags);
}
function partialVariablePattern(syntax = PERCENT_PLACEHOLDERS) {
  return new RegExp(`${escape(syntax.open)}(\\w*)$`);
}
function closingVariablePattern(syntax = PERCENT_PLACEHOLDERS) {
  return new RegExp(`^\\w*${escape(syntax.close)}`);
}
function substituteVariables(text, values, syntax = PERCENT_PLACEHOLDERS) {
  return text.replace(variablePattern(syntax, "g"), (m, name) => values[name] != null ? String(values[name]) : m);
}

// src/presets.ts
var DISCORD_VARIABLES = [
  { name: "botName", sample: "Your Bot", description: "The bot's name", group: "General" },
  { name: "botID", sample: "1349\u2026", description: "The bot's user ID", group: "General" },
  { name: "botAvatar", sample: "https://cdn.discordapp.com/embed/avatars/0.png", description: "URL of the bot's avatar", group: "General" },
  { name: "botTag", sample: "yourbot", description: "The bot's tag", group: "General" },
  { name: "botMention", sample: "@Your Bot", description: "Mention of the bot", group: "General" },
  { name: "guildName", sample: "Your Server", description: "The server's name", group: "General" },
  { name: "guildID", sample: "1234\u2026", description: "The server's ID", group: "General" },
  { name: "guildIcon", sample: "https://cdn.discordapp.com/embed/avatars/0.png", description: "URL of the server icon", group: "General" },
  { name: "timestamp", sample: "16:20", description: "Short date and time in the reader's timezone", group: "General" },
  { name: "shortTime", sample: "16:20", description: "Short time", group: "General" },
  { name: "longTime", sample: "16:20:30", description: "Long time", group: "General" },
  { name: "shortDate", sample: "30/06/2026", description: "Short date", group: "General" },
  { name: "longDate", sample: "30 June 2026", description: "Long date", group: "General" },
  { name: "shortDateTime", sample: "30 June 2026 16:20", description: "Short date and time", group: "General" },
  { name: "longDateTime", sample: "Tuesday, 30 June 2026 16:20", description: "Long date and time", group: "General" },
  { name: "relativeTime", sample: "2 minutes ago", description: "Relative time", group: "General" }
];
var CLICKER_VARIABLES = [
  { name: "user", sample: "@you", description: "Mention", group: "User who clicked" },
  { name: "userName", sample: "someone", description: "Username", group: "User who clicked" },
  { name: "userID", sample: "1234\u2026", description: "User ID", group: "User who clicked" },
  { name: "userAvatar", sample: "https://cdn.discordapp.com/embed/avatars/0.png", description: "Avatar URL", group: "User who clicked" }
];
function mergeVariables(...lists) {
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (const list of lists) {
    for (const v of list ?? []) {
      if (seen.has(v.name)) continue;
      seen.add(v.name);
      out.push(v);
    }
  }
  return out;
}
function applyVariableSamples(list, samples) {
  if (!samples) return list;
  return list.map((v) => samples[v.name] !== void 0 ? { ...v, sample: samples[v.name] } : v);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ACCENT_PRESETS,
  BLOCK_DESCRIPTIONS,
  BLOCK_LABELS,
  BUTTON_STYLE_OPTIONS,
  BUTTON_STYLE_VALUES,
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
  makeActionRow,
  makeBlock,
  makeButton,
  makeChildBlock,
  makeContainer,
  makeFile,
  makeMediaGallery,
  makeSection,
  makeSeparator,
  makeText,
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
});
