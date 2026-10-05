// The editor entry (@wyattluber/discord-builder/react): the builder, the
// preview and everything a host passes to them.
//
// It imports nothing from the host app. What it needs it asks for: the theme
// tokens in theme.css, the optional integrations in context.ts, the variables
// and the placeholder syntax as props.

export { DiscordMessageBuilder } from "./DiscordMessageBuilder";
export type { DiscordMessageBuilderProps } from "./DiscordMessageBuilder";
export { DiscordPreview, MessageComponents } from "./DiscordPreview";
// Discord-flavoured markdown as the preview draws it, for hosts that show
// message text elsewhere (a channel view, a report)
export { Markdown, previewVars, variablesToMap, type Mentions, type PreviewVars } from "./markdown";
export type { UploadImageFn, UploadFileFn } from "./fields";
// Reusable pieces for hosts that want a picker outside the builder
export { EmojiGrid, Popover } from "./fields";
// The form primitives, in case a host builds fields of its own alongside
export { Button, Input, Textarea, Switch, Skeleton, Modal, type ModalProps } from "./ui";
export { BuilderContext, SyntaxContext } from "./context";
// The shipped click-behaviour editor, and the props a replacement must take
export { DiscordActionEditor, type ActionEditorProps } from "./ButtonActions";
export {
  PERCENT_PLACEHOLDERS,
  wrapVariable,
  variablePattern,
  substituteVariables,
  type PlaceholderSyntax,
} from "./syntax";
export type { BuilderIntegrations, ChannelLite, UserLite, EmojiLite, MediaAsset, MediaLibrary, SavedButtonAction } from "./context";

export { serialize, serializeJson, validate } from "./serialize";
export type { SerializedMessage, ValidationIssue } from "./serialize";
export { deserialize } from "./deserialize";

export {
  emptyMessage,
  startingMessage,
  makeBlock,
  makeContainer,
  IS_COMPONENTS_V2,
  LIMITS,
} from "./constants";

// Optional: the usual Discord variable set. The builder offers no variables
// unless a host passes them, so a project spreads these or brings its own.
export {
  DISCORD_VARIABLES,
  CLICKER_VARIABLES,
  mergeVariables,
  applyVariableSamples,
} from "./presets";

export type {
  MessageModel,
  RootNode,
  ContainerNode,
  ContainerChild,
  ButtonNode,
  ButtonAction,
  ButtonActionData,
  ButtonActionType,
  TemplateVariable,
} from "./types";
