// src/emoji-data.ts
import emojiData from "unicode-emoji-json";
var ALL_EMOJIS = Object.entries(emojiData).map(([char, info]) => ({
  char,
  keywords: `${info.name} ${info.slug}`.toLowerCase().replace(/_/g, " "),
  // Discord-style :shortcode: (unicode-emoji-json's slug, e.g. "crying_face").
  shortcode: info.slug
}));
var COMMON_CHARS = [
  "\u{1F600}",
  "\u{1F601}",
  "\u{1F602}",
  "\u{1F923}",
  "\u{1F60A}",
  "\u{1F609}",
  "\u{1F60D}",
  "\u{1F970}",
  "\u{1F618}",
  "\u{1F60E}",
  "\u{1F914}",
  "\u{1F60F}",
  "\u{1F634}",
  "\u{1F62D}",
  "\u{1F621}",
  "\u{1F973}",
  "\u{1F631}",
  "\u{1F644}",
  "\u{1F605}",
  "\u{1F917}",
  "\u{1F929}",
  "\u{1F60B}",
  "\u{1F61C}",
  "\u{1F92A}",
  "\u{1F610}",
  "\u{1F928}",
  "\u{1F633}",
  "\u{1F97A}",
  "\u{1F608}",
  "\u{1F480}",
  "\u{1F921}",
  "\u{1F916}",
  "\u{1F47B}",
  "\u{1F4A9}",
  "\u{1F44D}",
  "\u{1F44E}",
  "\u{1F44F}",
  "\u{1F64C}",
  "\u{1F64F}",
  "\u{1F91D}",
  "\u{1F4AA}",
  "\u{1F440}",
  "\u{1F44B}",
  "\u270C\uFE0F",
  "\u{1F91E}",
  "\u{1F44C}",
  "\u{1F919}",
  "\u{1FAF6}",
  "\u{1FAE1}",
  "\u2764\uFE0F",
  "\u{1F9E1}",
  "\u{1F49B}",
  "\u{1F49A}",
  "\u{1F499}",
  "\u{1F49C}",
  "\u{1F5A4}",
  "\u{1F90D}",
  "\u{1F496}",
  "\u{1F494}",
  "\u{1F525}",
  "\u2705",
  "\u274C",
  "\u26A0\uFE0F",
  "\u2753",
  "\u2757",
  "\u{1F4AF}",
  "\u2728",
  "\u2B50",
  "\u{1F31F}",
  "\u{1F4AB}",
  "\u26A1",
  "\u{1F4A5}",
  "\u{1F389}",
  "\u{1F38A}",
  "\u{1F381}",
  "\u{1F3C6}",
  "\u{1F947}",
  "\u{1F451}",
  "\u{1F48E}",
  "\u{1F4B0}",
  "\u{1F6D2}",
  "\u{1F514}",
  "\u{1F4E2}",
  "\u{1F4CC}",
  "\u{1F4CE}",
  "\u{1F517}",
  "\u{1F512}",
  "\u{1F511}",
  "\u23F0",
  "\u23F3",
  "\u{1F680}",
  "\u{1F3AE}",
  "\u{1F4BB}",
  "\u{1F4F1}",
  "\u{1F7E2}",
  "\u{1F534}",
  "\u{1F7E1}",
  "\u{1F7E3}",
  "\u{1F535}",
  "\u26AA",
  "\u26AB",
  "\u27A1\uFE0F",
  "\u2B05\uFE0F",
  "\u2B06\uFE0F",
  "\u2B07\uFE0F"
];
var BY_CHAR = new Map(ALL_EMOJIS.map((e) => [e.char, e]));
var COMMON_EMOJIS = COMMON_CHARS.map((char) => {
  const found = BY_CHAR.get(char);
  return { char, keywords: found?.keywords ?? "", shortcode: found?.shortcode ?? "" };
});
function searchEmojis(query, limit = 240) {
  const q = query.trim().toLowerCase();
  if (!q) return COMMON_EMOJIS;
  const out = [];
  for (const e of ALL_EMOJIS) {
    if (e.keywords.includes(q)) {
      out.push(e);
      if (out.length >= limit) break;
    }
  }
  return out;
}
function searchShortcodes(query, limit = 8) {
  const q = query.trim().toLowerCase().replace(/:/g, "");
  if (!q) return [];
  const starts = [];
  const contains = [];
  for (const e of ALL_EMOJIS) {
    if (!e.shortcode) continue;
    if (e.shortcode.startsWith(q)) starts.push(e);
    else if (e.shortcode.includes(q)) contains.push(e);
    if (starts.length >= limit) break;
  }
  return [...starts, ...contains].slice(0, limit);
}
export {
  ALL_EMOJIS,
  COMMON_EMOJIS,
  searchEmojis,
  searchShortcodes
};
