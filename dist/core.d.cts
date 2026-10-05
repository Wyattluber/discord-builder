type Id = string;
declare const BUTTON_STYLE_VALUES: {
    readonly primary: 1;
    readonly secondary: 2;
    readonly success: 3;
    readonly danger: 4;
    readonly link: 5;
};
type ButtonStyleName = keyof typeof BUTTON_STYLE_VALUES;
/**
 * Click behaviour, as the host app defines it. Not part of the Discord payload:
 * the builder carries this through the model untouched, the serializer drops it,
 * and the host stores it keyed by customId to execute in its interactionCreate
 * handler. The shape is whatever that host's editor writes (see
 * `integrations.actionEditor`); `ButtonAction` below is the one the shipped
 * editor uses.
 */
type ButtonActionData = Record<string, unknown>;
type ButtonActionType = "none" | "send_channel" | "send_dm" | "reply";
/** The action shape of the shipped editor (ButtonActions.tsx). */
type ButtonAction = {
    type: ButtonActionType;
    /** Target channel for `send_channel`. */
    channelId?: string;
    /** Plain-text message the bot sends (supports %variables%, incl. %user%). */
    content?: string;
    /** When true, the response is a full builder message (`model`) instead of `content`. */
    rich?: boolean;
    /** Rich response, edited in a nested builder (serialized on send). */
    model?: MessageModel;
    /** For `reply`: visible only to the clicker (default true). */
    ephemeral?: boolean;
};
interface ButtonNode {
    id: Id;
    style: ButtonStyleName;
    label?: string;
    /** Unicode emoji (e.g. "🎉") or a custom emoji literal "<:name:id>". */
    emoji?: string;
    /** Used for every style except `link`. */
    customId?: string;
    /** Used only for the `link` style. */
    url?: string;
    disabled?: boolean;
    /** Optional click behaviour executed by the bot (see ButtonActionData). */
    action?: ButtonActionData;
}
interface TextNode {
    type: "text";
    id: Id;
    content: string;
}
type SeparatorSpacing = "small" | "large";
interface SeparatorNode {
    type: "separator";
    id: Id;
    divider: boolean;
    spacing: SeparatorSpacing;
}
interface ThumbnailAccessory {
    kind: "thumbnail";
    url: string;
    description?: string;
    spoiler?: boolean;
}
interface ButtonAccessory {
    kind: "button";
    button: ButtonNode;
}
type SectionAccessory = ThumbnailAccessory | ButtonAccessory;
interface SectionNode {
    type: "section";
    id: Id;
    /** 1-3 lines of text shown left of the accessory. */
    texts: string[];
    accessory: SectionAccessory;
}
interface MediaItem {
    id: Id;
    url: string;
    description?: string;
    spoiler?: boolean;
}
interface MediaGalleryNode {
    type: "media_gallery";
    id: Id;
    items: MediaItem[];
}
interface FileNode {
    type: "file";
    id: Id;
    /** Must reference an attached file, e.g. "attachment://image.png". */
    url: string;
    spoiler?: boolean;
}
interface ActionRowNode {
    type: "action_row";
    id: Id;
    buttons: ButtonNode[];
}
interface ContainerNode {
    type: "container";
    id: Id;
    /** 0xRRGGBB accent bar, or null for none. */
    accentColor?: number | null;
    spoiler?: boolean;
    children: ContainerChild[];
}
/** Anything that may live inside a container (containers cannot nest). */
type ContainerChild = TextNode | SectionNode | SeparatorNode | MediaGalleryNode | FileNode | ActionRowNode;
/** Any top-level block. */
type RootNode = ContainerNode | ContainerChild;
type AnyNode = RootNode;
interface MessageModel {
    components: RootNode[];
}
interface TemplateVariable {
    /** Name without the percent signs, e.g. "prize". */
    name: string;
    /** Sample value used in the live preview. */
    sample?: string;
    /** Short human description shown in the inserter. */
    description?: string;
    /** Group heading in the inserter (e.g. "Global", "This message"). */
    group?: string;
}

/** Flag you must set when sending a Components V2 message (1 << 15). */
declare const IS_COMPONENTS_V2 = 32768;
/** Discord's documented per-message ceilings (used for soft warnings). */
declare const LIMITS: {
    readonly totalComponents: 40;
    readonly actionRowButtons: 5;
    readonly sectionTexts: 3;
    readonly galleryItems: 10;
    readonly textDisplayChars: 4000;
    readonly buttonLabelChars: 80;
};
declare const BUTTON_STYLE_OPTIONS: {
    value: ButtonStyleName;
    label: string;
}[];
declare const ACCENT_PRESETS: {
    name: string;
    value: number;
}[];
declare function uid(prefix?: string): Id;
declare function makeButton(style?: ButtonStyleName): ButtonNode;
declare function makeText(content?: string): TextNode;
declare function makeSeparator(): SeparatorNode;
declare function makeSection(): SectionNode;
declare function makeActionRow(): ActionRowNode;
declare function makeMediaGallery(): MediaGalleryNode;
declare function makeFile(): FileNode;
declare function makeContainer(): ContainerNode;
/** Block kinds that may be added at the top level. */
declare const ROOT_BLOCK_KINDS: readonly ["container", "text", "section", "separator", "media_gallery", "file", "action_row"];
/** Block kinds allowed inside a container (everything except nested containers). */
declare const CHILD_BLOCK_KINDS: readonly ["text", "section", "separator", "media_gallery", "file", "action_row"];
type BlockKind = (typeof ROOT_BLOCK_KINDS)[number];
declare const BLOCK_LABELS: Record<BlockKind, string>;
declare const BLOCK_DESCRIPTIONS: Record<BlockKind, string>;
declare function makeBlock(kind: BlockKind): RootNode;
declare function makeChildBlock(kind: Exclude<BlockKind, "container">): ContainerChild;
/** A starter message: one branded container holding an empty text block. */
declare function emptyMessage(): {
    components: RootNode[];
};
/** A minimal starter: a single text block (for plain messages). */
declare function startingMessage(): {
    components: RootNode[];
};
/** A color number as a CSS hex string, or undefined when there is none. */
declare function hexOf(color?: number | null): string | undefined;

interface SerializedMessage {
    flags: number;
    components: unknown[];
}
interface ValidationIssue {
    level: "error" | "warning";
    path: string;
    message: string;
}
declare function serialize(model: MessageModel): SerializedMessage;
/** Pretty JSON of just the components array (handy for copy / storage). */
declare function serializeJson(model: MessageModel, indent?: number): string;
/** Every node the message carries, children included; Discord caps the total. */
declare function countComponents(nodes: RootNode[]): number;
declare function validate(model: MessageModel): ValidationIssue[];

/**
 * Accepts either a `{ components: [...] }` payload or a bare components array.
 * Returns an empty model on malformed input rather than throwing.
 */
declare function deserialize(input: unknown): MessageModel;

interface PlaceholderSyntax {
    /** Opening mark, e.g. "%" or "{{". */
    open: string;
    /** Closing mark, e.g. "%" or "}}". */
    close: string;
}
declare const PERCENT_PLACEHOLDERS: PlaceholderSyntax;
/** The placeholder for a variable name, e.g. "botName" → "%botName%". */
declare function wrapVariable(name: string, syntax?: PlaceholderSyntax): string;
/** Matches one placeholder; capture group 1 is the variable name. */
declare function variablePattern(syntax?: PlaceholderSyntax, flags?: string): RegExp;
/**
 * Matches a placeholder that is still being typed: the opening mark plus the
 * word characters after it, anchored at the end of the text before the caret.
 */
declare function partialVariablePattern(syntax?: PlaceholderSyntax): RegExp;
/**
 * Matches the tail of a placeholder: word characters followed by the closing
 * mark, anchored at the start. Tells a caret sitting inside a finished
 * placeholder apart from one typing a new name.
 */
declare function closingVariablePattern(syntax?: PlaceholderSyntax): RegExp;
/** Replaces every placeholder with its value, leaving unknown names in place. */
declare function substituteVariables(text: string, values: Record<string, string>, syntax?: PlaceholderSyntax): string;

/** Bot identity, server identity and time. Resolvable in every message. */
declare const DISCORD_VARIABLES: TemplateVariable[];
/**
 * Variables that only resolve when a specific user triggered the message, i.e.
 * inside a button's click response. They are NOT available in a broadcast
 * message (there is no clicker), so only offer them in that context.
 */
declare const CLICKER_VARIABLES: TemplateVariable[];
/**
 * Concatenates variable lists, first entry per name winning. Order therefore
 * carries meaning: pass the contextual list first, the presets last, so a
 * context-specific sample or description survives and a name offered twice
 * cannot show up twice in the palette.
 */
declare function mergeVariables(...lists: (TemplateVariable[] | undefined)[]): TemplateVariable[];
/** Replaces preset samples with the live values a host knows, keyed by name. */
declare function applyVariableSamples(list: TemplateVariable[], samples: Record<string, string> | undefined): TemplateVariable[];

export { ACCENT_PRESETS, type ActionRowNode, type AnyNode, BLOCK_DESCRIPTIONS, BLOCK_LABELS, BUTTON_STYLE_OPTIONS, BUTTON_STYLE_VALUES, type BlockKind, type ButtonAccessory, type ButtonAction, type ButtonActionData, type ButtonActionType, type ButtonNode, type ButtonStyleName, CHILD_BLOCK_KINDS, CLICKER_VARIABLES, type ContainerChild, type ContainerNode, DISCORD_VARIABLES, type FileNode, IS_COMPONENTS_V2, type Id, LIMITS, type MediaGalleryNode, type MediaItem, type MessageModel, PERCENT_PLACEHOLDERS, type PlaceholderSyntax, ROOT_BLOCK_KINDS, type RootNode, type SectionAccessory, type SectionNode, type SeparatorNode, type SeparatorSpacing, type SerializedMessage, type TemplateVariable, type TextNode, type ThumbnailAccessory, type ValidationIssue, applyVariableSamples, closingVariablePattern, countComponents, deserialize, emptyMessage, hexOf, makeActionRow, makeBlock, makeButton, makeChildBlock, makeContainer, makeFile, makeMediaGallery, makeSection, makeSeparator, makeText, mergeVariables, partialVariablePattern, serialize, serializeJson, startingMessage, substituteVariables, uid, validate, variablePattern, wrapVariable };
