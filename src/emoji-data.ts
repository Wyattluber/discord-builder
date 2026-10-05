// Unicode emoji data. The full set (ALL_EMOJIS) powers search; a small curated
// subset (COMMON_EMOJIS) is shown by default to keep the picker snappy. Custom
// server emoji are handled separately (searched by their name).
//
// The dataset behind this file weighs more than the rest of the builder, so
// the editor never imports it statically: the picker loads it with import()
// when it opens, and the bundler keeps it in a chunk of its own. A host that
// wants emoji search outside the builder (a chat composer) imports the
// `emoji` entry, which is this file.

import emojiData from "unicode-emoji-json";

export interface UnicodeEmoji { char: string; keywords: string; shortcode: string }

export const ALL_EMOJIS: UnicodeEmoji[] = Object.entries(emojiData).map(([char, info]) => ({
  char,
  keywords: `${info.name} ${info.slug}`.toLowerCase().replace(/_/g, " "),
  // Discord-style :shortcode: (unicode-emoji-json's slug, e.g. "crying_face").
  shortcode: info.slug,
}));

const COMMON_CHARS = [
  "😀", "😁", "😂", "🤣", "😊", "😉", "😍", "🥰", "😘", "😎",
  "🤔", "😏", "😴", "😭", "😡", "🥳", "😱", "🙄", "😅", "🤗",
  "🤩", "😋", "😜", "🤪", "😐", "🤨", "😳", "🥺", "😈", "💀",
  "🤡", "🤖", "👻", "💩", "👍", "👎", "👏", "🙌", "🙏", "🤝",
  "💪", "👀", "👋", "✌️", "🤞", "👌", "🤙", "🫶", "🫡", "❤️",
  "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💖", "💔", "🔥",
  "✅", "❌", "⚠️", "❓", "❗", "💯", "✨", "⭐", "🌟", "💫",
  "⚡", "💥", "🎉", "🎊", "🎁", "🏆", "🥇", "👑", "💎", "💰",
  "🛒", "🔔", "📢", "📌", "📎", "🔗", "🔒", "🔑", "⏰", "⏳",
  "🚀", "🎮", "💻", "📱", "🟢", "🔴", "🟡", "🟣", "🔵", "⚪",
  "⚫", "➡️", "⬅️", "⬆️", "⬇️",
];

const BY_CHAR = new Map(ALL_EMOJIS.map((e) => [e.char, e]));

export const COMMON_EMOJIS: UnicodeEmoji[] = COMMON_CHARS.map((char) => {
  const found = BY_CHAR.get(char);
  return { char, keywords: found?.keywords ?? "", shortcode: found?.shortcode ?? "" };
});

/** Search the full set by keyword, capped so the grid never renders thousands. */
export function searchEmojis(query: string, limit = 240): UnicodeEmoji[] {
  const q = query.trim().toLowerCase();
  if (!q) return COMMON_EMOJIS;
  const out: UnicodeEmoji[] = [];
  for (const e of ALL_EMOJIS) {
    if (e.keywords.includes(q)) {
      out.push(e);
      if (out.length >= limit) break;
    }
  }
  return out;
}

/**
 * Matches a typed :shortcode: fragment, Discord-style, prefix hits first.
 * `query` is the text after the colon.
 */
export function searchShortcodes(query: string, limit = 8): UnicodeEmoji[] {
  const q = query.trim().toLowerCase().replace(/:/g, "");
  if (!q) return [];
  const starts: UnicodeEmoji[] = [];
  const contains: UnicodeEmoji[] = [];
  for (const e of ALL_EMOJIS) {
    if (!e.shortcode) continue;
    if (e.shortcode.startsWith(q)) starts.push(e);
    else if (e.shortcode.includes(q)) contains.push(e);
    if (starts.length >= limit) break;
  }
  return [...starts, ...contains].slice(0, limit);
}
