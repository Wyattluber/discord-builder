// src/runtime.ts
var PERCENT_PLACEHOLDERS = { open: "%", close: "%" };
var COMPONENTS_V2_FLAG = 1 << 15;
var escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function variablePattern(syntax = PERCENT_PLACEHOLDERS, flags = "") {
  return new RegExp(`${escapeRe(syntax.open)}(\\w+)${escapeRe(syntax.close)}`, flags);
}
function substituteVars(value, vars, syntax = PERCENT_PLACEHOLDERS) {
  if (typeof value === "string") {
    return value.replace(variablePattern(syntax, "g"), (match, key) => vars[key] !== void 0 ? String(vars[key]) : match);
  }
  if (Array.isArray(value)) return value.map((v) => substituteVars(v, vars, syntax));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, substituteVars(v, vars, syntax)]));
  }
  return value;
}
function collectMediaAttachments(payload, media) {
  const files = [];
  if (!media?.match || !media?.load) return files;
  const seen = /* @__PURE__ */ new Map();
  const walk = (value) => {
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (!value || typeof value !== "object") return;
    for (const [key, val] of Object.entries(value)) {
      if (key === "url" && typeof val === "string") {
        const match = val.match(media.match);
        if (!match) continue;
        const id = match[1];
        if (!seen.has(id)) {
          const asset = media.load(id);
          if (!asset) continue;
          const filename = `${id}-${String(asset.name ?? "file").replace(/[^\w.-]/g, "_")}`;
          files.push({ name: filename, data: asset.data });
          seen.set(id, filename);
        }
        value[key] = `attachment://${seen.get(id)}`;
      } else {
        walk(val);
      }
    }
  };
  walk(payload);
  return files;
}
var unresolvedUrl = (url, syntax) => typeof url !== "string" || url.trim() === "" || variablePattern(syntax).test(url);
function stripUnresolvedMedia(value, syntax = PERCENT_PLACEHOLDERS) {
  if (Array.isArray(value)) {
    value.forEach((v) => stripUnresolvedMedia(v, syntax));
    return;
  }
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value.components)) {
    value.components = value.components.flatMap((child) => {
      if (child?.type === 9 && child.accessory?.type === 11 && unresolvedUrl(child.accessory.media?.url, syntax)) {
        return child.components ?? [];
      }
      if (child?.type === 12 && Array.isArray(child.items)) {
        child.items = child.items.filter((item) => !unresolvedUrl(item?.media?.url, syntax));
        if (child.items.length === 0) return [];
      }
      return [child];
    });
  }
  for (const v of Object.values(value)) stripUnresolvedMedia(v, syntax);
}
function stripUnresolvedLinks(value, syntax = PERCENT_PLACEHOLDERS) {
  if (Array.isArray(value)) {
    value.forEach((v) => stripUnresolvedLinks(v, syntax));
    return;
  }
  if (!value || typeof value !== "object") return;
  const deadLink = (b) => b?.type === 2 && b.style === 5 && unresolvedUrl(b.url, syntax);
  if (Array.isArray(value.components)) {
    value.components = value.components.flatMap((child) => {
      if (child?.type === 9 && deadLink(child.accessory)) return child.components ?? [];
      if (child?.type === 1 && Array.isArray(child.components)) {
        child.components = child.components.filter((b) => !deadLink(b));
        if (child.components.length === 0) return [];
      }
      return [child];
    });
  }
  for (const v of Object.values(value)) stripUnresolvedLinks(v, syntax);
}
function stripEmptyText(value) {
  if (Array.isArray(value)) {
    value.forEach(stripEmptyText);
    return;
  }
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value.components)) {
    value.components.forEach(stripEmptyText);
    value.components = value.components.filter((child) => {
      if (child?.type === 10) return String(child.content ?? "").trim().length > 0;
      if ((child?.type === 17 || child?.type === 9) && Array.isArray(child.components)) {
        return child.components.length > 0;
      }
      return true;
    });
  }
}
function restBody(components, files, allowedMentions) {
  const body = {
    flags: COMPONENTS_V2_FLAG,
    components,
    allowed_mentions: allowedMentions ?? { parse: [] }
  };
  if (files.length > 0) {
    body.attachments = files.map((f, i) => ({ id: i, filename: f.name }));
  }
  return body;
}
async function sendComponentsMessage(client, channelId, components, options = {}) {
  const files = options.files ?? [];
  return client.rest.post(`/channels/${channelId}/messages`, {
    body: restBody(components, files, options.allowedMentions),
    files
  });
}
async function editComponentsMessage(client, channelId, messageId, components, options = {}) {
  const files = options.files ?? [];
  return client.rest.patch(`/channels/${channelId}/messages/${messageId}`, {
    body: restBody(components, files, options.allowedMentions),
    files
  });
}
function mentionsInTemplate(rawPayload) {
  const text = typeof rawPayload === "string" ? rawPayload : JSON.stringify(rawPayload ?? {});
  const parse = /@(everyone|here)\b/.test(text) ? ["everyone"] : [];
  const roles = [...new Set([...text.matchAll(/<@&(\d+)>/g)].map((m) => m[1]))];
  const users = [...new Set([...text.matchAll(/<@!?(\d+)>/g)].map((m) => m[1]))];
  return { parse, roles, users };
}
function preparePayload(rawPayload, vars, { syntax = PERCENT_PLACEHOLDERS, media = null } = {}) {
  const template = typeof rawPayload === "string" ? JSON.parse(rawPayload) : rawPayload;
  const payload = substituteVars(template, vars, syntax);
  stripUnresolvedMedia(payload, syntax);
  stripUnresolvedLinks(payload, syntax);
  stripEmptyText(payload);
  const files = collectMediaAttachments(payload, media);
  return {
    components: payload?.components ?? [],
    files,
    allowedMentions: payload?.allowed_mentions ?? mentionsInTemplate(template)
  };
}
function preparedOrNull(rawPayload, vars, options = {}) {
  if (!rawPayload) return null;
  try {
    const prepared = preparePayload(rawPayload, vars, options);
    return prepared.components.length > 0 ? prepared : null;
  } catch (err) {
    console.error(`[Builder] Invalid ${options.label} payload, using default:`, err.message);
    return null;
  }
}
export {
  COMPONENTS_V2_FLAG,
  PERCENT_PLACEHOLDERS,
  collectMediaAttachments,
  editComponentsMessage,
  mentionsInTemplate,
  preparePayload,
  preparedOrNull,
  sendComponentsMessage,
  substituteVars,
  variablePattern
};
