// Optional %variable% presets, plus the two helpers every host needs to
// assemble its own list.
//
// The builder itself knows no variables: whatever `variables` a host passes is
// the whole offer, and passing none turns the palette, the % button and the
// autocomplete off. A project that wants the usual Discord set spreads the
// presets below; a project with its own vocabulary ignores them. Samples are
// neutral placeholders for the preview only - the host overrides them with
// live values (see applyVariableSamples).

import type { TemplateVariable } from "./types";

/** Bot identity, server identity and time. Resolvable in every message. */
export const DISCORD_VARIABLES: TemplateVariable[] = [
  { name: "botName", sample: "Your Bot", description: "The bot's name", group: "General" },
  { name: "botID", sample: "1349…", description: "The bot's user ID", group: "General" },
  { name: "botAvatar", sample: "https://cdn.discordapp.com/embed/avatars/0.png", description: "URL of the bot's avatar", group: "General" },
  { name: "botTag", sample: "yourbot", description: "The bot's tag", group: "General" },
  { name: "botMention", sample: "@Your Bot", description: "Mention of the bot", group: "General" },
  { name: "guildName", sample: "Your Server", description: "The server's name", group: "General" },
  { name: "guildID", sample: "1234…", description: "The server's ID", group: "General" },
  { name: "guildIcon", sample: "https://cdn.discordapp.com/embed/avatars/0.png", description: "URL of the server icon", group: "General" },
  { name: "timestamp", sample: "16:20", description: "Short date and time in the reader's timezone", group: "General" },
  { name: "shortTime", sample: "16:20", description: "Short time", group: "General" },
  { name: "longTime", sample: "16:20:30", description: "Long time", group: "General" },
  { name: "shortDate", sample: "30/06/2026", description: "Short date", group: "General" },
  { name: "longDate", sample: "30 June 2026", description: "Long date", group: "General" },
  { name: "shortDateTime", sample: "30 June 2026 16:20", description: "Short date and time", group: "General" },
  { name: "longDateTime", sample: "Tuesday, 30 June 2026 16:20", description: "Long date and time", group: "General" },
  { name: "relativeTime", sample: "2 minutes ago", description: "Relative time", group: "General" },
];

/**
 * Variables that only resolve when a specific user triggered the message, i.e.
 * inside a button's click response. They are NOT available in a broadcast
 * message (there is no clicker), so only offer them in that context.
 */
export const CLICKER_VARIABLES: TemplateVariable[] = [
  { name: "user", sample: "@you", description: "Mention", group: "User who clicked" },
  { name: "userName", sample: "someone", description: "Username", group: "User who clicked" },
  { name: "userID", sample: "1234…", description: "User ID", group: "User who clicked" },
  { name: "userAvatar", sample: "https://cdn.discordapp.com/embed/avatars/0.png", description: "Avatar URL", group: "User who clicked" },
];

/**
 * Concatenates variable lists, first entry per name winning. Order therefore
 * carries meaning: pass the contextual list first, the presets last, so a
 * context-specific sample or description survives and a name offered twice
 * cannot show up twice in the palette.
 */
export function mergeVariables(...lists: (TemplateVariable[] | undefined)[]): TemplateVariable[] {
  const seen = new Set<string>();
  const out: TemplateVariable[] = [];
  for (const list of lists) {
    for (const v of list ?? []) {
      if (seen.has(v.name)) continue;
      seen.add(v.name);
      out.push(v);
    }
  }
  return out;
}

/** Replaces preset samples with the live values a host knows, keyed by name. */
export function applyVariableSamples(
  list: TemplateVariable[],
  samples: Record<string, string> | undefined,
): TemplateVariable[] {
  if (!samples) return list;
  return list.map((v) => (samples[v.name] !== undefined ? { ...v, sample: samples[v.name] } : v));
}
