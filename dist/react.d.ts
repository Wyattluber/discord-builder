import * as react from 'react';
import react__default, { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes, ComponentType } from 'react';
import { ButtonActionData, TemplateVariable, MessageModel, PlaceholderSyntax } from './core.js';
export { ButtonAction, ButtonActionType, ButtonNode, CLICKER_VARIABLES, ContainerChild, ContainerNode, DISCORD_VARIABLES, IS_COMPONENTS_V2, LIMITS, PERCENT_PLACEHOLDERS, RootNode, SerializedMessage, ValidationIssue, applyVariableSamples, deserialize, emptyMessage, makeBlock, makeContainer, mergeVariables, serialize, serializeJson, startingMessage, substituteVariables, validate, variablePattern, wrapVariable } from './core.js';

/** Uploads an image and resolves to its public URL. Injected by the host app. */
type UploadImageFn = (file: File) => Promise<string>;
/** Uploads any file and resolves to a marker URL. Injected by the host app. */
type UploadFileFn = (file: File) => Promise<string>;
declare function Popover({ trigger, children, align, }: {
    trigger: ReactNode;
    children: (close: () => void) => ReactNode;
    align?: "start" | "end";
}): react.JSX.Element;
declare function EmojiGrid({ onPick }: {
    onPick: (e: string) => void;
}): react.JSX.Element;

interface ActionEditorProps {
    /** Whatever the host stores on the button; undefined until it is set. */
    action: ButtonActionData | undefined;
    onChange: (action: ButtonActionData | undefined) => void;
    /** The variables offered in the response text, if any. */
    variables?: TemplateVariable[];
}
declare function DiscordActionEditor({ action: raw, onChange, variables }: ActionEditorProps): react.JSX.Element;

type Variant = "default" | "secondary" | "outline" | "ghost" | "destructive";
type Size = "default" | "sm" | "lg" | "icon";
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    size?: Size;
}
declare const Button: react.ForwardRefExoticComponent<ButtonProps & react.RefAttributes<HTMLButtonElement>>;
declare const Input: react.ForwardRefExoticComponent<InputHTMLAttributes<HTMLInputElement> & react.RefAttributes<HTMLInputElement>>;
declare const Textarea: react.ForwardRefExoticComponent<TextareaHTMLAttributes<HTMLTextAreaElement> & react.RefAttributes<HTMLTextAreaElement>>;
declare function Switch({ checked, onCheckedChange, disabled, className }: {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    disabled?: boolean;
    className?: string;
}): react.JSX.Element;
declare function Skeleton({ className }: {
    className?: string;
}): react.JSX.Element;
interface ModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    /** Classes for the panel, e.g. a width cap. */
    className?: string;
    children: ReactNode;
}
/**
 * The fallback modal: enough for the media library, no more. It closes on
 * Escape and on a click outside, and it does not lock the page scroll or trap
 * focus - a host that stacks dialogs (as ours does: the builder itself lives in
 * one) passes its own through `integrations.modal`.
 */
declare function Modal({ open, onOpenChange, title, className, children }: ModalProps): react.ReactPortal | null;

interface ChannelLite {
    id: string;
    name: string;
}
interface UserLite {
    id: string;
    name: string;
    avatar?: string | null;
}
interface EmojiLite {
    name: string;
    id: string;
    animated: boolean;
}
interface MediaAsset {
    id: string;
    name: string | null;
    type: string | null;
    size: number;
    url: string;
    created_at: string;
}
interface MediaLibrary {
    list: () => Promise<MediaAsset[]>;
    remove: (id: string) => Promise<void>;
}
/** A reusable saved button action, offered for custom-id autofill/reuse. */
interface SavedButtonAction {
    customId: string;
    label?: string;
    action: ButtonActionData;
}
interface BuilderIntegrations {
    channels?: ChannelLite[];
    searchUsers?: (query: string) => Promise<UserLite[]>;
    emojis?: EmojiLite[];
    media?: MediaLibrary;
    /**
     * Opens a nested builder to edit a rich button-action response. Provided by
     * the host app (it owns the dialog); `save` receives the edited model.
     * Optional so the builder stays portable; without it, button actions only
     * offer plain-text responses.
     */
    editRichMessage?: (initial: MessageModel | undefined, save: (m: MessageModel) => void) => void;
    /**
     * Previously-saved button actions, for custom-id autofill and reuse. When a
     * button's custom id matches one, the editor offers to load its action.
     */
    savedActions?: SavedButtonAction[];
    /**
     * The host's dialog component, used for the media library. Without it the
     * builder falls back to its own bare modal (see ui.tsx), which is fine
     * standalone but knows nothing about dialogs stacking, page scroll locking or
     * focus trapping - a host that has solved those passes its own.
     */
    modal?: ComponentType<ModalProps>;
    /**
     * The editor for a button's click behaviour. Without it the shipped one is
     * used (reply / DM / post to channel); a host whose bot answers clicks
     * differently passes its own and owns the shape stored on the button.
     * `null` when the host's bot answers no clicks at all: buttons then offer
     * only their custom ID.
     */
    actionEditor?: ComponentType<ActionEditorProps> | null;
}
declare const BuilderContext: react.Context<BuilderIntegrations>;
/**
 * The placeholder syntax in use, so the fields deep in the tree write and read
 * variables the same way the preview renders them. Defaults to %name%.
 */
declare const SyntaxContext: react.Context<PlaceholderSyntax>;

interface DiscordMessageBuilderProps {
    value: MessageModel;
    onChange: (model: MessageModel) => void;
    variables?: TemplateVariable[];
    /** How a variable is written in a text; defaults to %name%. */
    syntax?: PlaceholderSyntax;
    /** Real values for variable samples (bot name, guild name, …), fetched
     *  from the live instance by the host app. Keys are variable names. */
    sampleOverrides?: Record<string, string>;
    /** Enables the upload button on image fields; resolves to a public URL. */
    onUploadImage?: UploadImageFn;
    /** Enables the upload button on file blocks; resolves to a marker URL. */
    onUploadFile?: UploadFileFn;
    /** Bot identity shown in the preview header. */
    botName?: string;
    botAvatar?: string;
    /** Rendered under the message: what the bot appends on the free plan. */
    watermark?: string | null;
    /** Optional channel list, user search and server emojis for the pickers. */
    integrations?: BuilderIntegrations;
    className?: string;
}
declare function DiscordMessageBuilder({ value, onChange, variables, syntax, sampleOverrides, onUploadImage, onUploadFile, botName, botAvatar, watermark, integrations, className }: DiscordMessageBuilderProps): react.JSX.Element;

type VarMap = Record<string, string>;
/**
 * What the preview needs to resolve variables: the sample values plus the
 * syntax they are written in. Carried as one object so every renderer below
 * passes it along unchanged.
 */
interface PreviewVars {
    values: VarMap;
    syntax: PlaceholderSyntax;
}
interface Mentions {
    users?: Record<string, string>;
    roles?: Record<string, string>;
    channels?: Record<string, string>;
}
declare function variablesToMap(vars?: TemplateVariable[], syntax?: PlaceholderSyntax): VarMap;
/** Sample values plus syntax, ready to hand to the renderers below. */
declare function previewVars(vars?: TemplateVariable[], syntax?: PlaceholderSyntax): PreviewVars;
declare function Markdown({ text, vars, mentions }: {
    text: string;
    vars: PreviewVars;
    mentions?: Mentions;
}): react__default.JSX.Element;

declare function MessageComponents({ model, variables, mentions, syntax }: {
    model: MessageModel;
    variables?: TemplateVariable[];
    mentions?: Mentions;
    syntax?: PlaceholderSyntax;
}): react.JSX.Element;
declare function DiscordPreview({ model, variables, mentions, botName, botAvatar, watermark, syntax, className, }: {
    model: MessageModel;
    variables?: TemplateVariable[];
    mentions?: Mentions;
    /** How variables are written; defaults to %name%. */
    syntax?: PlaceholderSyntax;
    botName?: string;
    botAvatar?: string;
    /** Free-plan mark appended by the bot. Preview shows it so nobody designs
     *  a message, sends it, and finds an extra line they did not put there. */
    watermark?: string | null;
    className?: string;
}): react.JSX.Element;

export { type ActionEditorProps, BuilderContext, type BuilderIntegrations, Button, ButtonActionData, type ChannelLite, DiscordActionEditor, DiscordMessageBuilder, type DiscordMessageBuilderProps, DiscordPreview, EmojiGrid, type EmojiLite, Input, Markdown, type MediaAsset, type MediaLibrary, type Mentions, MessageComponents, MessageModel, Modal, type ModalProps, PlaceholderSyntax, Popover, type PreviewVars, type SavedButtonAction, Skeleton, Switch, SyntaxContext, TemplateVariable, Textarea, type UploadFileFn, type UploadImageFn, type UserLite, previewVars, variablesToMap };
