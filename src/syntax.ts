// How a variable is written inside a text: the placeholder syntax.
//
// Percent marks (%name%) are the default, but nothing in the builder assumes
// them: a host that writes {{name}} or {name} passes its own syntax and the
// editor, the autocomplete, the palette and the preview all follow. The
// runtime entry (runtime.ts) takes the same shape on the bot side.

export interface PlaceholderSyntax {
  /** Opening mark, e.g. "%" or "{{". */
  open: string;
  /** Closing mark, e.g. "%" or "}}". */
  close: string;
}

export const PERCENT_PLACEHOLDERS: PlaceholderSyntax = { open: "%", close: "%" };

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The placeholder for a variable name, e.g. "botName" → "%botName%". */
export function wrapVariable(name: string, syntax: PlaceholderSyntax = PERCENT_PLACEHOLDERS): string {
  return `${syntax.open}${name}${syntax.close}`;
}

/** Matches one placeholder; capture group 1 is the variable name. */
export function variablePattern(syntax: PlaceholderSyntax = PERCENT_PLACEHOLDERS, flags = ""): RegExp {
  return new RegExp(`${escape(syntax.open)}(\\w+)${escape(syntax.close)}`, flags);
}

/**
 * Matches a placeholder that is still being typed: the opening mark plus the
 * word characters after it, anchored at the end of the text before the caret.
 */
export function partialVariablePattern(syntax: PlaceholderSyntax = PERCENT_PLACEHOLDERS): RegExp {
  return new RegExp(`${escape(syntax.open)}(\\w*)$`);
}

/**
 * Matches the tail of a placeholder: word characters followed by the closing
 * mark, anchored at the start. Tells a caret sitting inside a finished
 * placeholder apart from one typing a new name.
 */
export function closingVariablePattern(syntax: PlaceholderSyntax = PERCENT_PLACEHOLDERS): RegExp {
  return new RegExp(`^\\w*${escape(syntax.close)}`);
}

/** Replaces every placeholder with its value, leaving unknown names in place. */
export function substituteVariables(
  text: string,
  values: Record<string, string>,
  syntax: PlaceholderSyntax = PERCENT_PLACEHOLDERS,
): string {
  return text.replace(variablePattern(syntax, "g"), (m, name: string) =>
    values[name] != null ? String(values[name]) : m);
}
