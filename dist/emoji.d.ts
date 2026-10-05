interface UnicodeEmoji {
    char: string;
    keywords: string;
    shortcode: string;
}
declare const ALL_EMOJIS: UnicodeEmoji[];
declare const COMMON_EMOJIS: UnicodeEmoji[];
/** Search the full set by keyword, capped so the grid never renders thousands. */
declare function searchEmojis(query: string, limit?: number): UnicodeEmoji[];
/**
 * Matches a typed :shortcode: fragment, Discord-style, prefix hits first.
 * `query` is the text after the colon.
 */
declare function searchShortcodes(query: string, limit?: number): UnicodeEmoji[];

export { ALL_EMOJIS, COMMON_EMOJIS, type UnicodeEmoji, searchEmojis, searchShortcodes };
