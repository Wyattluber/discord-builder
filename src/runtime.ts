// The bot side of the builder: variable substitution, media resolution (a
// stored URL becomes attachment://) and the raw REST send and edit of a
// Components V2 payload.
//
// Host-free by design: no database, no app-specific variables, no discord.js.
// Where a payload points at media, the caller passes a resolver (the `media`
// option); sending takes anything with a discord.js-style `rest.post` and
// `rest.patch`, so a client from discord.js works as it is.

/** How a variable is written in a stored payload, e.g. `%name%` or `{{name}}`. */
export interface PlaceholderSyntax {
  open: string;
  close: string;
}

export const PERCENT_PLACEHOLDERS: PlaceholderSyntax = { open: '%', close: '%' };

/** Discord's IS_COMPONENTS_V2 message flag (1 << 15). */
export const COMPONENTS_V2_FLAG = 1 << 15;

/** A file to upload with the message. */
export interface MessageFile {
  name: string;
  data: unknown;
}

/** Finds the media a payload points at and loads it. */
export interface MediaResolver {
  /** Matches a stored media URL; capture group 1 is the asset id. */
  match: RegExp;
  /** The asset, or null when there is none (the URL then stays as it is). */
  load: (id: string) => { name?: string | null; data: unknown } | null | undefined;
}

export interface AllowedMentions {
  parse: string[];
  roles?: string[];
  users?: string[];
}

export interface PreparedPayload {
  components: unknown[];
  files: MessageFile[];
  allowedMentions: AllowedMentions;
}

export interface PrepareOptions {
  syntax?: PlaceholderSyntax;
  media?: MediaResolver | null;
}

/** Anything that can send REST requests the way discord.js's `client.rest` does. */
export interface RestClient {
  rest: {
    post: (route: `/${string}`, options: { body: unknown; files?: MessageFile[] }) => Promise<unknown>;
    patch: (route: `/${string}`, options: { body: unknown; files?: MessageFile[] }) => Promise<unknown>;
  };
}

export interface SendOptions {
  files?: MessageFile[];
  allowedMentions?: AllowedMentions;
}

type Json = any;

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Matches one placeholder; capture group 1 is the variable name. */
export function variablePattern(syntax: PlaceholderSyntax = PERCENT_PLACEHOLDERS, flags = ''): RegExp {
  return new RegExp(`${escapeRe(syntax.open)}(\\w+)${escapeRe(syntax.close)}`, flags);
}

/** Deep-clones `value`, replacing every placeholder in every string. Unknown names stay as they are. */
export function substituteVars<T>(value: T, vars: Record<string, unknown>, syntax: PlaceholderSyntax = PERCENT_PLACEHOLDERS): T {
  if (typeof value === 'string') {
    return value.replace(variablePattern(syntax, 'g'), (match, key: string) => (vars[key] !== undefined ? String(vars[key]) : match)) as T;
  }
  if (Array.isArray(value)) return value.map((v) => substituteVars(v, vars, syntax)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, substituteVars(v, vars, syntax)])) as T;
  }
  return value;
}

/**
 * Walks a payload, finds the media URLs the resolver recognises, loads them
 * and rewrites the URLs to attachment://. MUTATES the payload. Returns the
 * files to upload alongside the message. Without a resolver, URLs are left alone.
 */
export function collectMediaAttachments(payload: Json, media?: MediaResolver | null): MessageFile[] {
  const files: MessageFile[] = [];
  if (!media?.match || !media?.load) return files;
  const seen = new Map<string, string>(); // media id -> filename

  const walk = (value: Json) => {
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (!value || typeof value !== 'object') return;

    for (const [key, val] of Object.entries(value)) {
      if (key === 'url' && typeof val === 'string') {
        const match = val.match(media.match);
        if (!match) continue;
        const id = match[1];
        if (!seen.has(id)) {
          const asset = media.load(id);
          if (!asset) continue;
          const filename = `${id}-${String(asset.name ?? 'file').replace(/[^\w.-]/g, '_')}`;
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

// A URL that stayed empty or still contains a variable after substitution
// (an icon variable on a server without an icon): Discord rejects those
const unresolvedUrl = (url: unknown, syntax: PlaceholderSyntax) => typeof url !== 'string' || url.trim() === ''
  || variablePattern(syntax).test(url);

/**
 * Drops media whose URL did not resolve. Sections (type 9) REQUIRE an
 * accessory, so a section with a broken thumbnail is unwrapped into its
 * text components instead of being sent invalid. MUTATES the payload.
 */
function stripUnresolvedMedia(value: Json, syntax: PlaceholderSyntax = PERCENT_PLACEHOLDERS) {
  if (Array.isArray(value)) {
    value.forEach((v) => stripUnresolvedMedia(v, syntax));
    return;
  }
  if (!value || typeof value !== 'object') return;

  if (Array.isArray(value.components)) {
    value.components = value.components.flatMap((child: Json) => {
      if (child?.type === 9 && child.accessory?.type === 11
        && unresolvedUrl(child.accessory.media?.url, syntax)) {
        return child.components ?? [];
      }
      // Media gallery: drop broken items, drop the whole gallery when empty
      if (child?.type === 12 && Array.isArray(child.items)) {
        child.items = child.items.filter((item: Json) => !unresolvedUrl(item?.media?.url, syntax));
        if (child.items.length === 0) return [];
      }
      return [child];
    });
  }
  for (const v of Object.values(value)) stripUnresolvedMedia(v, syntax);
}

/**
 * Drops link buttons whose URL did not resolve (an optional invite variable
 * that is empty), the action rows that emptied, and unwraps a section whose
 * accessory was such a button, since a section must keep an accessory.
 * MUTATES the payload.
 */
function stripUnresolvedLinks(value: Json, syntax: PlaceholderSyntax = PERCENT_PLACEHOLDERS) {
  if (Array.isArray(value)) {
    value.forEach((v) => stripUnresolvedLinks(v, syntax));
    return;
  }
  if (!value || typeof value !== 'object') return;

  const deadLink = (b: Json) => b?.type === 2 && b.style === 5 && unresolvedUrl(b.url, syntax);
  if (Array.isArray(value.components)) {
    value.components = value.components.flatMap((child: Json) => {
      if (child?.type === 9 && deadLink(child.accessory)) return child.components ?? [];
      if (child?.type === 1 && Array.isArray(child.components)) {
        child.components = child.components.filter((b: Json) => !deadLink(b));
        if (child.components.length === 0) return [];
      }
      return [child];
    });
  }
  for (const v of Object.values(value)) stripUnresolvedLinks(v, syntax);
}

/**
 * Drops text displays that came out blank after substitution: an optional
 * variable on its own line otherwise leaves an empty content, which Discord
 * rejects with a 400. Containers left without any content are dropped too.
 */
function stripEmptyText(value: Json) {
  if (Array.isArray(value)) {
    value.forEach(stripEmptyText);
    return;
  }
  if (!value || typeof value !== 'object') return;

  if (Array.isArray(value.components)) {
    value.components.forEach(stripEmptyText);
    value.components = value.components.filter((child: Json) => {
      if (child?.type === 10) return String(child.content ?? '').trim().length > 0;
      // Container/section emptied by the filter above carries nothing left
      if ((child?.type === 17 || child?.type === 9) && Array.isArray(child.components)) {
        return child.components.length > 0;
      }
      return true;
    });
  }
}

function restBody(components: unknown[], files: MessageFile[], allowedMentions?: AllowedMentions) {
  const body: Record<string, unknown> = {
    flags: COMPONENTS_V2_FLAG,
    components,
    allowed_mentions: allowedMentions ?? { parse: [] },
  };
  if (files.length > 0) {
    body.attachments = files.map((f, i) => ({ id: i, filename: f.name }));
  }
  return body;
}

/** Sends a Components V2 message via raw REST. Returns the raw message data. */
export async function sendComponentsMessage(client: RestClient, channelId: string, components: unknown[], options: SendOptions = {}) {
  const files = options.files ?? [];
  return client.rest.post(`/channels/${channelId}/messages`, {
    body: restBody(components, files, options.allowedMentions),
    files,
  });
}

/** Edits an existing Components V2 message via raw REST. */
export async function editComponentsMessage(client: RestClient, channelId: string, messageId: string, components: unknown[], options: SendOptions = {}) {
  const files = options.files ?? [];
  return client.rest.patch(`/channels/${channelId}/messages/${messageId}`, {
    body: restBody(components, files, options.allowedMentions),
    files,
  });
}

/**
 * Mentions the author wrote into the template themselves may ping; text
 * that arrives through a variable (a member's reason, a form answer) never
 * may. So the allow list is read from the template before substitution:
 * @everyone/@here, each role, each user.
 */
export function mentionsInTemplate(rawPayload: unknown): AllowedMentions {
  const text = typeof rawPayload === 'string' ? rawPayload : JSON.stringify(rawPayload ?? {});
  const parse = /@(everyone|here)\b/.test(text) ? ['everyone'] : [];
  const roles = [...new Set([...text.matchAll(/<@&(\d+)>/g)].map((m) => m[1]))];
  const users = [...new Set([...text.matchAll(/<@!?(\d+)>/g)].map((m) => m[1]))];
  return { parse, roles, users };
}

/**
 * Prepares a stored payload for sending: substitute variables, drop what did
 * not resolve, resolve media. `rawPayload` is the stored JSON (string or
 * object) with a `components` array.
 */
export function preparePayload(rawPayload: unknown, vars: Record<string, unknown>, { syntax = PERCENT_PLACEHOLDERS, media = null }: PrepareOptions = {}): PreparedPayload {
  const template = typeof rawPayload === 'string' ? JSON.parse(rawPayload) : rawPayload;
  const payload: Json = substituteVars(template, vars, syntax);
  stripUnresolvedMedia(payload, syntax);
  stripUnresolvedLinks(payload, syntax);
  stripEmptyText(payload);
  const files = collectMediaAttachments(payload, media);
  return {
    components: payload?.components ?? [],
    files,
    allowedMentions: payload?.allowed_mentions ?? mentionsInTemplate(template),
  };
}

/**
 * A stored payload prepared for sending, or null when there is none, it
 * does not parse, or it renders to nothing: the caller then uses its
 * built-in message. `label` names the payload in the log so a broken one
 * can be found.
 */
export function preparedOrNull(rawPayload: unknown, vars: Record<string, unknown>, options: PrepareOptions & { label?: string } = {}): PreparedPayload | null {
  if (!rawPayload) return null;
  try {
    const prepared = preparePayload(rawPayload, vars, options);
    return prepared.components.length > 0 ? prepared : null;
  } catch (err) {
    console.error(`[Builder] Invalid ${options.label} payload, using default:`, (err as Error).message);
    return null;
  }
}
