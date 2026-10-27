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
  buttonLabelChars: 80,
  // Classic messages: the text, the embeds and the rows under them
  contentChars: 2e3,
  embeds: 10,
  embedTitleChars: 256,
  embedDescriptionChars: 4096,
  embedFields: 25,
  embedFieldNameChars: 256,
  embedFieldValueChars: 1024,
  embedFooterChars: 2048,
  embedAuthorNameChars: 256,
  /** Title, description, field names and values, footer and author name across all embeds. */
  embedTotalChars: 6e3,
  actionRows: 5
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
function makeEmbedField() {
  return { id: uid("fld"), name: "", value: "", inline: false };
}
function makeEmbed() {
  return {
    id: uid("emb"),
    color: ACCENT_PRESETS[0].value,
    author: { name: "", url: "", iconUrl: "" },
    title: "",
    url: "",
    description: "",
    fields: [],
    imageUrl: "",
    thumbnailUrl: "",
    footer: { text: "", iconUrl: "" },
    timestamp: false
  };
}
function emptyEmbedMessage() {
  return { format: "embeds", content: "", embeds: [makeEmbed()], components: [] };
}
function messageFormat(model) {
  return model.format === "embeds" ? "embeds" : "components";
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
function embedToApi(e) {
  const out = {};
  if (e.author.name) {
    const author = { name: e.author.name };
    if (e.author.url) author.url = e.author.url;
    if (e.author.iconUrl) author.icon_url = e.author.iconUrl;
    out.author = author;
  }
  if (e.title) out.title = e.title;
  if (e.url) out.url = e.url;
  if (e.description) out.description = e.description;
  if (e.fields.length > 0) {
    out.fields = e.fields.map((f) => {
      const field = { name: f.name, value: f.value };
      if (f.inline) field.inline = true;
      return field;
    });
  }
  if (e.imageUrl) out.image = { url: e.imageUrl };
  if (e.thumbnailUrl) out.thumbnail = { url: e.thumbnailUrl };
  if (e.footer.text) {
    const footer = { text: e.footer.text };
    if (e.footer.iconUrl) footer.icon_url = e.footer.iconUrl;
    out.footer = footer;
  }
  if (e.timestamp) out.timestamp = "now";
  if (e.color != null) out.color = e.color;
  return out;
}
function serialize(model) {
  if (messageFormat(model) === "embeds") {
    return {
      ...model.content ? { content: model.content } : {},
      embeds: (model.embeds ?? []).map(embedToApi),
      // Without the V2 flag Discord takes nothing but action rows here
      components: model.components.filter((n) => n.type === "action_row").map(rootToApi)
    };
  }
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
function countEmbedChars(embeds) {
  let n = 0;
  for (const e of embeds) {
    n += e.title.length + e.description.length + e.author.name.length + e.footer.text.length;
    for (const f of e.fields) n += f.name.length + f.value.length;
  }
  return n;
}
function isEmptyEmbed(e) {
  return !e.title.trim() && !e.description.trim() && e.fields.length === 0 && !e.imageUrl.trim() && !e.thumbnailUrl.trim() && !e.author.name.trim() && !e.footer.text.trim();
}
function tooLong(text, max, what, path, issues) {
  if (text.length > max) issues.push({ level: "error", path, message: `${what} is longer than ${max} characters.` });
}
function validateEmbedMessage(model, issues) {
  const content = model.content ?? "";
  const embeds = model.embeds ?? [];
  const rows = model.components.filter((n) => n.type === "action_row");
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
      const fieldPath = `${path} \u203A field ${j + 1}`;
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
var str = (v) => typeof v === "string" ? v : "";
function embedFromApi(e) {
  return {
    id: uid("emb"),
    color: typeof e?.color === "number" ? e.color : null,
    author: { name: str(e?.author?.name), url: str(e?.author?.url), iconUrl: str(e?.author?.icon_url) },
    title: str(e?.title),
    url: str(e?.url),
    description: str(e?.description),
    fields: (Array.isArray(e?.fields) ? e.fields : []).map((f) => ({
      id: uid("fld"),
      name: str(f?.name),
      value: str(f?.value),
      inline: !!f?.inline
    })),
    imageUrl: str(e?.image?.url),
    thumbnailUrl: str(e?.thumbnail?.url),
    footer: { text: str(e?.footer?.text), iconUrl: str(e?.footer?.icon_url) },
    // "now" as stored, or the ISO time of a message fetched from Discord
    timestamp: !!e?.timestamp
  };
}
function deserialize(input) {
  if (input && !Array.isArray(input) && Array.isArray(input.embeds)) {
    const raw = input;
    return {
      format: "embeds",
      content: str(raw.content),
      embeds: raw.embeds.map(embedFromApi),
      components: (Array.isArray(raw.components) ? raw.components : []).map(rootFromApi).filter((n) => n?.type === "action_row")
    };
  }
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

export {
  BUTTON_STYLE_VALUES,
  IS_COMPONENTS_V2,
  LIMITS,
  BUTTON_STYLE_OPTIONS,
  ACCENT_PRESETS,
  uid,
  makeButton,
  makeText,
  makeSeparator,
  makeSection,
  makeActionRow,
  makeMediaGallery,
  makeFile,
  makeContainer,
  ROOT_BLOCK_KINDS,
  CHILD_BLOCK_KINDS,
  BLOCK_LABELS,
  BLOCK_DESCRIPTIONS,
  makeBlock,
  makeChildBlock,
  emptyMessage,
  startingMessage,
  makeEmbedField,
  makeEmbed,
  emptyEmbedMessage,
  messageFormat,
  hexOf,
  serialize,
  serializeJson,
  countComponents,
  countEmbedChars,
  isEmptyEmbed,
  validate,
  deserialize,
  PERCENT_PLACEHOLDERS,
  wrapVariable,
  variablePattern,
  partialVariablePattern,
  closingVariablePattern,
  substituteVariables,
  DISCORD_VARIABLES,
  CLICKER_VARIABLES,
  mergeVariables,
  applyVariableSamples
};
